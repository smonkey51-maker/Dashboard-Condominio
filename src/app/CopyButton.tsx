"use client";

import { useState } from "react";

export default function CopyButton({ text, className, label = "Copia" }: { text: string; className?: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // clipboard non disponibile: nessuna azione
        }
      }}
    >
      {copied ? "Copiato ✓" : label}
    </button>
  );
}
