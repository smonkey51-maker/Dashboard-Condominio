"use client";

import { useEffect, useState } from "react";
import type { SyncedItem } from "@/lib/db";

const CACHE_KEY = "euganeo-cache";

export default function OfflineIndicator({ items }: { items: SyncedItem[] }) {
  const [online, setOnline] = useState(() => typeof window === "undefined" || navigator.onLine !== false);

  useEffect(() => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ items, timestamp: new Date().toISOString() }));
    } catch {
      // localStorage unavailable
    }
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [items]);

  if (online) return null;
  return <div className="offline-indicator">📡 Modalità offline — ultimi dati salvati</div>;
}
