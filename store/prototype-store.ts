"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  defaultEmailDraft,
  defaultPassport,
  defaultProfile,
  defaultQuestions,
  emptyProfile,
  type ComparisonCriterion,
  type Difficulty,
  type EditablePassport,
  type Goal,
  type StudentProfile,
} from "@/data/prototype";

type ListField = "interests" | "careers" | "skills";

type PrototypeState = {
  hasHydrated: boolean;
  goal: Goal | null;
  dnaStep: number;
  profile: StudentProfile;
  isSampleMode: boolean;
  selectedTrendId: string;
  ideaSetVersion: 0 | 1;
  selectedIdeaIds: string[];
  selectedIdeaId: string | null;
  comparisonCriteria: ComparisonCriterion[];
  difficulty: Difficulty;
  feasibilityVersion: "original" | "four-week";
  passport: EditablePassport;
  professorFilter: "전체" | "연구 주제" | "방법론" | "프로젝트·수업";
  selectedProfessorId: string | null;
  completedQuestIds: string[];
  savedIdeaIds: string[];
  savedProfessorIds: string[];
  comparedProfessorIds: string[];
  editedQuestions: string[];
  editedEmailDraft: string;
  setHasHydrated: (value: boolean) => void;
  setGoal: (goal: Goal | null) => void;
  setDnaStep: (step: number) => void;
  updateProfile: (patch: Partial<StudentProfile>) => void;
  toggleProfileItem: (field: ListField, value: string, max?: number) => void;
  setSampleMode: (value: boolean) => void;
  setSelectedTrend: (id: string) => void;
  regenerateIdeas: () => void;
  toggleIdeaSelection: (id: string) => void;
  setSelectedIdea: (id: string) => void;
  toggleCriterion: (criterion: ComparisonCriterion) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  setFeasibilityVersion: (version: "original" | "four-week") => void;
  updatePassport: (field: keyof EditablePassport, value: string) => void;
  setProfessorFilter: (filter: PrototypeState["professorFilter"]) => void;
  setSelectedProfessor: (id: string) => void;
  toggleSavedIdea: (id: string) => void;
  toggleSavedProfessor: (id: string) => void;
  toggleComparedProfessor: (id: string) => void;
  setQuestion: (index: number, value: string) => void;
  setEmailDraft: (value: string) => void;
  completeQuest: (id: string) => void;
  resetDemo: () => void;
};

const initialState = {
  goal: null,
  dnaStep: 1,
  profile: emptyProfile,
  isSampleMode: false,
  selectedTrendId: "greenwashing",
  ideaSetVersion: 0 as const,
  selectedIdeaIds: [] as string[],
  selectedIdeaId: null as string | null,
  comparisonCriteria: ["personalFit", "dataAccess"] as ComparisonCriterion[],
  difficulty: "project" as Difficulty,
  feasibilityVersion: "original" as const,
  passport: defaultPassport,
  professorFilter: "전체" as const,
  selectedProfessorId: null as string | null,
  completedQuestIds: [] as string[],
  savedIdeaIds: [] as string[],
  savedProfessorIds: [] as string[],
  comparedProfessorIds: [] as string[],
  editedQuestions: defaultQuestions,
  editedEmailDraft: defaultEmailDraft,
};

export const usePrototypeStore = create<PrototypeState>()(
  persist(
    (set) => ({
      hasHydrated: false,
      ...initialState,
      setHasHydrated: (value) => set({ hasHydrated: value }),
      setGoal: (goal) => set({ goal }),
      setDnaStep: (dnaStep) => set({ dnaStep }),
      updateProfile: (patch) => set((state) => ({ profile: { ...state.profile, ...patch } })),
      toggleProfileItem: (field, value, max) =>
        set((state) => {
          const current = state.profile[field];
          const exists = current.includes(value);
          const next = exists ? current.filter((item) => item !== value) : [...current, value];
          if (!exists && max && next.length > max) return state;
          return { profile: { ...state.profile, [field]: next } };
        }),
      setSampleMode: (isSampleMode) =>
        set({
          ...initialState,
          isSampleMode,
          profile: isSampleMode ? defaultProfile : emptyProfile,
        }),
      setSelectedTrend: (selectedTrendId) => set({ selectedTrendId }),
      regenerateIdeas: () =>
        set((state) => ({
          ideaSetVersion: state.ideaSetVersion === 0 ? 1 : 0,
          selectedIdeaIds: [],
          selectedIdeaId: null,
        })),
      toggleIdeaSelection: (id) =>
        set((state) => {
          const exists = state.selectedIdeaIds.includes(id);
          if (exists) return { selectedIdeaIds: state.selectedIdeaIds.filter((item) => item !== id) };
          if (state.selectedIdeaIds.length >= 2) return state;
          return { selectedIdeaIds: [...state.selectedIdeaIds, id] };
        }),
      setSelectedIdea: (selectedIdeaId) => set({ selectedIdeaId }),
      toggleCriterion: (criterion) =>
        set((state) => {
          const exists = state.comparisonCriteria.includes(criterion);
          if (exists) return { comparisonCriteria: state.comparisonCriteria.filter((item) => item !== criterion) };
          if (state.comparisonCriteria.length >= 2) return state;
          return { comparisonCriteria: [...state.comparisonCriteria, criterion] };
        }),
      setDifficulty: (difficulty) =>
        set((state) => ({ difficulty, profile: { ...state.profile, difficulty } })),
      setFeasibilityVersion: (feasibilityVersion) => set({ feasibilityVersion }),
      updatePassport: (field, value) => set((state) => ({ passport: { ...state.passport, [field]: value } })),
      setProfessorFilter: (professorFilter) => set({ professorFilter }),
      setSelectedProfessor: (selectedProfessorId) => set({ selectedProfessorId }),
      toggleSavedIdea: (id) =>
        set((state) => ({
          savedIdeaIds: state.savedIdeaIds.includes(id)
            ? state.savedIdeaIds.filter((item) => item !== id)
            : [...state.savedIdeaIds, id],
        })),
      toggleSavedProfessor: (id) =>
        set((state) => ({
          savedProfessorIds: state.savedProfessorIds.includes(id)
            ? state.savedProfessorIds.filter((item) => item !== id)
            : [...state.savedProfessorIds, id],
        })),
      toggleComparedProfessor: (id) =>
        set((state) => {
          if (state.comparedProfessorIds.includes(id)) {
            return { comparedProfessorIds: state.comparedProfessorIds.filter((item) => item !== id) };
          }
          if (state.comparedProfessorIds.length >= 2) return state;
          return { comparedProfessorIds: [...state.comparedProfessorIds, id] };
        }),
      setQuestion: (index, value) =>
        set((state) => ({
          editedQuestions: state.editedQuestions.map((question, questionIndex) =>
            questionIndex === index ? value : question,
          ),
        })),
      setEmailDraft: (editedEmailDraft) => set({ editedEmailDraft }),
      completeQuest: (id) =>
        set((state) => ({
          completedQuestIds: state.completedQuestIds.includes(id)
            ? state.completedQuestIds
            : [...state.completedQuestIds, id],
        })),
      resetDemo: () => set({ ...initialState, hasHydrated: true }),
    }),
    {
      name: "major-evolution-prototype-v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: ({ hasHydrated: _hasHydrated, ...state }) => state,
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);
