export type PaperGlossaryItem = {
  term: string;
  meaning: string;
};

export type PaperAnalysisResult = {
  title: string;
  oneLine: string;
  /**
   * 3줄 요약. 한 줄 요약은 논문의 성격만 알려주고 5장 카드는 다 읽어야 하므로,
   * 그 사이를 메운다. 순서는 고정한다.
   *   [0] 무엇을 왜 했는가  [1] 무엇을 발견했는가  [2] 어디까지 믿을 수 있는가
   * 세 번째 줄을 비우지 않는 것이 중요하다. 한계 없이 요약하면 학생이 확인
   * 범위를 모른 채 교수님께 말하게 된다.
   */
  threeLine: [string, string, string];
  background: string;
  question: string;
  methods: string[];
  findings: string[];
  limitations: string[];
  glossary: PaperGlossaryItem[];
  nextQuestions: string[];
  generatedAt: string;
  model: string;
};

export type PaperAnalysisRequest = {
  title: string;
  content: string;
};

