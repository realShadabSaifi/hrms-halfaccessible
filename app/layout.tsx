import type { Metadata } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import "./globals.scss";

const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-baloo",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "halfAccessible portal",
  description: "the portal. no corporate BS.",
};

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
