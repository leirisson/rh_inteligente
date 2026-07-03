import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secretKey = process.env.SESSION_SECRET ?? "convoca-dev-secret-change-me-please-32ch";
const encodedKey = new TextEncoder().encode(secretKey);

async function hasValidSession(cookieValue: string | undefined): Promise<boolean> {
  if (!cookieValue) return false;
  try {
    await jwtVerify(cookieValue, encodedKey, { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/empresa") && pathname !== "/empresa/login") {
    const session = request.cookies.get("convoca_company_session")?.value;
    if (!(await hasValidSession(session))) {
      return NextResponse.redirect(new URL("/empresa/login", request.url));
    }
  }

  if (pathname.startsWith("/candidato") && pathname !== "/candidato/entrar") {
    const session = request.cookies.get("convoca_candidate_session")?.value;
    if (!(await hasValidSession(session))) {
      return NextResponse.redirect(new URL("/candidato/entrar", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/empresa/:path*", "/candidato/:path*"],
};
