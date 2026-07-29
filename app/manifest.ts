import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "너의 교수님은?",
    short_name: "너의 교수님은?",
    description: "전공과 진로의 갈림길에서, 교수님을 찾고 만들고 잇는 대학생 연구 여정 앱",
    start_url: "/",
    display: "standalone",
    background_color: "#F5F7FC",
    theme_color: "#7557F6",
    lang: "ko-KR",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
