import { NextResponse, type NextRequest } from "next/server";

// No root layout is needed: the locale layout owns <html lang=...>.
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/") return NextResponse.redirect(new URL("/ru", request.url));
  return NextResponse.next();
}
export const config = { matcher: ["/"] };
