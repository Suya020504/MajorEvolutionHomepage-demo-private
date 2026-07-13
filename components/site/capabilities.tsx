"use client";

import Image from "next/image";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
  type Variants,
} from "framer-motion";
import { capabilities } from "@/lib/content";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

/* flatten both groups into one ordered deck for the spiral */
type Card = {
  name: string;
  desc: string;
  image: string;
  eyebrow: string;
  group: string;
};
const DECK: Card[] = capabilities.groups.flatMap((g) =>
  g.items.map((it) => ({
    name: it.name,
    desc: it.desc,
    image: it.image,
    eyebrow: g.eyebrow,
    group: g.label,
  }))
);

/* ── helix geometry (tuned for a front-facing 3D spiral) ── */
const CARD_W = 340;
const CARD_H = 212;
const RADIUS = 360; // cylinder radius (px)
const ANGLE = 0.62; // radians between neighbours
const Y_STEP = 64; // vertical climb per card (helix)

/* media query → only run the spiral on desktop */
function useIsDesktop() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(min-width: 1024px)");
    const on = () => setDesktop(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return desktop;
}

/* ── one card floating on the helix, driven by scroll progress ── */
function SpiralCard({
  card,
  index,
  total,
  progress,
}: {
  card: Card;
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  // distance from the focused slot: 0 = front & centre
  const u = (p: number) => index - p * (total - 1);

  const x = useTransform(progress, (p) => Math.sin(u(p) * ANGLE) * RADIUS - CARD_W / 2);
  const y = useTransform(progress, (p) => u(p) * Y_STEP - CARD_H / 2);
  const z = useTransform(progress, (p) => (Math.cos(u(p) * ANGLE) - 1) * RADIUS);
  const rotateY = useTransform(progress, (p) => (-u(p) * ANGLE * 180) / Math.PI);
  const scale = useTransform(progress, (p) =>
    Math.max(1 - Math.abs(u(p)) * 0.07, 0.55)
  );
  const opacity = useTransform(progress, (p) => {
    const a = Math.abs(u(p));
    return a > 5.5 ? 0 : Math.max(1 - a * 0.16, 0.12);
  });
  const blur = useTransform(progress, (p) => Math.min(Math.abs(u(p)) * 1.5, 6));
  const filter = useMotionTemplate`blur(${blur}px)`;
  const zIndex = useTransform(progress, (p) =>
    Math.round(200 - Math.abs(u(p)) * 10)
  );

  return (
    <motion.figure
      style={{ x, y, z, rotateY, scale, opacity, filter, zIndex }}
      className="absolute left-1/2 top-1/2 [backface-visibility:hidden] [will-change:transform,filter,opacity]"
    >
      <div
        className="relative overflow-hidden rounded-2xl bg-white ring-1 ring-black/10 shadow-[0_40px_90px_-50px_rgba(11,11,12,0.4)]"
        style={{ width: CARD_W, height: CARD_H }}
      >
        <Image
          src={card.image}
          alt={card.name}
          fill
          sizes="340px"
          className="object-cover opacity-0 transition-opacity duration-700"
          onLoad={(e) => (e.currentTarget.style.opacity = "1")}
            ref={(el) => {
              // cached images can finish before hydration — onLoad never fires
              if (el?.complete && el.naturalWidth > 0) el.style.opacity = "1";
            }}
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent"
        />
        <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
          <div>
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-white/55">
              {card.eyebrow}
            </span>
            <p className="font-accent text-lg font-bold leading-tight text-white">
              {card.name}
            </p>
          </div>
        </figcaption>
        {/* edge sheen */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.12),transparent_34%)]"
        />
      </div>
    </motion.figure>
  );
}

/* ── faint blueprint grid backdrop for the light stage ── */
function StageGrid() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-[0.5] [background-image:linear-gradient(to_right,rgba(11,11,12,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(11,11,12,0.05)_1px,transparent_1px)] [background-size:54px_54px] [mask-image:radial-gradient(80%_80%_at_50%_45%,#000_35%,transparent_82%)]"
    />
  );
}

/* ── spiral / list toggle (reference-style, top centre) ── */
function ViewToggle({
  view,
  setView,
  invert,
}: {
  view: "spiral" | "list";
  setView: (v: "spiral" | "list") => void;
  invert?: boolean; // light text on dark stage
}) {
  const base = invert ? "text-white/45" : "text-muted-foreground";
  const active = invert ? "text-white" : "text-foreground";
  return (
    <div className="flex items-center gap-3 text-[0.95rem] font-medium">
      <button
        type="button"
        onClick={() => setView("spiral")}
        className={cn("transition-colors", view === "spiral" ? active : base)}
      >
        spiral
      </button>
      <span
        aria-hidden
        className={cn(
          "h-1.5 w-1.5 rounded-full transition-colors",
          invert ? "bg-white/30" : "bg-foreground/30"
        )}
      />
      <button
        type="button"
        onClick={() => setView("list")}
        className={cn("transition-colors", view === "list" ? active : base)}
      >
        list
      </button>
    </div>
  );
}

/* ── light immersive spiral stage (pinned, scroll-driven) ── */
function SpiralSection({
  view,
  setView,
}: {
  view: "spiral" | "list";
  setView: (v: "spiral" | "list") => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const [focus, setFocus] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const idx = Math.round(p * (DECK.length - 1));
    setFocus(Math.min(Math.max(idx, 0), DECK.length - 1));
  });

  const fill = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const current = DECK[focus];

  return (
    <section
      id="capabilities"
      ref={ref}
      className="relative scroll-mt-20 bg-background text-foreground"
      style={{ height: "220vh" }}
    >
      <div
        className="sticky top-0 flex h-svh min-h-[40rem] items-center justify-center overflow-hidden"
        style={{ perspective: 1200 }}
      >
        <StageGrid />
        {/* brand glow pooling under the focused card */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl [background:radial-gradient(circle,rgba(37,99,235,0.1),transparent_64%)]"
        />

        {/* top bar — kicker (left) + toggle (centre) */}
        <div className="absolute inset-x-0 top-0 z-[300] flex items-center justify-between px-6 pt-24 lg:px-12">
          <div className="hidden lg:block">
            <span className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-foreground/45">
              {capabilities.kicker}
            </span>
            <h2 className="font-accent text-sm font-semibold text-foreground/80">
              도구가 결과를 만듭니다
            </h2>
          </div>
          <div className="mx-auto lg:mx-0">
            <ViewToggle view={view} setView={setView} />
          </div>
          <div className="hidden w-24 lg:block" />
        </div>

        {/* the helix */}
        <div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
          {DECK.map((card, i) => (
            <SpiralCard
              key={card.name}
              card={card}
              index={i}
              total={DECK.length}
              progress={scrollYProgress}
            />
          ))}
        </div>

        {/* focus caption — what the centred card is */}
        <div className="absolute inset-x-0 bottom-0 z-[300] flex flex-col items-center gap-4 px-6 pb-12">
          <div className="text-center">
            <span className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-brand">
              {current.eyebrow} · {current.group}
            </span>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{current.name}</span>
              {" — "}
              {current.desc}
            </p>
          </div>
          {/* progress bar */}
          <div className="relative h-px w-40 overflow-hidden bg-foreground/15">
            <motion.span
              style={{ width: fill }}
              className="absolute left-0 top-0 block h-full bg-foreground"
            />
          </div>
          <span className="font-mono text-[0.62rem] tracking-[0.2em] text-foreground/35">
            {String(focus + 1).padStart(2, "0")} / {String(DECK.length).padStart(2, "0")}
          </span>
        </div>
      </div>
    </section>
  );
}

/* ── list view: clean 2-column spec sheet (mobile / reduced-motion default) ── */
const rowContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};
const rowItem: Variants = {
  hidden: { opacity: 0, x: -14 },
  show: { opacity: 1, x: 0, transition: { duration: 0.45, ease: EASE } },
};

type Group = (typeof capabilities.groups)[number];

function CapGroup({ group, reduce }: { group: Group; reduce: boolean }) {
  return (
    <div>
      <div className="flex items-baseline justify-between border-b border-foreground/15 pb-4">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-brand">
            {group.eyebrow}
          </span>
          <h3 className="text-2xl font-extrabold tracking-tight">{group.label}</h3>
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          {String(group.items.length).padStart(2, "0")}
        </span>
      </div>

      <motion.ul
        variants={reduce ? undefined : rowContainer}
        initial={reduce ? undefined : "hidden"}
        whileInView={reduce ? undefined : "show"}
        viewport={{ once: true, margin: "-60px" }}
        className="mt-1"
      >
        {group.items.map((item, i) => (
          <motion.li
            key={item.name}
            variants={reduce ? undefined : rowItem}
            className="group/row flex items-center gap-4 border-b border-border py-3 transition-colors duration-300 hover:bg-secondary/60"
          >
            <span className="w-6 shrink-0 font-mono text-xs text-muted-foreground">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="relative h-[3.25rem] w-[4.75rem] shrink-0 overflow-hidden rounded-lg border border-border bg-secondary ring-1 ring-transparent transition-[border-color,box-shadow] duration-300 group-hover/row:border-brand/40 group-hover/row:ring-brand/20">
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="76px"
                className="object-cover opacity-0 transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/row:scale-110"
                onLoad={(e) => (e.currentTarget.style.opacity = "1")}
            ref={(el) => {
              // cached images can finish before hydration — onLoad never fires
              if (el?.complete && el.naturalWidth > 0) el.style.opacity = "1";
            }}
              />
            </span>
            <span className="shrink-0 text-base font-semibold tracking-tight">
              {item.name}
            </span>
            <span className="ml-auto truncate pl-4 text-right text-sm text-muted-foreground transition-colors duration-300 group-hover/row:text-foreground/80">
              {item.desc}
            </span>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}

function ListSection({
  reduce,
  showToggle,
  view,
  setView,
}: {
  reduce: boolean;
  showToggle: boolean;
  view: "spiral" | "list";
  setView: (v: "spiral" | "list") => void;
}) {
  const lines = capabilities.title.split("\n");
  return (
    <section
      id="capabilities"
      className="relative scroll-mt-20 bg-background px-6 py-24 lg:px-10 lg:py-32"
    >
      <div className="mx-auto max-w-[100rem]">
        <div className="flex items-start justify-between gap-6">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {capabilities.kicker} — what we build with
            </span>
            <h2 className="font-accent mt-4 max-w-3xl text-[clamp(2rem,4.5vw,3.75rem)] font-extrabold leading-[1.1] tracking-[-0.02em]">
              {lines.map((l, i) => (
                <span key={i} className="block">
                  {l}
                </span>
              ))}
            </h2>
            <p className="mt-5 max-w-xl leading-relaxed text-muted-foreground">
              {capabilities.description}
            </p>
          </div>
          {showToggle && (
            <div className="hidden shrink-0 pt-2 lg:block">
              <ViewToggle view={view} setView={setView} />
            </div>
          )}
        </div>

        <div className="relative mt-14 grid gap-x-16 gap-y-12 md:grid-cols-2 lg:mt-16">
          <motion.span
            aria-hidden
            initial={reduce ? false : { scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.8, ease: EASE }}
            className="absolute bottom-2 left-1/2 top-2 hidden w-px origin-top bg-border md:block"
          />
          <CapGroup group={capabilities.groups[0]} reduce={reduce} />
          <CapGroup group={capabilities.groups[1]} reduce={reduce} />
        </div>
      </div>
    </section>
  );
}

export function Capabilities() {
  const reduce = useReducedMotion() ?? false;
  const isDesktop = useIsDesktop();
  // 본질 집중: 정보 훑기 좋은 list가 기본, 스파이럴 연출은 옵션
  const [view, setView] = useState<"spiral" | "list">("list");

  // toggling swaps a 320vh stage for a short list — re-anchor to the section
  function changeView(v: "spiral" | "list") {
    setView(v);
    requestAnimationFrame(() => {
      document
        .getElementById("capabilities")
        ?.scrollIntoView({ block: "start" });
    });
  }

  // spiral only when it makes sense; otherwise the accessible list
  const showSpiral = isDesktop && !reduce && view === "spiral";

  if (showSpiral) {
    return <SpiralSection view={view} setView={changeView} />;
  }
  return (
    <ListSection
      reduce={reduce}
      showToggle={isDesktop && !reduce}
      view={view}
      setView={changeView}
    />
  );
}
