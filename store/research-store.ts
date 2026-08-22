// 연구 공동설계와 공식 교수 연결 상태를 브라우저에 저장한다.
"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  modeById,
  questionsForMode,
  type ConfirmedAnswer,
  type IdeaMode,
} from "@/data/co-design";
import {
  inferMajorArea,
  isMajorArea,
  normalizeAcademicInput,
  type MajorArea,
} from "@/data/academic-options";
import type {
  DataAccess,
  ExperienceLevel,
  PeriodLabel,
  ResearchTopic,
} from "@/data/research-mvp";
import {
  compareTopicPair,
  emptyConditions,
  missingRequired,
  recommend,
  type Conditions,
  type RecommendResult,
} from "@/lib/recommend";
import type {
  ProfessorKnockKitDraft,
  ProfessorMatch,
  ProfessorMatchResponse,
  ProfessorMentorLoopEntry,
  ProfessorPaperSelection,
  ProfessorMatchTopic,
} from "@/lib/professor-domain";
import { MAX_FAVORITE_PROFESSORS } from "@/lib/professor-paper-selection";

/**
 * 찾다에서 학생이 고른 탐색 조건 중 성장 포트폴리오가 쓰는 부분만 남깁니다.
 * 폼 전체를 저장하지 않고 화면이 실제로 보여줄 것만 둡니다.
 */
export type ProfessorDiscoverySummary = {
  major: string;
  interests: string[];
  careerConcerns: string[];
};

const MAX_INTERESTS = 3;
const MAX_METHODS = 2;

const RERECOMMEND_EMPTY_NOTE = "이 조건에서 비교할 수 있는 다른 연구주제가 아직 없어요. 조건을 바꿔 보세요.";

function resultIds(r: RecommendResult): string[] {
  if (r.kind === "ok") return [r.candidates[0].topic.id, r.candidates[1].topic.id];
  if (r.kind === "insufficient") return [r.candidate.topic.id];
  return [];
}

const toggle = (list: string[], value: string, max: number) => {
  if (list.includes(value)) return list.filter((v) => v !== value);
  if (list.length >= max) return list; // 최대 개수 초과는 무시 (UI에서 안내)
  return [...list, value];
};

export type InterestAddResult = "added" | "duplicate" | "empty" | "full";
export type FavoriteProfessorToggleResult = "added" | "removed" | "full";

function normalizeFavoriteProfessorIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(
    value
      .map((item) => typeof item === "string" ? item.trim().slice(0, 64) : "")
      .filter(Boolean),
  )).slice(0, MAX_FAVORITE_PROFESSORS);
}

function normalizePaperSelection(value: unknown): ProfessorPaperSelection | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const required = [
    "professorId",
    "professorName",
    "professorDepartment",
    "paperId",
    "title",
    "publicationType",
    "officialProfileUrl",
    "selectedAt",
  ] as const;
  if (required.some((key) => typeof raw[key] !== "string" || !raw[key])) return null;
  if (raw.publishedDate !== null && typeof raw.publishedDate !== "string") return null;
  if (raw.doi !== null && typeof raw.doi !== "string") return null;
  if (raw.kciId !== null && typeof raw.kciId !== "string") return null;
  return {
    professorId: String(raw.professorId).slice(0, 64),
    professorName: String(raw.professorName).slice(0, 80),
    professorDepartment: String(raw.professorDepartment).slice(0, 120),
    paperId: String(raw.paperId).slice(0, 64),
    title: String(raw.title).slice(0, 300),
    publicationType: String(raw.publicationType).slice(0, 80),
    publishedDate: raw.publishedDate as string | null,
    doi: raw.doi as string | null,
    kciId: raw.kciId as string | null,
    officialProfileUrl: String(raw.officialProfileUrl).slice(0, 500),
    selectedAt: String(raw.selectedAt).slice(0, 40),
  };
}

type ResearchState = {
  hasHydrated: boolean;
  conditions: Conditions;
  ideaMode: IdeaMode | null;
  coDesignStep: number;
  coDesignAnswers: ConfirmedAnswer[];
  result: RecommendResult | null;
  resultOrigin: "ai" | "reviewed-fallback" | null;
  groundingNote: string | null;
  selectedTopicId: string | null;
  professorMatches: ProfessorMatch[];
  professorCoverage: Pick<
    ProfessorMatchResponse,
    "officialRecordCount" | "scopeStatus" | "coverageGaps" | "note"
  > | null;
  professorMatchStatus: "idle" | "loading" | "success" | "error";
  professorMatchError: string | null;
  professorMatchTopicId: string | null;
  /** 새로고침·퀘스트 왕복 뒤에도 피칭 문구와 다시 찾기 요청을 복원하는 최소 요청 맥락. */
  professorDiscoveryTopic: ProfessorMatchTopic | null;
  /**
   * ‘다른 교수님 만나보기’로 제외한 교수 ID.
   * 찾기 화면과 피칭 화면이 다른 주소로 나뉘어 있어, 제외 목록도 저장소에서 공유합니다.
   */
  professorRejectedIds: string[];
  selectedProfessorId: string | null;
  favoriteProfessorIds: string[];
  /**
   * 찾다에서 학생이 고른 탐색 조건.
   * 만들다를 거치지 않고 찾다만 이용한 학생도 성장 포트폴리오의
   * 주제 탐색 단계가 채워지도록 남깁니다.
   */
  professorDiscoverySummary: ProfessorDiscoverySummary | null;
  selectedProfessorPaper: ProfessorPaperSelection | null;
  knockKitDrafts: Record<string, ProfessorKnockKitDraft>;
  mentorLoopEntries: Record<string, ProfessorMentorLoopEntry>;
  seenIds: string[];
  loadKey: number; // (재)추천마다 증가 → 결과 화면 로딩 재생
  reRecommendNote: string | null;
  interestsFull: boolean;
  methodsFull: boolean;

  setHasHydrated: (value: boolean) => void;
  setIdeaMode: (mode: IdeaMode) => void;
  setSchool: (school: string) => void;
  setMajorArea: (area: MajorArea) => void;
  setMajor: (major: string) => void;
  toggleInterest: (tag: string) => void;
  addInterest: (tag: string) => InterestAddResult;
  setExperience: (e: ExperienceLevel) => void;
  toggleMethod: (tag: string) => void;
  setPeriod: (p: PeriodLabel) => void;
  setDataAccess: (d: DataAccess) => void;
  toggleAvoid: (tag: string) => void;
  beginIdeaCoDesign: (input: {
    ideaMode: IdeaMode | null;
    conditions: Conditions;
  }) => string[];

  submit: () => string[]; // 누락 항목 반환 (빈 배열이면 공동설계 진입 가능)
  answerCoDesign: (value: string) => boolean; // 마지막 질문이면 true
  previousCoDesignQuestion: () => void;
  completeCoDesign: (
    topics?: [ResearchTopic, ResearchTopic],
    groundingNote?: string,
  ) => void;
  reRecommend: () => void;
  selectTopic: (id: string) => void;
  /** 진행 중인 연결 요청의 주제 ID. 저장된 주제 ID이거나 `context:`로 시작하는 임시 ID입니다. */
  setProfessorMatchLoading: (topicId: string) => void;
  setProfessorMatches: (response: ProfessorMatchResponse) => void;
  setProfessorDiscoveryTopic: (topic: ProfessorMatchTopic | null) => void;
  setProfessorRejectedIds: (ids: string[]) => void;
  setProfessorDiscoverySummary: (summary: ProfessorDiscoverySummary | null) => void;
  setProfessorMatchError: (topicId: string, message: string) => void;
  selectProfessor: (id: string) => void;
  toggleFavoriteProfessor: (id: string) => FavoriteProfessorToggleResult;
  removeFavoriteProfessors: (ids: string[]) => void;
  clearFavoriteProfessors: () => void;
  selectProfessorPaper: (selection: ProfessorPaperSelection | null) => void;
  saveKnockKitDraft: (key: string, draft: ProfessorKnockKitDraft) => void;
  saveMentorLoopEntry: (key: string, entry: ProfessorMentorLoopEntry) => void;
  deleteMentorLoopEntry: (key: string) => void;
  /** 데이터 종류별 삭제. 학생이 각각 지울 수 있어야 합니다. */
  clearProfessorMatches: () => void;
  clearKnockKitDrafts: () => void;
  clearMentorLoopEntries: () => void;
  reset: () => void;
};

const invalidatedResearchState = () => ({
  coDesignStep: 0,
  coDesignAnswers: [] as ConfirmedAnswer[],
  result: null,
  resultOrigin: null,
  groundingNote: null,
  selectedTopicId: null,
  professorMatches: [] as ProfessorMatch[],
  professorCoverage: null,
  professorMatchStatus: "idle" as const,
  professorMatchError: null,
  professorMatchTopicId: null,
  professorDiscoveryTopic: null,
  professorRejectedIds: [],
  professorDiscoverySummary: null,
  selectedProfessorId: null,
  seenIds: [] as string[],
  reRecommendNote: null,
});

export function migrateResearchState(
  persistedState: unknown,
  persistedVersion: number,
): Partial<ResearchState> {
  const state = persistedState && typeof persistedState === "object"
    ? persistedState as Partial<ResearchState>
    : {};
  const rawConditions = state.conditions && typeof state.conditions === "object"
    ? state.conditions as Partial<Conditions>
    : {};
  const major = normalizeAcademicInput(rawConditions.major, 80) || null;
  const interests = Array.isArray(rawConditions.interests)
    ? Array.from(new Set(
      rawConditions.interests
        .map((interest) => normalizeAcademicInput(interest, 60))
        .filter(Boolean),
    )).slice(0, MAX_INTERESTS)
    : [];
  const methods = Array.isArray(rawConditions.methods)
    ? rawConditions.methods.slice(0, MAX_METHODS)
    : [];
  const conditions: Conditions = {
    ...emptyConditions,
    ...rawConditions,
    school: normalizeAcademicInput(rawConditions.school, 80),
    majorArea: isMajorArea(rawConditions.majorArea)
      ? rawConditions.majorArea
      : major
        ? inferMajorArea(major)
        : null,
    major,
    interests,
    methods,
    avoid: Array.isArray(rawConditions.avoid) ? rawConditions.avoid : [],
  };
  const favoriteProfessorIds = normalizeFavoriteProfessorIds(state.favoriteProfessorIds);
  const selectedProfessorPaper = normalizePaperSelection(state.selectedProfessorPaper);

  return {
    ...state,
    conditions,
    favoriteProfessorIds,
    selectedProfessorPaper,
    interestsFull: interests.length >= MAX_INTERESTS,
    methodsFull: methods.length >= MAX_METHODS,
    // v1의 개인 맞춤 입력은 보편 대학생 입력으로 바뀌어 결과를 다시 계산해야 했습니다.
    // v2→v3은 즐겨찾기·논문 선택만 추가하므로 기존 공동설계와 추천 결과를 보존합니다.
    ...(persistedVersion < 2 ? invalidatedResearchState() : {}),
    /*
     * v3은 교수 결과만 저장하고 그 결과를 만든 입력 맥락은 저장하지 않았습니다.
     * 새로고침 뒤 ‘다른 교수님 만나보기’를 누르면 재검색할 조건이 없어 멈추므로,
     * v4 최초 진입에서는 이전 교수 결과만 비우고 새 계약으로 한 번 다시 찾게 합니다.
     * 즐겨찾기·공동설계·논문 선택은 그대로 보존합니다.
     */
    ...(persistedVersion < 4 ? {
      professorMatches: [],
      professorCoverage: null,
      professorMatchStatus: "idle" as const,
      professorMatchError: null,
      professorMatchTopicId: null,
      professorDiscoveryTopic: null,
      professorRejectedIds: [],
      professorDiscoverySummary: null,
      selectedProfessorId: null,
    } : {}),
  };
}

export const useResearchStore = create<ResearchState>()(persist((set, get) => ({
  hasHydrated: false,
  conditions: { ...emptyConditions },
  ideaMode: null,
  coDesignStep: 0,
  coDesignAnswers: [],
  result: null,
  resultOrigin: null,
  groundingNote: null,
  selectedTopicId: null,
  professorMatches: [],
  professorCoverage: null,
  professorMatchStatus: "idle",
  professorMatchError: null,
  professorMatchTopicId: null,
  professorDiscoveryTopic: null,
  professorRejectedIds: [],
  selectedProfessorId: null,
  favoriteProfessorIds: [],
  professorDiscoverySummary: null,
  selectedProfessorPaper: null,
  knockKitDrafts: {},
  mentorLoopEntries: {},
  seenIds: [],
  loadKey: 0,
  reRecommendNote: null,
  interestsFull: false,
  methodsFull: false,

  setHasHydrated: (hasHydrated) => set({ hasHydrated }),
  setIdeaMode: (ideaMode) =>
    set({
      ideaMode,
      ...invalidatedResearchState(),
    }),
  setSchool: (school) =>
    set((state) => ({
      conditions: { ...state.conditions, school: school.slice(0, 80) },
      ...invalidatedResearchState(),
    })),
  setMajorArea: (majorArea) =>
    set((state) => ({
      conditions: {
        ...state.conditions,
        majorArea,
        major: state.conditions.majorArea === majorArea ? state.conditions.major : null,
      },
      ...invalidatedResearchState(),
    })),
  setMajor: (major) =>
    set((state) => ({
      conditions: { ...state.conditions, major: major.slice(0, 80) },
      ...invalidatedResearchState(),
    })),
  toggleInterest: (tag) =>
    set((state) => {
      const normalized = normalizeAcademicInput(tag, 60);
      if (!normalized) return state;
      const interests = toggle(state.conditions.interests, normalized, MAX_INTERESTS);
      if (interests === state.conditions.interests) return state;
      return {
        conditions: { ...state.conditions, interests },
        interestsFull: interests.length >= MAX_INTERESTS,
        ...invalidatedResearchState(),
      };
    }),
  addInterest: (tag) => {
    const normalized = normalizeAcademicInput(tag, 60);
    if (!normalized) return "empty";
    const { conditions } = get();
    if (conditions.interests.includes(normalized)) return "duplicate";
    if (conditions.interests.length >= MAX_INTERESTS) return "full";
    set((state) => ({
      conditions: {
        ...state.conditions,
        interests: [...state.conditions.interests, normalized],
      },
      interestsFull: state.conditions.interests.length + 1 >= MAX_INTERESTS,
      ...invalidatedResearchState(),
    }));
    return "added";
  },
  setExperience: (experience) =>
    set((state) => ({
      conditions: { ...state.conditions, experience },
      ...invalidatedResearchState(),
    })),
  toggleMethod: (tag) =>
    set((state) => {
      const methods = toggle(state.conditions.methods, tag, MAX_METHODS);
      if (methods === state.conditions.methods) return state;
      return {
        conditions: { ...state.conditions, methods },
        methodsFull: methods.length >= MAX_METHODS,
        ...invalidatedResearchState(),
      };
    }),
  setPeriod: (period) =>
    set((state) => ({
      conditions: { ...state.conditions, period },
      ...invalidatedResearchState(),
    })),
  setDataAccess: (dataAccess) =>
    set((state) => ({
      conditions: { ...state.conditions, dataAccess },
      ...invalidatedResearchState(),
    })),
  toggleAvoid: (tag) =>
    set((state) => ({
      conditions: {
        ...state.conditions,
        avoid: toggle(state.conditions.avoid, tag, 99),
      },
      ...invalidatedResearchState(),
    })),
  beginIdeaCoDesign: ({ ideaMode, conditions }) => {
    const major = normalizeAcademicInput(conditions.major, 80) || null;
    const interests = Array.from(new Set(
      conditions.interests
        .map((interest) => normalizeAcademicInput(interest, 60))
        .filter(Boolean),
    )).slice(0, MAX_INTERESTS);
    const methods = Array.from(new Set(conditions.methods)).slice(0, MAX_METHODS);
    const nextConditions: Conditions = {
      ...conditions,
      school: normalizeAcademicInput(conditions.school, 80),
      majorArea: conditions.majorArea,
      major,
      interests,
      methods,
      avoid: Array.from(new Set(conditions.avoid)),
    };
    const missing = [...missingRequired(nextConditions)] as string[];
    if (!ideaMode) missing.unshift("ideaMode");
    if (missing.length) return missing;

    set({
      conditions: nextConditions,
      ideaMode,
      interestsFull: interests.length >= MAX_INTERESTS,
      methodsFull: methods.length >= MAX_METHODS,
      ...invalidatedResearchState(),
    });
    return [];
  },

  submit: () => {
    const { conditions, ideaMode } = get();
    const missing = [...missingRequired(conditions)] as string[];
    if (!ideaMode) missing.unshift("ideaMode");
    if (missing.length) return missing;
    set({
      coDesignStep: 0,
      coDesignAnswers: [],
      result: null,
      resultOrigin: null,
      groundingNote: null,
      seenIds: [],
      selectedTopicId: null,
      professorMatches: [],
      professorCoverage: null,
      professorMatchStatus: "idle",
      professorMatchError: null,
      professorMatchTopicId: null,
      professorDiscoveryTopic: null,
      professorRejectedIds: [],
      professorDiscoverySummary: null,
      selectedProfessorId: null,
      reRecommendNote: null,
    });
    return [];
  },

  answerCoDesign: (value) => {
    const { ideaMode, coDesignStep, coDesignAnswers } = get();
    if (!ideaMode || !value.trim()) return false;
    const questions = questionsForMode(ideaMode);
    const question = questions[coDesignStep];
    if (!question) return true;
    const answer: ConfirmedAnswer = {
      questionId: question.id,
      label: question.contextLabel,
      value: value.trim().slice(0, 160),
      status: "사용자 확인",
    };
    const nextAnswers = [
      ...coDesignAnswers.filter((item) => item.questionId !== question.id),
      answer,
    ];
    const isLast = coDesignStep >= questions.length - 1;
    set({
      coDesignAnswers: nextAnswers,
      coDesignStep: isLast ? coDesignStep : coDesignStep + 1,
    });
    return isLast;
  },

  previousCoDesignQuestion: () =>
    set((state) => ({
      coDesignStep: Math.max(0, state.coDesignStep - 1),
    })),

  completeCoDesign: (topics, groundingNote) => {
    const { conditions, ideaMode, coDesignAnswers } = get();
    if (!ideaMode || coDesignAnswers.length < questionsForMode(ideaMode).length) return;
    const result = topics
      ? compareTopicPair(conditions, topics)
      : recommend(conditions);
    set((state) => ({
      result,
      resultOrigin: topics ? "ai" : "reviewed-fallback",
      groundingNote: groundingNote ?? (
        topics
          ? "AI가 사용자 확인 답변을 바탕으로 후보를 구성했습니다."
          : "AI 연결을 사용할 수 없어 검수된 로컬 후보로 이어갑니다."
      ),
      seenIds: resultIds(result),
      selectedTopicId: null,
      professorMatches: [],
      professorCoverage: null,
      professorMatchStatus: "idle",
      professorMatchError: null,
      professorMatchTopicId: null,
      professorDiscoveryTopic: null,
      professorRejectedIds: [],
      professorDiscoverySummary: null,
      selectedProfessorId: null,
      reRecommendNote: null,
      loadKey: state.loadKey + 1,
    }));
  },

  reRecommend: () => {
    const { conditions, seenIds } = get();
    const next = recommend(conditions, { excludeIds: seenIds });
    if (next.kind === "ok") {
      set((s) => ({
        result: next,
        resultOrigin: "reviewed-fallback",
        groundingNote: "같은 조건에서 검수된 로컬 후보를 다시 구성했습니다.",
        seenIds: [...s.seenIds, ...resultIds(next)],
        selectedTopicId: null,
        professorMatches: [],
        professorCoverage: null,
        professorMatchStatus: "idle",
        professorMatchError: null,
        professorMatchTopicId: null,
        professorDiscoveryTopic: null,
        professorRejectedIds: [],
        professorDiscoverySummary: null,
        selectedProfessorId: null,
        reRecommendNote: null,
        loadKey: s.loadKey + 1,
      }));
    } else {
      // 새 후보 부족 → 기존 결과·선택 유지하고 안내만 표시
      set({ reRecommendNote: RERECOMMEND_EMPTY_NOTE });
    }
  },

  selectTopic: (id) => set({
    selectedTopicId: id,
    professorMatches: [],
    professorCoverage: null,
    professorMatchStatus: "idle",
    professorMatchError: null,
    professorMatchTopicId: null,
    professorDiscoveryTopic: null,
    professorRejectedIds: [],
    professorDiscoverySummary: null,
    selectedProfessorId: null,
  }),
  setProfessorMatchLoading: (professorMatchTopicId) =>
    set({ professorMatchStatus: "loading", professorMatchError: null, professorMatchTopicId }),
  // 늦게 도착한 이전 요청의 응답이 현재 결과를 덮지 않도록, 진행 중인 요청의 주제와만 대조합니다.
  setProfessorMatches: (response) =>
    set((state) => response.topicId !== state.professorMatchTopicId ? state : ({
      professorMatches: response.matches,
      professorCoverage: {
        officialRecordCount: response.officialRecordCount,
        scopeStatus: response.scopeStatus,
        coverageGaps: response.coverageGaps,
        note: response.note,
      },
      professorMatchStatus: "success",
      professorMatchError: null,
      selectedProfessorId: null,
    })),
  setProfessorMatchError: (topicId, professorMatchError) =>
    set((state) => topicId !== state.professorMatchTopicId ? state : ({
      professorMatchStatus: "error",
      professorMatchError,
    })),
  selectProfessor: (selectedProfessorId) => set({ selectedProfessorId }),
  toggleFavoriteProfessor: (id) => {
    const normalizedId = id.trim().slice(0, 64);
    if (!normalizedId) return "full";
    const { favoriteProfessorIds } = get();
    if (favoriteProfessorIds.includes(normalizedId)) {
      set({
        favoriteProfessorIds: favoriteProfessorIds.filter(
          (professorId) => professorId !== normalizedId,
        ),
      });
      return "removed";
    }
    if (favoriteProfessorIds.length >= MAX_FAVORITE_PROFESSORS) return "full";
    set({ favoriteProfessorIds: [...favoriteProfessorIds, normalizedId] });
    return "added";
  },
  removeFavoriteProfessors: (ids) => {
    const idsToRemove = new Set(normalizeFavoriteProfessorIds(ids));
    if (idsToRemove.size === 0) return;
    set((state) => ({
      favoriteProfessorIds: state.favoriteProfessorIds.filter(
        (professorId) => !idsToRemove.has(professorId),
      ),
    }));
  },
  clearFavoriteProfessors: () => set({ favoriteProfessorIds: [] }),
  selectProfessorPaper: (selectedProfessorPaper) => set({
    selectedProfessorPaper,
    ...(selectedProfessorPaper
      ? { selectedProfessorId: selectedProfessorPaper.professorId }
      : {}),
  }),
  saveKnockKitDraft: (key, draft) =>
    set((state) => ({ knockKitDrafts: { ...state.knockKitDrafts, [key]: draft } })),
  saveMentorLoopEntry: (key, entry) =>
    set((state) => ({
      mentorLoopEntries: { ...state.mentorLoopEntries, [key]: entry },
    })),
  deleteMentorLoopEntry: (key) =>
    set((state) => {
      const mentorLoopEntries = { ...state.mentorLoopEntries };
      delete mentorLoopEntries[key];
      return { mentorLoopEntries };
    }),

  setProfessorDiscoverySummary: (professorDiscoverySummary) =>
    set({ professorDiscoverySummary }),
  setProfessorDiscoveryTopic: (professorDiscoveryTopic) =>
    set({ professorDiscoveryTopic }),
  setProfessorRejectedIds: (professorRejectedIds) =>
    set({ professorRejectedIds }),

  clearProfessorMatches: () =>
    set({
      professorMatches: [],
      professorCoverage: null,
      professorMatchStatus: "idle",
      professorMatchError: null,
      professorMatchTopicId: null,
      professorDiscoveryTopic: null,
      professorRejectedIds: [],
      selectedProfessorId: null,
      professorDiscoverySummary: null,
    }),
  clearKnockKitDrafts: () => set({ knockKitDrafts: {} }),
  clearMentorLoopEntries: () => set({ mentorLoopEntries: {} }),

  reset: () =>
    set({
      conditions: { ...emptyConditions },
      ideaMode: null,
      coDesignStep: 0,
      coDesignAnswers: [],
      result: null,
      resultOrigin: null,
      groundingNote: null,
      selectedTopicId: null,
      professorMatches: [],
      professorCoverage: null,
      professorMatchStatus: "idle",
      professorMatchError: null,
      professorMatchTopicId: null,
      professorDiscoveryTopic: null,
      professorRejectedIds: [],
      professorDiscoverySummary: null,
      selectedProfessorId: null,
      seenIds: [],
      reRecommendNote: null,
      interestsFull: false,
      methodsFull: false,
    }),
}), {
  name: "major-evolution-research-v1",
  version: 4,
  migrate: migrateResearchState,
  storage: createJSONStorage(() => localStorage),
  skipHydration: true,
  partialize: ({
    hasHydrated: _hasHydrated,
    interestsFull: _interestsFull,
    methodsFull: _methodsFull,
    professorMatchStatus,
    professorMatchError,
    ...state
  }) => ({
    ...state,
    professorMatchStatus: professorMatchStatus === "loading" ? "idle" : professorMatchStatus,
    professorMatchError,
  }),
  onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
}));

export function currentModeLabel(mode: IdeaMode | null): string {
  return modeById(mode)?.label ?? "탐색 방식 미선택";
}
