"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { stats } from "@/lib/content";
import { Reveal } from "./reveal";

/**
 * Counts 0 → target the first time the number scrolls into view.
 *
 * Visibility is detected with getBoundingClientRect against the viewport
 * (not IntersectionObserver) so the trigger is reliable everywhere — IO
 * callbacks can silently never fire in some embedded/preview environments,
 * which would leave the numbers frozen at 0.
 */
function CountUp({ value }: { value: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);

  const match = value.match(/^(\d[\d,]*)(.*)$/);
  const isNum = match !== null;
  const target = match ? parseInt(match[1].replace(/,/g, ""), 10) : 0;
  const suffix = match ? match[2] : value;

  const [n, setN] = useState(0);

  useEffect(() => {
    if (!isNum) return;
    if (reduce) {
      setN(target);
      return;
    }

    let raf = 0;
    let started = false;

    const run = () => {
      if (started) return;
      started = true;
      cleanup();
      const start = performance.now();
      const DUR = 1700;
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / DUR);
        const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
        setN(Math.round(eased * target));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const inView = () => {
      const el = ref.current;
      if (!el) return false;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      // start once the number has risen ~80px above the bottom edge
      return r.top < vh - 80 && r.bottom > 0;
    };

    const onScroll = () => {
      if (inView()) run();
    };

    const cleanup = () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };

    if (inView()) {
      run();
    } else {
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
    }

    return () => {
      cancelAnimationFrame(raf);
      cleanup();
    };
  }, [isNum, reduce, target]);

  return (
    <span ref={ref} className="tnum">
      {isNum ? n.toLocaleString() : ""}
      {suffix}
    </span>
  );
}

export function Stats() {
  return (
    <section
      id="stats"
      className="scroll-mt-20 border-y border-border px-6 py-20 lg:px-10 lg:py-24"
    >
      <div className="mx-auto max-w-[100rem]">
        <h2 className="sr-only">주요 지표</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08}>
              <div className="flex flex-col gap-2">
                <div className="text-[clamp(2.25rem,4.6vw,3.5rem)] font-extrabold leading-none tracking-tight">
                  <CountUp value={s.value} />
                </div>
                <div className="text-sm leading-relaxed text-muted-foreground">
                  {s.label}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
