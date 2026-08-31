import type { ProfessorMentorLoopEntry } from "@/lib/professor-domain";

export const MENTOR_LOOP_DEMO_FEEDBACK =
  "가격 예측 정확도만 높이기보다 거래자료와 사진 정보가 각각 어떤 설명력을 더하는지 비교해 보세요.";

function addSevenDays(date: string, now: Date) {
  const base = /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? new Date(`${date}T00:00:00.000Z`)
    : new Date(now);
  base.setUTCDate(base.getUTCDate() + 7);
  return base.toISOString().slice(0, 10);
}

/**
 * 시연 중 세 단계를 빠르게 살펴볼 수 있는 임시 초안입니다.
 * 저장소에는 쓰지 않으며 화면의 마지막 저장 버튼을 눌러야 실제 기록이 됩니다.
 */
export function createMentorLoopDemoEntry(
  current: ProfessorMentorLoopEntry,
  now = new Date(),
): ProfessorMentorLoopEntry {
  const meetingDate = current.meetingDate || now.toISOString().slice(0, 10);
  return {
    ...current,
    meetingDate,
    feedbackSummary: MENTOR_LOOP_DEMO_FEEDBACK,
    recommendedResources: "농산물유통정보(KAMIS) 가격 데이터와 품질·등급 기준 자료",
    cautionPoint: "사진 촬영 환경과 품목별 표본 수 차이가 결과를 왜곡하지 않는지 먼저 확인하기",
    commitment: "가격·거래량 변수 정의표와 이미지 표본 30건을 정리해 비교 기준을 만들겠습니다.",
    after: {
      question: "농산물 거래자료에 이미지 특징을 결합했을 때 품목별 가격 예측 오차가 얼마나 줄어드는가?",
      methodDetail: "거래가격·거래량 기반 기준 모형과 이미지 특징을 추가한 모형의 MAE와 변수 중요도를 비교",
      scope: "대표 농산물 2개 품목, 최근 1개 연도 공개 거래자료와 품목별 이미지 30건의 소규모 검증",
    },
    sevenDayActions: [
      "1~2일차: KAMIS에서 두 품목의 가격·거래량 표본과 변수 정의를 정리하기",
      "3~5일차: 품목별 이미지 30건을 모아 촬영 조건과 품질 특징을 표로 만들기",
      "6~7일차: 기준 모형과 이미지 결합 모형의 오차를 비교해 한 장으로 요약하기",
    ],
    nextCheckAt: addSevenDays(meetingDate, now),
    followUpEmail: "",
    updatedAt: now.toISOString(),
  };
}
