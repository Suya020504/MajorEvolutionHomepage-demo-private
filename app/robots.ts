import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();

  return {
    rules: { userAgent: "*", allow: "/" },
    // 크롤러가 사이트맵을 찾을 수 있도록 절대 URL로 알린다.
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
