import { ErrorResponse } from "../../error";
const MAX_TOKEN_DURATION = 14 * 24 * 60 * 60 * 1000; // 14 days

export interface SessionDOMethods<Session> {
  getSession(): Promise<{ value: Session } | { error: string }>;
  saveSession(session: Session): Promise<void>;
  revokeSession(): Promise<void>;
}

interface SessionIdParts {
  unsignedSessionId: string;
  signature: string;
}

const packSessionId = (parts: SessionIdParts): string => {
  return btoa([parts.unsignedSessionId, parts.signature].join(':'));
}

const unpackSessionId = (packed: string): SessionIdParts => {
  const [unsignedSessionId, signature] = atob(packed).split(':');
  return { unsignedSessionId, signature };
}

const arrayBufferToHex = (buffer: ArrayBuffer): string => {
  const array = new Uint8Array(buffer);
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export const createSessionCookie = ({ sessionId, maxAge }: { sessionId: string, maxAge?: number | true }) =>
  `session_id=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax${maxAge ? `; Max-Age=${maxAge === true ? MAX_TOKEN_DURATION / 1000 : maxAge}` : ''}`;

export const signSessionId = async ({ unsignedSessionId, secretKey }: { unsignedSessionId: string, secretKey: string }) => {
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secretKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureArrayBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(unsignedSessionId)
  );

  return arrayBufferToHex(signatureArrayBuffer);
}

export const generateSessionId = async ({ secretKey }: { secretKey: string }) => {
  const unsignedSessionId = crypto.randomUUID();
  const signature = await signSessionId({ unsignedSessionId, secretKey });
  return packSessionId({ unsignedSessionId, signature });
}

export const isValidSessionId = async ({ sessionId, secretKey }: { sessionId: string, secretKey: string }) => {
  const { unsignedSessionId, signature } = unpackSessionId(sessionId);
  const computedSignature = await signSessionId({ unsignedSessionId, secretKey });
  return computedSignature === signature;
}

export const defineSessionStore = <Session>({
  secretKey,
  get,
  set,
  unset,
}: {
  secretKey: string,
  get(id: string): Promise<Session>,
  set(id: string, session: Session): Promise<void>,
  unset(id: string): Promise<void>
}) => {
  const getSessionIdFromCookie = (request: Request): string | undefined => {
    const cookieHeader = request.headers.get("Cookie");
    if (!cookieHeader) return undefined;

    for (const cookie of cookieHeader.split(';')) {
      const [key, value] = cookie.trim().split('=');
      if (key === 'session_id') {
        return value;
      }
    }
  };

  const load = async (request: Request): Promise<Session> => {
    const sessionId = getSessionIdFromCookie(request);
    if (!sessionId) {
      throw new ErrorResponse(401, "No session id found");
    }

    if (!await isValidSessionId({ sessionId, secretKey })) {
      throw new ErrorResponse(401, "Invalid session id");
    }

    try {
      return await get(sessionId);
    } catch (error) {
      throw new ErrorResponse(401, "Invalid session id");
    }
  };

  const save = async (
    response: Response,
    session: Session,
    { maxAge }: { maxAge?: number | true } = {}
  ): Promise<void> => {
    const sessionId = await generateSessionId({ secretKey });
    await set(sessionId, session);
    response.headers.set("Set-Cookie", createSessionCookie({ sessionId, maxAge }));
  };

  const remove = async (
    request: Request,
    response: Response
  ): Promise<void> => {
    const sessionId = getSessionIdFromCookie(request);
    if (sessionId) {
      await unset(sessionId);
    }
    response.headers.set("Set-Cookie", createSessionCookie({ sessionId: '', maxAge: 0 }));
  };

  return {
    load,
    save,
    remove,
  };
};

export const defineDurableSession = <Session>({
  secretKey,
  sessionDO,
}: {
  secretKey: string,
  sessionDO: DurableObjectNamespace<SessionDOMethods<Session>>
}) => {
  const get = async (sessionId: string): Promise<Session> => {
    const { unsignedSessionId } = unpackSessionId(sessionId);
    const doId = sessionDO.idFromName(unsignedSessionId);
    const sessionStub = sessionDO.get(doId);
    const result = await sessionStub.getSession();
    
    if ('error' in result) {
      throw new Error(result.error);
    }
    
    return result.value;
  };

  const set = async (sessionId: string, session: Session): Promise<void> => {
    const { unsignedSessionId } = unpackSessionId(sessionId);
    const doId = sessionDO.idFromName(unsignedSessionId);
    const sessionStub = sessionDO.get(doId);
    await sessionStub.saveSession(session);
  };

  const unset = async (sessionId: string): Promise<void> => {
    const { unsignedSessionId } = unpackSessionId(sessionId);
    const doId = sessionDO.idFromName(unsignedSessionId);
    const sessionStub = sessionDO.get(doId);
    await sessionStub.revokeSession();
  };

  return defineSessionStore({ secretKey, get, set, unset });
};