import "server-only";

import dkuRuntime from "@/data/professors/runtime/dku-professors.json";
import { PROFESSOR_MATCH_POLICY } from "@/lib/professor-domain";
import type {
  OfficialProfessor,
  OfficialPublication,
  ProfessorCoverageGap,
  ProfessorDataStatus,
  ProfessorMatch,
  ProfessorMatchDecisionBasis,
  ProfessorMatchResponse,
  ProfessorMatchRole,
  ProfessorMatchStrength,
  ProfessorMatchTopic,
} from "@/lib/professor-domain";

type RawPublication = {
  id?: string;
  title: string;
  publication_type: string;
  published_date: string | null;
  doi: string | null;
  kci_id: string | null;
  official_profile_url: string;
};

type RawProfessor = {
  id: string;
  university: string;
  college: string;
  department: string;
  departments?: string[];
  association_statuses?: string[];
  name: string;
  title: string;
  research_fields: string[];
  publications: RawPublication[];
  publication_count?: number;
  official_profile_url: string;
  source_url: string;
  collected_at: string;
  status: ProfessorDataStatus;
  research_fields_status: ProfessorDataStatus;
  publications_status: ProfessorDataStatus;
  failure_reason: string | null;
};

type RawDataset = {
  records: RawProfessor[];
  scope_status: "SAMPLE" | "PARTIAL" | "COMPLETE";
  official_record_count: number;
  note: string;
  coverage_gaps?: Array<{
    university?: string;
    department?: string;
    status: ProfessorDataStatus;
    source_url: string;
    reason: string;
    scope_impact: string;
  }>;
};

const dataset = dkuRuntime as unknown as RawDataset;

const matchingConcepts: Array<{
  label: string;
  topicTerms: string[];
  evidenceTerms: string[];
  role: ProfessorMatchRole;
}> = [
  {
    label: "AI·텍스트 분석",
    topicTerms: ["ai", "인공지능", "머신러닝", "분류", "예측", "텍스트 분석"],
    evidenceTerms: [
      "ai",
      "인공지능",
      "머신러닝",
      "딥러닝",
      "자연어",
      "텍스트",
      "데이터마이닝",
      "data mining",
    ],
    role: "METHOD",
  },
  {
    label: "소비자 가치·선택",
    topicTerms: ["소비자", "지불의사", "가격 프리미엄", "선택실험", "구매", "설문"],
    evidenceTerms: [
      "소비자",
      "지불의사",
      "가치평가",
      "비시장재화",
      "구매행태",
      "수요",
      "마케팅",
      "선택실험",
    ],
    role: "TOPIC",
  },
  {
    label: "농식품·식품 시장",
    topicTerms: ["농식품", "식품", "농산물", "푸드", "먹거리"],
    evidenceTerms: [
      "농식품",
      "식품",
      "농산물",
      "농업",
      "먹거리",
      "로컬푸드",
      "식품산업",
    ],
    role: "TOPIC",
  },
  {
    label: "가격·시장",
    topicTerms: ["가격", "시장", "급등", "수급", "유통", "무역"],
    evidenceTerms: ["가격", "시장", "수급", "유통", "무역", "경제", "마케팅"],
    role: "TOPIC",
  },
  {
    label: "친환경·지속가능성",
    topicTerms: ["친환경", "esg", "지속가능", "그린워싱", "환경 표시", "탄소"],
    evidenceTerms: ["친환경", "esg", "지속가능", "환경", "녹색", "탄소", "자원순환"],
    role: "CONTEXT",
  },
  {
    label: "정책·행정",
    topicTerms: ["정책", "공공", "규제", "정부", "제도"],
    evidenceTerms: ["정책", "공공", "규제", "정부", "행정", "제도"],
    role: "CONTEXT",
  },
  {
    label: "시계열·예측",
    topicTerms: ["시계열", "조기경보", "예측", "추세", "패널"],
    evidenceTerms: ["시계열", "예측", "forecast", "패널", "계량", "회귀"],
    role: "METHOD",
  },
  {
    label: "설문·통계 분석",
    topicTerms: ["설문", "회귀", "통계", "실험", "상관"],
    evidenceTerms: ["설문", "회귀", "통계", "실험", "계량", "조사"],
    role: "METHOD",
  },
  {
    label: "문학·서사",
    topicTerms: ["고전", "소설", "설화", "서사", "문학", "시가", "시조", "한시"],
    evidenceTerms: ["고전", "소설", "설화", "서사", "문학", "시가", "시조", "한시"],
    role: "TOPIC",
  },
];

const genericTerms = new Set([
  "연구",
  "분석",
  "데이터",
  "기반",
  "활용",
  "관련",
  "영향",
  "효과",
  "방법",
  "모델",
  "설계",
  "탐색",
  "관계",
  "경제",
  "학과",
  "전공",
  "국내",
  "분야",
  "과정",
  "대한",
  "어떤",
  "있는가",
]);

function normalize(value: string): string {
  return value.toLocaleLowerCase("ko-KR").replace(/\s+/g, " ").trim();
}

function meaningfulTerms(value: string): string[] {
  return normalize(value)
    .split(/[^0-9a-z가-힣]+/u)
    .map((term) => term.trim())
    .filter((term) => term.length >= 2);
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function containsTerm(text: string, term: string): boolean {
  const normalizedText = normalize(text);
  const normalizedTerm = normalize(term);
  if (!normalizedTerm) return false;
  if (/^[a-z0-9]+$/.test(normalizedTerm) && normalizedTerm.length <= 3) {
    const escaped = normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, "i").test(
      normalizedText,
    );
  }
  return normalizedText.includes(normalizedTerm);
}

function toPublication(raw: RawPublication, professorId: string, index: number): OfficialPublication {
  return {
    id: raw.id ?? `publication:${professorId}:${index + 1}`,
    title: raw.title,
    publicationType: raw.publication_type,
    publishedDate: raw.published_date,
    doi: raw.doi,
    kciId: raw.kci_id,
    officialProfileUrl: raw.official_profile_url,
  };
}

function toProfessor(raw: RawProfessor): OfficialProfessor {
  return {
    id: raw.id,
    university: raw.university,
    college: raw.college,
    department: raw.department,
    departments: raw.departments ?? [raw.department],
    associationStatuses: raw.association_statuses ?? [],
    name: raw.name,
    title: raw.title,
    researchFields: raw.research_fields,
    publications: raw.publications.map((publication, index) =>
      toPublication(publication, raw.id, index)),
    publicationCount: raw.publication_count ?? raw.publications.length,
    officialProfileUrl: raw.official_profile_url,
    sourceUrl: raw.source_url,
    collectedAt: raw.collected_at,
    status: raw.status,
    researchFieldsStatus: raw.research_fields_status,
    publicationsStatus: raw.publications_status,
    failureReason: raw.failure_reason,
    profileEvidenceId: `profile:${raw.id}`,
  };
}

const officialProfessors = dataset.records.map(toProfessor);
const professorById = new Map(officialProfessors.map((professor) => [professor.id, professor]));

const coverageGaps: ProfessorCoverageGap[] = (dataset.coverage_gaps ?? []).map((gap) => ({
    university: gap.university ?? "단국대학교",
    department: gap.department,
    status: gap.status,
    reason: gap.reason,
    scopeImpact: gap.scope_impact,
    sourceUrl: gap.source_url,
  }));

function publicationEvidence(
  professor: OfficialProfessor,
  topicTerms: string[],
): OfficialPublication | undefined {
  return professor.publications
    .filter((publication) => {
      const title = normalize(publication.title);
      return topicTerms.some((term) => term.length >= 2 && containsTerm(title, term));
    })
    .sort((left, right) => left.id.localeCompare(right.id))[0];
}

type EvaluatedProfessor = {
  match: ProfessorMatch;
  hasRelevantEvidence: boolean;
  matchedConcepts: Set<string>;
};

const rolePreference: ProfessorMatchRole[] = ["TOPIC", "METHOD", "CONTEXT"];
const conceptsForRole = (role: ProfessorMatchRole) =>
  matchingConcepts.filter((concept) => concept.role === role);

function compareDecisionBasis(
  left: ProfessorMatchDecisionBasis,
  right: ProfessorMatchDecisionBasis,
): number {
  const rules: Array<(basis: ProfessorMatchDecisionBasis) => boolean> = [
    (basis) => basis.roleMatches.topic,
    (basis) => basis.roleMatches.method,
    (basis) => basis.roleMatches.context,
    (basis) => basis.sources.matchedPublication,
    (basis) => basis.sources.researchFields,
    (basis) => basis.sources.officialProfile,
  ];

  for (const rule of rules) {
    const leftMatches = rule(left);
    const rightMatches = rule(right);
    if (leftMatches !== rightMatches) return leftMatches ? -1 : 1;
  }
  return 0;
}

function compareEvaluatedProfessors(
  left: EvaluatedProfessor,
  right: EvaluatedProfessor,
): number {
  for (const concept of conceptsForRole("TOPIC")) {
    const leftMatches = left.matchedConcepts.has(concept.label);
    const rightMatches = right.matchedConcepts.has(concept.label);
    if (leftMatches !== rightMatches) return leftMatches ? -1 : 1;
  }
  if (
    left.match.decisionBasis.departmentMatchesMajor
    !== right.match.decisionBasis.departmentMatchesMajor
  ) {
    return left.match.decisionBasis.departmentMatchesMajor ? -1 : 1;
  }
  for (const role of ["METHOD", "CONTEXT"] as const) {
    for (const concept of conceptsForRole(role)) {
      const leftMatches = left.matchedConcepts.has(concept.label);
      const rightMatches = right.matchedConcepts.has(concept.label);
      if (leftMatches !== rightMatches) return leftMatches ? -1 : 1;
    }
  }
  return compareDecisionBasis(left.match.decisionBasis, right.match.decisionBasis)
    || left.match.professor.id.localeCompare(right.match.professor.id);
}

function complementaryRoles(primaryRole: ProfessorMatchRole): ProfessorMatchRole[] {
  if (primaryRole === "TOPIC") return ["METHOD", "CONTEXT"];
  if (primaryRole === "METHOD") return ["TOPIC", "CONTEXT"];
  return ["TOPIC", "METHOD"];
}

function evaluateProfessor(
  professor: OfficialProfessor,
  topic: ProfessorMatchTopic,
): EvaluatedProfessor {
  const topicText = normalize([
    topic.title,
    topic.question,
    topic.methodDetail,
    topic.scope,
    topic.major,
    ...topic.interests,
    ...topic.methods,
  ].join(" "));
  const topicTerms = meaningfulTerms(topicText);
  const evidenceTopicTerms = topicTerms.filter((term) => !genericTerms.has(term));
  const fieldTerms = unique(professor.researchFields.flatMap(meaningfulTerms));
  const directTerms = fieldTerms.filter(
    (term) => !genericTerms.has(term) && containsTerm(topicText, term),
  );
  const professorEvidence = normalize([
    professor.department,
    ...professor.researchFields,
    ...professor.publications.map((publication) => publication.title),
  ].join(" "));
  const conceptMatches = matchingConcepts
    .map((concept) => {
      const topicHits = concept.topicTerms.filter((term) =>
        containsTerm(topicText, term));
      const evidenceHits = concept.evidenceTerms.filter((term) =>
        containsTerm(professorEvidence, term));
      return {
        ...concept,
        topicHits,
        evidenceHits,
      };
    })
    .filter((concept) => concept.topicHits.length > 0 && concept.evidenceHits.length > 0);
  const roleMatches = new Set<ProfessorMatchRole>(
    conceptMatches.map((concept) => concept.role),
  );
  const methodDirectTerms = directTerms.filter((term) =>
    topic.methods.some((method) => containsTerm(method, term)));
  if (directTerms.length > 0) {
    roleMatches.add(methodDirectTerms.length > 0 ? "METHOD" : "TOPIC");
  }
  const hasRelevantEvidence = roleMatches.size > 0;
  const publication = hasRelevantEvidence
    ? publicationEvidence(professor, evidenceTopicTerms)
    : undefined;
  const departmentMatchesMajor = Boolean(
    topic.major
    && professor.departments.some((department) =>
      containsTerm(department, topic.major)),
  );

  let role: ProfessorMatchRole = "CONTEXT";
  let strength: ProfessorMatchStrength = "LIMITED";
  let reason = `현재 수집된 공식 프로필에서 이 주제와 직접 일치하는 근거는 찾지 못했습니다. 공식 프로필의 ‘${professor.researchFields[0] ?? "연구분야 미기재"}’ 관점으로 범위를 검토할 대안 후보입니다.`;
  const matchedTerms: string[] = [];

  if (conceptMatches.length > 0) {
    const preferredRole = rolePreference.find((candidateRole) =>
      roleMatches.has(candidateRole));
    const best = conceptMatches.find((concept) => concept.role === preferredRole)
      ?? conceptMatches[0];
    role = best.role;
    matchedTerms.push(...best.evidenceHits.slice(0, 3));
    reason = `공식 프로필의 ‘${best.evidenceHits.slice(0, 3).join(", ")}’ 근거가 이 주제의 ${best.label} ${role === "METHOD" ? "방법" : role === "TOPIC" ? "내용" : "맥락"}과 연결됩니다.`;
  } else if (directTerms.length > 0) {
    role = methodDirectTerms.length > 0 ? "METHOD" : "TOPIC";
    matchedTerms.push(...directTerms.slice(0, 3));
    reason = `공식 프로필 연구분야의 ‘${matchedTerms.join(", ")}’가 선택한 주제의 표현과 직접 연결됩니다.`;
  }

  if (publication) {
    matchedTerms.push(
      ...topicTerms
        .filter((term) => !genericTerms.has(term))
        .filter((term) => containsTerm(publication.title, term))
        .slice(0, 2),
    );
  }
  strength = directTerms.length > 0 || publication
    ? "DIRECT"
    : hasRelevantEvidence
      ? "RELATED"
      : "LIMITED";

  const evidenceIds = [professor.profileEvidenceId];
  if (publication) evidenceIds.push(publication.id);
  const decisionBasis: ProfessorMatchDecisionBasis = {
    matchedConcepts: conceptMatches.map((concept) => concept.label),
    departmentMatchesMajor,
    roleMatches: {
      topic: roleMatches.has("TOPIC"),
      method: roleMatches.has("METHOD"),
      context: roleMatches.has("CONTEXT"),
    },
    sources: {
      officialProfile: professor.status === "FOUND"
        && Boolean(professor.officialProfileUrl)
        && Boolean(professor.sourceUrl),
      researchFields: professor.researchFieldsStatus === "FOUND"
        && professor.researchFields.length > 0,
      matchedPublication: Boolean(publication),
    },
  };

  return {
    match: {
      professor,
      role,
      strength,
      reason,
      evidenceIds,
      matchedTerms: unique(matchedTerms),
      doesNotEstablish: [
        "교수의 면담·지도·모집 가능 여부",
        "선택 주제에 대한 교수의 참여 의사",
        strength === "LIMITED"
          ? "현재 공식 프로필 범위에서의 직접적인 연구주제 적합성"
          : "추천 결과의 우열이나 성공 가능성",
      ],
      decisionBasis,
    },
    hasRelevantEvidence,
    matchedConcepts: new Set(conceptMatches.map((concept) => concept.label)),
  };
}

export function getOfficialProfessorById(id: string): OfficialProfessor | null {
  return professorById.get(id) ?? null;
}

export function getOfficialProfessors(): OfficialProfessor[] {
  return officialProfessors;
}

export function matchOfficialProfessors(
  topic: ProfessorMatchTopic,
  /** 학생이 거절한 교수. 다시 찾을 때 후보에서 제외합니다. */
  options: { excludeIds?: string[] } = {},
): ProfessorMatchResponse {
  const excluded = new Set(options.excludeIds ?? []);
  const evaluated = officialProfessors
    .filter((professor) => !excluded.has(professor.id))
    .map((professor) => evaluateProfessor(professor, topic))
    .sort(compareEvaluatedProfessors);
  const primary =
    evaluated.find((candidate) => candidate.hasRelevantEvidence) ??
    evaluated[0];
  const alternative =
    complementaryRoles(primary?.match.role ?? "TOPIC")
      .map((role) =>
        evaluated.find(
          (candidate) =>
            candidate.match.professor.id !== primary?.match.professor.id &&
            candidate.match.role === role &&
            candidate.hasRelevantEvidence,
        ))
      .find((candidate): candidate is EvaluatedProfessor => Boolean(candidate)) ??
    evaluated.find(
      (candidate) =>
        candidate.match.professor.id !== primary?.match.professor.id &&
        candidate.hasRelevantEvidence,
    ) ??
    evaluated.find(
      (candidate) =>
        candidate.match.professor.id !== primary?.match.professor.id,
    );
  const matches = [primary, alternative]
    .filter((candidate): candidate is EvaluatedProfessor => Boolean(candidate))
    .map((candidate) => candidate.match);

  return {
    topicId: topic.id,
    matches,
    selectionPolicy: PROFESSOR_MATCH_POLICY,
    generatedAt: new Date().toISOString(),
    officialRecordCount: dataset.official_record_count,
    scopeStatus: dataset.scope_status,
    coverageGaps,
    note: `${dataset.note} 교수 선택은 주제·방법·맥락의 공식 근거, 출처 완전성, 안정적 교수 ID 순서의 결정적 규칙으로 수행합니다.`,
  };
}
