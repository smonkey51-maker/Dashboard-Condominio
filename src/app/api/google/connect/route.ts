import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { googleAuthorizationUrl } from "@/lib/google";

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated())) return NextResponse.redirect(new URL("/login", request.url));
  const state = randomBytes(24).toString("hex");
  const response = NextResponse.redirect(googleAuthorizationUrl(state));
  response.cookies.set("google_oauth_state", state, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });
  return response;
}
