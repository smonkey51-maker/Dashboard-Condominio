"use client";

import { useSyncExternalStore } from "react";
import { IconMoon, IconSun } from "./icons";

const STORAGE_KEY = "euganeo-theme";

function getSnapshot(): "light" | "dark" {
  const stored = document.documentElement.getAttribute("data-theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getServerSnapshot(): "light" | "dark" {
  return "dark";
}

function subscribe(onChange: () => void) {
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  mql.addEventListener("change", onChange);
  return () => {
    observer.disconnect();
    mql.removeEventListener("change", onChange);
  };
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(STORAGE_KEY, next);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", next === "dark" ? "#0f3d38" : "#f6f1e6");
  };

  return (
    <button type="button" className="theme-toggle" onClick={toggle} aria-label="Cambia tema chiaro/scuro">
      {theme === "dark" ? <IconMoon /> : <IconSun />}
      {theme === "dark" ? "Scuro" : "Chiaro"}
    </button>
  );
}
