import type { Metadata } from "next";
import { Navbar } from "@/components/site/navbar";
import { Portfolio } from "@/components/site/portfolio";
import { CultureCta } from "@/components/site/culture-cta";
import { Footer } from "@/components/site/footer";
import { BreadcrumbJsonLd } from "@/components/site/breadcrumb-jsonld";

export const metadata: Metadata = {
  alternates: { canonical: "/work" },
  title: "제작 사례",
  description:
    "제조부터 개발까지, 모두의 창업 솔루션이 만들어 온 제작 사례를 소개합니다. 아이디어가 실제 제품·서비스로 완성된 과정을 확인해 보세요.",
};

export default function WorkPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "홈", path: "/" },
          { name: "제작 사례", path: "/work" },
        ]}
      />
      <Navbar />
      <main id="main">
        <h1 className="sr-only">
          제작 사례 — 제조부터 개발까지 완성한 프로젝트
        </h1>
        <Portfolio />
        <CultureCta />
      </main>
      <Footer />
    </>
  );
}
