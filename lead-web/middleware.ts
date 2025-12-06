// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Публично: корень, /auth и статика
const PUBLIC_PREFIXES = ["/", "/auth", "/_next", "/favicon", "/images", "/public"];

function isPublic(pathname: string) {
  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) return true;
  if (/\.[\w]+$/.test(pathname)) return true; // *.css, *.js, *.png ...
  return false;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  const token = req.cookies.get("token")?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = { matcher: ["/:path*"] };
