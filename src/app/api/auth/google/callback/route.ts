import { NextRequest, NextResponse } from "next/server";
import { attachSession, findUserByEmail } from "@/lib/auth";
import { verifyGoogleLogin } from "@/lib/googleLogin";

export async function GET(request: NextRequest) {
  const state = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");
  const cookieState = request.cookies.get("google_login_state")?.value;
  if (!state || state !== cookieState || !code) {
    console.error("Google login callback: state/code check failed", {
      hasState: Boolean(state),
      hasCookieState: Boolean(cookieState),
      stateMatchesCookie: Boolean(state) && state === cookieState,
      hasCode: Boolean(code),
    });
    return NextResponse.redirect(new URL("/login?error=1", request.url));
  }
  try {
    const email = await verifyGoogleLogin(code);
    const user = findUserByEmail(email);
    if (!user) {
      console.error(`Google login callback: email not in allowlist (${email})`);
      return NextResponse.redirect(new URL("/login?error=denied", request.url));
    }
    const response = attachSession(NextResponse.redirect(new URL("/", request.url), 303), user.id);
    response.cookies.set("google_login_state", "", { path: "/", maxAge: 0 });
    return response;
  } catch (error) {
    console.error("Google login callback failed", error);
    return NextResponse.redirect(new URL("/login?error=1", request.url));
  }
}
