import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SCOOPER",
    short_name: "SCOOPER",
    description: "근무일정",
    start_url: "/",
    scope: "/",
    display: "standalone",
    lang: "ko",
    background_color: "#F3EEE6",
    theme_color: "#FFFCF8",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
