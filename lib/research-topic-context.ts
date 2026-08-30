import type { ResearchTopic } from "@/data/research-mvp";
import type { RecommendResult } from "@/lib/recommend";
import type { ProfessorMatchTopic } from "@/lib/professor-domain";

type TopicState = {
  result: RecommendResult | null;
  selectedTopicId: string | null;
  professorDiscoveryTopic: ProfessorMatchTopic | null;
};

/**
 * 만들다에서 고른 연구주제와 튜토리얼에서 정리한 고민을 하나의 대화 맥락으로 읽습니다.
 *
 * 튜토리얼 이용자는 연구주제를 만들지 않아도 교수 연결과 첫 대화 준비를 시작할 수 있습니다.
 * 이때 새 사실을 만들어내지 않고, 학생이 확인한 입력만 ResearchTopic 계약으로 옮깁니다.
 */
export function resolveJourneyTopic({
  result,
  selectedTopicId,
  professorDiscoveryTopic,
}: TopicState): ResearchTopic | null {
  // 학생이 현재 ‘찾다’에서 입력한 맥락은 과거 프로젝트 선택보다 최신 첫 대화의 기준입니다.
  if (professorDiscoveryTopic) {
    const title = professorDiscoveryTopic.title.trim()
      || professorDiscoveryTopic.question.trim();
    if (title) {
      return {
        id: professorDiscoveryTopic.id,
        pairId: `student-context:${professorDiscoveryTopic.id}`,
        variant: "안전 축소형",
        title,
        majors: professorDiscoveryTopic.major ? [professorDiscoveryTopic.major] : [],
        interests: professorDiscoveryTopic.interests,
        methods: professorDiscoveryTopic.methods,
        minWeeks: 4,
        goodDataAccess: ["아직 모름"],
        avoidTags: [],
        problem: professorDiscoveryTopic.additionalContext || undefined,
        question: professorDiscoveryTopic.question.trim() || title,
        reason: "튜토리얼에서 학생이 확인한 고민을 첫 대화 맥락으로 사용합니다.",
        userConfirmed: [
          professorDiscoveryTopic.major,
          ...professorDiscoveryTopic.interests,
          ...professorDiscoveryTopic.careerConcerns ?? [],
        ].filter(Boolean),
        aiProposed: [],
        dataOptions: [],
        methodDetail: professorDiscoveryTopic.methodDetail.trim()
          || "교수님과 대화하며 필요한 정보와 다음 행동을 확인",
        scope: professorDiscoveryTopic.scope.trim() || "첫 대화에서 확인할 범위",
        uncertainties: [
          "교수님의 지도·면담 가능 여부는 공식 안내와 직접 연락으로 확인해야 합니다.",
        ],
        firstAction: "선택한 교수님의 공식 정보를 확인하고 첫 질문을 준비하기",
        evidence: [],
      };
    }
  }

  if (result && selectedTopicId) {
    if (result.kind === "ok") {
      const selected = result.candidates.find(
        (candidate) => candidate.topic.id === selectedTopicId,
      );
      if (selected) return selected.topic;
    }
    if (
      result.kind === "insufficient"
      && result.candidate.topic.id === selectedTopicId
    ) {
      return result.candidate.topic;
    }
  }

  return null;
}
