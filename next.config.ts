import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // the invoice PDF route reads the Inter font files at runtime; make sure Vercel ships them
  outputFileTracingIncludes: {
    "/api/invoices/[id]/pdf": ["./node_modules/@fontsource/inter/files/inter-latin-*-normal.woff"],
  },
  sassOptions: {
    includePaths: [path.join(process.cwd(), "styles")],
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
