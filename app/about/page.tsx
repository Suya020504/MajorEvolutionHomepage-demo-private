import type { Metadata } from "next";
import { Navbar } from "@/components/site/navbar";
import { Companies } from "@/components/site/companies";
import { Partners } from "@/components/site/partners";
import { Featured } from "@/components/site/featured";
import { CultureCta } from "@/components/site/culture-cta";
import { Footer } from "@/components/site/footer";
import { BreadcrumbJsonLd } from "@/components/site/breadcrumb-jsonld";

export const metadata: Metadata = {
  alternates: { canonical: "/about" },
  title: "회사소개",
  description:
    "제조와 개발, 두 역량을 하나의 흐름으로 잇는 팀. 모두의 창업 솔루션과 함께 만드는 창업 생태계, 그리고 제작 철학을 소개합니다.",
};

export default function AboutPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "홈", path: "/" },
          { name: "회사소개", path: "/about" },
        ]}
      />
      <Navbar />
      <main id="main">
        <h1 className="sr-only">
          회사소개 — 제조와 개발을 잇는 창업 제작 팀, 모두의 창업 솔루션
        </h1>
        <Companies />
        <Partners />
        <Featured />
        <CultureCta />
      </main>
      <Footer />
    </>
  );
}
