/** 학생 탐색과 프로젝트 자문 추천을 같은 배열에 섞지 않기 위한 순수 상태 계약입니다. */
export type ProfessorMatchStatus = "idle" | "loading" | "success" | "error";

export type ProfessorMatchBucket<TMatch = unknown, TCoverage = unknown> = {
  matches: TMatch[];
  coverage: TCoverage | null;
  status: ProfessorMatchStatus;
  error: string | null;
  topicId: string | null;
  rejectedIds: string[];
  selectedProfessorId: string | null;
};

export function emptyProfessorMatchBucket<TMatch = unknown, TCoverage = unknown>(): ProfessorMatchBucket<TMatch, TCoverage> {
  return { matches: [], coverage: null, status: "idle", error: null, topicId: null, rejectedIds: [], selectedProfessorId: null };
}

export function isProjectProfessorMatchTopic(topicId: string | null | undefined, selectedTopicId: string | null | undefined): boolean {
  return Boolean(topicId && selectedTopicId && topicId === selectedTopicId && !topicId.startsWith("discovery:") && !topicId.startsWith("context:"));
}

export function clearStudentProfessorMatchBucket<TMatch, TCoverage>({
  projectBucket,
}: {
  studentBucket: ProfessorMatchBucket<TMatch, TCoverage>;
  projectBucket: ProfessorMatchBucket<TMatch, TCoverage>;
}) {
  return { studentBucket: emptyProfessorMatchBucket<TMatch, TCoverage>(), projectBucket };
}

export function resolveActiveProfessorMatch<
  TMatch extends { professor: { id: string } },
>({
  studentMatches,
  selectedStudentProfessorId,
  projectMatches,
  selectedProjectProfessorId,
  favoriteStudentProfessorIds = [],
}: {
  studentMatches: readonly TMatch[];
  selectedStudentProfessorId: string | null | undefined;
  projectMatches: readonly TMatch[];
  selectedProjectProfessorId: string | null | undefined;
  favoriteStudentProfessorIds?: readonly string[];
}): { source: "student" | "project"; match: TMatch } | null {
  const studentMatch = selectedStudentProfessorId
    ? studentMatches.find((match) => match.professor.id === selectedStudentProfessorId)
    : null;
  if (studentMatch) return { source: "student", match: studentMatch };

  const projectMatch = selectedProjectProfessorId
    ? projectMatches.find((match) => match.professor.id === selectedProjectProfessorId)
    : null;
  if (projectMatch) return { source: "project", match: projectMatch };

  const favoriteIds = new Set(favoriteStudentProfessorIds);
  const favoriteMatch = studentMatches.find((match) => favoriteIds.has(match.professor.id));
  return favoriteMatch ? { source: "student", match: favoriteMatch } : null;
}

/** 일반 교수 연결의 만남 준비는 프로젝트 자문 교수를 대신 사용하지 않습니다. */
export function resolveStudentProfessorMatch<
  TMatch extends { professor: { id: string } },
>({
  studentMatches,
  selectedStudentProfessorId,
  favoriteStudentProfessorIds = [],
}: {
  studentMatches: readonly TMatch[];
  selectedStudentProfessorId: string | null | undefined;
  favoriteStudentProfessorIds?: readonly string[];
}): TMatch | null {
  const selected = selectedStudentProfessorId
    ? studentMatches.find((match) => match.professor.id === selectedStudentProfessorId)
    : null;
  if (selected) return selected;
  const favoriteIds = new Set(favoriteStudentProfessorIds);
  return studentMatches.find((match) => favoriteIds.has(match.professor.id)) ?? null;
}

/** 프로젝트 실행 화면은 프로젝트 버킷에서 선택한 자문 교수만 사용합니다. */
export function resolveProjectProfessorMatch<
  TMatch extends { professor: { id: string } },
>({
  projectMatches,
  selectedProjectProfessorId,
}: {
  projectMatches: readonly TMatch[];
  selectedProjectProfessorId: string | null | undefined;
}): TMatch | null {
  return selectedProjectProfessorId
    ? projectMatches.find((match) => match.professor.id === selectedProjectProfessorId) ?? null
    : null;
}

export function removeProfessorFromMatchBuckets<
  TMatch extends { professor: { id: string } },
>({
  source,
  professorId,
  studentMatches,
  selectedStudentProfessorId,
  projectMatches,
  selectedProjectProfessorId,
}: {
  source: "student" | "project" | "paper";
  professorId: string;
  studentMatches: readonly TMatch[];
  selectedStudentProfessorId: string | null;
  projectMatches: readonly TMatch[];
  selectedProjectProfessorId: string | null;
}) {
  const nextStudentMatches = source === "student"
    ? studentMatches.filter((match) => match.professor.id !== professorId)
    : [...studentMatches];
  const nextProjectMatches = source === "project"
    ? projectMatches.filter((match) => match.professor.id !== professorId)
    : [...projectMatches];

  return {
    studentMatches: nextStudentMatches,
    selectedStudentProfessorId: source === "student" && selectedStudentProfessorId === professorId
      ? null
      : selectedStudentProfessorId,
    projectMatches: nextProjectMatches,
    selectedProjectProfessorId: source === "project" && selectedProjectProfessorId === professorId
      ? null
      : selectedProjectProfessorId,
  };
}

export function activateProfessorSelection({
  source,
  professorId,
  selectedStudentProfessorId,
  selectedProjectProfessorId,
}: {
  source: "student" | "project";
  professorId: string;
  selectedStudentProfessorId: string | null;
  selectedProjectProfessorId: string | null;
}) {
  return source === "project"
    ? {
        selectedStudentProfessorId,
        selectedProjectProfessorId: professorId,
      }
    : {
        selectedStudentProfessorId: professorId,
        selectedProjectProfessorId,
      };
}

export function professorMatchSourceForId<
  TMatch extends { professor: { id: string } },
>({
  professorId,
  studentMatches,
  projectMatches,
}: {
  professorId: string;
  studentMatches: readonly TMatch[];
  projectMatches: readonly TMatch[];
}): "student" | "project" | null {
  if (studentMatches.some((match) => match.professor.id === professorId)) return "student";
  if (projectMatches.some((match) => match.professor.id === professorId)) return "project";
  return null;
}

export function migrateProfessorMatchBuckets<TMatch = unknown, TCoverage = unknown>(legacy: {
  selectedTopicId: string | null | undefined;
  professorMatchTopicId: string | null | undefined;
  professorMatches: TMatch[] | null | undefined;
  professorCoverage: TCoverage | null | undefined;
  professorMatchStatus: ProfessorMatchStatus | null | undefined;
  professorMatchError: string | null | undefined;
  professorRejectedIds: string[] | null | undefined;
  selectedProfessorId: string | null | undefined;
}) {
  const bucket: ProfessorMatchBucket<TMatch, TCoverage> = {
    matches: Array.isArray(legacy.professorMatches) ? legacy.professorMatches : [],
    coverage: legacy.professorCoverage ?? null,
    status: legacy.professorMatchStatus ?? "idle",
    error: legacy.professorMatchError ?? null,
    topicId: legacy.professorMatchTopicId ?? null,
    rejectedIds: Array.isArray(legacy.professorRejectedIds) ? legacy.professorRejectedIds : [],
    selectedProfessorId: legacy.selectedProfessorId ?? null,
  };
  return isProjectProfessorMatchTopic(bucket.topicId, legacy.selectedTopicId)
    ? { studentBucket: emptyProfessorMatchBucket<TMatch, TCoverage>(), projectBucket: bucket }
    : { studentBucket: bucket, projectBucket: emptyProfessorMatchBucket<TMatch, TCoverage>() };
}
