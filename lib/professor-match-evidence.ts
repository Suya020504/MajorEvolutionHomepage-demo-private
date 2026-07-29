import type { ProfessorMatchTopic } from "@/lib/professor-domain";

/**
 * 교수의 공식 연구분야·논문과 직접 대조할 입력만 반환합니다.
 * 진로 고민·학년·만남 방식·자유 맥락은 면담 질문 개인화에만 사용합니다.
 */
export function buildProfessorEvidenceText(topic: ProfessorMatchTopic): string {
  return [
    topic.title,
    topic.question,
    topic.methodDetail,
    topic.major,
    topic.secondaryMajor,
    ...topic.interests,
    ...(topic.careerInterests ?? []),
    ...topic.methods,
  ].filter(Boolean).join(" ");
}
