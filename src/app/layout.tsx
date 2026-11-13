import type { Metadata, Viewport } from "next";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";
import RegisterServiceWorker from "./register-sw";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const serif = Newsreader({ subsets: ["latin"], variable: "--font-serif", style: ["normal"] });

export const metadata: Metadata = {
  title: "Euganeo Casa",
  description: "Dashboard privata del Condominio Euganeo",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Euganeo Casa",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#123f36",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it" className={`${sans.variable} ${serif.variable}`}>
      <body>
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
