"use client";

import { useState } from "react";

// The full IBAN is not rendered until requested; copying is a deliberate action.
export default function IbanBox({ masked, full, display }: { masked: string; full: string; display: string }) {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(full);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setShown(true);
    }
  }

  return (
    <div className="iban-box">
      <div>
        <p className="eyebrow">Bonifico condominiale</p>
        <code className="iban-code" aria-live="polite">{shown ? display : masked}</code>
      </div>
      <div className="iban-actions">
        <button type="button" className="chip-button" onClick={() => setShown((v) => !v)}>{shown ? "Nascondi" : "Mostra"}</button>
        <button type="button" className="chip-button primary" onClick={copy}>{copied ? "IBAN copiato ✓" : "Copia IBAN"}</button>
      </div>
    </div>
  );
}
