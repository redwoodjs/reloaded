import { index, route, RouteDefinition } from '@redwoodjs/sdk/router';
import { Context } from '@/worker';
import { MealPlanPage } from './MealPlan';

export const planRoutes: RouteDefinition<Context>[] = [
  index([
    ({ ctx }) => {
      if (!ctx.user?.setup) {
        return new Response(null, {
          status: 302,
          headers: { Location: '/setup' }
        });
      }
    },
    MealPlanPage
  ]),
]
