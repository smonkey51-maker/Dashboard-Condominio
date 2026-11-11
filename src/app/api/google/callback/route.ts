import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated, verifySignedState } from "@/lib/auth";
import { isGoogleTarget, saveGoogleAuthorization } from "@/lib/google";

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated())) return NextResponse.redirect(new URL("/login", request.url));
  const state = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");
  const target = verifySignedState(state);
  if (!isGoogleTarget(target) || !code) {
    console.error("Google connect callback: state/code check failed", { hasTarget: isGoogleTarget(target), hasCode: Boolean(code) });
    return NextResponse.redirect(new URL("/?google=error", request.url));
  }
  try {
    await saveGoogleAuthorization(target, code);
    return NextResponse.redirect(new URL(`/?google=connected-${target}`, request.url));
  } catch (error) {
    console.error("Google connect callback failed", error);
    return NextResponse.redirect(new URL("/?google=error", request.url));
  }
}
