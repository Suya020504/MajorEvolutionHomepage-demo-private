import type { ResearchTopic } from "@/data/research-mvp";
import type {
  ProfessorMatchResponse,
  ProfessorMatchTopic,
} from "@/lib/professor-domain";
import {
  postProfessorMatch,
  type ProfessorMatchHttpOptions,
} from "@/lib/professor-match-http";

export type MatchOptions = ProfessorMatchHttpOptions;

/** 학생이 직접 입력한 맥락. 찾다 화면의 `내 맥락 입력` 패널이 씁니다. */
export type ProfessorSearchContext = {
  university: string;
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
    university: context.university.trim(),
  };
}

async function postMatch(
  topic: ProfessorMatchTopic,
  university: string,
  options: MatchOptions,
): Promise<ProfessorMatchResponse> {
  return postProfessorMatch(topic, university, options);
}

/** 저장된 연구주제로 연결합니다. (만들다 → 찾다 경로) */
export async function requestProfessorMatches(
  topic: ResearchTopic,
  major: string,
  university: string,
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
    university,
  }, university, options);
}

/** 학생이 직접 입력한 맥락으로 연결합니다. (찾다에서 바로 시작) */
export async function requestProfessorMatchesByContext(
  context: ProfessorSearchContext,
  options: MatchOptions = {},
): Promise<ProfessorMatchResponse> {
  return postMatch(contextToMatchTopic(context), context.university, options);
}
