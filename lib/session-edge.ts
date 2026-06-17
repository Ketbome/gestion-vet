import { jwtVerify } from "jose";

export const SESSION_COOKIE = "session";

export type SessionUser = { uid: number; role: string; name: string };

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Falta JWT_SECRET en las variables de entorno");
  return new TextEncoder().encode(secret);
}

export async function verifyToken(
  token: string | undefined
): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    if (
      typeof payload.uid === "number" &&
      typeof payload.role === "string" &&
      typeof payload.name === "string"
    ) {
      return { uid: payload.uid, role: payload.role, name: payload.name };
    }
    return null;
  } catch {
    return null;
  }
}
