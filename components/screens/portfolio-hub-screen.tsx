"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Bot,
  CalendarCheck,
  CheckCircle2,
  FileText,
  FlaskConical,
  GraduationCap,
  Lightbulb,
  LoaderCircle,
  MessageCircleQuestion,
  NotebookPen,
  Route,
  Search,
  Settings2,
  Sprout,
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
import { useAiProfessorStore } from "@/store/ai-professor-store";
import growthStyles from "./portfolio-hub-screen.module.css";

type GrowthStep = {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  done: boolean;
};

const PROFESSOR_ROLE_LABEL = {
  TOPIC: "주제 연결",
  METHOD: "방법 연결",
  CONTEXT: "맥락 연결",
} as const;

const PROFESSOR_SOURCE_LABEL = {
  student: "첫 교수 매칭",
  project: "프로젝트 매칭",
  paper: "대화 준비",
} as const;

function sameValues(a: string[], b: string[]) {
  return a.length === b.length && a.every((item) => b.includes(item));
}

export function PortfolioHubScreen() {
  const hasResearchHydrated = useResearchStore((state) => state.hasHydrated);
  const hasQuestHydrated = useQuestStore((state) => state.hasHydrated);
  const hasAiHydrated = useAiProfessorStore((state) => state.hasHydrated);
  const aiMessages = useAiProfessorStore((state) => state.messages);
  const aiGrowthNotes = useAiProfessorStore((state) => state.growthNotes);
  const conditions = useResearchStore((state) => state.conditions);
  const result = useResearchStore((state) => state.result);
  const matches = useResearchStore((state) => state.professorMatches);
  const selectedProfessorId = useResearchStore((state) => state.selectedProfessorId);
  const discovery = useResearchStore((state) => state.professorDiscoverySummary);
  const selectedTopicId = useResearchStore((state) => state.selectedTopicId);
  const coDesignAnswers = useResearchStore((state) => state.coDesignAnswers);
  const growthDirectionBaseline = useResearchStore((state) => state.growthDirectionBaseline);
  const growthProjectHistory = useResearchStore((state) => state.growthProjectHistory);
  const growthProfessorHistory = useResearchStore((state) => state.growthProfessorHistory);
  const selectedPaper = useResearchStore((state) => state.selectedProfessorPaper);
  const knockKitDrafts = useResearchStore((state) => state.knockKitDrafts);
  const mentorLoopEntries = useResearchStore((state) => state.mentorLoopEntries);
  const cards = useQuestStore((state) => state.cards);

  if (!hasResearchHydrated || !hasQuestHydrated || !hasAiHydrated) {
    return (
      <div className="research-loading">
        <LoaderCircle className="spin" />
        <p>저장한 성장 기록을 불러오고 있어요.</p>
      </div>
    );
  }

  const hasTopic = Boolean(result || conditions.major || discovery?.major || growthProjectHistory.length);
  const hasProfessor = Boolean(selectedProfessorId || matches.length || growthProfessorHistory.length);
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

  const currentInterests = conditions.interests.length
    ? conditions.interests
    : discovery?.interests ?? [];
  const latestProject = growthProjectHistory.at(-1) ?? null;
  const latestSelectedProfessor = [...growthProfessorHistory]
    .reverse()
    .find((record) => record.selectedAt) ?? null;
  const latestProfessor = growthProfessorHistory.at(-1) ?? null;
  const directionChanged = Boolean(
    growthDirectionBaseline
    && currentInterests.length
    && !sameValues(growthDirectionBaseline.interests, currentInterests),
  );
  const startingPoint = growthDirectionBaseline?.careerConcerns[0]
    ?? (growthDirectionBaseline?.interests.length
      ? growthDirectionBaseline.interests.join(" · ")
      : growthDirectionBaseline?.major || "첫 고민을 아직 남기지 않았어요");
  const currentDirection = latestProject?.title
    ?? (currentInterests.length ? currentInterests.join(" · ") : "관심 방향을 정리하는 중이에요");
  const currentAction = latestSelectedProfessor
    ? `${latestSelectedProfessor.name} 교수님과의 다음 행동 준비`
    : latestProfessor
      ? `${latestProfessor.name} 교수님 연결 근거 확인`
      : next.title;
  const changeSummary = directionChanged && growthDirectionBaseline
    ? `처음 관심 ${growthDirectionBaseline.interests.join(" · ")}에서 지금 ${currentInterests.join(" · ")}까지 확장했어요.`
    : latestProject && currentInterests.length
      ? `${currentInterests.join(" · ")} 관심을 ‘${latestProject.title}’ 프로젝트로 구체화했어요.`
      : "저장되는 기록이 쌓이면 처음 고민과 지금의 방향을 비교해 보여드려요.";
  const visibleProjects = [...growthProjectHistory].reverse().slice(0, 3);
  const visibleProfessors = [...growthProfessorHistory].reverse().slice(0, 6);

  return (
    <AppShell showHeader={false} className={styles.shell} bottomNav={<ServiceBottomNav />}>
      <ServiceMobileHeader />
      <div className={styles.hub}>
        <ServiceHubIntro
          title="나의 성장과정"
          description="처음 남긴 고민부터 프로젝트 설계, 교수 연결, 다음 행동까지 내가 이 서비스에서 쌓은 경험을 한곳에서 확인해요."
        />

        <section className={growthStyles.aiProfessorSection} aria-labelledby="my-ai-professor-title">
          <span className={growthStyles.aiProfessorIcon}><Bot size={25} aria-hidden="true" /></span>
          <div className={growthStyles.aiProfessorCopy}>
            <h2 id="my-ai-professor-title">나의 AI 교수님</h2>
            <p>
              {aiGrowthNotes.at(-1)?.body
                ?? "교수님을 만나기 전후, 진로 고민과 프로젝트 생각을 가볍게 대화하며 정리해요."}
            </p>
            <small>
              {aiMessages.length || aiGrowthNotes.length
                ? `이어갈 대화 ${aiMessages.length}개 · 성장 메모 ${aiGrowthNotes.length}개`
                : "실제 교수님의 지도는 대신하지 않고, 내 생각을 정리하는 데 집중해요."}
            </small>
          </div>
          <Link href="/portfolio/ai-professor" className={growthStyles.aiProfessorAction}>
            {aiMessages.length ? "대화 이어가기" : "가볍게 대화하기"}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </section>

        <HubPrimaryTask {...next} />

        <section className={growthStyles.storySection} aria-labelledby="growth-story-title">
          <header className={growthStyles.storyHeading}>
            <div>
              <h2 id="growth-story-title">내 방향이 구체화된 흐름</h2>
              <p>{changeSummary}</p>
            </div>
            <span>{coDesignAnswers.length ? `AI와 확인한 답변 ${coDesignAnswers.length}개` : "기록을 쌓는 중"}</span>
          </header>
          <ol className={growthStyles.storyPath}>
            <li>
              <span className={growthStyles.storyIcon}><Route size={20} aria-hidden="true" /></span>
              <div><small>처음 남긴 고민</small><strong>{startingPoint}</strong></div>
            </li>
            <ArrowRight className={growthStyles.storyArrow} size={20} aria-hidden="true" />
            <li>
              <span className={growthStyles.storyIcon}><FlaskConical size={20} aria-hidden="true" /></span>
              <div><small>프로젝트로 구체화</small><strong>{currentDirection}</strong></div>
            </li>
            <ArrowRight className={growthStyles.storyArrow} size={20} aria-hidden="true" />
            <li>
              <span className={growthStyles.storyIcon}><Sprout size={20} aria-hidden="true" /></span>
              <div><small>지금 이어가는 행동</small><strong>{currentAction}</strong></div>
            </li>
          </ol>
          <p className={growthStyles.storyNote}>입력하지 않은 변화는 추정하지 않고, 직접 선택하거나 저장한 내용만 보여줘요.</p>
        </section>

        <HubList title="이 서비스를 통해 쌓은 경험" trailing={<span>{recordedCount} / 6 단계 기록</span>}>
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

        {visibleProjects.length > 0 ? (
          <HubList title="프로젝트 설계 기록" trailing={<span>{growthProjectHistory.length}개 프로젝트</span>}>
            {visibleProjects.map((project) => (
              <HubRow
                key={project.topicId}
                icon={FlaskConical}
                title={project.title}
                description={project.question}
                status={project.topicId === selectedTopicId ? "현재 프로젝트" : "이전 선택"}
                href="/result"
                tone={project.topicId === selectedTopicId ? "violet" : "neutral"}
              />
            ))}
          </HubList>
        ) : null}

        {visibleProfessors.length > 0 ? (
          <HubList title="지금까지 연결한 교수님" trailing={<span>{growthProfessorHistory.length}명 기록</span>}>
            {visibleProfessors.map((record) => (
              <HubRow
                key={`${record.source}-${record.professorId}`}
                icon={GraduationCap}
                title={`${record.name} ${record.title}`}
                description={`${record.department || record.college} · ${record.reason}`}
                status={record.selectedAt
                  ? "선택한 교수"
                  : `${PROFESSOR_SOURCE_LABEL[record.source]} · ${PROFESSOR_ROLE_LABEL[record.role]}`}
                href={`/professors/${record.professorId}`}
                tone={record.selectedAt ? "mint" : record.source === "project" ? "violet" : "neutral"}
              />
            ))}
          </HubList>
        ) : null}

        <HubUtilityLinks>
          <HubUtilityLink icon={FileText} href="/portfolio/builder">포트폴리오 만들기</HubUtilityLink>
          <HubUtilityLink icon={Settings2} href="/portfolio/manage">내 기록 관리</HubUtilityLink>
        </HubUtilityLinks>
      </div>
    </AppShell>
  );
}
