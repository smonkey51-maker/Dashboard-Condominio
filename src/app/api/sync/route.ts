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
    const message = error instanceof Error ? error.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await syncGoogle();
    return NextResponse.redirect(new URL("/?sync=ok", request.url), 303);
  } catch (error) {
    return NextResponse.redirect(new URL("/?sync=error", request.url), 303);
  }
}
