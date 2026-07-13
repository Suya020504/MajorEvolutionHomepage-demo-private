import Link from "next/link";
import { RevealLines, Reveal } from "./reveal";

/* 홈 요약 블록 ③ — 가격 요약(다크 밴드). 핵심 가격 메시지 + /pricing·/process 유도.
   (별도 stats 4종 그리드는 두지 않음 — 홈 경량화 목적) */
export function HomePricingSummary() {
  return (
    <section
      id="price-summary"
      className="relative scroll-mt-20 overflow-hidden bg-ink px-6 py-24 text-white lg:px-10 lg:py-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-1/2 h-[34rem] w-[34rem] -translate-y-1/2 rounded-full blur-3xl [background:radial-gradient(circle,rgba(37,99,235,0.16),transparent_66%)]"
      />
      <div className="relative mx-auto flex max-w-[100rem] flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <Reveal>
            <span className="kicker font-latin text-white/55">Pricing</span>
          </Reveal>
          <RevealLines
            as="h2"
            text={"기본 150만원부터,\n견적은 미팅에서 투명하게"}
            className="font-accent mt-4 block text-[clamp(2rem,4.5vw,3.5rem)] font-bold leading-[1.12] tracking-[-0.01em]"
          />
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-xl leading-relaxed text-white/65">
              시제품 제작도 MVP 개발도 같은 시작점입니다. 과업 범위에 따라 비용이 달라지며, 상담 미팅을 통해 정확한 견적을 안내드립니다.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.15}>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-ink transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] hover:shadow-[0_18px_50px_-16px_rgba(37,99,235,0.6)]"
            >
              가격 자세히 보기
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="/process"
              className="inline-flex items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              제작 과정 6단계
              <span aria-hidden>→</span>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
