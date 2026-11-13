import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Euganeo Casa",
    short_name: "Euganeo Casa",
    description: "Dashboard privata del Condominio Euganeo",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f2ec",
    theme_color: "#0f3d34",
    lang: "it",
    icons: [
      { src: "/icon-192.png?v=2", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png?v=2", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png?v=2", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
