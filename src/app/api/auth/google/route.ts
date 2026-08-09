import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { googleLoginUrl } from "@/lib/googleLogin";

export async function GET(request: NextRequest) {
  const state = randomBytes(24).toString("hex");
  let url: string;
  try {
    url = googleLoginUrl(state);
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(new URL("/login?error=1", request.url));
  }
  const response = NextResponse.redirect(url);
  response.cookies.set("google_login_state", state, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });
  return response;
}
