import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated, verifySignedState } from "@/lib/auth";
import { saveGoogleAuthorization } from "@/lib/google";

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated())) return NextResponse.redirect(new URL("/login", request.url));
  const code = request.nextUrl.searchParams.get("code");
  if (verifySignedState(request.nextUrl.searchParams.get("state")) !== "google" || !code) {
    console.error("Google connect callback: state/code check failed", { hasCode: Boolean(code) });
    return NextResponse.redirect(new URL("/?google=error", request.url));
  }
  try {
    await saveGoogleAuthorization(code);
    return NextResponse.redirect(new URL("/?google=connected&autosync=1", request.url));
  } catch (error) {
    console.error("Google connect callback failed", error);
    const missingScopes = error instanceof Error && error.message.startsWith("Permessi Google mancanti");
    return NextResponse.redirect(new URL(`/?google=${missingScopes ? "scopes" : "error"}`, request.url));
  }
}
