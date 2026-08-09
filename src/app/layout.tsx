import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Euganeo Casa",
  description: "Dashboard privata del Condominio Euganeo",
};

export const viewport: Viewport = {
  themeColor: "#030a06",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="it"><body>{children}</body></html>;
}
