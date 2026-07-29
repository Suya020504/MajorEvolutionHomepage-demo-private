"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * 교수님 퀘스트 저장 모델.
 *
 * 다섯 도구가 만든 결과물을 한 형태로 모읍니다. 연구 여정 store와 분리해 둔 이유는
 * 침묵 구조대가 오프라인에서 저장된 질문만으로 동작해야 하기 때문입니다(AC-006).
 *
 * 저장하지 않는 것: 교수 이메일 주소, 면담 음성, 교수의 사적 정보.
 */

export type QuestToolId =
  | "paper-bite"
  | "first-line"
  | "silence-rescue"
  | "email-guard"
  | "next-seed";

/** 결과에 붙는 근거. 페이지 근거 없이 만든 요약은 저장하지 않습니다. */
export type QuestEvidence = {
  label: string;
  page: number | null;
  href: string | null;
};

export type SavedQuestCard = {
  id: string;
  tool: QuestToolId;
  title: string;
  body: string;
  /** 학생이 직접 쓴 카드면 null입니다. */
  evidence: QuestEvidence | null;
  professorId: string | null;
  topicId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type QuestCardInput = {
  tool: QuestToolId;
  title: string;
  body: string;
  evidence?: QuestEvidence | null;
  professorId?: string | null;
  topicId?: string | null;
};

type QuestState = {
  hasHydrated: boolean;
  cards: SavedQuestCard[];

  setHasHydrated: (value: boolean) => void;
  saveCard: (input: QuestCardInput) => string;
  updateCard: (id: string, patch: Partial<Pick<SavedQuestCard, "title" | "body">>) => void;
  deleteCard: (id: string) => void;
  deleteCardsByTool: (tool: QuestToolId) => number;
  clearCards: () => void;
};

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `card-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

export const useQuestStore = create<QuestState>()(persist((set) => ({
  hasHydrated: false,
  cards: [],

  setHasHydrated: (hasHydrated) => set({ hasHydrated }),

  saveCard: (input) => {
    const now = new Date().toISOString();
    const card: SavedQuestCard = {
      id: newId(),
      tool: input.tool,
      title: input.title,
      body: input.body,
      evidence: input.evidence ?? null,
      professorId: input.professorId ?? null,
      topicId: input.topicId ?? null,
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({ cards: [card, ...state.cards] }));
    return card.id;
  },

  updateCard: (id, patch) =>
    set((state) => ({
      cards: state.cards.map((card) =>
        card.id === id ? { ...card, ...patch, updatedAt: new Date().toISOString() } : card),
    })),

  deleteCard: (id) =>
    set((state) => ({ cards: state.cards.filter((card) => card.id !== id) })),

  deleteCardsByTool: (tool) => {
    let removed = 0;
    set((state) => {
      const kept = state.cards.filter((card) => card.tool !== tool);
      removed = state.cards.length - kept.length;
      return { cards: kept };
    });
    return removed;
  },

  clearCards: () => set({ cards: [] }),
}), {
  name: "nyp-quest-cards-v1",
  version: 1,
  storage: createJSONStorage(() => localStorage),
  skipHydration: true,
  partialize: ({ hasHydrated: _hasHydrated, ...state }) => state,
  onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
}));

export function cardsForTool(cards: SavedQuestCard[], tool: QuestToolId): SavedQuestCard[] {
  return cards.filter((card) => card.tool === tool);
}
