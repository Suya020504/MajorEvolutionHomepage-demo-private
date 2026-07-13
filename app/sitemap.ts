import type { MetadataRoute } from "next";

const SITE = "https://www.modusol.kr";

// 페이지별 마지막 의미 있는 수정일(정적) — 빌드마다 바뀌지 않도록 고정.
// 콘텐츠를 실제로 갱신하면 해당 라우트의 날짜만 올려주면 됨.
export default function sitemap(): MetadataRoute.Sitemap {
  const routes: {
    path: string;
    lastModified: string;
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  }[] = [
    { path: "/", lastModified: "2026-07-07", priority: 1.0, changeFrequency: "weekly" },
    { path: "/pricing", lastModified: "2026-07-07", priority: 0.9, changeFrequency: "monthly" },
    { path: "/work", lastModified: "2026-07-07", priority: 0.8, changeFrequency: "monthly" },
    { path: "/contact", lastModified: "2026-07-07", priority: 0.8, changeFrequency: "monthly" },
    { path: "/about", lastModified: "2026-07-07", priority: 0.7, changeFrequency: "monthly" },
    { path: "/process", lastModified: "2026-07-07", priority: 0.7, changeFrequency: "monthly" },
    { path: "/privacy", lastModified: "2026-07-07", priority: 0.3, changeFrequency: "yearly" },
  ];

  return routes.map((r) => ({
    url: `${SITE}${r.path}`,
    lastModified: r.lastModified,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
