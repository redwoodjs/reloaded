import { defineDurableSession } from "@redwoodjs/sdk/auth"

export let sessions: ReturnType<typeof createSessionStore>;

const createSessionStore = (env: Env) =>
  defineDurableSession({
    secretKey: env.SECRET_KEY,
    sessionDurableObject: env.SESSION_DURABLE_OBJECT,
  })

export const setupSessionStore = (env: Env) => {
  sessions = createSessionStore(env);
  return sessions;
}