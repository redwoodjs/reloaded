import { index, route, RouteDefinition } from '@redwoodjs/sdk/router';
import { Context } from '@/worker';
import { SetupPage } from './SetupPage';

export const setupRoutes: RouteDefinition<Context>[] = [
  index([
    SetupPage
  ]),
]
