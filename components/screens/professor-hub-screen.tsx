"use client";

import {
  Bookmark,
  Compass,
  LoaderCircle,
  MessageCircleQuestion,
  Search,
  Settings2,
  ShieldCheck,
  UserRound,
} from "lucide-react";
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
import { useResearchStore } from "@/store/research-store";

export function ProfessorHubScreen() {
  const hasHydrated = useResearchStore((state) => state.hasHydrated);
  const matches = useResearchStore((state) => state.professorMatches);
  const selectedProfessorId = useResearchStore((state) => state.selectedProfessorId);
  const favoriteProfessorIds = useResearchStore((state) => state.favoriteProfessorIds);

  if (!hasHydrated) {
    return (
      <div className="research-loading">
        <LoaderCircle className="spin" />
        <p>교수 연결을 불러오고 있어요.</p>
      </div>
    );
  }

  const selected = matches.find((match) => match.professor.id === selectedProfessorId) ?? null;
  const saved = matches.filter((match) => favoriteProfessorIds.includes(match.professor.id));

  const primary = selected
    ? {
        title: "첫 대화를 준비할 차례예요",
        description: `${selected.professor.name} 교수님과 나눌 첫 질문부터 준비해 보세요.`,
        cta: "대화 준비 이어가기",
        href: "/quest",
        icon: MessageCircleQuestion,
        secondary: { label: "다른 교수 연결 보기", href: "/professors/pitch" },
      }
    : matches.length > 0
      ? {
          title: "대화할 교수를 골라보세요",
          description: "순위가 아니라, 내 고민과 연결된 이유를 보고 첫 교수를 선택해요.",
          cta: "교수 피칭 이어보기",
          href: "/professors/pitch",
          icon: UserRound,
          secondary: { label: "새로 찾기", href: "/tutorial" },
        }
      : {
          title: "3분이면 첫 교수 연결을 볼 수 있어요",
          description: "한 번에 한 질문씩 고민을 정리하면 학교 공식 정보에서 교수를 찾아드려요.",
          cta: "3분 교수 찾기",
          href: "/tutorial",
          icon: Compass,
          secondary: { label: "질문을 한 화면에서 입력하기", href: "/professors/discover" },
        };

  return (
    <AppShell
      showHeader={false}
      className={styles.shell}
      bottomNav={<ServiceBottomNav />}
    >
      <ServiceMobileHeader />
      <div className={styles.hub}>
        <ServiceHubIntro
          title="누구와 이야기할지 찾아볼까요?"
          description="지금 고민을 정리하면 학교 공식 정보에서 대화할 교수를 찾아드려요."
        />

        <HubPrimaryTask {...primary} />

        <HubList title="내 교수 연결">
          <HubRow
            icon={UserRound}
            title={selected ? `${selected.professor.name} ${selected.professor.title}` : "아직 선택한 교수가 없어요"}
            description={selected ? `${selected.professor.department} · 첫 대화 준비 중` : "공식 근거를 비교한 뒤 첫 교수를 선택해요."}
            status={selected ? "연결됨" : "시작 전"}
            href={selected ? `/professors/${selected.professor.id}` : matches.length ? "/professors/pitch" : "/tutorial"}
            tone={selected ? "mint" : "neutral"}
          />
          <HubRow
            icon={Bookmark}
            title="저장한 교수"
            description={saved.length ? saved.map((item) => item.professor.name).join(" · ") : "관심 있는 교수를 저장하면 여기에 모여요."}
            status={saved.length ? `${saved.length}명` : "비어 있음"}
            href={matches.length ? "/professors/pitch" : "/tutorial"}
            tone={saved.length ? "violet" : "neutral"}
          />
        </HubList>

        <HubUtilityLinks>
          <HubUtilityLink icon={Search} href="/professors/discover">조건을 직접 입력해 교수 찾기</HubUtilityLink>
          <HubUtilityLink icon={Settings2} href="/portfolio/manage">저장한 연결 관리</HubUtilityLink>
        </HubUtilityLinks>

        <p className={styles.trustNote}>
          <ShieldCheck size={17} aria-hidden="true" /> 학교 공식 정보만 연결 근거로 사용해요.
        </p>
      </div>
    </AppShell>
  );
}
