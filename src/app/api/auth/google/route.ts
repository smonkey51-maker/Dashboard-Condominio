import { NextRequest, NextResponse } from "next/server";
import { createLoginState } from "@/lib/auth";
import { googleLoginUrl } from "@/lib/googleLogin";

export async function GET(request: NextRequest) {
  try {
    const url = googleLoginUrl(createLoginState());
    return NextResponse.redirect(url);
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(new URL("/login?error=1", request.url));
  }
}
