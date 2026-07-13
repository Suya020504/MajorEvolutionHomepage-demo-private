"use client";

import Image from "next/image";

import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { cultureCta } from "@/lib/content";
import { Reveal } from "./reveal";
import { Magnetic } from "./magnetic";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Headline with editorial weight contrast: the setup line is thin, the closing
 * line is heavy. Fades + rises on scroll-in (no clip mask — text never hides
 * even if the in-view trigger is missed).
 */
function ContactTitle() {
  const reduce = useReducedMotion();
  const lines = cultureCta.title.split("\n");
  // last line is the punch (heaviest); earlier lines stay light
  const weight = (i: number) => (i === lines.length - 1 ? 800 : 300);

  return (
    <h2 className="mt-5 text-[clamp(2.5rem,7vw,6rem)] leading-[1.04] tracking-[-0.03em] text-white">
      {lines.map((line, i) =>
        reduce ? (
          <span key={i} className="block" style={{ fontWeight: weight(i) }}>
            {line}
          </span>
        ) : (
          <motion.span
            key={i}
            className="block"
            style={{ fontWeight: weight(i) }}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: i * 0.09, ease: EASE }}
          >
            {line}
          </motion.span>
        )
      )}
    </h2>
  );
}

export function CultureCta() {
  const reduce = useReducedMotion();
  const orbRef = useRef<HTMLDivElement>(null);
  const raf = useRef(0);

  // brand-blue glow that trails the cursor across the section
  const handleMove = (e: React.MouseEvent<HTMLElement>) => {
    if (reduce) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const o = orbRef.current;
      if (!o) return;
      o.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      o.style.opacity = "1";
    });
  };
  const handleLeave = () => {
    if (orbRef.current) orbRef.current.style.opacity = "0";
  };

  return (
    <section
      id="contact"
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="relative scroll-mt-20 overflow-hidden border-t border-white/10 bg-ink text-white"
    >
      {/* photo kept only as faint organic texture, not the subject */}
      <Image
        src={cultureCta.image}
        alt=""
        aria-hidden
        fill
        sizes="100vw"
        className="object-cover opacity-[0.08] grayscale"
      />
      {/* designed aurora glow — the real backdrop */}
      <div aria-hidden className="aurora aurora-drift absolute inset-0" />
      {/* legibility + seamless blend into the dark footer */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-ink/85 via-ink/55 to-ink"
      />
      {/* vignette to focus the center */}
      <div
        aria-hidden
        className="absolute inset-0 [background:radial-gradient(80%_70%_at_50%_45%,transparent,rgba(11,11,12,0.7))]"
      />
      {/* brand glow that trails the cursor — the section's living moment */}
      <div
        ref={orbRef}
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 h-[36rem] w-[36rem] opacity-0 mix-blend-screen [background:radial-gradient(circle,rgba(37,99,235,0.3),rgba(37,99,235,0)_62%)]"
        style={{
          transitionProperty: "opacity, transform",
          transitionDuration: "500ms, 380ms",
          transitionTimingFunction: "ease-out",
          willChange: "transform",
        }}
      />
      {/* film grain over everything */}
      <div aria-hidden className="grain-local absolute inset-0" />

      <div className="relative mx-auto flex max-w-[100rem] flex-col items-center px-6 py-32 text-center lg:px-10 lg:py-48">
        <Reveal>
          <span className="kicker inline-flex items-center gap-3 text-white/55">
            <span aria-hidden className="h-px w-8 bg-white/30" />
            {cultureCta.kicker}
            <span aria-hidden className="h-px w-8 bg-white/30" />
          </span>
        </Reveal>
        <ContactTitle />
        <Reveal delay={0.1}>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/75">
            {cultureCta.body}
          </p>
        </Reveal>
        <Reveal delay={0.16}>
          <Magnetic className="mt-10 inline-block">
            <Link
              href={cultureCta.cta.href}
              className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-white py-4 pl-8 pr-3 text-sm font-semibold text-ink transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] hover:shadow-[0_18px_50px_-16px_rgba(37,99,235,0.65)]"
            >
              {/* brand fill sweeps up on hover */}
              <span
                aria-hidden
                className="absolute inset-0 translate-y-full bg-brand transition-transform duration-[450ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0"
              />
              <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
                {cultureCta.cta.label}
              </span>
              {/* arrow chip inverts colour on hover */}
              <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-ink text-white transition-[background-color,color,transform] duration-300 group-hover:translate-x-0.5 group-hover:bg-white group-hover:text-brand">
                →
              </span>
            </Link>
          </Magnetic>
        </Reveal>
      </div>
    </section>
  );
}
