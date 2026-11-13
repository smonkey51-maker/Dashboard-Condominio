"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const messages: Record<string, { tone: "success" | "error"; text: string }> = {
  connected: { tone: "success", text: "Google collegato: Gmail e Calendar. Aggiorno i dati…" },
  scopes: { tone: "error", text: "Servono entrambi i permessi (Gmail e Calendar). Riprova e lascia spuntate tutte le caselle." },
  error: { tone: "error", text: "Non è stato possibile collegare l’account Google. Riprova." },
};

export default function Notices() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const key = params.get("google");
  const [hidden, setHidden] = useState(false);
  const message = key ? messages[key] : undefined;

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => { setHidden(true); router.replace(pathname, { scroll: false }); }, 6000);
    return () => clearTimeout(t);
  }, [message, router, pathname]);

  if (!message || hidden) return null;
  return <div className={`notice ${message.tone}`} role="status">{message.text}</div>;
}
