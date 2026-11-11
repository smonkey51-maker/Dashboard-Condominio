import { NextRequest, NextResponse } from "next/server";
import { attachSession, findUserByEmail, verifyLoginState } from "@/lib/auth";
import { verifyGoogleLogin } from "@/lib/googleLogin";

export async function GET(request: NextRequest) {
  const state = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");
  if (!verifyLoginState(state) || !code) {
    console.error("Google login callback: state/code check failed", {
      hasValidState: verifyLoginState(state),
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
    return attachSession(NextResponse.redirect(new URL("/", request.url), 303), user.id);
  } catch (error) {
    console.error("Google login callback failed", error);
    return NextResponse.redirect(new URL("/login?error=1", request.url));
  }
}
