import type { ResearchTopic } from "@/data/research-mvp";
import type {
  ProfessorMatchResponse,
  ProfessorMatchTopic,
} from "@/lib/professor-domain";
import {
  postProfessorMatch,
  type ProfessorMatchHttpOptions,
} from "@/lib/professor-match-http";

export type ProfessorDiscoveryContext = {
  university: string;
  goal: string;
  major: string;
  interests: string[];
  topic: string;
  careerGoal: string;
  meetingSituation: string;
  additionalContext: string;
};

export type ProfessorDiscoveryOptions = ProfessorMatchHttpOptions & {
  savedTopic?: ResearchTopic | null;
};

export function isDankookUniversity(value: string): boolean {
  const normalized = value.toLocaleLowerCase("ko-KR").replace(/\s+/g, "");
  return new Set([
    "단국대",
    "단국대학교",
    "dankook",
    "dankookuniversity",
  ]).has(normalized);
}

export function discoveryContextToMatchTopic(
  context: ProfessorDiscoveryContext,
  savedTopic?: ResearchTopic | null,
): ProfessorMatchTopic {
  const interests = [...new Set(context.interests.map((item) => item.trim()).filter(Boolean))]
    .slice(0, 3);
  const topic = context.topic.trim() || savedTopic?.title.trim() || interests[0] || "";
  const careerGoal = context.careerGoal.trim();
  const meetingSituation = context.meetingSituation.trim();
  const additionalContext = context.additionalContext.trim();
  const goal = context.goal.trim();

  return {
    id: savedTopic?.id ?? `discovery:${[context.major, topic, goal].join(":")}`,
    title: topic,
    question: savedTopic?.question
      ?? `${topic}을(를) ${goal || "전공 탐색"} 관점에서 어떻게 발전시킬 수 있을까?`,
    methodDetail: savedTopic?.methodDetail ?? "",
    scope: [
      savedTopic?.scope,
      careerGoal && `진로 목표: ${careerGoal}`,
      meetingSituation && `만남 상황: ${meetingSituation}`,
      additionalContext,
    ].filter(Boolean).join(" · "),
    // 교수 찾기 화면에서 방금 확인한 관심 분야를 그대로 사용합니다.
    // 저장된 연구주제를 앞에 합치면 API의 3개 제한에서 새 입력이 잘릴 수 있습니다.
    interests,
    methods: savedTopic?.methods ?? [],
    major: context.major.trim(),
    university: context.university.trim(),
    goal,
    careerGoal,
    meetingSituation,
    additionalContext,
  };
}

export async function requestProfessorDiscoveryMatches(
  context: ProfessorDiscoveryContext,
  options: ProfessorDiscoveryOptions = {},
): Promise<ProfessorMatchResponse> {
  const topic = discoveryContextToMatchTopic(context, options.savedTopic);
  return postProfessorMatch(topic, context.university, options);
}
