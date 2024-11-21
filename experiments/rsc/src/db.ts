import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from '@prisma/adapter-d1'
import { Env } from './worker';

export const createDbClient = (env: Env) => {
  const adapter = new PrismaD1(env.DB)
  const client = new PrismaClient({ adapter })
  return client
}

