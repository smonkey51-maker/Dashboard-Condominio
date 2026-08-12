"use client";

import { useEffect } from "react";

const sectionIds = ["panoramica", "pagamenti", "assemblee", "documenti", "aggiornamenti", "impostazioni"];
const activationLine = 140;

export default function NavSpy() {
  useEffect(() => {
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>(".sidebar nav a, .pill-nav a"));
    if (!sections.length || !links.length) return;

    const setActive = (id: string) => {
      links.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${id}`));
    };

    let ticking = false;
    const update = () => {
      ticking = false;
      const visible = sections.filter((section) => section.offsetParent !== null);
      if (!visible.length) return;

      const doc = document.documentElement;
      const atBottom = window.innerHeight + window.scrollY >= doc.scrollHeight - 2;
      if (atBottom) {
        setActive(visible[visible.length - 1].id);
        return;
      }

      let current = visible[0];
      let currentTop = -Infinity;
      for (const section of visible) {
        const top = section.getBoundingClientRect().top;
        if (top <= activationLine && top > currentTop) {
          current = section;
          currentTop = top;
        }
      }
      setActive(current.id);
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return null;
}
