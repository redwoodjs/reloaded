import { MAX_TOKEN_DURATION } from './constants';
import { ErrorResponse } from './error';
import { SessionDO } from './session';

interface SessionIdParts {
  sessionId: string;
  signature: string;
}

const packSessionId = (parts: SessionIdParts): string => {
  return btoa([parts.sessionId, parts.signature].join(':'));
}

const unpackSessionId = (packed: string): SessionIdParts => {
  const [sessionId, signature] = atob(packed).split(':');
  return { sessionId, signature };
}

export const performLogin = async (request: Request, env: Env) => {
  const userId = "1";

  const sessionId = await generateSessionId(env);
  const doId = env.SESSION_DO.idFromName(sessionId);
  const sessionDO = env.SESSION_DO.get(doId) as DurableObjectStub<SessionDO>;
  await sessionDO.saveSession(userId);

  const cookie = `session_id=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_TOKEN_DURATION}`;

  return new Response("Login successful", {
    status: 200,
    headers: { "Set-Cookie": cookie },
  });
}

const signSessionId = async (sessionId: string, env: Env) => {
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(env.SECRET_KEY),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureArrayBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(sessionId)
  );

  return arrayBufferToHex(signatureArrayBuffer);
}

const arrayBufferToHex = (buffer: ArrayBuffer): string => {
  const array = new Uint8Array(buffer);
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export const generateSessionId = async (env: Env) => {
  const unsignedSessionId = crypto.randomUUID();
  const signature = await signSessionId(unsignedSessionId, env);
  return packSessionId({ sessionId: unsignedSessionId, signature });
}

export const isValidSessionId = async (sessionId: string, env: Env) => {
  const { sessionId: unsignedSessionId, signature } = unpackSessionId(sessionId);
  const computedSignature = await signSessionId(unsignedSessionId, env);
  return computedSignature === signature;
}

export const getSession = async (request: Request, env: Env) => {
  const cookieHeader = request.headers.get("Cookie");

  if (!cookieHeader) {
    throw new ErrorResponse(401, "No cookie found");
  }

  const cookies = Object.fromEntries(
    cookieHeader.split("; ").map((c) => c.split("="))
  );

  const sessionId = cookies["session_id"];

  if (sessionId == null) {
    throw new ErrorResponse(401, "No session id found");
  }

  if (!await isValidSessionId(sessionId, env)) {
    throw new ErrorResponse(401, "Invalid session id");
  }

  const doId = env.SESSION_DO.idFromName(sessionId);
  const sessionDO = env.SESSION_DO.get(doId) as DurableObjectStub<SessionDO>;
  const session = await sessionDO.getSession();

  return session;
}