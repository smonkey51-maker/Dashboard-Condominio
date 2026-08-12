"use client";

import { useEffect } from "react";

const sectionIds = ["panoramica", "pagamenti", "assemblee", "documenti", "aggiornamenti", "impostazioni"];

export default function NavSpy() {
  useEffect(() => {
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>(".sidebar nav a, .pill-nav a"));
    if (!links.length) return;

    const sync = () => {
      const hash = window.location.hash.replace("#", "");
      const active = sectionIds.includes(hash) ? hash : "panoramica";
      links.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${active}`));
    };

    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  return null;
}
