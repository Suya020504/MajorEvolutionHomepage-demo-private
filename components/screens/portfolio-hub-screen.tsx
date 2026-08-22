"use client";

import {
  BookOpenCheck,
  CalendarCheck,
  CheckCircle2,
  FileText,
  Lightbulb,
  LoaderCircle,
  MessageCircleQuestion,
  NotebookPen,
  Search,
  Settings2,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppShell } from "@/components/app/primitives";
import { ServiceBottomNav } from "@/components/app/side-nav";
import {
  HubList,
  HubPrimaryTask,
  HubRow,
  HubUtilityLink,
  HubUtilityLinks,
  ServiceHubIntro,
  ServiceMobileHeader,
  serviceHubStyles as styles,
} from "@/components/app/service-hub";
import { cardsForTool, useQuestStore } from "@/store/quest-store";
import { useResearchStore } from "@/store/research-store";

type GrowthStep = {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  done: boolean;
};

export function PortfolioHubScreen() {
  const hasResearchHydrated = useResearchStore((state) => state.hasHydrated);
  const hasQuestHydrated = useQuestStore((state) => state.hasHydrated);
  const conditions = useResearchStore((state) => state.conditions);
  const result = useResearchStore((state) => state.result);
  const matches = useResearchStore((state) => state.professorMatches);
  const selectedProfessorId = useResearchStore((state) => state.selectedProfessorId);
  const discovery = useResearchStore((state) => state.professorDiscoverySummary);
  const selectedPaper = useResearchStore((state) => state.selectedProfessorPaper);
  const knockKitDrafts = useResearchStore((state) => state.knockKitDrafts);
  const mentorLoopEntries = useResearchStore((state) => state.mentorLoopEntries);
  const cards = useQuestStore((state) => state.cards);

  if (!hasResearchHydrated || !hasQuestHydrated) {
    return (
      <div className="research-loading">
        <LoaderCircle className="spin" />
        <p>저장한 성장 기록을 불러오고 있어요.</p>
      </div>
    );
  }

  const hasTopic = Boolean(result || conditions.major || discovery?.major);
  const hasProfessor = Boolean(selectedProfessorId || matches.length);
  const hasPaper = Boolean(selectedPaper || cardsForTool(cards, "paper-bite").length);
  const hasPreparation = Boolean(
    Object.keys(knockKitDrafts).length
    || cardsForTool(cards, "first-line").length
    || cardsForTool(cards, "silence-rescue").length,
  );
  const hasRevision = Object.keys(mentorLoopEntries).length > 0;
  const hasActions = Boolean(
    Object.keys(mentorLoopEntries).length
    || cardsForTool(cards, "next-seed").length,
  );

  const steps: GrowthStep[] = [
    { id: "topic", label: "주제 탐색", description: "관심 주제와 고민을 정리했어요.", href: "/portfolio/builder", icon: Search, done: hasTopic },
    { id: "professor", label: "교수 근거", description: "교수의 연구와 연결 근거를 확인했어요.", href: "/portfolio/builder", icon: UserRound, done: hasProfessor },
    { id: "paper", label: "읽은 논문", description: "교수님의 연구를 한입 카드로 남겨보세요.", href: "/paper/reader?mode=bite&source=favorites", icon: BookOpenCheck, done: hasPaper },
    { id: "prepare", label: "면담 준비", description: "첫 질문과 연락 초안을 준비해 보세요.", href: "/quest", icon: MessageCircleQuestion, done: hasPreparation },
    { id: "revision", label: "수정 전후", description: "받은 조언으로 달라진 점을 남겨보세요.", href: "/mentor-loop", icon: Lightbulb, done: hasRevision },
    { id: "actions", label: "7일 행동", description: "이번 주에 실행할 행동을 기록해 보세요.", href: "/mentor-loop", icon: CalendarCheck, done: hasActions },
  ];

  const recordedCount = steps.filter((step) => step.done).length;
  const nextIndex = steps.findIndex((step) => !step.done);
  const safeNextIndex = nextIndex === -1 ? steps.length - 1 : nextIndex;
  const start = Math.max(0, Math.min(safeNextIndex - 2, steps.length - 3));
  const visibleSteps = steps.slice(start, start + 3);
  const next = nextIndex === -1
    ? {
        icon: NotebookPen,
        title: "지금까지 달라진 과정을 한 번 돌아보세요",
        description: "저장한 단계만 골라 나의 성장 포트폴리오를 만들 수 있어요.",
        cta: "포트폴리오 만들기",
        href: "/portfolio/builder",
      }
    : {
        icon: steps[nextIndex].icon,
        title: `다음은 ${steps[nextIndex].label} 단계예요`,
        description: steps[nextIndex].description,
        cta: steps[nextIndex].id === "topic" ? "전공 아이디어 시작하기" : "다음 기록 만들기",
        href: steps[nextIndex].href,
      };

  return (
    <AppShell showHeader={false} className={styles.shell} bottomNav={<ServiceBottomNav />}>
      <ServiceMobileHeader />
      <div className={styles.hub}>
        <ServiceHubIntro
          title="준비하며 달라진 과정을 모았어요"
          description="결과보다 고민하고 수정하고 실행한 기록을 보여줘요."
        />

        <HubPrimaryTask {...next} />

        <HubList title="나의 성장 기록" trailing={<span>{recordedCount} / 6 단계 기록</span>}>
          {visibleSteps.map((step, index) => {
            const Icon = step.done ? CheckCircle2 : step.icon;
            const isCurrent = !step.done && steps.findIndex((item) => !item.done) === steps.indexOf(step);
            return (
              <HubRow
                key={step.id}
                icon={Icon}
                title={step.done ? step.label : isCurrent ? "아직 비어 있는 기록" : step.label}
                description={step.description}
                status={step.done ? "기록 있음" : isCurrent ? "다음 단계" : "시작 전"}
                href={step.done ? "/portfolio/builder" : step.href}
                tone={step.done ? "mint" : isCurrent ? "violet" : "neutral"}
              />
            );
          })}
        </HubList>

        <HubUtilityLinks>
          <HubUtilityLink icon={FileText} href="/portfolio/builder">포트폴리오 만들기</HubUtilityLink>
          <HubUtilityLink icon={Settings2} href="/portfolio/manage">내 기록 관리</HubUtilityLink>
        </HubUtilityLinks>
      </div>
    </AppShell>
  );
}
