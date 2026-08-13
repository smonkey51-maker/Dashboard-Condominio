import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import RevealController from "./RevealController";
import NavSpy from "./NavSpy";
import SectionOverlay from "./SectionOverlay";

const roboto = Roboto({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-roboto" });

export const metadata: Metadata = {
  title: "Euganeo Casa",
  description: "Dashboard privata del Condominio Euganeo",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f1e6" },
    { media: "(prefers-color-scheme: dark)", color: "#0f3d38" },
  ],
};

const THEME_BOOT_SCRIPT = `
  try {
    var t = localStorage.getItem("euganeo-theme");
    if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
  } catch (e) {}
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it" className={roboto.variable} suppressHydrationWarning>
      <body>
        <Script id="theme-boot" strategy="beforeInteractive">{THEME_BOOT_SCRIPT}</Script>
        {children}
        <RevealController />
        <NavSpy />
        <SectionOverlay />
      </body>
    </html>
  );
}
