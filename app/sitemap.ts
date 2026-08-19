import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const canonicalPaths = [
    "",
    "/tutorial",
    "/research",
    "/co-design",
    "/result",
    "/paper",
    "/paper/reader",
    "/professors",
    "/quest",
    "/quest/first-line",
    "/quest/silence-rescue",
    "/quest/email-guard",
    "/mentor-loop",
    "/portfolio",
  ];

  return canonicalPaths.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));
}
