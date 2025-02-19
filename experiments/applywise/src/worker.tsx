import { defineApp } from '@redwoodjs/sdk/worker';
import { index, layout } from '@redwoodjs/sdk/router';
import { Document } from 'src/Document';
import { Home } from 'src/pages/Home';
import { setupDb } from './db';

type Context = {
}

export default defineApp<Context>([
  async ({ ctx, env, request }) => {
    await setupDb(env)
    // ctx.user = await getUser(request, env)
  },
  layout(Document, [
    index([
      Home,
    ]),
  ]),
])
