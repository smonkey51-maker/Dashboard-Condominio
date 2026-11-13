"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconBell, IconCoin, IconFile, IconHome, IconHomeFilled, IconUsers } from "./icons";

const items = [
  { href: "/", label: "Panoramica", Icon: IconHome, Active: IconHomeFilled },
  { href: "/pagamenti", label: "Pagamenti", Icon: IconCoin },
  { href: "/assemblee", label: "Assemblee", Icon: IconUsers },
  { href: "/documenti", label: "Documenti", Icon: IconFile },
  { href: "/comunicazioni", label: "Comunicazioni", Icon: IconBell },
];

export default function NavLinks({ variant }: { variant: "top" | "pill" }) {
  const pathname = usePathname();
  return (
    <nav className={variant === "top" ? "top-nav" : "pill-nav"} aria-label="Navigazione principale">
      {items.map(({ href, label, Icon, Active }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={active ? "active" : undefined} aria-current={active ? "page" : undefined} aria-label={label}>
            {active && Active ? <Active className="nav-icon" /> : <Icon className="nav-icon" />}
            <span className="nav-label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
