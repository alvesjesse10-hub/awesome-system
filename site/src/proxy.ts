import { NextResponse, type NextRequest } from "next/server";

function preferredMarket(request: NextRequest): "br" | "us" {
  const acceptLanguage = request.headers.get("accept-language") ?? "";
  return acceptLanguage.toLowerCase().startsWith("pt") ? "br" : "us";
}

export function proxy(request: NextRequest) {
  const market = preferredMarket(request);
  return NextResponse.redirect(new URL(`/${market}`, request.url));
}

export const config = {
  matcher: "/",
};
