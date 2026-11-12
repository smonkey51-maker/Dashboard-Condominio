import { NextRequest, NextResponse } from "next/server";
import { createSignedState, isAuthenticated } from "@/lib/auth";
import { googleAuthorizationUrl } from "@/lib/google";

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated())) return NextResponse.redirect(new URL("/login", request.url));
  try {
    return NextResponse.redirect(googleAuthorizationUrl(createSignedState("google")));
  } catch (error) {
    console.error("Google connect failed", error);
    return NextResponse.redirect(new URL("/?google=error", request.url));
  }
}
