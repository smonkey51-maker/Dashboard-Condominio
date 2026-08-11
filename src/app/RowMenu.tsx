"use client";

import { useState } from "react";
import { IconMore } from "./icons";
import CopyButton from "./CopyButton";

export default function RowMenu({ url }: { url: string | null }) {
  const [open, setOpen] = useState(false);
  if (!url) return null;

  return (
    <div className="row-menu">
      <button type="button" className="row-menu-trigger" aria-label="Altre azioni" onClick={() => setOpen((v) => !v)}>
        <IconMore />
      </button>
      {open && (
        <div className="row-menu-panel" onMouseLeave={() => setOpen(false)}>
          <a href={url} target="_blank" rel="noreferrer">Apri originale</a>
          <CopyButton text={url} label="Copia link" />
        </div>
      )}
    </div>
  );
}
