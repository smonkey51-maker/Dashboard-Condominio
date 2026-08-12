"use client";

import { useEffect, useState } from "react";

const overlayIds = ["pagamenti", "assemblee", "documenti", "aggiornamenti"];

export default function SectionOverlay() {
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      const hash = window.location.hash.replace("#", "");
      setOpenId(overlayIds.includes(hash) ? hash : null);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  useEffect(() => {
    overlayIds.forEach((id) => {
      document.getElementById(id)?.classList.toggle("open", id === openId);
    });
    document.body.classList.toggle("overlay-open", Boolean(openId));
  }, [openId]);

  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") window.location.hash = "top";
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openId]);

  if (!openId) return null;
  return <a className="overlay-backdrop" href="#top" aria-label="Chiudi" />;
}
