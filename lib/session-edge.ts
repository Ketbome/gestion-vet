import { jwtVerify } from "jose";

export const SESSION_COOKIE = "session";

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Falta JWT_SECRET en las variables de entorno");
  return new TextEncoder().encode(secret);
}

export async function verifyToken(
  token: string | undefined
): Promise<{ user: string } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    return typeof payload.user === "string" ? { user: payload.user } : null;
  } catch {
    return null;
  }
}
