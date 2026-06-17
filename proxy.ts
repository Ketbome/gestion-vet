import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifyToken } from "@/lib/session-edge";

// Rutas accesibles sin sesión (login y agendamiento público de clientes)
const PUBLIC_PATHS = ["/login", "/agendar"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export default async function proxy(request: NextRequest) {
  const session = await verifyToken(
    request.cookies.get(SESSION_COOKIE)?.value
  );
  const { pathname } = request.nextUrl;

  if (!session && !isPublic(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
