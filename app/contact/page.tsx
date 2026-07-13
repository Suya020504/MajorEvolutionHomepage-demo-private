import type { Metadata } from "next";
import { Navbar } from "@/components/site/navbar";
import { Contact } from "@/components/site/contact";
import { Footer } from "@/components/site/footer";
import { BreadcrumbJsonLd } from "@/components/site/breadcrumb-jsonld";

export const metadata: Metadata = {
  alternates: { canonical: "/contact" },
  title: "문의",
  description:
    "제조든 개발이든, 아이디어 단계여도 괜찮습니다. 제작 유형·예산·일정을 남겨주시면 영업일 1~2일 안에 답변드립니다 — 모두의 창업 솔루션.",
};

export default function ContactPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "홈", path: "/" },
          { name: "문의", path: "/contact" },
        ]}
      />
      <Navbar />
      <main id="main">
        <h1 className="sr-only">
          문의하기 — 시제품 제작·MVP 개발 상담 신청
        </h1>
        <Contact />
      </main>
      <Footer />
    </>
  );
}
