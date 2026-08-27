/**
 * 논문 요약 기반 컨택 메일 계약.
 *
 * 3분 카드로 정리한 논문 요약을 근거로 교수님께 보낼 첫 연락 메일 초안을 만듭니다.
 * 이 서비스의 원칙을 그대로 따릅니다.
 *
 * - AI는 초안만 씁니다. 발송은 학생이 직접 합니다.
 * - 요약에 없는 내용을 지어내지 않습니다. 메일에 쓴 근거를 groundedOn에 남겨
 *   학생이 사실 여부를 눈으로 확인할 수 있게 합니다.
 * - 교수 이메일 주소는 요청에도 응답에도 포함하지 않습니다. 저장하지도 않습니다.
 */

export type ContactEmailPaperSummary = {
  /** 3분 카드의 한 줄 요약 */
  oneLine: string;
  background: string;
  question: string;
  methods: string[];
  findings: string[];
  limitations: string[];
  nextQuestions: string[];
};

export type ContactEmailStudent = {
  /** 비워 두면 메일에서 이름 자리를 비워 둡니다. 추측해 채우지 않습니다. */
  name?: string;
  school?: string;
  major?: string;
  grade?: string;
  interests?: string[];
};

export type ContactEmailRequest = {
  professorName: string;
  professorDepartment?: string;
  paperTitle: string;
  paperPublishedDate?: string;
  paperType?: string;
  summary: ContactEmailPaperSummary;
  student?: ContactEmailStudent;
  /** 학생이 이번 연락으로 얻고 싶은 것. 비워 두면 면담 요청을 기본으로 씁니다. */
  goal?: string;
};

export type ContactEmailResult = {
  subject: string;
  /** 학생이 그대로 검토·수정할 수 있는 본문 전문 */
  body: string;
  /** 메일이 근거로 삼은 요약 문장. 학생이 사실 확인용으로 대조합니다. */
  groundedOn: string[];
  /** 보내기 전에 학생이 직접 확인해야 할 항목 */
  beforeSending: string[];
  generatedAt: string;
  model: string;
};

export const CONTACT_EMAIL_GOAL_MAX = 200;
export const CONTACT_EMAIL_SUMMARY_ITEM_MAX = 600;
