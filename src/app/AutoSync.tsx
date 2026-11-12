"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Refreshes the data when the dashboard is opened and the last sync is stale (or
// was just connected), so it no longer depends only on the once-a-day cron.
export default function AutoSync({ lastSyncedAt }: { lastSyncedAt?: string }) {
  const router = useRouter();
  const force = useSearchParams().get("google") === "connected";
  useEffect(() => {
    const age = lastSyncedAt ? Date.now() - new Date(lastSyncedAt).getTime() : Infinity;
    if (!force && age < 3 * 60 * 60 * 1000) return;
    const key = "euganeo-autosync";
    try {
      const last = Number(sessionStorage.getItem(key) || 0);
      if (Date.now() - last < 5 * 60 * 1000) return;
      sessionStorage.setItem(key, String(Date.now()));
    } catch {}
    fetch("/api/sync?json=1", { method: "POST" })
      .then(() => router.refresh())
      .catch(() => {});
  }, [lastSyncedAt, force, router]);
  return null;
}
