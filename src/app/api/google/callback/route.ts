import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { saveGoogleAuthorization } from "@/lib/google";

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated())) return NextResponse.redirect(new URL("/login", request.url));
  const state = request.nextUrl.searchParams.get("state");
  const code = request.nextUrl.searchParams.get("code");
  if (!state || state !== request.cookies.get("google_oauth_state")?.value || !code) {
    return NextResponse.redirect(new URL("/?google=error", request.url));
  }
  try {
    await saveGoogleAuthorization(code);
    return NextResponse.redirect(new URL("/?google=connected", request.url));
  } catch {
    return NextResponse.redirect(new URL("/?google=error", request.url));
  }
}
