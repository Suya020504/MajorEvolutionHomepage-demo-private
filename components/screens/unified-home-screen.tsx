"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle, NotebookPen, Route } from "lucide-react";
import type { CSSProperties } from "react";
import { AppShell, Card, PrimaryButton, Tag } from "@/components/app/primitives";
import { SceneBanner } from "@/components/app/scene-banner";
import { brandDecoration, brandScene, coreIcon } from "@/lib/brand-assets";
import { useResearchStore } from "@/store/research-store";

/**
 * Y-00 통합 홈.
 *
 * 찾다·만들다·잇다를 같은 시각 무게로 보여줍니다(AC-002).
 * 정해진 순서가 없으므로 카드를 단계로 번호 매겨 잠그지 않고,
 * 저장된 기록이 있으면 그 사실만 표시합니다.
 */

type CoreKey = "find" | "make" | "connect";

const CORE_CARDS: Array<{
  key: CoreKey;
  index: string;
  name: string;
  verb: string;
  description: string;
  href: string;
  icon: string;
  /** 카드 뒤에 옅게 깔리는 장식. 의미 전달용이 아니라 분위기용입니다. */
  decoration: string;
}> = [
  {
    key: "find",
    index: "01",
    name: "나의 교수님",
    verb: "찾다",
    description: "진로·관심 분야를 잘 아는 교수님을 공식 근거와 함께 발견한다.",
    href: "/professors",
    icon: coreIcon.find,
    decoration: brandDecoration.radarRings,
  },
  {
    key: "make",
    index: "02",
    name: "전공 진화 실험실",
    verb: "만들다",
    description: "내 전공 / 전공+AI / 전공+타 전공으로 실행 가능한 프로젝트를 만든다.",
    href: "/research",
    icon: coreIcon.make,
    decoration: brandDecoration.seedGrowth,
  },
  {
    key: "connect",
    index: "03",
    name: "교수님 퀘스트",
    verb: "잇다",
    description: "교수님을 찾아가기 전부터 만난 후까지 대화와 다음 행동을 이어준다.",
    href: "/quest",
    icon: coreIcon.connect,
    decoration: brandDecoration.questConfetti,
  },
];

export function UnifiedHomeScreen() {
  const router = useRouter();
  const hasHydrated = useResearchStore((state) => state.hasHydrated);
  const result = useResearchStore((state) => state.result);
  const selectedTopicId = useResearchStore((state) => state.selectedTopicId);
  const matches = useResearchStore((state) => state.professorMatches);
  const selectedProfessorId = useResearchStore((state) => state.selectedProfessorId);
  const knockKitDrafts = useResearchStore((state) => state.knockKitDrafts);
  const mentorLoopEntries = useResearchStore((state) => state.mentorLoopEntries);

  if (!hasHydrated) {
    return (
      <div className="research-loading">
        <LoaderCircle className="spin" />
        <p>저장된 여정을 불러오고 있어요.</p>
      </div>
    );
  }

  const draftKey =
    selectedTopicId && selectedProfessorId ? `${selectedTopicId}:${selectedProfessorId}` : null;

  const saved: Record<CoreKey, boolean> = {
    find: matches.length > 0,
    make: Boolean(result),
    connect: Boolean(draftKey && (knockKitDrafts[draftKey] || mentorLoopEntries[draftKey])),
  };
  const hasAnySaved = Object.values(saved).some(Boolean);

  // 이어보기는 가장 멀리 간 지점으로 돌아갑니다. 순서를 강제하지는 않습니다.
  const resumeHref = saved.connect
    ? "/quest"
    : saved.find
      ? "/professors"
      : saved.make
        ? "/result"
        : "/research";

  return (
    <AppShell title="너의 교수님은?" className="unified-home-screen">
      <SceneBanner
        scene={brandScene.home}
        alt="교수 탐색, 전공 아이디어, 교수 만남으로 이어지는 서비스 여정"
        title="오늘은 어디서 시작할까요?"
        description="전공과 진로의 갈림길에서, 교수님을 찾고 만들고 잇다."
        priority
      />

      <div className="core-card-grid">
        {CORE_CARDS.map((card) => (
          <Link
            key={card.key}
            href={card.href}
            className={`core-card core-card--${card.key}`}
            aria-label={`${card.name} ${card.verb} — ${card.description}`}
            style={{ "--core-deco": `url(${card.decoration})` } as CSSProperties}
          >
            <div className="core-card__head">
              <span className="core-card__index">{card.index}</span>
              {saved[card.key] && <Tag tone="mint">저장된 기록</Tag>}
            </div>
            <h2 className="core-card__title">
              {card.name}
              <em>{card.verb}</em>
            </h2>
            <Image
              className="core-card__icon"
              src={card.icon}
              alt=""
              aria-hidden="true"
              width={96}
              height={96}
              loading="eager"
              unoptimized
            />
            <p className="core-card__description">{card.description}</p>
          </Link>
        ))}
      </div>

      <Card className="core-note">
        <Route size={18} aria-hidden="true" />
        <div>
          <strong>한 방향 통로가 아닙니다</strong>
          <p>찾다와 만들다 중 어디서든 시작하고, 잇다에서 실제 행동으로 전환합니다.</p>
        </div>
      </Card>

      <div className="core-actions">
        <PrimaryButton className="core-resume" onClick={() => router.push(resumeHref)}>
          {hasAnySaved ? "나의 여정 이어보기" : "연구주제부터 시작하기"} <ArrowRight size={18} />
        </PrimaryButton>
        <Link href="/portfolio" className="core-portfolio-link">
          <NotebookPen size={16} aria-hidden="true" /> 성장 포트폴리오 보기
        </Link>
      </div>
    </AppShell>
  );
}
