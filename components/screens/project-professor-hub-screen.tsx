"use client";

import {
  FlaskConical,
  GraduationCap,
  LoaderCircle,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { AppShell } from "@/components/app/primitives";
import { ServiceBottomNav } from "@/components/app/side-nav";
import {
  HubList,
  HubPrimaryTask,
  HubRow,
  ServiceHubIntro,
  ServiceMobileHeader,
  serviceHubStyles as styles,
} from "@/components/app/service-hub";
import type { TopicWithChecks } from "@/lib/recommend";
import { useResearchStore } from "@/store/research-store";

const ROLE_LABEL = {
  TOPIC: "연구주제 연결",
  METHOD: "방법론 연결",
  CONTEXT: "응용 맥락 연결",
} as const;

function findSelectedTopic(
  result: ReturnType<typeof useResearchStore.getState>["result"],
  selectedTopicId: string | null,
): TopicWithChecks | null {
  if (!result || !selectedTopicId || result.kind === "empty") return null;
  if (result.kind === "insufficient") {
    return result.candidate.topic.id === selectedTopicId ? result.candidate : null;
  }
  return result.candidates.find((candidate) => candidate.topic.id === selectedTopicId) ?? null;
}

export function ProjectProfessorHubScreen() {
  const hasHydrated = useResearchStore((state) => state.hasHydrated);
  const result = useResearchStore((state) => state.result);
  const selectedTopicId = useResearchStore((state) => state.selectedTopicId);
  const professorMatches = useResearchStore((state) => state.professorMatches);
  const professorCoverage = useResearchStore((state) => state.professorCoverage);

  if (!hasHydrated) {
    return (
      <div className="research-loading">
        <LoaderCircle className="spin" />
        <p>프로젝트 교수 추천을 불러오고 있어요.</p>
      </div>
    );
  }

  const selectedTopic = findSelectedTopic(result, selectedTopicId);
  const projectMatches = professorCoverage?.rankingSource === "ai-reranked"
    ? professorMatches
    : [];

  const primary = !result
    ? {
        title: "나만의 프로젝트부터 설계해 볼까요?",
        description: "AI와 공통 질문 3개, 맞춤 질문 2개를 나누며 프로젝트의 문제·방법·범위를 정해요.",
        cta: "AI 프로젝트 설계하기",
        href: "/research/tutorial",
        icon: FlaskConical,
      }
    : !selectedTopic
      ? {
          title: "프로젝트 후보를 하나 골라주세요",
          description: "두 후보의 근거와 실행 조건을 비교해 고르면 그 프로젝트에 맞는 교수 추천이 이어져요.",
          cta: "프로젝트 후보 고르기",
          href: "/result",
          icon: FlaskConical,
        }
      : projectMatches.length > 0
        ? {
            title: "프로젝트에 맞는 교수님을 찾았어요",
            description: "공식 교수 후보 안에서 연구주제·방법론·응용 맥락을 도울 교수님을 나누어 확인했어요.",
            cta: "추천 근거 자세히 보기",
            href: "/result#professor-connection",
            icon: GraduationCap,
          }
        : {
            title: "선택한 프로젝트의 교수 추천을 이어가세요",
            description: "프로젝트 결과에서 공식 교수 후보를 불러오고 AI가 역할별 연결 이유를 정리해요.",
            cta: "맞춤 교수 추천 확인하기",
            href: "/result#professor-connection",
            icon: GraduationCap,
          };

  return (
    <AppShell showHeader={false} className={styles.shell} bottomNav={<ServiceBottomNav />}>
      <ServiceMobileHeader />
      <div className={styles.hub}>
        <ServiceHubIntro
          title="내 프로젝트에 맞는 교수님을 찾아볼까요?"
          description="학생 고민을 위한 첫 교수 매칭과 분리해, 선택한 프로젝트의 성공적인 실행에 필요한 전문성을 기준으로 연결해요."
        />

        <HubPrimaryTask {...primary} />

        {selectedTopic ? (
          <HubList title="선택한 프로젝트" trailing={<span>AI 공동설계 완료</span>}>
            <HubRow
              icon={FlaskConical}
              title={selectedTopic.topic.title}
              description={selectedTopic.topic.question}
              status="선택됨"
              href="/result"
              tone="violet"
            />
          </HubList>
        ) : null}

        {projectMatches.length > 0 ? (
          <HubList title="맞춤 교수 추천" trailing={<span>{projectMatches.length}명</span>}>
            {projectMatches.map((match) => (
              <HubRow
                key={match.professor.id}
                icon={UserRound}
                title={`${match.professor.name} ${match.professor.title}`}
                description={`${match.professor.department} · ${match.mentorFitReason ?? match.reason}`}
                status={ROLE_LABEL[match.role]}
                href={`/professors/${match.professor.id}`}
                tone="mint"
              />
            ))}
          </HubList>
        ) : null}

        <p className={styles.trustNote}>
          <ShieldCheck size={17} aria-hidden="true" /> 공식 교수 정보 안에서만 추천하며, 면담 가능 여부와 프로젝트 성공을 보장하지 않아요.
        </p>
      </div>
    </AppShell>
  );
}
