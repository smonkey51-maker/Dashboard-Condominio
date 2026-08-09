import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { googleLoginUrl } from "@/lib/googleLogin";

export async function GET() {
  const state = randomBytes(24).toString("hex");
  const response = NextResponse.redirect(googleLoginUrl(state));
  response.cookies.set("google_login_state", state, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });
  return response;
}
