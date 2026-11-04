import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

// Who may show the site inside a frame. Telegram Web (web.telegram.org) frames the Mini Apps, and
// /tg/shop and /tg/admin then navigate to the storefront and /admin inside that frame, so they need it
// too. Yandex Metrica frames pages to replay Webvisor recordings and click maps.
// X-Frame-Options is deliberately not used: it cannot list several sites, and browsers ignore it
// when frame-ancestors is present.
const FRAME_ANCESTORS = [
  "'self'",
  "https://web.telegram.org",
  "https://metrika.yandex.ru",
  "https://metrica.yandex.com",
  "https://*.webvisor.com",
].join(" ");

const nextConfig: NextConfig = {
  turbopack: { root: projectRoot },
  poweredByHeader: false,
  images: {
    // Product photos uploaded from the admin panel live in Vercel Blob.
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com", pathname: "/**" }],
  },
  experimental: {
    // Admin CSV/Excel import accepts files up to 5MB (default limit is 1MB).
    serverActions: { bodySizeLimit: "6mb" },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: `frame-ancestors ${FRAME_ANCESTORS}; base-uri 'self'; object-src 'none'` },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Camera stays allowed for the site itself: admin scans barcodes with the phone camera.
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=()" },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
