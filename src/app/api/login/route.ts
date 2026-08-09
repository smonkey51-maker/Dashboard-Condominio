import { NextRequest, NextResponse } from "next/server";
import { createSessionValue, safePasswordMatch, SESSION_COOKIE } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const password = String(form.get("password") || "");
  if (!safePasswordMatch(password)) return NextResponse.redirect(new URL("/login?error=1", request.url), 303);
  const response = NextResponse.redirect(new URL("/", request.url), 303);
  response.cookies.set(SESSION_COOKIE, createSessionValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
