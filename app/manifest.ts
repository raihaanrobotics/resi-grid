import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ResiGrid",
    short_name: "ResiGrid",
    description: "Your neighborhood resilience hub",
    start_url: "/",
    display: "standalone",
    background_color: "#05080b",
    theme_color: "#05080b",
    icons: [
      {
        src: "/icons/resigrid.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
