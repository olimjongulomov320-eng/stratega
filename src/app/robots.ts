import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const privatePaths = ["/admin", "/api", "/kabinet", "/korzina", "/korzina-yuborildi", "/kirish", "/compare", "/wishlist"];
  const disallow = [...privatePaths, ...privatePaths.map((p) => `/ru${p}`), ...privatePaths.map((p) => `/en${p}`)];
  return {
    rules: [{ userAgent: "*", allow: "/", disallow }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
