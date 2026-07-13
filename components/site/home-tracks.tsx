import Link from "next/link";
import { pricing } from "@/lib/content";
import { Section, SectionHeader } from "./section";
import { Reveal } from "./reveal";
import { LogoMark } from "./logos";

/* 홈 요약 블록 ① — 제조 / 개발 두 트랙을 압축해 보여주고 서비스 페이지로 유도.
   데이터는 pricing.plans 재사용(단일 출처 유지). */
const MARK: Record<string, string> = {
  manufacture: "원더플라스틱",
  develop: "RC BLOCK",
};

export function HomeTracks() {
  return (
    <Section id="tracks" className="bg-background">
      <SectionHeader
        kicker="What we make"
        title={"제조와 개발,\n두 갈래로 만듭니다"}
        description="아이디어를 손에 잡히는 제품으로, 또 살아 움직이는 서비스로. 한 팀이 두 역량을 하나의 흐름으로 잇습니다."
      />

      <div className="mt-14 grid gap-6 lg:mt-16 lg:grid-cols-2">
        {pricing.plans.map((plan, i) => (
          <Reveal key={plan.tone} delay={i * 0.08}>
            <Link
              href="/#services"
              className="group flex h-full flex-col rounded-3xl border border-border bg-secondary/40 p-8 transition-[transform,border-color,box-shadow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:border-brand/40 hover:shadow-[0_36px_80px_-44px_rgba(11,11,12,0.35)] sm:p-10"
            >
              <div className="flex items-center justify-between">
                <span className="font-latin text-sm tracking-[0.12em] text-foreground/40">
                  [0{i + 1}]
                </span>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-foreground/50 transition-colors duration-500 group-hover:border-brand/40 group-hover:text-brand">
                  <LogoMark name={MARK[plan.tone]} className="h-6 w-6" />
                </span>
              </div>

              <span className="mt-7 block text-sm font-semibold uppercase tracking-[0.14em] text-brand">
                {plan.label}
              </span>
              <h3 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                {plan.name}
              </h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {plan.caption}
              </p>

              <ul className="mt-6 flex flex-wrap gap-2">
                {plan.features.slice(0, 4).map((f) => (
                  <li
                    key={f}
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground/70"
                  >
                    {f}
                  </li>
                ))}
              </ul>

              <span className="mt-auto flex items-center gap-2 pt-8 text-sm font-semibold text-foreground">
                서비스 자세히 보기
                <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
