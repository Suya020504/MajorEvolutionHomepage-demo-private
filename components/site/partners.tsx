"use client";

import { motion, useReducedMotion } from "framer-motion";
import { partners } from "@/lib/content";
import { cn } from "@/lib/utils";
import { Section, SectionHeader } from "./section";
import { Reveal } from "./reveal";

const EASE = [0.16, 1, 0.3, 1] as const;

type Item = (typeof partners.items)[number];

/* desktop orbit positions (% of the stage) — two partners flanking the hub on a
   balanced diagonal (upper-left ↔ lower-right) so the plates never collide with
   the hub. Keep POS length in sync with partners.items. */
const POS = [
  { x: 20, y: 18 },
  { x: 80, y: 82 },
] as const;

/* Archimedean spiral path for the vortex backdrop (editorial motif) */
const SPIRAL_PATH = (() => {
  const pts: string[] = [];
  for (let a = 0; a <= Math.PI * 2 * 5; a += 0.14) {
    const r = a * 1.5;
    pts.push(`${(50 + Math.cos(a) * r).toFixed(2)} ${(50 + Math.sin(a) * r).toFixed(2)}`);
  }
  return "M " + pts.join(" L ");
})();

/* ── editorial crop-mark corners on an offset frame ── */
function Corners({ className }: { className?: string }) {
  const spots = [
    "left-0 top-0 border-l border-t",
    "right-0 top-0 border-r border-t",
    "left-0 bottom-0 border-l border-b",
    "right-0 bottom-0 border-r border-b",
  ];
  return (
    <>
      {spots.map((s) => (
        <span
          key={s}
          aria-hidden
          className={cn("absolute h-2.5 w-2.5", className, s)}
        />
      ))}
    </>
  );
}

/* ── Isometric 3D line-art building per company (draws on view) ── */
type BKind = "factory" | "tech" | "studio" | "hub";
const ROLE_KIND: Record<string, BKind> = {
  제조: "factory",
  개발: "tech",
  마케팅: "studio",
};

/* isometric basis vectors (unit length): width recedes up-right,
   depth up-left, height straight up. */
type Pt = [number, number];
const VW: Pt = [0.866, -0.5];
const VD: Pt = [-0.866, -0.5];
const VH: Pt = [0, -1];
const add = (p: Pt, v: Pt, s: number): Pt => [p[0] + v[0] * s, p[1] + v[1] * s];
const n = (v: number) => v.toFixed(1);
const closed = (pts: Pt[]) =>
  "M" + pts.map((p) => `${n(p[0])} ${n(p[1])}`).join("L") + "Z";
const seg = (a: Pt, b: Pt) => `M${n(a[0])} ${n(a[1])}L${n(b[0])} ${n(b[1])}`;

function isoGeom(fx: number, fy: number, w: number, d: number, h: number) {
  const F: Pt = [fx, fy];
  const Rb = add(F, VW, w);
  const Lb = add(F, VD, d);
  const Bb = add(Rb, VD, d);
  const Ft = add(F, VH, h);
  const Rt = add(Rb, VH, h);
  const Lt = add(Lb, VH, h);
  const Bt = add(Bb, VH, h);
  return { F, Rb, Lb, Bb, Ft, Rt, Lt, Bt };
}

function DrawPath({
  d,
  delay = 0,
  reduce,
  className = "text-foreground/70",
  width = 2,
}: {
  d: string;
  delay?: number;
  reduce: boolean;
  className?: string;
  width?: number;
}) {
  return (
    <motion.path
      d={d}
      fill="none"
      stroke="currentColor"
      strokeWidth={width}
      strokeLinejoin="round"
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
      className={className}
      initial={reduce ? false : { pathLength: 0, opacity: 0 }}
      whileInView={{ pathLength: 1, opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 1.1, delay, ease: EASE }}
    />
  );
}

/* one isometric box — silhouette + the three edges meeting at the front-top */
function IsoBox({
  fx,
  fy,
  w,
  d,
  h,
  delay = 0,
  reduce,
  className = "text-foreground/70",
}: {
  fx: number;
  fy: number;
  w: number;
  d: number;
  h: number;
  delay?: number;
  reduce: boolean;
  className?: string;
}) {
  const g = isoGeom(fx, fy, w, d, h);
  const silhouette = closed([g.F, g.Rb, g.Rt, g.Bt, g.Lt, g.Lb]);
  const edges =
    seg(g.F, g.Ft) + seg(g.Ft, g.Lt) + seg(g.Ft, g.Rt);
  return (
    <>
      <DrawPath d={silhouette} reduce={reduce} delay={delay} className={className} />
      <DrawPath d={edges} reduce={reduce} delay={delay + 0.18} className={className} />
    </>
  );
}

/* a window on an isometric wall (ax = VW for right wall, VD for left);
   `lit` ones glow on/off in brand blue. */
function IsoWin({
  base,
  ax,
  u,
  v,
  ww = 5,
  hh = 6,
  lit = false,
  delay = 0,
  reduce,
}: {
  base: Pt;
  ax: Pt;
  u: number;
  v: number;
  ww?: number;
  hh?: number;
  lit?: boolean;
  delay?: number;
  reduce: boolean;
}) {
  const c = add(add(base, ax, u), VH, v);
  const path = closed([c, add(c, ax, ww), add(add(c, ax, ww), VH, hh), add(c, VH, hh)]);
  if (!lit)
    return <path d={path} className="text-foreground/15" fill="currentColor" />;
  return (
    <motion.path
      d={path}
      className="text-brand"
      fill="currentColor"
      initial={{ opacity: 0.22 }}
      animate={reduce ? undefined : { opacity: [0.22, 0.9, 0.22] }}
      transition={{ duration: 3.2, repeat: Infinity, delay, ease: "easeInOut" }}
    />
  );
}

/* drifting smoke puff rising from a chimney top */
function Smoke({ cx, cy, delay, reduce }: { cx: number; cy: number; delay: number; reduce: boolean }) {
  if (reduce) return null;
  return (
    <motion.circle
      cx={cx}
      r={2.4}
      className="text-foreground/25"
      fill="currentColor"
      initial={{ cy, opacity: 0 }}
      animate={{ cy: [cy, cy - 22], opacity: [0, 0.5, 0], r: [1.8, 5] }}
      transition={{ duration: 3, repeat: Infinity, delay, ease: "easeOut" }}
    />
  );
}

/* pulsing rooftop beacon */
function Beacon({ cx, cy, reduce }: { cx: number; cy: number; reduce: boolean }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={2.3} className="text-brand" fill="currentColor" />
      {!reduce && (
        <motion.circle
          cx={cx}
          cy={cy}
          r={2.3}
          className="text-brand"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.4}
          animate={{ r: [2.3, 9], opacity: [0.7, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
        />
      )}
    </>
  );
}

function BuildingArt({ kind }: { kind: BKind }) {
  const reduce = useReducedMotion() ?? false;
  return (
    <div className="relative h-[6.5rem] w-full">
      <svg
        viewBox="0 0 160 132"
        preserveAspectRatio="xMidYMax meet"
        className="h-full w-full"
        aria-hidden
      >
        {/* ground shadow */}
        <ellipse cx="80" cy="126" rx="54" ry="8" className="text-foreground/[0.05]" fill="currentColor" />

        {kind === "factory" && (
          <>
            <IsoBox fx={68} fy={118} w={48} d={30} h={22} reduce={reduce} delay={0.1} />
            {/* chimneys on the roof */}
            <IsoBox fx={96} fy={70} w={7} d={7} h={26} reduce={reduce} delay={0.45} />
            <IsoBox fx={84} fy={76} w={6} d={6} h={20} reduce={reduce} delay={0.55} />
            {/* right-wall windows */}
            <IsoWin base={[68, 118]} ax={VW} u={9} v={5} lit delay={0.3} reduce={reduce} />
            <IsoWin base={[68, 118]} ax={VW} u={20} v={5} reduce={reduce} />
            <IsoWin base={[68, 118]} ax={VW} u={31} v={5} lit delay={1.1} reduce={reduce} />
            {/* left-wall door */}
            <IsoWin base={[68, 118]} ax={VD} u={11} v={0} ww={7} hh={11} reduce={reduce} />
            {/* eco leaf accent */}
            <DrawPath
              d="M52 58 q9 -12 19 -9 q-1 12 -19 9 Z"
              reduce={reduce}
              delay={0.7}
              className="text-brand"
              width={1.8}
            />
            <Smoke cx={99} cy={42} delay={0} reduce={reduce} />
            <Smoke cx={86} cy={54} delay={1.3} reduce={reduce} />
          </>
        )}

        {kind === "tech" && (
          <>
            <IsoBox fx={80} fy={120} w={30} d={26} h={62} reduce={reduce} delay={0.1} />
            <IsoBox fx={112} fy={116} w={22} d={18} h={28} reduce={reduce} delay={0.4} />
            {/* window grid — right wall */}
            {[12, 26, 40, 54].map((v, r) =>
              [6, 18].map((u, c) => (
                <IsoWin
                  key={`r${u}-${v}`}
                  base={[80, 120]}
                  ax={VW}
                  u={u}
                  v={v}
                  lit={(r + c) % 3 === 0}
                  delay={r * 0.4 + c * 0.7}
                  reduce={reduce}
                />
              ))
            )}
            {/* window grid — left wall */}
            {[14, 30, 46].map((v) => (
              <IsoWin key={`l${v}`} base={[80, 120]} ax={VD} u={9} v={v} reduce={reduce} />
            ))}
            {/* antenna + beacon */}
            <DrawPath d={seg([81, 58], [81, 44])} reduce={reduce} delay={0.7} width={1.6} className="text-brand" />
            <Beacon cx={81} cy={42} reduce={reduce} />
          </>
        )}

        {kind === "studio" && (
          <>
            <IsoBox fx={74} fy={118} w={42} d={30} h={30} reduce={reduce} delay={0.1} />
            {/* rooftop billboard (thin iso panel) */}
            <IsoBox fx={62} fy={74} w={34} d={3} h={18} reduce={reduce} delay={0.45} className="text-brand" />
            {/* sparkle on the billboard face */}
            <DrawPath
              d="M79 58 C80 62 81 63 85 64 C81 65 80 66 79 70 C78 66 77 65 73 64 C77 63 78 62 79 58 Z"
              reduce={reduce}
              delay={0.8}
              className="text-brand"
              width={1.5}
            />
            {/* windows + door */}
            <IsoWin base={[74, 118]} ax={VW} u={10} v={6} lit delay={0.4} reduce={reduce} />
            <IsoWin base={[74, 118]} ax={VW} u={24} v={6} reduce={reduce} />
            <IsoWin base={[74, 118]} ax={VD} u={11} v={0} ww={7} hh={12} reduce={reduce} />
          </>
        )}

        {kind === "hub" && (
          <>
            {/* flanking buildings */}
            <IsoBox fx={40} fy={120} w={20} d={18} h={22} reduce={reduce} delay={0.25} />
            <IsoBox fx={118} fy={116} w={20} d={16} h={20} reduce={reduce} delay={0.32} />
            {/* central stepped landmark (brand) */}
            <IsoBox fx={78} fy={116} w={34} d={28} h={28} reduce={reduce} delay={0.1} className="text-brand" />
            <IsoBox fx={82} fy={84} w={24} d={20} h={16} reduce={reduce} delay={0.32} className="text-brand" />
            <IsoBox fx={86} fy={70} w={14} d={12} h={12} reduce={reduce} delay={0.5} className="text-brand" />
            {/* lit windows on the base */}
            <IsoWin base={[78, 116]} ax={VW} u={8} v={6} lit delay={0.4} reduce={reduce} />
            <IsoWin base={[78, 116]} ax={VW} u={20} v={6} lit delay={1.0} reduce={reduce} />
            <IsoWin base={[78, 116]} ax={VD} u={9} v={6} lit delay={1.5} reduce={reduce} />
            {/* beacon mast + pulse */}
            <DrawPath d={seg([88, 60], [88, 50])} reduce={reduce} delay={0.6} width={1.6} className="text-brand" />
            <Beacon cx={88} cy={48} reduce={reduce} />
          </>
        )}
      </svg>
    </div>
  );
}

/* ── Partner node: thin-framed editorial plate (paralleluniverse-style) ── */
function NodeCardInner({ item, index }: { item: Item; index: number }) {
  return (
    <figure className="group/n relative">
      {/* offset crop frame + corner ticks */}
      <div
        aria-hidden
        className="absolute -inset-[9px] border border-foreground/10 transition-colors duration-500 group-hover/n:border-foreground/25"
      >
        <Corners className="border-foreground/30 transition-colors duration-500 group-hover/n:border-foreground" />
      </div>

      {/* plate */}
      <div className="relative bg-background p-5 ring-1 ring-foreground/15 transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/n:-translate-y-1 group-hover/n:shadow-[0_30px_60px_-40px_rgba(11,11,12,0.4)]">
        {/* meta row — [0N] ........... // YEAR */}
        <div className="flex items-center justify-between">
          <span className="font-latin text-xs tracking-[0.12em] text-foreground/40">
            [{String(index + 1).padStart(2, "0")}]
          </span>
          <span className="font-latin text-xs tracking-[0.12em] text-foreground/40">
            // {item.year}
          </span>
        </div>

        {/* company building — animated line-art */}
        <div className="mt-3 border-y border-foreground/[0.07] py-3">
          <BuildingArt kind={ROLE_KIND[item.role] ?? "tech"} />
        </div>

        {/* name — editorial weight */}
        <h3 className="mt-4 text-[1.5rem] font-extrabold leading-none tracking-[-0.01em] text-foreground">
          {item.name}
        </h3>
        <p className="mt-2 text-[13px] font-medium text-muted-foreground">
          {item.field}
        </p>

        {/* footer — note + role tag */}
        <div className="mt-4 flex items-end justify-between gap-3 border-t border-foreground/10 pt-3.5">
          <p className="text-sm leading-relaxed text-foreground/70">{item.note}</p>
          <span className="shrink-0 border border-foreground/20 px-2.5 py-0.5 text-[12px] font-semibold text-foreground transition-colors duration-500 group-hover/n:border-brand group-hover/n:text-brand">
            {item.role}
          </span>
        </div>
      </div>
    </figure>
  );
}

/* ── Hub: same frame language, brand-emphasised, alive ── */
function HubCardInner() {
  return (
    <figure className="group/h relative">
      {/* offset crop frame (brand) */}
      <div
        aria-hidden
        className="absolute -inset-[9px] border border-brand/25"
      >
        <Corners className="border-brand/60" />
      </div>

      <div className="relative bg-background p-6 text-center ring-1 ring-brand/40 shadow-[0_34px_80px_-50px_rgba(37,99,235,0.5)]">
        <div className="flex items-center justify-between">
          <span className="font-latin text-xs tracking-[0.12em] text-brand/70">
            [00]
          </span>
          <span className="font-latin text-xs uppercase tracking-[0.18em] text-brand/70">
            HUB
          </span>
        </div>

        {/* HQ landmark building — animated line-art */}
        <div className="mt-3 border-y border-brand/10 py-3">
          <BuildingArt kind="hub" />
        </div>

        <h3 className="mt-4 text-[1.55rem] font-extrabold leading-none tracking-[-0.01em]">
          {partners.hub.name}
        </h3>
        <p className="mt-2 text-sm font-semibold text-brand">{partners.hub.role}</p>
        <p className="mt-1.5 text-[13px] text-muted-foreground">{partners.hub.note}</p>
      </div>
    </figure>
  );
}

/* ── Ambient backdrop: slow vortex spiral + soft vignette (light) ── */
function EcosystemBackdrop({ reduce }: { reduce: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* slow-rotating vortex line-art */}
      <motion.svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        className="absolute left-1/2 top-1/2 h-[150%] w-[150%] -translate-x-1/2 -translate-y-1/2 text-foreground/[0.07]"
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "50% 50%" }}
      >
        <path
          d={SPIRAL_PATH}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.25"
          vectorEffect="non-scaling-stroke"
        />
      </motion.svg>
      {/* faint brand pool so the pulses read */}
      <div className="absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl [background:radial-gradient(circle,rgba(37,99,235,0.07),transparent_66%)]" />
    </div>
  );
}

/* ── Desktop ecosystem: hub at center, partners orbiting, drawn connectors ── */
function EcosystemStage({ reduce }: { reduce: boolean }) {
  return (
    <div className="relative mx-auto mt-20 hidden h-[62rem] max-w-5xl lg:mt-28 lg:block">
      <EcosystemBackdrop reduce={reduce} />

      {/* connector lines (thin, neutral — editorial) */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full text-foreground/20"
        aria-hidden
      >
        {POS.map((p, i) => (
          <motion.line
            key={i}
            x1="50"
            y1="50"
            x2={p.x}
            y2={p.y}
            stroke="currentColor"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            initial={reduce ? false : { pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, delay: 0.15 + i * 0.14, ease: EASE }}
          />
        ))}
      </svg>

      {/* signal pulses travelling each connector → hub */}
      {!reduce &&
        POS.map((p, i) => (
          <motion.span
            key={`pulse-${i}`}
            aria-hidden
            className="absolute z-[5] h-2 w-2 rounded-full bg-brand shadow-[0_0_12px_3px_rgba(37,99,235,0.5)]"
            style={{ left: `${p.x}%`, top: `${p.y}%`, x: "-50%", y: "-50%" }}
            animate={{
              left: [`${p.x}%`, "50%"],
              top: [`${p.y}%`, "50%"],
              opacity: [0, 1, 1, 0],
              scale: [0.6, 1, 1, 0.4],
            }}
            transition={{
              duration: 2.6,
              repeat: Infinity,
              repeatDelay: 1.1,
              delay: 1 + i * 0.55,
              ease: "easeInOut",
              times: [0, 0.12, 0.85, 1],
            }}
          />
        ))}

      {/* partner nodes */}
      {partners.items.map((item, i) => (
        <motion.div
          key={item.name}
          style={{ left: `${POS[i].x}%`, top: `${POS[i].y}%` }}
          initial={reduce ? false : { opacity: 0, scale: 0.86 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.35 + i * 0.12, ease: EASE }}
          className="group/n absolute z-10 w-[16rem] -translate-x-1/2 -translate-y-1/2"
        >
          <NodeCardInner item={item} index={i} />
        </motion.div>
      ))}

      {/* central hub */}
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.88 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: EASE }}
        className="group/h absolute left-1/2 top-1/2 z-20 w-[17rem] -translate-x-1/2 -translate-y-1/2"
      >
        <HubCardInner />
      </motion.div>
    </div>
  );
}

export function Partners() {
  const reduce = useReducedMotion() ?? false;

  return (
    <Section id="partners" className="overflow-hidden bg-background">
      <SectionHeader
        kicker={partners.kicker}
        title={partners.title}
        description={partners.description}
      />

      {/* DESKTOP — ecosystem diagram */}
      <Reveal>
        <EcosystemStage reduce={reduce} />
      </Reveal>

      {/* MOBILE — hub + partners stacked */}
      <div className="mt-12 flex flex-col gap-7 lg:hidden">
        <div className="group/h">
          <HubCardInner />
        </div>
        <div className="flex flex-col gap-7">
          {partners.items.map((item, i) => (
            <div key={item.name} className="group/n">
              <NodeCardInner item={item} index={i} />
            </div>
          ))}
        </div>
      </div>

      <Reveal delay={0.1}>
        <p className="mx-auto mt-16 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">
          {partners.note}
        </p>
      </Reveal>
    </Section>
  );
}
