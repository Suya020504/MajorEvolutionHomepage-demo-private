"use client";

import Image from "next/image";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useLenis } from "lenis/react";
import { useRouter } from "next/navigation";
import { processPage } from "@/lib/content";
import { cn } from "@/lib/utils";
import { Magnetic } from "./magnetic";
import { PaintWord } from "./paint-word";

const EASE = [0.16, 1, 0.3, 1] as const;

/* 마커 페인트 — 핵심어 "흐름" 하나만 (본질 집중: 페이지당 하나의 강조) */
const PAINT_DELAYS: Record<string, number> = {
  흐름: 1.0,
};
const PAINT_RE = /(흐름)/g;

function paintedLine(line: string) {
  return line.split(PAINT_RE).map((part, i) =>
    PAINT_DELAYS[part] !== undefined ? (
      <PaintWord key={i} delay={PAINT_DELAYS[part]} tone="gradient">
        {part}
      </PaintWord>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export function Process() {
  const reduce = useReducedMotion();
  const lenis = useLenis();
  const router = useRouter();

  // scroll-drawn progress rail over the steps column
  const stepsRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: stepsRef,
    offset: ["start center", "end center"],
  });
  const railScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  function go(href: string) {
    if (href.startsWith("/") && !href.startsWith("/#")) {
      router.push(href);
      return;
    }
    const hash = href.startsWith("/#") ? href.slice(1) : href;
    router.push("/" + hash);
    if (lenis) lenis.scrollTo(hash, { offset: -80 });
  }

  const { hero, steps, cta } = processPage;

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-background text-foreground">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_85%_10%,rgba(37,99,235,0.13),transparent_60%)]"
        />
        <div className="relative mx-auto max-w-[100rem] px-6 pb-24 pt-36 lg:px-10 lg:pb-32 lg:pt-44">
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="kicker inline-flex items-center gap-2.5 text-foreground/55"
          >
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brand" />
            {hero.kicker}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.06, ease: EASE }}
            className="display mt-6 max-w-4xl text-[clamp(2.4rem,6vw,5.5rem)]"
            style={{ lineHeight: 1.05 }}
          >
            {hero.title.split("\n").map((line, i) => (
              <span key={i} className="block">
                {paintedLine(line)}
              </span>
            ))}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.16, ease: EASE }}
            className="mt-5 text-xl italic text-foreground/65 sm:text-2xl"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {hero.accent}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.24, ease: EASE }}
            className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/70 sm:text-lg"
          >
            {hero.body}
          </motion.p>

          <motion.ul
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.32, ease: EASE }}
            className="mt-10 flex flex-wrap gap-x-3 gap-y-3"
          >
            {hero.meta.map((m) => (
              <li
                key={m}
                className="rounded-full border border-border px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] text-foreground/65"
              >
                {m}
              </li>
            ))}
          </motion.ul>
        </div>
      </section>

      {/* ── STEPS ────────────────────────────────────────────── */}
      <section className="relative bg-background py-20 lg:py-28">
        <div
          ref={stepsRef}
          className="relative mx-auto max-w-[88rem] px-6 lg:px-10"
        >
          {/* drawn rail (desktop) */}
          <div
            aria-hidden
            className="absolute bottom-0 left-[calc(50%-0.5px)] top-0 hidden w-px bg-border lg:block"
          >
            <motion.div
              className="absolute inset-x-0 top-0 origin-top bg-foreground"
              style={{ height: "100%", scaleY: reduce ? 1 : railScale }}
            />
          </div>

          <ol className="flex flex-col gap-20 lg:gap-0">
            {steps.map((step, i) => {
              const flip = i % 2 === 1;
              return (
                <li
                  key={step.no}
                  className="relative grid items-center gap-10 lg:min-h-[78vh] lg:grid-cols-2 lg:gap-20"
                >
                  {/* node dot on the rail */}
                  <span
                    aria-hidden
                    className="absolute left-1/2 top-1/2 z-10 hidden h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-foreground lg:block"
                  />

                  {/* TEXT */}
                  <motion.div
                    initial={reduce ? false : { opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.7, ease: EASE }}
                    className={cn(
                      "lg:py-24",
                      flip ? "lg:order-2 lg:pl-16" : "lg:pr-16"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <span className="display text-[clamp(2.5rem,5vw,4rem)] leading-none text-foreground/15">
                        {step.no}
                      </span>
                      <span className="rounded-full bg-secondary px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        {step.track}
                      </span>
                    </div>

                    <h2 className="mt-5 text-[clamp(1.6rem,3vw,2.4rem)] font-bold tracking-tight">
                      {step.title}
                    </h2>
                    <p className="mt-2 text-lg font-medium text-brand">
                      {step.lead}
                    </p>
                    <p className="mt-5 max-w-md leading-relaxed text-muted-foreground">
                      {step.body}
                    </p>

                    <ul className="mt-7 flex flex-wrap gap-2">
                      {step.deliverables.map((d) => (
                        <li
                          key={d}
                          className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground/80"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </motion.div>

                  {/* IMAGE */}
                  <motion.div
                    initial={reduce ? false : { opacity: 0, y: 48, scale: 0.96 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.8, ease: EASE }}
                    className={cn(
                      "lg:py-24",
                      flip ? "lg:order-1 lg:pr-16" : "lg:pl-16"
                    )}
                  >
                    <div className="relative aspect-[4/5] overflow-hidden rounded-xl shadow-2xl shadow-black/15 ring-1 ring-border">
                      <Image
                        src={step.image}
                        alt=""
                        aria-hidden
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover"
                      />
                      <span className="absolute left-4 top-4 rounded-full bg-ink/80 px-3 py-1.5 font-mono text-xs tracking-[0.2em] text-white">
                        STEP {step.no}
                      </span>
                    </div>
                  </motion.div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-ink py-24 text-white lg:py-32">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(110%_90%_at_15%_90%,rgba(37,99,235,0.22),transparent_60%)]"
        />
        <div className="relative mx-auto max-w-3xl px-6 text-center lg:px-10">
          <span className="kicker text-white/55">{cta.kicker}</span>
          <h2 className="display mt-5 text-[clamp(2rem,4.5vw,3.5rem)] leading-tight">
            {cta.title}
          </h2>
          <p className="mx-auto mt-5 max-w-xl leading-relaxed text-white/70">
            {cta.body}
          </p>
          <div className="mt-9 flex justify-center">
            <Magnetic className="inline-block">
              <button
                type="button"
                onClick={() => go(cta.href)}
                className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.03]"
              >
                {cta.label}
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </button>
            </Magnetic>
          </div>
        </div>
      </section>
    </>
  );
}
