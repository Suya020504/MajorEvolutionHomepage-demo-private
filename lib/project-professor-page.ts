import type { ProfessorMatch, ProfessorMatchRole } from "@/lib/professor-domain";

export const PROJECT_PROFESSOR_ROLE_META = {
  TOPIC: {
    label: "연구주제 멘토",
    focus: "연구질문과 범위",
    consultation: "연구질문에서 먼저 좁혀야 할 범위와 꼭 확인할 배경은 무엇인지 자문해 보세요.",
  },
  METHOD: {
    label: "연구방법 멘토",
    focus: "데이터와 분석 방법",
    consultation: "현재 구할 수 있는 데이터와 방법으로 질문을 검증할 수 있는지 자문해 보세요.",
  },
  CONTEXT: {
    label: "응용·확장 멘토",
    focus: "현장 적용과 전공 확장",
    consultation: "프로젝트를 어떤 분야와 연결하면 의미 있는 결과로 확장할 수 있는지 자문해 보세요.",
  },
} as const satisfies Record<ProfessorMatchRole, {
  label: string;
  focus: string;
  consultation: string;
}>;

const ROLE_ORDER: ProfessorMatchRole[] = ["TOPIC", "METHOD", "CONTEXT"];

export function buildProjectProfessorRoleSlots(matches: ProfessorMatch[]) {
  return ROLE_ORDER.map((role) => ({
    role,
    ...PROJECT_PROFESSOR_ROLE_META[role],
    match: matches.find((match) => match.role === role) ?? null,
  }));
}

export function projectProfessorNextAction(selectedProfessorId: string | null) {
  if (!selectedProfessorId) {
    return {
      label: "면담할 교수님을 선택해 주세요",
      href: null,
      disabled: true,
    } as const;
  }
  return {
    label: "선택한 교수님과 프로젝트 시작하기",
    href: "/project-execution",
    disabled: false,
  } as const;
}
