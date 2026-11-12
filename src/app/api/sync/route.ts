import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { syncGoogle } from "@/lib/google";

export const maxDuration = 60;

function cronAuthorized(request: NextRequest) {
  return Boolean(process.env.CRON_SECRET) && request.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(request: NextRequest) {
  if (!cronAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ ok: true, ...(await syncGoogle()) });
  } catch (error) {
    console.error("Cron sync failed", error);
    const message = error instanceof Error ? error.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const wantsJson = request.nextUrl.searchParams.get("json") === "1";
  try {
    const result = await syncGoogle();
    if (wantsJson) return NextResponse.json({ ok: true, ...result });
    return NextResponse.redirect(new URL("/?sync=ok", request.url), 303);
  } catch (error) {
    console.error("Manual sync failed", error);
    if (wantsJson) return NextResponse.json({ ok: false }, { status: 500 });
    return NextResponse.redirect(new URL("/?sync=error", request.url), 303);
  }
}
