"use client";

import Image from "next/image";

import { useEffect, useRef, useState } from "react";
import {
  animate,
  AnimatePresence,
  motion,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "framer-motion";
import { useLenis } from "lenis/react";
import { useRouter } from "next/navigation";
import { services, servicesShowcase } from "@/lib/content";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;
const N = services.length;

/** Counts 0 → target the first time it scrolls into view, then "pops" on land. */
function CountUp({ value, onDone }: { value: string; onDone?: () => void }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });

  const target = parseInt(value.replace(/\D/g, ""), 10) || 0;
  const suffix = value.replace(/[\d\s]/g, ""); // e.g. "+"

  const [display, setDisplay] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setDisplay(target);
      setDone(true);
      onDone?.();
      return;
    }
    const controls = animate(0, target, {
      duration: 2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
      onComplete: () => {
        setDone(true);
        onDone?.();
      },
    });
    return () => controls.stop();
    // onDone is a stable setter from the parent; intentionally not a dep
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduce, target]);

  return (
    <div ref={ref} className="text-[clamp(3.25rem,8.5vw,9rem)]">
      <motion.span
        aria-hidden
        className="tnum inline-block"
        animate={done && !reduce ? { scale: [1, 1.08, 1] } : undefined}
        transition={{ duration: 0.45, ease: EASE }}
      >
        {display}
      </motion.span>
      <motion.span
        className="text-brand"
        initial={false}
        animate={{ opacity: done ? 1 : 0 }}
        transition={{ duration: 0.35 }}
      >
        {suffix}
      </motion.span>
    </div>
  );
}

export function ServicesShowcase() {
  const reduce = useReducedMotion();
  const lenis = useLenis();
  const router = useRouter();
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [numberDone, setNumberDone] = useState(false);
  const [showPhoto, setShowPhoto] = useState(false);

  // After the number finishes counting, hold briefly, then hand the stage
  // over to the photo (number fades out → photo fades in).
  useEffect(() => {
    if (!numberDone) return;
    const t = setTimeout(() => setShowPhoto(true), 800);
    return () => clearTimeout(t);
  }, [numberDone]);

  // scroll-linked (NOT IntersectionObserver) → reliable with Lenis
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const idx = Math.min(N - 1, Math.max(0, Math.floor(p * N)));
    setActive(idx);
  });

  function go(href: string) {
    if (href.startsWith("/") && !href.startsWith("/#")) {
      router.push(href);
      return;
    }
    const hash = href.startsWith("/#") ? href.slice(1) : href;
    if (lenis) lenis.scrollTo(hash, { offset: -80 });
    else document.querySelector(hash)?.scrollIntoView();
  }

  const cur = services[active];

  return (
    <section id="services" className="relative scroll-mt-20 bg-secondary">
      <h2 className="sr-only">서비스</h2>
      {/* DESKTOP: pinned, scroll-scrubbed showcase */}
      <div
        ref={trackRef}
        className="hidden lg:block"
        style={{ height: `${N * 85}vh` }}
      >
        <div className="sticky top-0 flex h-svh flex-col overflow-hidden pt-24">
          <div className="mx-auto grid w-full max-w-[100rem] flex-1 grid-cols-[0.9fr_1.4fr_0.9fr] items-center gap-8 px-10">
            {/* LEFT — service list */}
            <div>
              <span className="kicker text-muted-foreground">
                {servicesShowcase.kicker}
              </span>
              <ul className="mt-8 flex flex-col gap-3">
                {services.map((s, i) => (
                  <li
                    key={s.no}
                    className={cn(
                      "flex items-center gap-3 text-2xl font-semibold tracking-tight transition-colors duration-300 xl:text-3xl",
                      i === active ? "text-foreground" : "text-foreground/25"
                    )}
                  >
                    <motion.span
                      aria-hidden
                      animate={{
                        opacity: i === active ? 1 : 0,
                        x: i === active ? 0 : -10,
                      }}
                      transition={{ duration: 0.3 }}
                      className="text-brand"
                    >
                      →
                    </motion.span>
                    {s.name}
                  </li>
                ))}
              </ul>
            </div>

            {/* CENTER — number shows + counts up first, then fades away completely
                so the photo can take over center stage. */}
            <div className="relative flex h-full items-center justify-center">
              {/* NUMBER layer — visible on entry, then fades out & disappears */}
              <AnimatePresence>
                {!showPhoto && (
                  <motion.div
                    key="figure"
                    exit={
                      reduce
                        ? { opacity: 0 }
                        : { opacity: 0, scale: 0.96, filter: "blur(6px)" }
                    }
                    transition={{ duration: reduce ? 0.25 : 0.8, ease: EASE }}
                    className="display absolute inset-0 flex select-none flex-col items-center justify-center leading-[0.82] text-foreground"
                  >
                    <CountUp
                      value={servicesShowcase.centerValue}
                      onDone={() => setNumberDone(true)}
                    />
                    <div className="text-[clamp(1.5rem,3.5vw,2.75rem)] text-foreground/55">
                      {servicesShowcase.centerLabel}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* PHOTO layer — revealed only after the number disappears.
                  Sized to the viewport height (keeps a portrait card ratio). */}
              <div className="relative aspect-[5/6] h-[clamp(20rem,62vh,44rem)] shrink-0">
                {showPhoto && (
                  <AnimatePresence>
                    <motion.div
                      key={active}
                      initial={
                        reduce
                          ? { opacity: 0 }
                          : { opacity: 0, y: 64, scale: 0.92 }
                      }
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={
                        reduce
                          ? { opacity: 0 }
                          : { opacity: 0, y: -48, scale: 0.95 }
                      }
                      transition={{ duration: reduce ? 0.2 : 0.7, ease: EASE }}
                      className="absolute inset-0"
                    >
                      <div className="relative h-full w-full overflow-hidden rounded-lg shadow-2xl shadow-black/25 ring-1 ring-white/10">
                        <Image
                          src={cur.image}
                          alt=""
                          aria-hidden
                          fill
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          className="object-cover"
                        />
                        <span className="absolute inset-x-0 bottom-0 bg-ink/80 px-4 py-3 font-mono text-xs uppercase tracking-[0.2em] text-white">
                          {cur.label}
                        </span>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </div>

            {/* RIGHT — description + CTA */}
            <div>
              <span className="kicker text-muted-foreground">
                {servicesShowcase.rightKicker}
              </span>
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: reduce ? 0.15 : 0.45, ease: EASE }}
                  className="mt-6"
                >
                  <h3 className="text-2xl font-bold tracking-tight">
                    {cur.name}
                  </h3>
                  <p className="mt-4 max-w-sm leading-relaxed text-muted-foreground">
                    {cur.description}
                  </p>
                  <button
                    type="button"
                    onClick={() => go("/contact")}
                    className="group mt-7 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-transform hover:scale-[1.03]"
                  >
                    {cur.cta}
                    <span className="transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </button>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* bottom — progress + counter */}
          <div className="mx-auto flex w-full max-w-[100rem] items-center justify-between px-10 pb-10">
            <div className="flex items-center gap-2" aria-hidden>
              {services.map((s, i) => (
                <span
                  key={s.no}
                  className={cn(
                    "h-1 rounded-full transition-all duration-300",
                    i === active ? "w-10 bg-foreground" : "w-4 bg-foreground/20"
                  )}
                />
              ))}
            </div>
            <span className="tnum text-sm text-muted-foreground">
              <span className="text-foreground">{cur.no}</span> /{" "}
              {String(N).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>

      {/* MOBILE — simple stacked list (no pin/scrub) */}
      <div className="px-6 py-20 lg:hidden">
        <span className="kicker text-muted-foreground">
          {servicesShowcase.kicker}
        </span>
        <div className="mt-8 flex flex-col gap-12">
          {services.map((s) => (
            <div key={s.no} className="flex flex-col gap-4">
              <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-muted">
                <Image
                  src={s.image}
                  alt=""
                  aria-hidden
                  fill
                  sizes="100vw"
                  className="object-cover"
                />
              </div>
              <div className="flex items-baseline gap-3">
                <span className="tnum text-sm text-brand">{s.no}</span>
                <h3 className="text-xl font-bold tracking-tight">{s.name}</h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {s.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
