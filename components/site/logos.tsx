import Image from "next/image";

/**
 * Original, hand-drawn placeholder logo marks (monochrome, currentColor).
 * These are NOT the companies' real logos — those aren't publicly available.
 * Drop real SVG/PNG logos in /public/logos and swap LogoMark when provided.
 *
 *  wonder  — 원더플라스틱 (친환경 제조)  · leaf
 *  rcblock — RC BLOCK (개발)            · stacked blocks
 *  warhol  — 워홀원모어 (브랜딩·콘텐츠)  · spark
 *  all     — 모두의 창업 솔루션 (통합)    · square(제조) ∪ circle(개발)
 */
const MAP: Record<string, string> = {
  "원더플라스틱": "wonder",
  "RC BLOCK": "rcblock",
  "워홀원모어": "warhol",
  "모두의 창업 솔루션": "all",
};

export function LogoMark({
  name,
  className = "h-5 w-5",
}: {
  name: string;
  className?: string;
}) {
  const id = MAP[name] ?? "all";
  const common = {
    viewBox: "0 0 24 24",
    className,
    "aria-hidden": true as const,
  };

  if (id === "wonder") {
    // 실제 로고 (public/logos/wonderplastic.png · 투명 배경)
    return (
      <Image
        src="/logos/wonderplastic.png"
        alt="원더플라스틱 로고"
        width={263}
        height={65}
        className={className}
      />
    );
  }
  if (id === "rcblock") {
    return (
      <svg {...common} fill="currentColor">
        <rect x="8" y="2.5" width="8" height="8" rx="1.6" opacity="0.75" />
        <rect x="3" y="13.5" width="8" height="8" rx="1.6" />
        <rect x="13" y="13.5" width="8" height="8" rx="1.6" opacity="0.5" />
      </svg>
    );
  }
  if (id === "warhol") {
    return (
      <svg {...common} fill="currentColor">
        <path d="M12 1.8 14.1 9.9 22.2 12 14.1 14.1 12 22.2 9.9 14.1 1.8 12 9.9 9.9Z" />
      </svg>
    );
  }
  // all — 자체 브랜드 마크: square(제조) ∪ circle(개발) = 통합 솔루션
  return (
    <svg {...common} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinejoin="round">
      <rect x="3" y="3" width="12.5" height="12.5" rx="2.4" />
      <circle cx="15.2" cy="15.2" r="6.2" />
    </svg>
  );
}
