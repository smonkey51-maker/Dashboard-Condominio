import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { syncGoogle } from "@/lib/google";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const cronAuthorized = Boolean(process.env.CRON_SECRET) && request.headers.get("x-cron-secret") === process.env.CRON_SECRET;
  if (!cronAuthorized && !(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await syncGoogle();
    if (cronAuthorized) return NextResponse.json({ ok: true, ...result });
    return NextResponse.redirect(new URL("/?sync=ok", request.url), 303);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    if (cronAuthorized) return NextResponse.json({ error: message }, { status: 500 });
    return NextResponse.redirect(new URL("/?sync=error", request.url), 303);
  }
}
