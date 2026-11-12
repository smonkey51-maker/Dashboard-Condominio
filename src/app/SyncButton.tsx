"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconRefresh } from "./icons";

type Status = "idle" | "busy" | "ok" | "error";

export default function SyncButton({ label, problem }: { label: string; problem?: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");

  async function run() {
    setStatus("busy");
    try {
      const res = await fetch("/api/sync?json=1", { method: "POST" });
      setStatus(res.ok ? "ok" : "error");
      router.refresh();
    } catch {
      setStatus("error");
    }
    setTimeout(() => setStatus("idle"), 3000);
  }

  const text = status === "busy" ? "Aggiorno…" : status === "ok" ? "Aggiornato ✓" : status === "error" ? "Aggiornamento non riuscito" : label;
  const tone = status === "error" || (status === "idle" && problem) ? "bad" : "good";
  return (
    <button type="button" className={`sync-chip ${tone}`} onClick={run} title="Aggiorna ora" disabled={status === "busy"} aria-live="polite">
      <span className="sync-dot" />
      <span>{text}</span>
      <IconRefresh className={status === "busy" ? "spin" : undefined} />
    </button>
  );
}
