"use client";

import Image from "next/image";

import { companies } from "@/lib/content";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";
import { LogoMark } from "./logos";
import { ScrollRevealText } from "./scroll-reveal-text";
import { useCarousel, CarouselArrow } from "./carousel";

const TITLE_INK = "#0b0b0c";

/* ── Intro — 정적 에디토리얼 구성: 타이틀 완전 노출 → 아래 컬러 사진.
      (핀 해제 후 사진이 타이틀을 덮던 구도를 재설계) ── */
function CinemaIntro() {
  const { intro } = companies;

  return (
    <section
      id="companies"
      className="relative scroll-mt-20 overflow-hidden bg-background text-foreground"
    >
      <div className="relative mx-auto max-w-[100rem] px-6 pb-20 pt-28 lg:px-10 lg:pb-24 lg:pt-36">
        <p className="kicker font-latin text-center text-foreground/45">
          기업 소개 · Companies
        </p>

        {/* 타이틀 — 아무것도 가리지 않게 최상단에 온전히 */}
        <h2
          style={{ color: TITLE_INK }}
          className="font-latin mt-7 text-center text-[clamp(2.75rem,10.5vw,9.5rem)] font-bold uppercase leading-[0.95] tracking-tight"
        >
          {intro.big}
        </h2>

        {/* 사진 + 좌우 주석 — 컬러, 살짝만 기울여 */}
        <div className="relative mt-12 lg:mt-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-1/2 hidden -translate-y-1/2 items-start justify-between lg:flex"
          >
            <div className="font-latin flex items-start gap-8 text-[11px] tracking-[0.22em] text-foreground/55">
              <span className="text-foreground/30">01</span>
              <span className="whitespace-pre-line leading-relaxed">
                {intro.left}
              </span>
            </div>
            <div className="font-latin flex items-start gap-8 text-[11px] tracking-[0.22em] text-foreground/55">
              <span className="whitespace-pre-line text-right leading-relaxed">
                {intro.right}
              </span>
              <span className="text-foreground/30">03</span>
            </div>
          </div>

          <div className="relative mx-auto aspect-[4/3] w-[min(88vw,44rem)] rotate-2 overflow-hidden rounded-2xl shadow-[0_50px_120px_-40px_rgba(11,11,12,0.35)]">
            <Image
              src={companies.cover}
              alt=""
              aria-hidden
              fill
              priority
              sizes="(max-width: 800px) 88vw, 704px"
              className="object-cover"
            />
            <div aria-hidden className="absolute inset-0 ring-1 ring-inset ring-black/10" />
          </div>
        </div>
      </div>
    </section>
  );
}

type Company = {
  name: string;
  role: string;
  body: string;
  tags: readonly string[];
};

/* Light cards (continues the cinema chapter). Hover reveals the logo
   (subtle → prominent) + accent line sweep + lift. No flip. The umbrella
   card is marked with a brand glow to anchor it. */
function CompanyCard({ item, accent }: { item: Company; accent: boolean }) {
  return (
    <article
      className={cn(
        "group relative flex h-full min-h-[27rem] flex-col overflow-hidden rounded-3xl border bg-secondary/40 p-8 text-foreground transition-[transform,box-shadow,border-color,background-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:border-foreground/25 hover:bg-secondary/70 hover:shadow-[0_36px_80px_-36px_rgba(11,11,12,0.35)] sm:p-9",
        accent ? "border-brand/30" : "border-border"
      )}
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-brand transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
      />
      <div aria-hidden className="grain-local absolute inset-0" />
      {accent && (
        <div
          aria-hidden
          className="absolute -right-24 -top-24 h-64 w-64 rounded-full blur-3xl [background:radial-gradient(circle,rgba(37,99,235,0.12),transparent_62%)]"
        />
      )}

      <div className="relative flex items-center justify-between">
        {(() => {
          // 가로형 워드마크 로고(실제 로고)를 쓰는 카드는 박스를 넓게
          const wordmark = item.name === "원더플라스틱";
          return (
            <span
              className={cn(
                "flex h-14 items-center justify-center rounded-xl border border-border transition-[transform,color,background-color,border-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110 group-hover:border-foreground/40 group-hover:bg-white",
                wordmark
                  ? "w-auto px-3 text-foreground"
                  : "w-14 text-foreground/45 group-hover:text-foreground"
              )}
            >
              <LogoMark
                name={item.name}
                className={wordmark ? "h-8 w-auto" : "h-7 w-7"}
              />
            </span>
          );
        })()}
        <span
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-semibold",
            accent ? "border-brand/40 text-brand" : "border-border text-foreground/75"
          )}
        >
          {item.role}
        </span>
      </div>

      <h3 className="relative mt-7 text-2xl font-bold tracking-tight">
        {item.name}
      </h3>
      <p className="relative mt-4 leading-relaxed text-muted-foreground">{item.body}</p>

      <div className="relative mt-auto flex flex-wrap gap-2 pt-7">
        {item.tags.map((t) => (
          <span
            key={t}
            className="rounded-full bg-foreground/[0.06] px-3 py-1.5 text-xs text-foreground/70"
          >
            {t}
          </span>
        ))}
      </div>
    </article>
  );
}

export function Companies() {
  const { members, umbrella } = companies;
  const cards: { item: Company; accent: boolean }[] = [
    ...members.map((m) => ({ item: m as Company, accent: false })),
    { item: umbrella as Company, accent: true },
  ];
  const { ref, selected, scrollPrev, scrollNext, scrollTo } = useCarousel({
    loop: false,
    align: "start",
  });

  return (
    <>
      <CinemaIntro />

      {/* scroll-revealed manifesto — words light up left→right on scroll
          (zetta-joule style), bridging the cinema into the company cards */}
      <section className="relative bg-background px-6 pt-24 pb-6 text-foreground lg:px-10 lg:pt-32">
        <div className="mx-auto max-w-[100rem]">
          <span className="kicker font-latin text-foreground/45">Who we are</span>
          <ScrollRevealText
            text={companies.statement}
            className="mt-9 max-w-5xl text-[clamp(1.55rem,3.5vw,3rem)] font-semibold leading-[1.32] tracking-[-0.01em] text-foreground"
          />
        </div>
      </section>

      {/* same light chapter — flows out of the cinema, no tone jump */}
      <section className="relative scroll-mt-20 bg-background px-6 pb-28 pt-16 text-foreground lg:px-10">
        <div className="mx-auto max-w-[100rem]">
          <div className="flex items-end justify-between gap-6">
            <Reveal>
              <p className="max-w-md text-sm font-medium uppercase tracking-[0.18em] text-foreground/45">
                원더플라스틱 · RC BLOCK · 통합 솔루션
              </p>
            </Reveal>
            <div className="hidden shrink-0 items-center gap-5 sm:flex">
              <span className="tnum text-sm text-foreground/45">
                <span className="text-foreground">
                  {String(selected + 1).padStart(2, "0")}
                </span>{" "}
                / {String(cards.length).padStart(2, "0")}
              </span>
              <div className="flex gap-2">
                <CarouselArrow dir="prev" onClick={scrollPrev} />
                <CarouselArrow dir="next" onClick={scrollNext} />
              </div>
            </div>
          </div>

          {/* drag carousel */}
          <div className="mt-10 overflow-hidden" ref={ref}>
            <div className="flex gap-5">
              {cards.map((c) => (
                <div
                  key={c.item.name}
                  className="min-w-0 shrink-0 grow-0 basis-[88%] sm:basis-[58%] lg:basis-[40%] xl:basis-[34%]"
                >
                  <CompanyCard item={c.item} accent={c.accent} />
                </div>
              ))}
            </div>
          </div>

          {/* dots (mobile) */}
          <div className="mt-8 flex justify-center gap-2 sm:hidden">
            {cards.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`${i + 1}번 슬라이드로 이동`}
                onClick={() => scrollTo(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === selected ? "w-7 bg-foreground" : "w-1.5 bg-foreground/30"
                )}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
