import type { ResearchTopic } from "@/data/research-mvp";
import type {
  ProfessorMatchResponse,
  ProfessorMatchTopic,
} from "@/lib/professor-domain";

type ErrorPayload = { error?: string };

export type MatchOptions = {
  /** 학생이 거절한 교수. 다시 찾을 때 후보에서 제외합니다. */
  excludeIds?: string[];
};

/** 학생이 직접 입력한 맥락. 찾다 화면의 `내 맥락 입력` 패널이 씁니다. */
export type ProfessorSearchContext = {
  major: string;
  interest: string;
  career: string;
  topic: string;
};

export function contextToMatchTopic(context: ProfessorSearchContext): ProfessorMatchTopic {
  const topic = context.topic.trim();
  const interest = context.interest.trim();
  const career = context.career.trim();
  return {
    // 학생 입력 기반 임시 주제라 저장된 주제 ID와 겹치지 않게 접두사를 붙입니다.
    id: `context:${topic || interest}`,
    title: topic || interest,
    question: topic
      ? `${topic}을(를) ${career || "내 진로"} 관점에서 어떻게 다룰 수 있을까?`
      : `${interest}을(를) ${career || "내 진로"} 관점에서 어떻게 다룰 수 있을까?`,
    methodDetail: "",
    scope: career,
    interests: [interest, topic].filter(Boolean),
    methods: [],
    major: context.major.trim(),
  };
}

async function postMatch(
  topic: ProfessorMatchTopic,
  options: MatchOptions,
): Promise<ProfessorMatchResponse> {
  const response = await fetch("/api/professors/match", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic, excludeIds: options.excludeIds ?? [] }),
  });
  const data = await response.json() as ProfessorMatchResponse | ErrorPayload;
  if (!response.ok) {
    throw new Error("error" in data && data.error
      ? data.error
      : "공식 교수 데이터를 연결하지 못했습니다.");
  }
  return data as ProfessorMatchResponse;
}

/** 저장된 연구주제로 연결합니다. (만들다 → 찾다 경로) */
export async function requestProfessorMatches(
  topic: ResearchTopic,
  major: string,
  options: MatchOptions = {},
): Promise<ProfessorMatchResponse> {
  return postMatch({
    id: topic.id,
    title: topic.title,
    question: topic.question,
    methodDetail: topic.methodDetail,
    scope: topic.scope,
    interests: topic.interests,
    methods: topic.methods,
    major,
  }, options);
}

/** 학생이 직접 입력한 맥락으로 연결합니다. (찾다에서 바로 시작) */
export async function requestProfessorMatchesByContext(
  context: ProfessorSearchContext,
  options: MatchOptions = {},
): Promise<ProfessorMatchResponse> {
  return postMatch(contextToMatchTopic(context), options);
}
