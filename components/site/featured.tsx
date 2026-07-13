"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useLenis } from "lenis/react";
import { useRouter } from "next/navigation";
import { approach } from "@/lib/content";
import { Reveal, RevealLines } from "./reveal";

export function Featured() {
  const lenis = useLenis();
  const router = useRouter();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

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
    <section
      id="approach"
      className="relative scroll-mt-20 overflow-hidden bg-secondary text-foreground"
    >
      <div className="mx-auto grid max-w-[100rem] items-stretch gap-0 lg:grid-cols-2">
        {/* parallax image */}
        <div
          ref={ref}
          className="relative h-72 overflow-hidden sm:h-96 lg:h-auto lg:min-h-[40rem]"
        >
          <motion.img
            src={approach.image}
            alt=""
            aria-hidden
            loading="lazy"
            style={reduce ? undefined : { y }}
            className="img-graded absolute inset-0 h-[120%] w-full -top-[10%] object-cover"
          />
        </div>

        {/* copy */}
        <div className="flex flex-col justify-center px-6 py-20 lg:px-16 lg:py-32">
          <Reveal>
            <span className="kicker text-foreground/60">{approach.kicker}</span>
          </Reveal>
          <RevealLines
            as="h2"
            text={approach.title}
            className="display mt-5 block text-[clamp(2rem,4vw,3.5rem)] text-foreground"
          />
          <Reveal delay={0.1}>
            <p className="mt-7 max-w-lg leading-relaxed text-muted-foreground">
              {approach.body}
            </p>
          </Reveal>

          <Reveal delay={0.16}>
            <ol className="mt-10 grid max-w-lg grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
              {approach.steps.map((step, i) => (
                <li
                  key={step}
                  className="flex items-center gap-3 border-t border-border pt-4 text-sm text-foreground/85"
                >
                  <span className="tnum text-foreground/40">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </Reveal>

          <Reveal delay={0.22}>
            <button
              type="button"
              onClick={() => go(approach.cta.href)}
              className="group mt-12 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-brand to-[#3b82f6] px-7 py-3.5 text-sm font-semibold text-white transition-[transform,box-shadow] duration-300 hover:scale-[1.03] hover:shadow-[0_14px_36px_-12px_rgba(37,99,235,0.55)]"
            >
              {approach.cta.label}
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
