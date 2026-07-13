import { permanentRedirect } from "next/navigation";

// 서비스 섹션이 홈페이지로 통합됨 — 기존 URL은 홈 앵커로 영구(308) 리다이렉트해 링크 자산을 넘긴다.
export default function ServicesPage() {
  permanentRedirect("/#services");
}
