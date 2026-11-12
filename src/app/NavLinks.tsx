"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconBell, IconCoin, IconFile, IconHome, IconUsers } from "./icons";

const items = [
  { href: "/", label: "Panoramica", Icon: IconHome },
  { href: "/pagamenti", label: "Pagamenti", Icon: IconCoin },
  { href: "/assemblee", label: "Assemblee", Icon: IconUsers },
  { href: "/documenti", label: "Documenti", Icon: IconFile },
  { href: "/comunicazioni", label: "Comunicazioni", Icon: IconBell },
];

export default function NavLinks({ variant }: { variant: "side" | "pill" }) {
  const pathname = usePathname();
  return (
    <nav className={variant === "side" ? "side-nav" : "pill-nav"} aria-label="Navigazione principale">
      {items.map(({ href, label, Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={active ? "active" : undefined} aria-current={active ? "page" : undefined} aria-label={label}>
            <Icon className="nav-icon" />
            <span className="nav-label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
