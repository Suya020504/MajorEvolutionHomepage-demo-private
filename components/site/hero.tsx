"use client";

import type { CSSProperties, ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useLenis } from "lenis/react";
import { useRouter } from "next/navigation";
import { brand } from "@/lib/content";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/useStore";
import { HeroCanvas } from "./hero-canvas";
import { Magnetic } from "./magnetic";
import { PaintWord } from "./paint-word";

const EASE = [0.16, 1, 0.3, 1] as const;

/* ── Hero focal art: an isometric building assembled block by block on a
      blueprint — outline draws (stroke-dashoffset), grid fades in, blocks
      drop layer by layer (painter's algorithm order), then the blue module,
      hovering roof slab and satellite cube finish the composition.
      Pure CSS keyframes (.iso-* in globals.css); timeline starts when the
      preloader lifts (`show` → .iso-run). No 3D library — flat projection:
      sx = (x−y)·cos30°, sy = (x+y)·sin30° − z. ── */
const IS = 58;
const IOX = 340;
const IOY = 252;
const IAX = Math.cos(Math.PI / 6);
const ipt = (x: number, y: number, z: number): [number, number] => [
  IOX + (x - y) * IAX * IS,
  IOY + (x + y) * 0.5 * IS - z * IS,
];
const ipoly = (pts: [number, number][]) =>
  "M" + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join("L") + "Z";
const iseg = (a: [number, number], b: [number, number]) =>
  `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`;

/* build order: z-layer ascending, then x+y ascending → correct occlusion */
const ISO_CELLS: [number, number, number][] = (() => {
  const cells: [number, number, number][] = [];
  for (let x = 0; x < 3; x++) for (let y = 0; y < 3; y++) cells.push([x, y, 0]);
  for (let x = 0; x < 2; x++) for (let y = 0; y < 2; y++) cells.push([x, y, 1]);
  cells.sort((a, b) => a[2] - b[2] || a[0] + a[1] - (b[0] + b[1]) || a[0] - b[0]);
  return cells;
})();

function IsoCube({
  x,
  y,
  z,
  w = 1,
  dp = 1,
  h = 1,
  delay,
  variant,
}: {
  x: number;
  y: number;
  z: number;
  w?: number;
  dp?: number;
  h?: number;
  delay: number;
  variant?: "blue" | "slab";
}) {
  const A = ipt(x, y, z + h);
  const B = ipt(x + w, y, z + h);
  const C = ipt(x + w, y + dp, z + h);
  const D = ipt(x, y + dp, z + h);
  const E = ipt(x + w, y, z);
  const F = ipt(x + w, y + dp, z);
  const G = ipt(x, y + dp, z);
  return (
    <g
      className={cn(
        "iso-blk",
        variant === "blue" ? "iso-blue text-brand" : "text-foreground/50",
        variant === "slab" && "iso-slab"
      )}
      style={{ ["--d" as string]: `${delay.toFixed(2)}s` } as CSSProperties}
    >
      <path className="iso-face iso-fl" pathLength={1} d={ipoly([D, C, F, G])} />
      <path className="iso-face iso-fr" pathLength={1} d={ipoly([B, E, F, C])} />
      <path className="iso-face iso-ft" pathLength={1} d={ipoly([A, B, C, D])} />
    </g>
  );
}

function HeroIsoArt({ show }: { show: boolean }) {
  // 본질 집중 다이어트: 전체 타임라인 40% 단축 (~4.5s → ~2.7s 완성)
  const T0 = 0.6; // first block lands after the blueprint is on the table
  const STEP = 0.08;
  const tBlue = T0 + ISO_CELLS.length * STEP;
  const dotDelay = (t: number) =>
    ({ ["--d" as string]: `${t.toFixed(2)}s` }) as CSSProperties;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute right-[3%] top-1/2 z-[5] hidden w-[min(36vw,32rem)] -translate-y-1/2 lg:block"
    >
      <svg
        viewBox="0 0 680 492"
        fill="none"
        className={cn("iso-scene h-auto w-full", show && "iso-run")}
      >
        {/* blueprint: ground outline draws, grid fades in */}
        <path
          className="iso-outline"
          pathLength={1}
          d={ipoly([
            ipt(-0.7, -0.7, 0),
            ipt(3.7, -0.7, 0),
            ipt(3.7, 3.7, 0),
            ipt(-0.7, 3.7, 0),
          ])}
        />
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <path
              className="iso-grid"
              style={dotDelay(0.3 + i * 0.03)}
              d={iseg(ipt(i, 0, 0), ipt(i, 3, 0))}
            />
            <path
              className="iso-grid"
              style={dotDelay(0.32 + i * 0.03)}
              d={iseg(ipt(0, i, 0), ipt(3, i, 0))}
            />
          </g>
        ))}

        {/* blocks stack layer by layer */}
        {ISO_CELLS.map((c, i) => (
          <IsoCube
            key={`${c[0]}-${c[1]}-${c[2]}`}
            x={c[0]}
            y={c[1]}
            z={c[2]}
            delay={T0 + i * STEP}
          />
        ))}

        {/* brand-blue module tops out the build */}
        <IsoCube x={0} y={0} z={2} delay={tBlue} variant="blue" />

        {/* roof slab — lands last, then hovers */}
        <g className="iso-hover">
          <IsoCube
            x={-0.22}
            y={-0.22}
            z={3.16}
            w={1.44}
            dp={1.44}
            h={0.24}
            delay={tBlue + 0.2}
            variant="slab"
          />
        </g>

        {/* satellite cube + survey dots */}
        <IsoCube x={-2.35} y={2.3} z={0} w={0.6} dp={0.6} h={0.6} delay={tBlue + 0.35} />
        <circle className="iso-dot" style={dotDelay(tBlue + 0.45)} cx="92" cy="140" r="3" />
        <circle className="iso-dot" style={dotDelay(tBlue + 0.55)} cx="596" cy="118" r="3" />
        <circle className="iso-dot" style={dotDelay(tBlue + 0.65)} cx="560" cy="330" r="3" />
      </svg>
    </div>
  );
}

const KICKER = "Startup Making Solution";
const TITLE_LINES: ReactNode[] = [
  <>
    <span className="shimmer">아이디어</span> 하나로
  </>,
  <>
    <PaintWord>창업</PaintWord>을 제작합니다
  </>,
];
const ACCENT = "From idea to product.";
const SUBCOPY =
  "제품 시제품부터 웹·앱 MVP까지, 제조와 개발을 함께 이해하는 팀이 창업의 시작을 돕습니다.";

export function Hero() {
  const reduce = useReducedMotion();
  const entered = useUiStore((s) => s.entered);
  const lenis = useLenis();
  const router = useRouter();
  const show = reduce || entered;

  // route(/xxx) → 페이지 이동 · 앵커(#xxx) → 같은 페이지 스크롤
  function go(href: string) {
    if (href.startsWith("/") && !href.startsWith("/#")) {
      router.push(href);
      return;
    }
    const hash = href.startsWith("/#") ? href.slice(1) : href;
    if (lenis) lenis.scrollTo(hash, { offset: -80 });
    else document.querySelector(hash)?.scrollIntoView();
  }

  // staggered rise, gated on `entered` so it plays as the curtain lifts
  const rise: Variants = {
    hidden: { opacity: 0, y: 32 },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.95, delay: 0.1 + i * 0.11, ease: EASE },
    }),
  };
  const anim = (i: number) => ({
    custom: i,
    variants: rise,
    initial: "hidden",
    animate: show ? "show" : "hidden",
  });

  return (
    <section
      id="top"
      className="relative h-[100svh] min-h-[640px] w-full overflow-hidden bg-background text-foreground"
    >
      <HeroCanvas />

      {/* legibility: lift the lower-left where the copy sits */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white via-white/25 to-white/40"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(125%_95%_at_12%_88%,rgba(255,255,255,0.75),transparent_62%)]"
      />

      {/* focal art — anchors the eye where the copy isn't */}
      <HeroIsoArt show={show ?? false} />

      <div className="relative z-10 mx-auto flex h-full max-w-[100rem] flex-col px-6 lg:px-10">
        {/* top hairline row */}
        <motion.div
          {...anim(0)}
          className="flex items-center justify-between pt-28 lg:pt-32"
        >
          <span className="kicker inline-flex items-center gap-2.5 text-foreground/55">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brand" />
            {KICKER}
          </span>
          <span className="kicker hidden text-foreground/40 sm:block">
            {brand.location}
          </span>
        </motion.div>

        {/* headline block, lower third */}
        <div className="mt-auto max-w-5xl pb-24 lg:pb-28">
          <h1
            className="display text-[clamp(2.6rem,7vw,6.5rem)]"
            style={{ lineHeight: 1.04 }}
          >
            {TITLE_LINES.map((line, i) => (
              <span
                key={i}
                className="block overflow-hidden pb-[0.12em]"
              >
                <motion.span className="block" {...anim(1 + i)}>
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            {...anim(3)}
            className="mt-5 text-xl italic text-foreground/70 sm:text-2xl"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {ACCENT}
          </motion.p>

          <motion.p
            {...anim(4)}
            className="mt-6 max-w-xl text-base leading-relaxed text-foreground/75 sm:text-lg"
          >
            {SUBCOPY}
          </motion.p>

          <motion.div
            {...anim(5)}
            className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4"
          >
            <Magnetic className="inline-block">
              <button
                type="button"
                onClick={() => go("/contact")}
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-brand to-[#3b82f6] px-7 py-3.5 text-sm font-semibold text-white transition-[transform,box-shadow] duration-300 hover:scale-[1.03] hover:shadow-[0_14px_36px_-12px_rgba(37,99,235,0.55)]"
              >
                제작 문의하기
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </button>
            </Magnetic>
            <button
              type="button"
              onClick={() => go("/work")}
              className="group inline-flex items-center gap-2 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
            >
              <span className="relative">
                제작 사례 보기
                <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-foreground/60 transition-transform duration-300 group-hover:scale-x-100" />
              </span>
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </button>
          </motion.div>
        </div>
      </div>

      {/* scroll cue */}
      <motion.button
        type="button"
        onClick={() => go("#support")}
        aria-label="아래로 스크롤"
        {...anim(6)}
        className="group absolute bottom-7 right-6 z-10 hidden items-center gap-3 text-foreground/45 transition-colors hover:text-foreground sm:flex lg:right-10"
      >
        <span className="kicker">Scroll</span>
        <span className="relative block h-10 w-px overflow-hidden bg-foreground/20">
          <span className="scroll-cue absolute left-0 top-0 block h-1/2 w-full bg-foreground" />
        </span>
      </motion.button>
    </section>
  );
}
