import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'

export let db: PrismaClient;

export const createDbClient = (env: Env) =>
  new PrismaClient({ adapter: new PrismaD1(env.DB) });

export const setupDb = async (env: Env) => {
  db = createDbClient(env);
  // todo(justinvdm, 30 Jan 2025): Figure out how to avoid this.
  //
  // ## Context:
  // Vite sends an initial request to the worker when running the dev server,
  // at which point the Prisma WASM is imported. Using the Prisma for the first time _after_ this initial request
  // (e.g. if we only run the db for a request to /some/subpath) causes vite to not try import the WASM module
  // at all, and ultimately the request ends up hanging indefinetely.
  // * However, once the WASM has been imported, it is cached in some way that persists on the file system
  // (from experimentation, it is not in node_modules/.vite). This means that if you were to subsequently
  // change the code to _not_ have Prisma used after the initial request, the WASM will still be cached and
  // the request will not hang. This makes this issue particularly hard to debug.
  await db.$queryRaw`SELECT 1`;
};

export const setup = (env: Env) => {
  setupDb(env);
}