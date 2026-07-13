import type { Metadata } from "next";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { BreadcrumbJsonLd } from "@/components/site/breadcrumb-jsonld";
import { privacy } from "@/lib/content";

export const metadata: Metadata = {
  alternates: { canonical: "/privacy" },
  title: "개인정보처리방침",
  description: "모두의 창업 솔루션 개인정보처리방침 — 문의 기능 관련 개인정보 처리 안내.",
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "홈", path: "/" },
          { name: "개인정보처리방침", path: "/privacy" },
        ]}
      />
      <Navbar />
      <main id="main" className="mx-auto max-w-3xl px-6 pb-28 pt-36 lg:pt-44">
        <span className="kicker font-latin text-muted-foreground">Legal</span>
        <h1 className="display font-accent mt-4 text-[clamp(2rem,5vw,3.25rem)] font-extrabold tracking-[-0.02em]">
          {privacy.title}
        </h1>
        <p className="mt-3 font-mono text-xs text-muted-foreground">
          최종 업데이트 · {privacy.updated}
        </p>

        <p className="mt-10 leading-relaxed text-muted-foreground">
          {privacy.intro}
        </p>

        <div className="mt-10 divide-y divide-border border-y border-border">
          {privacy.sections.map((s) => (
            <section key={s.h} className="py-7">
              <h2 className="text-lg font-bold tracking-tight">{s.h}</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {s.body}
              </p>
            </section>
          ))}
        </div>

        <p className="mt-10 rounded-xl border border-border bg-secondary/50 p-5 text-xs leading-relaxed text-muted-foreground">
          {privacy.notice}
        </p>
      </main>
      <Footer />
    </>
  );
}
