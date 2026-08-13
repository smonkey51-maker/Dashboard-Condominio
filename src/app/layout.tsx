import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import RevealController from "./RevealController";
import NavSpy from "./NavSpy";
import MobileTabController from "./MobileTabController";

const roboto = Roboto({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-roboto" });

export const metadata: Metadata = {
  title: "Euganeo Casa",
  description: "Dashboard privata del Condominio Euganeo",
};

export const viewport: Viewport = {
  themeColor: "#fdfaf5",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it" className={roboto.variable}>
      <body>
        {children}
        <RevealController />
        <NavSpy />
        <MobileTabController />
      </body>
    </html>
  );
}
