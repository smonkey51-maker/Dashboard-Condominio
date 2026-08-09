import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { saveGoogleAuthorization } from "@/lib/google";

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated())) return NextResponse.redirect(new URL("/login", request.url));
  const state = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");
  const cookieState = request.cookies.get("google_oauth_state")?.value;
  if (!state || state !== cookieState || !code) {
    console.error("Google connect callback: state/code check failed", {
      hasState: Boolean(state),
      hasCookieState: Boolean(cookieState),
      stateMatchesCookie: Boolean(state) && state === cookieState,
      hasCode: Boolean(code),
    });
    return NextResponse.redirect(new URL("/?google=error", request.url));
  }
  try {
    await saveGoogleAuthorization(code);
    return NextResponse.redirect(new URL("/?google=connected", request.url));
  } catch (error) {
    console.error("Google connect callback failed", error);
    return NextResponse.redirect(new URL("/?google=error", request.url));
  }
}
