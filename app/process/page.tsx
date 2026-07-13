import type { Metadata } from "next";
import { Navbar } from "@/components/site/navbar";
import { Process } from "@/components/site/process";
import { Footer } from "@/components/site/footer";
import { BreadcrumbJsonLd } from "@/components/site/breadcrumb-jsonld";

export const metadata: Metadata = {
  alternates: { canonical: "/process" },
  title: "제작 과정",
  description:
    "상담부터 양산·배포까지, 모두의 창업 솔루션의 6단계 제작 프로세스. 제조와 개발을 함께 이해하는 한 팀이 단계별 산출물과 일정을 투명하게 공유합니다.",
};

export default function ProcessPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "홈", path: "/" },
          { name: "제작 과정", path: "/process" },
        ]}
      />
      <Navbar />
      <main id="main">
        <h1 className="sr-only">
          제작 과정 — 상담부터 양산·배포까지 6단계 프로세스
        </h1>
        <Process />
      </main>
      <Footer />
    </>
  );
}
