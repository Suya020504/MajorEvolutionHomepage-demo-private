"use client";

import Image from "next/image";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { pricing } from "@/lib/content";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

/* ── Faint orbital line-art (paralleluniverse-style), monochrome ── */
function OrbitalArt() {
  return (
    <svg
      viewBox="0 0 800 800"
      className="h-full w-full"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    >
      <circle cx="400" cy="400" r="110" />
      <circle cx="400" cy="400" r="180" strokeDasharray="2 9" />
      <circle cx="400" cy="400" r="262" />
      <circle cx="400" cy="400" r="350" strokeDasharray="2 11" />
      <ellipse cx="400" cy="400" rx="350" ry="180" strokeDasharray="1 13" />
      <ellipse cx="400" cy="400" rx="180" ry="350" strokeDasharray="1 13" />
      <circle cx="400" cy="50" r="4" fill="currentColor" stroke="none" />
      <circle cx="750" cy="400" r="3" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ── Minimal monochrome MacBook frame (CSS-only, brand-clean) ── */
function MacBookFrame({ src }: { src: string }) {
  return (
    <div className="w-full">
      {/* lid / screen */}
      <div className="mx-auto w-[86%] rounded-t-[0.9rem] rounded-b-[0.15rem] border border-b-0 border-white/15 bg-[#101013] p-2 shadow-[0_34px_70px_-44px_rgba(11,11,12,0.45)]">
        <div className="relative aspect-[16/10] overflow-hidden rounded-[0.35rem] bg-[radial-gradient(120%_120%_at_30%_15%,rgba(255,255,255,0.06),transparent_60%)] ring-1 ring-white/10">
          <Image
            src={src}
            alt=""
            aria-hidden
            fill
            sizes="(max-width: 640px) 90vw, 480px"
            className="object-cover opacity-0 transition-opacity duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)]"
            onLoad={(e) => (e.currentTarget.style.opacity = "1")}
            ref={(el) => {
              // cached images can finish before hydration — onLoad never fires
              if (el?.complete && el.naturalWidth > 0) el.style.opacity = "1";
            }}
          />
          {/* screen sheen */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.1),transparent_38%)]"
          />
        </div>
      </div>
      {/* deck / base */}
      <div className="relative mx-auto h-[0.95rem] w-full rounded-b-[0.7rem] rounded-t-[0.1rem] bg-gradient-to-b from-[#26262b] to-[#141418] shadow-[0_22px_30px_-22px_rgba(11,11,12,0.4)] sm:h-[1.15rem]">
        {/* thumb notch */}
        <span
          aria-hidden
          className="absolute left-1/2 top-0 h-[0.26rem] w-[15%] -translate-x-1/2 rounded-b-md bg-[#0b0b0e]"
        />
      </div>
    </div>
  );
}

/* ── Minimal monochrome iPhone frame (CSS-only) ── */
function PhoneFrame({ src }: { src: string }) {
  return (
    <div className="relative w-full rounded-[1.9rem] border border-white/15 bg-[#101013] p-[3.5%] shadow-[0_40px_80px_-44px_rgba(11,11,12,0.5)]">
      <div className="relative aspect-[9/19] overflow-hidden rounded-[1.35rem] bg-[radial-gradient(120%_120%_at_30%_10%,rgba(255,255,255,0.06),transparent_55%)] ring-1 ring-white/10">
        <Image
          src={src}
          alt=""
          aria-hidden
          fill
          sizes="140px"
          className="object-cover opacity-0 transition-opacity duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)]"
          onLoad={(e) => (e.currentTarget.style.opacity = "1")}
            ref={(el) => {
              // cached images can finish before hydration — onLoad never fires
              if (el?.complete && el.naturalWidth > 0) el.style.opacity = "1";
            }}
        />
        {/* dynamic island */}
        <span
          aria-hidden
          className="absolute left-1/2 top-[2.4%] h-[3.4%] w-[30%] -translate-x-1/2 rounded-full bg-black"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.1),transparent_34%)]"
        />
      </div>
    </div>
  );
}

/* ── 개발 트랙: MacBook + iPhone cluster, scroll parallax (toss-style) ── */
function DeviceCluster({ reduce }: { reduce: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const macY = useTransform(scrollYProgress, [0, 1], ["6%", "-6%"]);
  const phoneY = useTransform(scrollYProgress, [0, 1], ["18%", "-14%"]);

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[34rem] px-4 sm:px-0">
      <motion.div style={reduce ? undefined : { y: macY }}>
        <MacBookFrame src={pricing.shots.pc} />
      </motion.div>
      <motion.div
        style={reduce ? undefined : { y: phoneY }}
        className="absolute -bottom-8 right-0 w-[26%] sm:-right-2 sm:w-[24%]"
      >
        <PhoneFrame src={pricing.shots.mobile} />
      </motion.div>
    </div>
  );
}

/* ── 제조 트랙: framed product on a plinth, scroll parallax ── */
function ProductFrame({ src, reduce }: { src: string; reduce: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[30rem]">
      <motion.div style={reduce ? undefined : { y }}>
        {/* 액자 — thin frame + passe-partout mat around a graded product */}
        <div className="group relative rounded-sm border border-border bg-white p-3 shadow-[0_44px_90px_-50px_rgba(11,11,12,0.5)] sm:p-4">
          <div className="relative overflow-hidden ring-1 ring-black/10">
            <div className="relative aspect-[4/5] overflow-hidden bg-[radial-gradient(120%_120%_at_30%_20%,rgba(255,255,255,0.06),transparent_60%)]">
              <Image
                src={src}
                alt=""
                aria-hidden
                fill
                sizes="(max-width: 640px) 90vw, 480px"
                className="object-cover opacity-0 transition-[opacity,transform] duration-[1.4s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                onLoad={(e) => (e.currentTarget.style.opacity = "1")}
            ref={(el) => {
              // cached images can finish before hydration — onLoad never fires
              if (el?.complete && el.naturalWidth > 0) el.style.opacity = "1";
            }}
              />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.08),transparent_36%)]"
              />
            </div>
          </div>
        </div>
      </motion.div>
      {/* plinth shadow — grounds the object */}
      <div
        aria-hidden
        className="mx-auto mt-5 h-6 w-3/5 rounded-[50%] bg-[radial-gradient(closest-side,rgba(11,11,12,0.22),transparent)] blur-md"
      />
    </div>
  );
}

/* ── Editorial caption (furoweb work-card style: index · label · name · tags) ── */
function ShowcaseCaption({
  plan,
  no,
  reduce,
}: {
  plan: (typeof pricing.plans)[number];
  no: string;
  reduce: boolean;
}) {
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.8, ease: EASE }}
    >
      <div className="flex items-center gap-4">
        <span
          className="text-lg text-foreground/40"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          [{no}]
        </span>
        <span aria-hidden className="h-px w-10 bg-foreground/20" />
        <span className="kicker font-latin text-foreground/55">{plan.label}</span>
      </div>

      <h3 className="font-accent mt-5 text-[clamp(1.9rem,4vw,3rem)] font-bold leading-[1.08] tracking-[-0.01em] text-foreground">
        {plan.name}
      </h3>

      <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
        {plan.caption}
      </p>

      {/* feature tags (editorial pills) */}
      <ul className="mt-6 flex flex-wrap gap-2">
        {plan.features.map((f) => (
          <li
            key={f}
            className="rounded-full border border-border px-3.5 py-1.5 text-[0.8rem] text-foreground/70 transition-colors duration-300 hover:border-foreground/35 hover:text-foreground"
          >
            {f}
          </li>
        ))}
      </ul>

      {/* price line */}
      <div className="mt-8 flex items-baseline gap-3 border-t border-border pt-6">
        <span className="font-accent text-[2.4rem] font-extrabold leading-none text-foreground">
          {plan.price}
        </span>
        <span className="font-accent text-lg font-semibold text-foreground/60">
          {plan.unit}
        </span>
        <span className="ml-auto text-xs text-foreground/55">기본 시작 금액</span>
      </div>
    </motion.div>
  );
}

/* ── One showcase row: caption + device/product mockup, alternating sides ── */
function ShowcaseRow({
  plan,
  no,
  reverse,
  reduce,
}: {
  plan: (typeof pricing.plans)[number];
  no: string;
  reverse: boolean; // mockup on the left
  reduce: boolean;
}) {
  const mockup =
    plan.tone === "develop" ? (
      <DeviceCluster reduce={reduce} />
    ) : (
      <ProductFrame src={plan.image} reduce={reduce} />
    );

  return (
    <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
      {/* caption */}
      <div className={cn("order-2", reverse ? "lg:order-2" : "lg:order-1")}>
        <ShowcaseCaption plan={plan} no={no} reduce={reduce} />
      </div>
      {/* mockup */}
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.94 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.9, ease: EASE }}
        className={cn(
          "order-1 pb-10 lg:pb-0",
          reverse ? "lg:order-1" : "lg:order-2"
        )}
      >
        {mockup}
      </motion.div>
    </div>
  );
}

/* ── Dark showcase stage: two plans as device/product mockups (toss + furoweb).
      Inner stage — caller provides the section wrapper + reduce flag.
      pricing.tsx 는 이 stage 를 자기 섹션 안에서 그대로 사용. ── */
export function PlanShowcaseStage({ reduce }: { reduce: boolean }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ["start end", "end start"],
  });
  const rot = useTransform(scrollYProgress, [0, 1], [-12, 24]);

  return (
    <div ref={stageRef} className="relative overflow-hidden text-foreground">
      {/* orbital line art, slow scroll-linked rotation */}
      <motion.div
        aria-hidden
        style={reduce ? undefined : { rotate: rot }}
        className="pointer-events-none absolute left-1/2 top-1/2 h-[150%] w-[150%] -translate-x-1/2 -translate-y-1/2 opacity-[0.06]"
      >
        <OrbitalArt />
      </motion.div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(58%_48%_at_50%_30%,rgba(11,11,12,0.04),transparent_70%)]"
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-16 flex items-center gap-4">
          <span className="kicker font-latin inline-flex items-center gap-2.5 text-foreground/45">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brand" />
            The Two Tracks
          </span>
          <span aria-hidden className="h-px flex-1 bg-foreground/12" />
          <span className="font-mono text-xs text-foreground/35">01 — 02</span>
        </div>

        <div className="space-y-28 lg:space-y-40">
          <ShowcaseRow plan={pricing.plans[0]} no="01" reverse={false} reduce={reduce} />
          <ShowcaseRow plan={pricing.plans[1]} no="02" reverse={true} reduce={reduce} />
        </div>
      </div>
    </div>
  );
}

/* ── Standalone light section — 홈에서 "제조/MVP 사진+텍스트" 쇼케이스로 사용 ── */
export function PlanShowcase() {
  const reduce = useReducedMotion() ?? false;
  return (
    <section
      id="tracks"
      className="relative scroll-mt-20 overflow-hidden bg-secondary px-6 pb-28 pt-24 text-foreground lg:px-10 lg:pb-36 lg:pt-28"
    >
      <div className="mx-auto max-w-[100rem]">
        <PlanShowcaseStage reduce={reduce} />
      </div>
    </section>
  );
}
