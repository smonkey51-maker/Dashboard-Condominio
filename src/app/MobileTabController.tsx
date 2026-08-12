"use client";

import { useEffect } from "react";

const tabIds = ["panoramica", "pagamenti", "assemblee", "documenti", "aggiornamenti", "impostazioni"];
const MOBILE_QUERY = "(max-width: 850px)";

export default function MobileTabController() {
  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-tab]"));
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'));
    if (!sections.length) return;

    const showTab = (id: string) => {
      sections.forEach((section) => {
        section.style.display = section.dataset.tab === id ? "" : "none";
      });
      links.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${id}`));
    };

    const resetTabs = () => {
      sections.forEach((section) => {
        section.style.display = "";
      });
    };

    const onClick = (event: MouseEvent) => {
      if (!mql.matches) return;
      const link = event.currentTarget as HTMLAnchorElement;
      const id = link.getAttribute("href")?.slice(1);
      if (!id || !tabIds.includes(id)) return;
      event.preventDefault();
      showTab(id);
      history.replaceState(null, "", `#${id}`);
      window.scrollTo(0, 0);
    };

    links.forEach((link) => link.addEventListener("click", onClick));

    const applyMode = () => {
      if (mql.matches) {
        const hash = window.location.hash.slice(1);
        showTab(tabIds.includes(hash) ? hash : "panoramica");
      } else {
        resetTabs();
      }
    };

    applyMode();
    mql.addEventListener("change", applyMode);
    return () => {
      links.forEach((link) => link.removeEventListener("click", onClick));
      mql.removeEventListener("change", applyMode);
    };
  }, []);

  return null;
}
