"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { pricing } from "@/lib/content";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

/* ── 추가 지원 서비스: furoweb-style editorial block
      (big statement fading to gray + serif attribution rows) ── */
/* compatibility jamo for the 19 Hangul lead consonants */
const CHO_COMPAT = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ",
  "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];

/* Build the per-keystroke frames for a string, composing Hangul syllables
   jamo-by-jamo (ㅈ → 제 → 젝) like a real Korean IME. */
function hangulFrames(text: string): string[] {
  const frames: string[] = [];
  let base = "";
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const c = code - 0xac00;
      const cho = Math.floor(c / 588);
      const jung = Math.floor((c % 588) / 28);
      const jong = c % 28;
      frames.push(base + CHO_COMPAT[cho]); // 자음
      frames.push(base + String.fromCharCode(0xac00 + (cho * 21 + jung) * 28)); // +모음
      if (jong > 0) frames.push(base + ch); // +받침
      base += ch;
    } else {
      base += ch;
      frames.push(base);
    }
  }
  return frames;
}

/* ── Korean IME-style typewriter; types once when scrolled into view ── */
function KoreanType({
  text,
  className,
  speed = 46,
  reduce,
}: {
  text: string;
  className?: string;
  speed?: number;
  reduce: boolean;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px -15% 0px" });
  const frames = useMemo(() => hangulFrames(text), [text]);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (reduce || !inView || step >= frames.length) return;
    const t = setTimeout(() => setStep((s) => s + 1), speed);
    return () => clearTimeout(t);
  }, [reduce, inView, step, frames.length, speed]);

  if (reduce) return <p className={className}>{text}</p>;

  const shown = step > 0 ? frames[Math.min(step, frames.length) - 1] : "";

  return (
    <p ref={ref} className={cn("relative", className)}>
      {/* invisible sizer reserves the final height — no layout shift */}
      <span aria-hidden className="invisible">
        {text}
      </span>
      {/* typed text overlaid, with blinking caret */}
      <span className="absolute inset-0">
        {shown}
        <span aria-hidden className="type-caret" />
      </span>
    </p>
  );
}

function SupportEditorial({ reduce }: { reduce: boolean }) {
  return (
    <div>
      {/* header — mono Latin label + Korean eyebrow */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-muted-foreground">
          {pricing.supportKicker}
        </span>
        <span aria-hidden className="hidden h-px w-12 bg-border sm:block" />
        <span className="kicker font-latin text-brand">
          {pricing.supportEyebrow}
        </span>
      </div>

      {/* signature furoweb statement — lead solid, tail fades to gray */}
      <p className="font-accent mt-8 max-w-4xl text-[clamp(1.7rem,4.4vw,3.3rem)] font-bold leading-[1.18] tracking-[-0.015em]">
        <span className="text-foreground">{pricing.supportStatementLead} </span>
        <span className="bg-gradient-to-r from-foreground via-foreground to-muted-foreground/25 bg-clip-text text-transparent">
          {pricing.supportStatementTail}
        </span>
      </p>

      {/* two services as editorial entries with serif attribution */}
      <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
        {pricing.support.map((s, i) => (
          <motion.div
            key={s.title}
            initial={reduce ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: i * 0.1, ease: EASE }}
            className="group flex flex-col bg-background p-8 transition-colors duration-300 hover:bg-secondary/40 sm:p-10"
          >
            {/* body — typed out like a real Korean IME (cursor blinks) */}
            <KoreanType
              text={s.desc}
              reduce={reduce}
              speed={30}
              className="text-lg leading-relaxed text-foreground/85 sm:text-xl"
            />

            {/* serif attribution row */}
            <div className="mt-auto flex items-center gap-3 pt-9">
              <span className="font-display-ko text-base font-medium text-foreground">
                {s.title}
              </span>
              <span aria-hidden className="text-muted-foreground/50">
                /
              </span>
              <span className="text-sm text-muted-foreground">{s.role}</span>
              <span className="ml-auto shrink-0 rounded-full border border-border px-2.5 py-0.5 text-[11px] font-semibold text-brand">
                {s.tag}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* Standalone page section — 추가 지원 서비스 (moved above Pricing) */
export function Support() {
  const reduce = useReducedMotion() ?? false;

  return (
    <section
      id="support"
      className="relative scroll-mt-20 bg-background px-6 py-24 lg:px-10 lg:py-28"
    >
      <div className="mx-auto max-w-[100rem]">
        <SupportEditorial reduce={reduce} />
      </div>
    </section>
  );
}
