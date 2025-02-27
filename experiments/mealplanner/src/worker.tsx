import { defineApp } from '@redwoodjs/sdk/worker';
import { index, layout, prefix } from '@redwoodjs/sdk/router';
import { Document } from '@/app/Document';
import { Home } from '@/app/pages/Home';
import { authRoutes } from '@/app/pages/auth/routes';
import { sessions, setupSessionStore } from './session/store';
import { Session } from './session/durableObject';
import { db, setupDb } from './db';
import { User } from '@prisma/client';
import { setupRoutes } from './app/pages/setup/routes';
import { planRoutes } from './app/pages/plan/routes';
import { apiRoutes } from './app/pages/api/routes';
export { SessionDurableObject } from './session/durableObject';
import { QueueBatch } from '@cloudflare/workers-types';
import { 
  createMealPlan, 
  createShoppingList, 
  updateMealPlanStatus, 
  updateShoppingListStatus 
} from "./app/pages/plan/functions";

export type Context = {
  session: Session | null;
  user: User | null;
  env: Env;
  debugMode: boolean;
}

const app = defineApp<Context>([
  async ({ env, ctx, request }) => {
    setupDb(env);
    setupSessionStore(env);
    ctx.session = await sessions.load(request);
    ctx.debugMode = env.DEBUG_MODE === 'true';
    if (ctx.session?.userId) {
      ctx.user = await db.user.findUnique({
        where: {
          id: ctx.session.userId,
        },
        include: {
          setup: true,
        },
      });
    }
  },
  // todo: Figure out why I'm needing to provide route type param each time
  layout<Context>(Document, [
    index([
        ({ ctx }) => {
          if (!ctx.user) {
            return new Response(null, {
              status: 302,
              headers: { Location: '/user/login' }
            });
          } else if (!ctx.user?.setup) {
            return new Response(null, {
              status: 302,
              headers: { Location: '/setup' }
            });
          } else if (ctx.user?.setup) {
            return new Response(null, {
              status: 302,
              headers: { Location: '/plan' }
            });
          }
        },
        Home,
    ]),
    prefix<Context>("/setup", setupRoutes),
    prefix<Context>("/plan", planRoutes),
    prefix<Context>("/user", authRoutes),
    prefix<Context>("/api", apiRoutes),
  ])
])

export default {
  fetch: app.fetch,
  async queue(batch: QueueBatch<any>, env: Env) {
    const debugMode = env.DEBUG_MODE === 'true';
    for (const message of batch.messages) {
      console.log(`Processing message: ${message.body.action}`);
      
      if (message.body.action === 'createMealPlan') {
        console.log(`Debug mode: ${debugMode}`);
        console.log(`Creating meal plan for userId: ${message.body.userId}`);
        const { userId } = message.body;
        const user = await db.user.findUnique({
          where: { id: userId },    
        });
        if (user) {
          try {
            await createMealPlan(env.OPENAI_API_KEY, userId, debugMode);  
          } catch (error) {
            console.error(`Error creating meal plan for userId: ${userId}`, error);
            // Update status to failed if there's an error
            await updateMealPlanStatus(userId, "failed", `Error: ${error instanceof Error ? error.message : "Unknown error"}`);
          }
        } else {
          console.error(`User not found for userId: ${userId}`);
          await updateMealPlanStatus(userId, "failed", "User not found");
        }
      }
      if (message.body.action === 'createShoppingList') {
        console.log(`Creating shopping list for userId: ${message.body.userId}`);
        const { userId } = message.body;
        
        try {
          const user = await db.user.findUnique({
            where: { id: userId },
            include: {
              mealplan: true
            }
          });
          
          if (!user) {
            console.error(`User not found for userId: ${userId}`);
            await updateShoppingListStatus(userId, "failed", "User not found");
            continue;
          }
          
          if (!user.mealplan) {
            console.error(`Meal plan not found for userId: ${userId}`);
            await updateShoppingListStatus(userId, "failed", "Meal plan not found. Please generate a meal plan first.");
            continue;
          }
          
          await createShoppingList(env.OPENAI_API_KEY, user.mealplan.plan, userId, debugMode);
          console.log(`Successfully created shopping list for userId: ${userId}`);
          
        } catch (error) {
          console.error(`Error creating shopping list for userId: ${userId}`, error);
          await updateShoppingListStatus(userId, "failed", `Error: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }
    }
  }
} satisfies ExportHandler<Env>;