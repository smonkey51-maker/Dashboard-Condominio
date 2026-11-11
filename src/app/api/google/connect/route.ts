import { NextRequest, NextResponse } from "next/server";
import { createSignedState, isAuthenticated } from "@/lib/auth";
import { googleAuthorizationUrl, isGoogleTarget } from "@/lib/google";

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated())) return NextResponse.redirect(new URL("/login", request.url));
  const target = request.nextUrl.searchParams.get("target");
  if (!isGoogleTarget(target)) return NextResponse.redirect(new URL("/?google=error", request.url));
  return NextResponse.redirect(googleAuthorizationUrl(target, createSignedState(target)));
}
