import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { loadState } from "@/lib/db";
import { fetchAttachment } from "@/lib/google";

export const maxDuration = 30;

const INLINE_TYPES = /^(application\/pdf|image\/(png|jpe?g|gif|webp|heic))$/i;
const MAX_BYTES = 4 * 1024 * 1024; // serverless responses are limited to ~4.5 MB

// Opens or downloads an attachment straight from Gmail; nothing is stored.
export async function GET(request: NextRequest) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ref = request.nextUrl.searchParams.get("ref") || "";
  const index = Number(request.nextUrl.searchParams.get("i") || 0);
  const download = request.nextUrl.searchParams.get("dl") === "1";
  const [source, ...rest] = ref.split("~");
  const id = rest.join("~");
  const state = await loadState();
  const item = state.items.find((i) => i.source === source && i.external_id === id);
  const meta = item?.attachments?.[index];
  if (!item || source !== "gmail" || !meta) return NextResponse.json({ error: "Allegato non trovato" }, { status: 404 });
  if (meta.size > MAX_BYTES) return NextResponse.json({ error: "File troppo grande: aprilo da Gmail" }, { status: 413 });
  try {
    const file = await fetchAttachment(item.external_id, meta.part_id);
    if (!file) return NextResponse.json({ error: "Allegato non più disponibile" }, { status: 404 });
    const inline = !download && INLINE_TYPES.test(file.mime);
    return new NextResponse(new Uint8Array(file.buffer), {
      headers: {
        "Content-Type": inline ? file.mime : download ? file.mime : "application/octet-stream",
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Attachment download failed", error);
    return NextResponse.json({ error: "Impossibile leggere l’allegato" }, { status: 502 });
  }
}
