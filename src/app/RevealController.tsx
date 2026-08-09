"use client";

import { useEffect } from "react";

export default function RevealController() {
  useEffect(() => {
    const tiles = Array.from(document.querySelectorAll<HTMLElement>(".rv"));
    if (!tiles.length) return;

    if (!("IntersectionObserver" in window)) {
      tiles.forEach((tile) => tile.classList.add("in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const delay = (tiles.indexOf(entry.target as HTMLElement) % 4) * 130;
            setTimeout(() => entry.target.classList.add("in"), delay);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    tiles.forEach((tile) => io.observe(tile));
    return () => io.disconnect();
  }, []);

  return null;
}
