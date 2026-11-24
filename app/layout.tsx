import type { Metadata } from "next";
import localFont from "next/font/local";
import { getAppSettings } from "@/lib/branding/settings";
import "./globals.scss";

// Self-hosted (from @fontsource) instead of next/font/google, so builds don't depend on
// downloading from Google Fonts. Same families, weights and latin subset as before.
// next/font needs literal options, hence the spelled-out paths.
const baloo = localFont({
  src: [
    { path: "../node_modules/@fontsource/baloo-2/files/baloo-2-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../node_modules/@fontsource/baloo-2/files/baloo-2-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../node_modules/@fontsource/baloo-2/files/baloo-2-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-baloo",
  display: "swap",
});

const nunito = localFont({
  src: [
    { path: "../node_modules/@fontsource/nunito/files/nunito-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../node_modules/@fontsource/nunito/files/nunito-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../node_modules/@fontsource/nunito/files/nunito-latin-700-normal.woff2", weight: "700", style: "normal" },
    { path: "../node_modules/@fontsource/nunito/files/nunito-latin-800-normal.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-nunito",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getAppSettings();
  return {
    title: `${settings.app_name} portal`,
    description: "the portal. no corporate BS.",
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${baloo.variable} ${nunito.variable}`}>
      <body>
        <a className="skip-link" href="#main">
          skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
