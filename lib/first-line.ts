/**
 * Q-02 첫마디 랜덤박스 문장 생성.
 *
 * 규칙:
 * - 상황(수업 후·이메일·오피스아워)마다 말을 여는 방식이 다릅니다.
 * - 목적이 같으면 묻는 내용은 같고 표현만 달라집니다.
 * - 교수의 성격·친밀도·면담 가능성은 추정하지 않습니다. 근거는 학생이 확인한 것만 씁니다.
 * - AI 호출 없이 만들기 때문에 오프라인에서도 동작합니다.
 */

export type FirstLineSituation = "after-class" | "email" | "office-hour";
export type FirstLinePurpose = "focus" | "background" | "extension";

export const SITUATIONS: Array<{ id: FirstLineSituation; label: string; hint: string }> = [
  { id: "after-class", label: "수업 후", hint: "짧게, 한 가지만 여쭙는 상황" },
  { id: "email", label: "이메일", hint: "맥락을 먼저 밝히고 요청하는 상황" },
  { id: "office-hour", label: "오피스아워", hint: "시간을 정해 찾아뵙는 상황" },
];

export const PURPOSES: Array<{ id: FirstLinePurpose; label: string }> = [
  { id: "focus", label: "연구 초점 파악" },
  { id: "background", label: "연구 배경 이해" },
  { id: "extension", label: "연구 확장 아이디어" },
];

/**
 * 받침 유무에 따라 조사를 고릅니다.
 *
 * 연결 근거는 학생이 직접 입력하므로 끝 글자를 알 수 없습니다.
 * 「제목」이나 (설명)처럼 따옴표·괄호로 끝나는 경우가 많아 마지막 한글 음절까지 거슬러 봅니다.
 */
export function particle(word: string, withBatchim: string, withoutBatchim: string): string {
  const syllables = word.match(/[가-힣]/g);
  if (!syllables || syllables.length === 0) return withoutBatchim;
  const last = syllables[syllables.length - 1].charCodeAt(0) - 0xac00;
  return last % 28 === 0 ? withoutBatchim : withBatchim;
}

/** 상황별 여는 말 3가지. 같은 상황 안에서 표현만 달라집니다. */
const OPENERS: Record<FirstLineSituation, string[]> = {
  "after-class": [
    "교수님, 수업 마치고 잠깐 여쭤도 될까요?",
    "교수님, 오늘 수업 내용과 이어지는 질문이 하나 있습니다.",
    "교수님, 짧게 한 가지만 여쭙고 싶습니다.",
  ],
  email: [
    "안녕하세요 교수님. 학부에서 연구를 준비하고 있는 학생입니다.",
    "교수님께 연구 방향을 여쭙고자 메일 드립니다.",
    "안녕하세요 교수님. 준비 중인 주제를 두고 조언을 구하고 싶어 연락드립니다.",
  ],
  "office-hour": [
    "교수님, 오피스아워에 찾아뵈어도 될지 여쭙습니다.",
    "교수님, 시간을 내주실 수 있다면 오피스아워에 들르고 싶습니다.",
    "교수님, 오피스아워에 20분 정도 여쭐 시간을 부탁드려도 될까요?",
  ],
};

/** 목적별 묻는 말 3가지. 묻는 내용은 같고 표현만 달라집니다. */
const ASKS: Record<FirstLinePurpose, Array<(evidence: string) => string>> = {
  focus: [
    (e) => `${e}${particle(e, "을", "를")} 읽었는데, 그 연구에서 가장 중요하게 고려하신 부분이 무엇이었는지 여쭤보고 싶습니다.`,
    (e) => `${e}에서 핵심 질문을 어떻게 좁히셨는지 듣고 싶습니다.`,
    (e) => `${e}의 여러 갈래 중에서 어디에 초점을 두기로 하셨는지 궁금합니다.`,
  ],
  background: [
    (e) => `${e}에 관심을 갖게 되신 계기나 배경에 대해 듣고 싶습니다.`,
    (e) => `${e}${particle(e, "을", "를")} 시작하시게 된 문제의식이 무엇이었는지 여쭙고 싶습니다.`,
    (e) => `${e}${particle(e, "이", "가")} 어떤 맥락에서 출발한 연구인지 이해하고 싶습니다.`,
  ],
  extension: [
    (e) => `${e}의 후속 연구나 확장 아이디어가 있다면 어떤 방향을 고려하고 계신지 궁금합니다.`,
    (e) => `${e}${particle(e, "을", "를")} 제 주제로 이어보려 할 때 먼저 확인해야 할 점이 무엇일지 여쭙고 싶습니다.`,
    (e) => `${e}에서 아직 다뤄지지 않은 질문이 있다면 무엇일지 듣고 싶습니다.`,
  ],
};

export type FirstLineInput = {
  situation: FirstLineSituation;
  purpose: FirstLinePurpose;
  /** 학생이 확인한 연결 근거. 비어 있으면 근거 없이 문장을 만들지 않습니다. */
  evidence: string;
  /** 다시 섞기를 누를 때마다 증가합니다. */
  shuffle: number;
};

export type FirstLineSentence = {
  id: string;
  text: string;
  purposeLabel: string;
};

const PURPOSE_LABEL = new Map(PURPOSES.map((item) => [item.id, item.label]));

export function buildFirstLines(input: FirstLineInput): FirstLineSentence[] {
  const evidence = input.evidence.trim();
  if (!evidence) return [];
  const openers = OPENERS[input.situation];
  const asks = ASKS[input.purpose];
  const purposeLabel = PURPOSE_LABEL.get(input.purpose) ?? "";

  return [0, 1, 2].map((slot) => {
    // 셔플은 여는 말과 묻는 말의 짝을 돌려 같은 목적의 다른 표현을 만듭니다.
    const openerIndex = (slot + input.shuffle) % openers.length;
    const askIndex = (slot + input.shuffle * 2) % asks.length;
    return {
      id: `${input.situation}-${input.purpose}-${slot}`,
      text: `${openers[openerIndex]} ${asks[askIndex](evidence)}`,
      purposeLabel,
    };
  });
}
