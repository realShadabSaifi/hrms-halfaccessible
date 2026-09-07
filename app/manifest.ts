import type { MetadataRoute } from "next";
import { getAppSettings } from "@/lib/branding/settings";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getAppSettings();
  return {
    name: `${settings.app_name} portal`,
    short_name: settings.app_name,
    start_url: "/chat",
    display: "standalone",
    background_color: "#F7F5FC",
    theme_color: "#7463D4",
    icons: [
      { src: "/pwa/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa/512", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
