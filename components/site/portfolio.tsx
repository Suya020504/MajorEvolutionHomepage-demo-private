"use client";

import Image from "next/image";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Boxes,
  Cpu,
  Factory,
  Gift,
  Globe,
  GraduationCap,
  LayoutTemplate,
  Landmark,
  MessageSquare,
  Orbit,
  Package,
  Recycle,
  Rocket,
  ScanLine,
  Smartphone,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { workGallery } from "@/lib/content";
import { Reveal } from "./reveal";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

type Item = (typeof workGallery.items)[number];

const TRACK_LABEL: Record<string, string> = {
  manufacture: "제조",
  develop: "개발",
};

/* category → lucide icon (no misleading stock photos; consistent + honest) */
const ICONS: Record<string, LucideIcon> = {
  "친환경 업사이클 제품": Recycle,
  "기업 ESG 굿즈": Gift,
  "전시용 시제품": Package,
  관광기념품: Landmark,
  "교육용 키트": GraduationCap,
  "3D프린팅 제품": Boxes,
  "사출 제품": Factory,
  "맞춤형 굿즈": Sparkles,
  "기업 홈페이지": Globe,
  "서비스 랜딩페이지": LayoutTemplate,
  "MVP 웹사이트": Rocket,
  "모바일 앱": Smartphone,
  "AI 서비스": Cpu,
  "AR 콘텐츠": ScanLine,
  메타버스: Orbit,
  "신청·문의 시스템": MessageSquare,
};

/* ── Longbow-style blueprint overlay: faint grid + selection handles ── */
function Blueprint() {
  const cols = [0, 25, 50, 75, 100];
  const rows = [0, 50, 100];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {[0, 50, 100].map((x) => (
        <span
          key={`v${x}`}
          className="absolute inset-y-0 w-px bg-foreground/[0.07]"
          style={{ left: `${x}%` }}
        />
      ))}
      <span className="absolute inset-x-0 top-0 h-px bg-foreground/[0.07]" />
      <span className="absolute inset-x-0 bottom-0 h-px bg-foreground/[0.07]" />
      {rows.flatMap((y) =>
        cols
          .filter((x) => x % 50 === 0)
          .map((x) => (
            <span
              key={`${x}-${y}`}
              className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 border border-foreground/30 bg-secondary"
              style={{ left: `${x}%`, top: `${y}%` }}
            />
          ))
      )}
    </div>
  );
}

/* corner crop brackets on each tile */
function Corners() {
  const base = "absolute h-3 w-3 border-white/55";
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 z-10">
      <span className={cn(base, "left-2 top-2 border-l border-t")} />
      <span className={cn(base, "right-2 top-2 border-r border-t")} />
      <span className={cn(base, "bottom-2 left-2 border-b border-l")} />
      <span className={cn(base, "bottom-2 right-2 border-b border-r")} />
    </span>
  );
}

function WorkTile({ item, index }: { item: Item; index: number }) {
  const reduce = useReducedMotion();
  const Icon = ICONS[item.name] ?? Package;
  // local paths (/work/...) are real project photos; remote ids stay icon tiles
  const photo = item.image.startsWith("/");

  return (
    <motion.figure
      layout={!reduce}
      initial={reduce ? false : { opacity: 0, scale: 0.96, rotateY: -14 }}
      whileInView={reduce ? undefined : { opacity: 1, scale: 1, rotateY: 0 }}
      whileHover={reduce ? undefined : { y: -4 }}
      viewport={{ once: true, margin: "-40px" }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.55, ease: EASE }}
      style={{ transformPerspective: 900 }}
      className={cn(
        "group relative flex aspect-[4/3] flex-col justify-between overflow-hidden border border-border text-foreground transition-colors duration-500 hover:border-brand/50",
        photo ? "bg-ink" : "bg-secondary/50 p-6"
      )}
      data-cursor
    >
      {photo ? (
        <>
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.045]"
          />
          {/* legibility grade for the caption */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-black/15"
          />
          <Corners />

          <div className="relative flex items-center justify-between p-5">
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-white/80">
              .{String(index + 1).padStart(2, "0")} · {TRACK_LABEL[item.track]}
            </span>
          </div>
          <div className="relative p-5">
            <h3 className="flex items-center gap-2 text-xl font-bold tracking-tight text-white">
              {item.name}
              <span className="translate-x-1 text-white/60 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                →
              </span>
            </h3>
            {"desc" in item && item.desc && (
              <p className="mt-1 text-sm leading-snug text-white/70">
                {item.desc}
              </p>
            )}
          </div>
        </>
      ) : (
        <>
          <div aria-hidden className="grain-local absolute inset-0 opacity-60" />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100 [background:radial-gradient(circle,rgba(37,99,235,0.2),transparent_62%)]"
          />
          <Corners />

          <div className="relative flex items-center justify-between">
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-foreground/55">
              .{String(index + 1).padStart(2, "0")} · {TRACK_LABEL[item.track]}
            </span>
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-brand transition-[transform,border-color,background-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110 group-hover:border-brand/40 group-hover:bg-brand/10">
              <Icon className="h-5 w-5" strokeWidth={1.5} />
            </span>
          </div>

          <h3 className="relative flex items-center gap-2 text-xl font-bold tracking-tight">
            {item.name}
            <span className="translate-x-1 text-foreground/40 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
              →
            </span>
          </h3>
        </>
      )}
    </motion.figure>
  );
}

export function Portfolio() {
  const [filter, setFilter] = useState<string>("all");
  const items = workGallery.items.filter(
    (i) => filter === "all" || i.track === filter
  );

  return (
    <section
      id="work"
      className="relative scroll-mt-20 overflow-hidden bg-secondary px-6 py-24 lg:px-10 lg:py-32"
    >
      <Blueprint />

      <div className="relative mx-auto max-w-[100rem]">
        {/* header — mono dot label + serif title + latin italic accent */}
        <Reveal>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            .{workGallery.kicker} — selected output
          </span>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="font-accent mt-4 text-[clamp(2rem,4.5vw,3.75rem)] font-extrabold leading-[1.1] tracking-[-0.02em]">
            {workGallery.title.split("\n").map((l, i) => (
              <span key={i} className="block">
                {l}
              </span>
            ))}
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p
            className="mt-4 text-xl italic text-foreground/55 sm:text-2xl"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            Crafted, end to end.
          </p>
        </Reveal>
        <Reveal delay={0.14}>
          <p className="mt-5 max-w-xl leading-relaxed text-muted-foreground">
            {workGallery.description}
          </p>
        </Reveal>

        {/* filter tabs — mono ghost pills */}
        <Reveal delay={0.18}>
          <div className="mt-10 flex flex-wrap gap-2">
            {workGallery.filters.map((f) => {
              const on = filter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  aria-pressed={on}
                  className={cn(
                    "rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors duration-300",
                    on
                      ? "border-foreground bg-foreground text-background"
                      : "border-foreground/20 text-foreground/60 hover:border-foreground/50 hover:text-foreground"
                  )}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* gallery grid */}
        <motion.div
          layout
          className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {items.map((item, i) => (
              <WorkTile key={item.name} item={item} index={i} />
            ))}
          </AnimatePresence>
        </motion.div>

        <Reveal delay={0.1}>
          <p className="mt-12 font-mono text-xs leading-relaxed text-muted-foreground">
            ※ 제조 사례는 원더플라스틱의 실제 제작 결과물이며, 개발 사례는 직접
            기획·개발한 프로젝트입니다.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
