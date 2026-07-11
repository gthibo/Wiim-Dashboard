import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Wiim Dashboard",
    short_name: "WiiM",
    description: "Control and monitor your WiiM audio devices",
    start_url: "/",
    display: "standalone",
    background_color: "#2A1804",
    theme_color: "#2A1804",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
