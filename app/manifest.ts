import type { MetadataRoute } from "next";

// PWA 매니페스트 — 홈화면 추가·모바일 브랜딩 신호. Next가 <link rel="manifest">를 자동 주입.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "모두의 창업 솔루션",
    short_name: "모두의창업",
    description: "아이디어 하나로 시작하는 창업 제작 솔루션",
    start_url: "/",
    display: "standalone",
    lang: "ko",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
