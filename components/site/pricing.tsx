"use client";

import Image from "next/image";

import { useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useInView,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { useLenis } from "lenis/react";
import { useRouter } from "next/navigation";
import { pricing } from "@/lib/content";
import { cn } from "@/lib/utils";
import { Magnetic } from "./magnetic";
import { IsoGlyph } from "./iso-glyphs";
import { PlanShowcaseStage } from "./plan-showcase";

const EASE = [0.16, 1, 0.3, 1] as const;

/* ── Wolverine-style "drop in one by one" cascade ── */
const dropContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.16, delayChildren: 0.05 } },
};
const dropItem: Variants = {
  hidden: { opacity: 0, y: -52 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
};

function Drop({
  children,
  className,
  reduce,
}: {
  children: React.ReactNode;
  className?: string;
  reduce: boolean;
}) {
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div variants={dropItem} className={className}>
      {children}
    </motion.div>
  );
}

/* ── Count 0 → target once in view ── */
function CountUp({ target, className }: { target: number; className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2, margin: "0px 0px -10% 0px" });
  const [n, setN] = useState(reduce ? target : 0);

  useEffect(() => {
    if (!inView || reduce) return;
    const c = animate(0, target, {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setN(Math.round(v)),
    });
    return () => c.stop();
  }, [inView, reduce, target]);

  return (
    <span ref={ref} className={cn("tnum", className)}>
      {n}
    </span>
  );
}

/* ── "The Two Tracks" 제조/개발 사진+텍스트 쇼케이스는 ./plan-showcase 로 추출됨
      (홈과 /pricing 이 공유). PlanShowcaseStage 를 import 해서 사용. ── */

/* ── Estimate-variable chips: cascade in (stagger), tactile fill on hover ── */
const chipContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.05 } },
};
const chipItem: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.9 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: EASE } },
};

/* ── One variable as a blueprint-style tile (3D iso glyph + depth) ── */
function VarTile({ name, index }: { name: string; index: number }) {
  return (
    <motion.div
      variants={chipItem}
      className="group/v relative flex items-center gap-3.5 overflow-hidden rounded-xl border border-border bg-gradient-to-b from-background to-secondary/60 px-4 py-3.5 shadow-[0_1px_2px_rgba(11,11,12,0.04),0_12px_26px_-20px_rgba(11,11,12,0.3)] transition-[border-color,transform,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-brand/45 hover:shadow-[0_22px_44px_-24px_rgba(37,99,235,0.5)]"
    >
      {/* faint index watermark fills the empty right side */}
      <span
        aria-hidden
        className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 font-display-ko text-[3.4rem] font-bold leading-none text-transparent [-webkit-text-stroke:1px_rgba(11,11,12,0.05)] transition-[--tw-text-stroke] duration-300 group-hover/v:[-webkit-text-stroke:1px_rgba(37,99,235,0.12)]"
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      {/* filled brand chip with a 3D iso glyph — inverts on hover */}
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand ring-1 ring-brand/15 transition-[background-color,color,transform] duration-300 group-hover/v:scale-105 group-hover/v:bg-brand group-hover/v:text-white group-hover/v:ring-brand">
        <IsoGlyph name={name} className="h-6 w-6" />
      </span>
      <span className="relative text-sm font-semibold text-foreground">{name}</span>
    </motion.div>
  );
}

/* ── One category group: header (icon + eyebrow + title + index) + tile grid ── */
function VarGroup({
  no,
  eyebrow,
  title,
  desc,
  items,
  glyph,
  reduce,
}: {
  no: string;
  eyebrow: string;
  title: string;
  desc: string;
  items: readonly string[];
  glyph: string;
  reduce: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-4 border-b border-border pb-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/15 shadow-[0_10px_24px_-16px_rgba(37,99,235,0.5)]">
          <IsoGlyph name={glyph} className="h-7 w-7" />
        </span>
        <div className="min-w-0">
          <span className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground">
            {eyebrow}
          </span>
          <h4 className="text-lg font-extrabold tracking-tight text-foreground">
            {title}
          </h4>
        </div>
        <span className="ml-auto font-latin text-sm tracking-[0.12em] text-foreground/30">
          [{no}]
        </span>
      </div>

      <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
        {desc}
      </p>

      <motion.div
        variants={reduce ? undefined : chipContainer}
        initial={reduce ? undefined : "hidden"}
        whileInView={reduce ? undefined : "show"}
        viewport={{ once: true, margin: "-40px" }}
        className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        {items.map((it, i) => (
          <VarTile key={it} name={it} index={i} />
        ))}
      </motion.div>
    </div>
  );
}

/* ── Estimate variables — blueprintapps-style asymmetric layout
      (left heading + summary · right categorised tiles · grid backdrop) ── */
function VariablesBlueprint({ reduce }: { reduce: boolean }) {
  return (
    <div className="relative border-t border-border pt-12 lg:pt-16">
      {/* blueprint grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.7] [background-image:linear-gradient(to_right,rgba(11,11,12,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(11,11,12,0.045)_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(85%_65%_at_35%_0%,#000_18%,transparent_82%)]"
      />
      {/* soft brand wash behind the tiles for depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-10 h-[34rem] w-[34rem] translate-x-1/4 rounded-full blur-3xl [background:radial-gradient(circle,rgba(37,99,235,0.07),transparent_66%)]"
      />

      <div className="relative grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
        {/* LEFT — heading + summary (sticky on desktop) */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <span className="kicker font-latin text-brand">
            견적 변수 · Estimate Variables
          </span>
          <h3 className="font-accent mt-4 text-[clamp(1.7rem,3.2vw,2.6rem)] font-extrabold leading-[1.18] tracking-[-0.01em]">
            이 변수들이 모여,
            <br /> 당신의 견적이 됩니다
          </h3>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
            제품 제작과 서비스 개발은 각각 다른 변수로 단가가 정해집니다. 아래
            항목들을 미팅에서 함께 정리해 정확한 견적을 산정합니다.
          </p>

          {/* summary — the variables resolve into one custom quote */}
          <div className="mt-9 inline-flex items-center gap-2.5 rounded-full border border-foreground/15 bg-background px-5 py-3 shadow-[0_18px_40px_-34px_rgba(11,11,12,0.5)]">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
              =
            </span>
            <span className="text-sm font-semibold text-foreground">
              당신만의 맞춤 견적
            </span>
          </div>
        </div>

        {/* RIGHT — categorised variable tiles */}
        <div className="space-y-12">
          <VarGroup
            no="01"
            eyebrow="제조 기반"
            title={pricing.variables[0].short}
            desc={pricing.variables[0].desc}
            items={pricing.variables[0].items}
            glyph="__manufacture"
            reduce={reduce}
          />
          <VarGroup
            no="02"
            eyebrow="개발 기반"
            title={pricing.variables[1].short}
            desc={pricing.variables[1].desc}
            items={pricing.variables[1].items}
            glyph="__develop"
            reduce={reduce}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Opener: 정적 에디토리얼 헤더 — 사진 위 화이트 포그, 핀/스크럽 없음.
      (본질 집중 다이어트: 스크롤 하이재킹 제거, 정보로 바로 진입) ── */
function CinematicOpener() {
  const titleLines = pricing.title.split("\n");

  return (
    <section
      id="pricing"
      className="relative scroll-mt-20 overflow-hidden bg-background px-6 py-28 text-foreground lg:py-36"
    >
      <Image
        src={pricing.cinemaImage}
        alt=""
        aria-hidden
        fill
        priority
        sizes="100vw"
        className="img-graded object-cover opacity-30"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-white via-white/40 to-white"
      />
      <div className="relative mx-auto max-w-4xl text-center">
        <span className="kicker font-latin inline-flex items-center gap-3 text-foreground/55">
          <span aria-hidden className="h-px w-8 bg-foreground/30" />
          {pricing.kicker} · 투명한 가격
          <span aria-hidden className="h-px w-8 bg-foreground/30" />
        </span>
        <h2 className="display font-accent mt-5 text-[clamp(2.4rem,7vw,5.5rem)] leading-[1.04]">
          {titleLines.map((l, i) => (
            <span key={i} className="block">
              {l}
            </span>
          ))}
        </h2>
        <p className="mx-auto mt-6 max-w-xl leading-relaxed text-foreground/70">
          {pricing.description}
        </p>
      </div>
    </section>
  );
}

export function Pricing() {
  const reduce = useReducedMotion() ?? false;
  const lenis = useLenis();
  const router = useRouter();

  function go(href: string) {
    if (href.startsWith("/") && !href.startsWith("/#")) {
      router.push(href);
      return;
    }
    const hash = href.startsWith("/#") ? href.slice(1) : href;
    if (lenis) lenis.scrollTo(hash, { offset: -80 });
    else document.querySelector(hash)?.scrollIntoView();
  }

  return (
    <>
      {/* cinematic opener (paralleluniverse-style) holds the id=pricing anchor */}
      <CinematicOpener />

      {/* light showcase chapter — flows seamlessly out of the cinema */}
      <section className="relative bg-secondary px-6 pb-28 pt-12 text-foreground lg:px-10 lg:pb-36 lg:pt-16">
        <div className="mx-auto max-w-[100rem]">
          <PlanShowcaseStage reduce={reduce} />
        </div>
      </section>

      {/* light relief — estimate variables + CTA */}
      <section className="relative bg-background px-6 py-24 lg:px-10 lg:py-28">
      <div className="mx-auto max-w-[100rem]">
        {/* variables + CTA cascade */}
        <motion.div
          variants={reduce ? undefined : dropContainer}
          initial={reduce ? undefined : "hidden"}
          whileInView={reduce ? undefined : "show"}
          viewport={{ once: true, margin: "-80px" }}
          className="space-y-16 lg:space-y-20"
        >
          {/* estimate variables — blueprint-style asymmetric layout */}
          <Drop reduce={reduce}>
            <VariablesBlueprint reduce={reduce} />
          </Drop>

          {/* dark CTA band */}
          <Drop reduce={reduce}>
            <CtaBand reduce={reduce} go={go} />
          </Drop>
        </motion.div>
      </div>
      </section>
    </>
  );
}

/* ── Signature dark CTA band: aurora-free ink + pointer glow + grain ── */
function CtaBand({
  reduce,
  go,
}: {
  reduce: boolean;
  go: (href: string) => void;
}) {
  const orb = useRef<HTMLDivElement>(null);
  const raf = useRef(0);

  function onMove(e: React.MouseEvent<HTMLElement>) {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      if (!orb.current) return;
      orb.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      orb.current.style.opacity = "1";
    });
  }
  function onLeave() {
    if (orb.current) orb.current.style.opacity = "0";
  }

  const titleLines = pricing.ctaTitle.split("\n");

  return (
    <div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="relative overflow-hidden rounded-[2rem] bg-ink px-7 py-12 text-white sm:px-12 sm:py-16 lg:px-16"
    >
      {/* pointer-tracking brand glow */}
      <div
        ref={orb}
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 h-[32rem] w-[32rem] opacity-0 mix-blend-screen [background:radial-gradient(circle,rgba(37,99,235,0.28),rgba(37,99,235,0)_62%)]"
        style={{
          transitionProperty: "opacity, transform",
          transitionDuration: "500ms, 380ms",
          transitionTimingFunction: "ease-out",
          willChange: "transform",
        }}
      />
      <div aria-hidden className="grain-local absolute inset-0" />

      <div className="relative flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <span className="kicker font-latin inline-flex items-center gap-2.5 text-white/55">
            <span aria-hidden className="h-1.5 w-1.5 shrink-0 bg-brand" />
            {pricing.ctaKicker}
          </span>
          <h3 className="font-accent mt-5 text-[clamp(1.9rem,3.6vw,3.1rem)] leading-[1.12] tracking-[-0.01em]">
            {titleLines.map((line, i) => (
              <span
                key={i}
                className="block"
                style={{ fontWeight: i === titleLines.length - 1 ? 800 : 400 }}
              >
                {line}
              </span>
            ))}
          </h3>
          <p
            className="mt-4 text-lg italic text-white/55 sm:text-xl"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {pricing.ctaAccent}
          </p>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-white/65 sm:text-base">
            {pricing.note}
          </p>
        </div>

        {/* price anchor + CTA — fills the right, balances the band */}
        <div className="flex shrink-0 flex-col items-start gap-7 lg:items-end">
          <div className="lg:text-right">
            <div className="relative inline-block">
              <p className="font-accent flex items-baseline gap-1.5">
                <CountUp
                  target={150}
                  className="text-[clamp(3.25rem,7vw,5.5rem)] font-extrabold leading-none"
                />
                <span className="text-xl font-bold">만원~</span>
              </p>
              <motion.span
                aria-hidden
                initial={reduce ? false : { scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.4, ease: EASE }}
                className="absolute -bottom-2 left-0 h-0.5 w-full origin-left bg-brand"
              />
            </div>
            <p className="kicker font-latin mt-4 text-white/60">
              기본 시작 금액 · Base price
            </p>
          </div>

          <Magnetic className="inline-block">
            <button
              type="button"
              onClick={() => go(pricing.cta.href)}
              className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-white py-4 pl-8 pr-3 text-sm font-semibold text-ink transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] hover:shadow-[0_18px_50px_-16px_rgba(37,99,235,0.65)]"
            >
              <span
                aria-hidden
                className="absolute inset-0 translate-y-full bg-brand transition-transform duration-[450ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0"
              />
              <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
                {pricing.cta.label}
              </span>
              <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-ink text-white transition-[background-color,color,transform] duration-300 group-hover:translate-x-0.5 group-hover:bg-white group-hover:text-brand">
                →
              </span>
            </button>
          </Magnetic>
        </div>
      </div>

      {/* wibify-style "what's included" — square bullets + hairline rows */}
      <motion.div
        variants={reduce ? undefined : chipContainer}
        initial={reduce ? undefined : "hidden"}
        whileInView={reduce ? undefined : "show"}
        viewport={{ once: true, margin: "-60px" }}
        className="relative mt-12 grid border-t border-white/10 sm:grid-cols-2 sm:gap-x-14"
      >
        {pricing.included.map((f) => (
          <motion.div
            key={f.label}
            variants={reduce ? undefined : chipItem}
            className="flex items-baseline justify-between gap-6 border-b border-white/10 py-5"
          >
            <span className="flex items-center gap-3 text-base font-semibold text-white">
              <span aria-hidden className="h-1.5 w-1.5 shrink-0 bg-brand" />
              {f.label}
            </span>
            <span className="text-right text-sm leading-relaxed text-white/55">
              {f.desc}
            </span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
