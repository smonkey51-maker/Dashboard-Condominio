import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Euganeo Casa",
    short_name: "Euganeo Casa",
    description: "Dashboard privata del Condominio Euganeo",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f5f0",
    theme_color: "#133e2a",
    lang: "it",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
