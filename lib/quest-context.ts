"use client";

import { useMemo } from "react";
import type { ResearchTopic } from "@/data/research-mvp";
import type { ProfessorMatch } from "@/lib/professor-domain";
import { useResearchStore } from "@/store/research-store";

export type QuestContext = {
  topic: ResearchTopic | null;
  match: ProfessorMatch | null;
};

/**
 * 퀘스트 도구가 공유하는 맥락(선택한 연구주제 + 연결한 교수).
 *
 * 맥락이 없으면 null을 돌려주고, 화면은 문장을 지어내는 대신 앞 단계로 안내합니다.
 */
export function useQuestContext(): QuestContext {
  const result = useResearchStore((state) => state.result);
  const selectedTopicId = useResearchStore((state) => state.selectedTopicId);
  const matches = useResearchStore((state) => state.professorMatches);
  const selectedProfessorId = useResearchStore((state) => state.selectedProfessorId);

  return useMemo(() => {
    let topic: ResearchTopic | null = null;
    if (result && selectedTopicId) {
      if (result.kind === "ok") {
        topic = result.candidates.find((c) => c.topic.id === selectedTopicId)?.topic ?? null;
      } else if (result.kind === "insufficient" && result.candidate.topic.id === selectedTopicId) {
        topic = result.candidate.topic;
      }
    }
    const match = matches.find((item) => item.professor.id === selectedProfessorId) ?? null;
    return { topic, match };
  }, [result, selectedTopicId, matches, selectedProfessorId]);
}

/**
 * 학생 입력과 교수를 잇는 근거 문장.
 * 공식 프로필에서 확인한 것만 씁니다. 성격이나 친밀도는 추정하지 않습니다.
 */
export function evidencePhrase(match: ProfessorMatch | null): string {
  if (!match) return "";
  const publication = match.professor.publications.find((item) =>
    match.evidenceIds.includes(item.id));
  if (publication) return `「${publication.title}」`;
  const field = match.matchedTerms[0] ?? match.professor.researchFields[0];
  return field ? `${field} 연구분야` : "공식 프로필에 소개된 연구";
}
