import { route, RouteDefinition } from '@redwoodjs/sdk/router';
import { Context } from '@/worker';
import { 
  createMealPlan, 
  createShoppingList, 
  getMealPlan, 
  updateMealPlanStatus, 
  getMealPlanStatus,
  updateShoppingListStatus,
  getShoppingListStatus
} from '../plan/functions';

export const apiRoutes: RouteDefinition<Context>[] = [
  route('/createMealPlan', async ({ ctx, env }) => {
    const userId = ctx.user?.id;
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    // Set initial status to "queued"
    await updateMealPlanStatus(userId, "queued", "Your meal plan has been queued for generation.");
    
    await env.QUEUE.send({
      action: 'createMealPlan',
      userId,
    });
    return new Response('Added to queue', { status: 200 });
  }),
  
  // Add a new route to check meal plan status
  route('/mealPlanStatus', async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    const status = await getMealPlanStatus(userId);
    return new Response(JSON.stringify(status), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }),
  
  route('/createShoppingList', async ({ ctx, env }) => {
    const userId = ctx.user?.id;
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    // Set initial status to "queued"
    await updateShoppingListStatus(userId, "queued", "Your shopping list has been queued for generation.");
    
    await env.QUEUE.send({
      action: 'createShoppingList',
      userId,
    });
    return new Response('Added to queue', { status: 200 });
  }),
  
  // Add a new route to check shopping list status
  route('/shoppingListStatus', async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    const status = await getShoppingListStatus(userId);
    return new Response(JSON.stringify(status), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }),
]
