import type { ProjectExecutionDraft } from "@/lib/project-execution";

export type ProjectMeetingDemoPatch = Pick<
  ProjectExecutionDraft,
  "meetingGoal" | "questions" | "materials" | "reflection"
>;

/** 데모 전용 프로젝트 자문 초안. 화면의 기존 자동 저장 흐름을 통해서만 저장됩니다. */
export function createProjectMeetingDemoPatch(): ProjectMeetingDemoPatch {
  return {
    meetingGoal: "거래자료와 사진 특징을 함께 사용할 때 가격 예측 오차가 실제로 줄어드는지 검증하고, 한 학기 안에 가능한 연구 범위를 확정한다.",
    questions: [
      "거래가격·거래량만 사용한 기준 모형과 이미지 특징을 결합한 모형을 어떤 지표로 비교하는 게 적절할까요?",
      "품목별 이미지 30건 정도의 소규모 표본으로도 의미 있는 탐색 결과를 만들 수 있을까요?",
      "사진 촬영 환경과 품질 등급 차이가 가격 예측에 미치는 영향을 어떻게 통제하면 좋을까요?",
    ],
    materials: {
      "project-brief": true,
      evidence: true,
      "sample-data": true,
      "decision-log": true,
    },
    reflection: "거래자료만 사용한 기준 모형과 이미지 특징을 결합한 모형을 분리해 비교하고, 품목 2개·이미지 30건의 소규모 검증으로 범위를 줄이라는 조언을 반영했습니다.",
  };
}
