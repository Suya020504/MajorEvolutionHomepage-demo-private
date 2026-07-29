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

/** 결과에 붙는 근거 범위. 페이지를 알 수 없으면 page=null과 범위 한계를 함께 저장합니다. */
export type QuestEvidence = {
  label: string;
  page: number | null;
  href: string | null;
};

export type QuestCardSlot = "problem" | "method" | "result" | "limitations" | "questions";

export type SavedQuestCard = {
  id: string;
  tool: QuestToolId;
  title: string;
  body: string;
  /** 학생이 직접 쓴 카드면 null입니다. */
  evidence: QuestEvidence | null;
  professorId: string | null;
  topicId: string | null;
  /** 공식 논문을 선택한 경우에만 존재합니다. */
  paperId: string | null;
  /** 같은 논문의 3분 카드 5장을 한 묶음으로 갱신하기 위한 키입니다. */
  bundleId: string | null;
  slot: QuestCardSlot | null;
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
  paperId?: string | null;
  bundleId?: string | null;
  slot?: QuestCardSlot | null;
};

export type PaperQuestBundleInput = {
  bundleId: string;
  evidence: QuestEvidence;
  professorId: string | null;
  topicId: string | null;
  paperId: string | null;
  cards: Array<{
    slot: QuestCardSlot;
    title: string;
    body: string;
  }>;
};

type QuestState = {
  hasHydrated: boolean;
  cards: SavedQuestCard[];

  setHasHydrated: (value: boolean) => void;
  saveCard: (input: QuestCardInput) => string;
  savePaperBundle: (input: PaperQuestBundleInput) => string[];
  updateCard: (id: string, patch: Partial<Pick<SavedQuestCard, "title" | "body">>) => void;
  deleteCard: (id: string) => void;
  deleteCardsByTool: (tool: QuestToolId) => number;
  clearCards: () => void;
};

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `card-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

export function migrateQuestState(persistedState: unknown): Partial<QuestState> {
  if (!persistedState || typeof persistedState !== "object" || Array.isArray(persistedState)) {
    return { cards: [] };
  }
  const state = persistedState as Partial<QuestState>;
  const cards = Array.isArray(state.cards)
    ? state.cards.map((card) => ({
        ...card,
        paperId: typeof card.paperId === "string" ? card.paperId : null,
        bundleId: typeof card.bundleId === "string" ? card.bundleId : null,
        slot: ["problem", "method", "result", "limitations", "questions"].includes(
          String(card.slot),
        )
          ? card.slot
          : null,
      }))
    : [];
  return { ...state, cards };
}

export const useQuestStore = create<QuestState>()(persist((set) => ({
  hasHydrated: false,
  cards: [],

  setHasHydrated: (hasHydrated) => set({ hasHydrated }),

  saveCard: (input) => {
    const now = new Date().toISOString();
    let savedId = "";
    set((state) => {
      const existing = input.bundleId && input.slot
        ? state.cards.find(
            (card) => card.bundleId === input.bundleId && card.slot === input.slot,
          )
        : null;
      if (existing) {
        savedId = existing.id;
        return {
          cards: state.cards.map((card) => card.id === existing.id
            ? {
                ...card,
                title: input.title,
                body: input.body,
                evidence: input.evidence ?? null,
                professorId: input.professorId ?? null,
                topicId: input.topicId ?? null,
                paperId: input.paperId ?? null,
                updatedAt: now,
              }
            : card),
        };
      }

      const id = newId();
      savedId = id;
      const card: SavedQuestCard = {
        id,
        tool: input.tool,
        title: input.title,
        body: input.body,
        evidence: input.evidence ?? null,
        professorId: input.professorId ?? null,
        topicId: input.topicId ?? null,
        paperId: input.paperId ?? null,
        bundleId: input.bundleId ?? null,
        slot: input.slot ?? null,
        createdAt: now,
        updatedAt: now,
      };
      return { cards: [card, ...state.cards] };
    });
    return savedId;
  },

  savePaperBundle: (input) => {
    const now = new Date().toISOString();
    const uniqueCards = Array.from(
      new Map(input.cards.slice(0, 5).map((card) => [card.slot, card])).values(),
    );
    const savedIds: string[] = [];
    set((state) => {
      const cardBySlot = new Map(uniqueCards.map((card) => [card.slot, card]));
      const existingSlots = new Set<QuestCardSlot>();
      const updatedCards = state.cards.map((card) => {
        if (card.bundleId !== input.bundleId || !card.slot) return card;
        const next = cardBySlot.get(card.slot);
        if (!next) return card;
        existingSlots.add(card.slot);
        savedIds.push(card.id);
        return {
          ...card,
          title: next.title,
          body: next.body,
          evidence: input.evidence,
          professorId: input.professorId,
          topicId: input.topicId,
          paperId: input.paperId,
          updatedAt: now,
        };
      });
      const newCards = uniqueCards
        .filter((card) => !existingSlots.has(card.slot))
        .map((item) => {
          const id = newId();
          savedIds.push(id);
          return {
            id,
            tool: "paper-bite" as const,
            title: item.title,
            body: item.body,
            evidence: input.evidence,
            professorId: input.professorId,
            topicId: input.topicId,
            paperId: input.paperId,
            bundleId: input.bundleId,
            slot: item.slot,
            createdAt: now,
            updatedAt: now,
          };
        });
      return { cards: [...newCards, ...updatedCards] };
    });
    return savedIds;
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
  version: 2,
  migrate: migrateQuestState,
  storage: createJSONStorage(() => localStorage),
  skipHydration: true,
  partialize: ({ hasHydrated: _hasHydrated, ...state }) => state,
  onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
}));

export function cardsForTool(cards: SavedQuestCard[], tool: QuestToolId): SavedQuestCard[] {
  return cards.filter((card) => card.tool === tool);
}
