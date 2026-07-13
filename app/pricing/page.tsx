import type { Metadata } from "next";
import { Navbar } from "@/components/site/navbar";
import { Pricing } from "@/components/site/pricing";
import { Footer } from "@/components/site/footer";
import { BreadcrumbJsonLd } from "@/components/site/breadcrumb-jsonld";

export const metadata: Metadata = {
  alternates: { canonical: "/pricing" },
  title: "가격",
  description:
    "시제품 제작도 MVP 개발도 기본 150만원부터. 견적에 영향을 주는 변수와 사업비 서류·대면 결제 같은 추가 지원 서비스까지 투명하게 안내합니다.",
};

export default function PricingPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "홈", path: "/" },
          { name: "가격", path: "/pricing" },
        ]}
      />
      <Navbar />
      <main id="main">
        <h1 className="sr-only">
          제작 서비스 가격 안내 — 시제품 제작·MVP 개발 기본 150만원부터
        </h1>
        <Pricing />
      </main>
      <Footer />
    </>
  );
}
