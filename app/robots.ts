import type { MetadataRoute } from "next";

const SITE = "https://www.modusol.kr";

// 검색엔진 크롤링 규칙. 공개 페이지는 전면 허용하고, 관리자·API 경로는 차단.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/"],
    },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
