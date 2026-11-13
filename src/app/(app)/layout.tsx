import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { loadDashboard, syncLabel } from "@/lib/view";
import AutoSync from "../AutoSync";
import NavLinks from "../NavLinks";
import Notices from "../Notices";
import OfflineIndicator from "../OfflineIndicator";
import SyncButton from "../SyncButton";
import { IconUser } from "../icons";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!(await getSessionUser())) redirect("/login");
  const { items, lastRun, connected } = await loadDashboard();
  const problem = lastRun?.status === "error" ? lastRun : null;

  return (
    <div className="app-shell">
      <OfflineIndicator items={items} />
      {connected && <Suspense><AutoSync lastSyncedAt={lastRun?.synced_at} /></Suspense>}
      <NavLinks variant="pill" />

      <div className="content">
        <div className="chrome"><header className="topbar">
          <Link className="brand" href="/">Euganeo Casa</Link>
          <NavLinks variant="top" />
          <div className="topbar-actions">
            {connected && <SyncButton className="desktop-only" label={lastRun ? syncLabel(lastRun.synced_at) : "mai aggiornato"} problem={Boolean(problem)} />}
            <form action="/api/logout" method="post"><button className="user-button" aria-label="Esci"><IconUser className="user-icon" /><span className="user-text">Esci</span></button></form>
          </div>
        </header></div>
        <main className="page">
          <Suspense><Notices /></Suspense>
          {problem && (
            <div className="notice error">
              {problem.needs_reconnect
                ? "L’autorizzazione Google è scaduta: ricollega l’account per riprendere gli aggiornamenti. "
                : `Ultima sincronizzazione non riuscita (${problem.error}). `}
              <a href="/api/google/connect"><u>Ricollega Google</u></a>
            </div>
          )}
          {!connected && (
            <section className="connect">
              <div><h2>Collega Gmail e Calendar</h2><p>Un solo accesso con l’account dove arrivano le email del condominio, in sola lettura.</p></div>
              <a className="button" href="/api/google/connect">Collega Google</a>
            </section>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
