// Shared by the sync (when saving) and the views (so already-saved emails pick
// up improvements to these rules without waiting for a re-sync).
export function classify(subject: string, attachments: number) {
  const text = subject.toLowerCase();
  if (/assemblea|convocazione/.test(text)) return "assembly";
  if (/\b(rata|rate|pagamento|scadenza|saldo|bonifico|versamento|acconto|conguaglio|bollettino|ripartizione)\b/.test(text)) return "payment";
  if (/\b(lavori|manutenzione|guasto|ascensore|riparazione|interruzione|perdita|infiltrazion\w*|intervento)\b/.test(text)) return "maintenance";
  if (/verbale/.test(text) || attachments > 0) return "document";
  return "update";
}
