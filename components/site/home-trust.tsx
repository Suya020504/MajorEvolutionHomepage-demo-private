import Link from "next/link";
import { partners, caseStudies } from "@/lib/content";
import { Section, SectionHeader } from "./section";
import { Reveal } from "./reveal";
import { LogoMark } from "./logos";

/* 홈 요약 블록 ② — 신뢰 스트립: 파트너 로고 + 대표 제작 사례 3개 프리뷰.
   각각 /about, /work 로 유도. */
export function HomeTrust() {
  return (
    <Section id="trust" className="bg-secondary">
      <SectionHeader
        kicker="Proof"
        title={"혼자가 아닙니다"}
        description="검증된 제조·개발 파트너와 함께, 아이디어를 실제 제품과 서비스로 만들어 왔습니다."
        trailing={
          <Link
            href="/work"
            className="inline-flex items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-brand"
          >
            제작 사례 전체 보기
            <span aria-hidden>→</span>
          </Link>
        }
      />

      {/* 파트너 로고 스트립 */}
      <Reveal>
        <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4 border-y border-border py-6">
          <span className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground">
            함께하는 파트너
          </span>
          {partners.items.map((p) => (
            <span key={p.name} className="flex items-center gap-2 text-sm font-medium text-foreground/80">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-foreground/60">
                <LogoMark name={p.name} className="h-4 w-4" />
              </span>
              {p.name}
            </span>
          ))}
          <Link
            href="/about"
            className="ml-auto inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            회사소개 <span aria-hidden>→</span>
          </Link>
        </div>
      </Reveal>

      {/* 대표 사례 3개 프리뷰 */}
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {caseStudies.slice(0, 3).map((c, i) => (
          <Reveal key={c.title} delay={i * 0.08}>
            <Link
              href="/work"
              className="group block h-full overflow-hidden rounded-2xl border border-border bg-background transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-[0_30px_60px_-40px_rgba(11,11,12,0.4)]"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                <img
                  src={c.image}
                  alt={c.title}
                  loading="lazy"
                  className="img-graded h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <span className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-brand">
                  {c.tag}
                </span>
                <h3 className="mt-1.5 font-semibold leading-snug text-foreground">
                  {c.title}
                </h3>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
