"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { GrowthProfessorResponse } from "@/lib/ai-growth-professor";

export type AiProfessorMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  /**
   * 대화 지도에서 과거 AI 답변을 출발점으로 새 갈래를 시작했을 때만
   * 해당 답변 id를 저장합니다. 기존의 일반 대화는 null입니다.
   */
  branchParentMessageId: string | null;
  reflection: GrowthProfessorResponse["reflection"] | null;
  suggestedPrompts: string[];
};

export type AiGrowthNote = {
  id: string;
  title: string;
  body: string;
  sourceMessageId: string;
  createdAt: string;
};

export type AiConversationMapDecision = "keep" | "exclude";

type AiProfessorState = {
  hasHydrated: boolean;
  messages: AiProfessorMessage[];
  growthNotes: AiGrowthNote[];
  mapDecisions: Record<string, AiConversationMapDecision>;
  setHasHydrated: (value: boolean) => void;
  addUserMessage: (content: string, branchParentMessageId?: string | null) => AiProfessorMessage;
  addAssistantMessage: (response: GrowthProfessorResponse) => AiProfessorMessage;
  saveReflection: (messageId: string) => "saved" | "already-saved" | "missing";
  removeGrowthNote: (id: string) => void;
  setMapDecision: (messageId: string, decision: AiConversationMapDecision) => void;
  clearMapDecision: (messageId: string) => void;
  clearConversation: () => void;
  clearGrowthNotes: () => void;
};

const MAX_MESSAGES = 40;
const MAX_NOTES = 20;

function createId(prefix: string) {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${random}`;
}

function trimText(value: string, max: number) {
  return value.trim().replace(/\s+/g, " ").slice(0, max);
}

export const useAiProfessorStore = create<AiProfessorState>()(persist((set, get) => ({
  hasHydrated: false,
  messages: [],
  growthNotes: [],
  mapDecisions: {},
  setHasHydrated: (hasHydrated) => set({ hasHydrated }),
  addUserMessage: (content, branchParentMessageId = null) => {
    const message: AiProfessorMessage = {
      id: createId("user"),
      role: "user",
      content: trimText(content, 600),
      createdAt: new Date().toISOString(),
      branchParentMessageId,
      reflection: null,
      suggestedPrompts: [],
    };
    set((state) => ({ messages: [...state.messages, message].slice(-MAX_MESSAGES) }));
    return message;
  },
  addAssistantMessage: (response) => {
    const message: AiProfessorMessage = {
      id: createId("assistant"),
      role: "assistant",
      content: trimText(response.reply, 900),
      createdAt: response.generatedAt,
      branchParentMessageId: null,
      reflection: {
        title: trimText(response.reflection.title, 80),
        body: trimText(response.reflection.body, 320),
      },
      suggestedPrompts: response.suggestedPrompts.map((item) => trimText(item, 100)),
    };
    set((state) => ({ messages: [...state.messages, message].slice(-MAX_MESSAGES) }));
    return message;
  },
  saveReflection: (messageId) => {
    const state = get();
    const message = state.messages.find((item) => item.id === messageId);
    if (!message?.reflection) return "missing";
    if (state.growthNotes.some((note) => note.sourceMessageId === messageId)) return "already-saved";
    const note: AiGrowthNote = {
      id: createId("note"),
      title: message.reflection.title,
      body: message.reflection.body,
      sourceMessageId: messageId,
      createdAt: new Date().toISOString(),
    };
    set({ growthNotes: [...state.growthNotes, note].slice(-MAX_NOTES) });
    return "saved";
  },
  removeGrowthNote: (id) => set((state) => ({
    growthNotes: state.growthNotes.filter((note) => note.id !== id),
  })),
  setMapDecision: (messageId, decision) => set((state) => ({
    mapDecisions: { ...state.mapDecisions, [messageId]: decision },
  })),
  clearMapDecision: (messageId) => set((state) => {
    const mapDecisions = { ...state.mapDecisions };
    delete mapDecisions[messageId];
    return { mapDecisions };
  }),
  clearConversation: () => set({ messages: [], mapDecisions: {} }),
  clearGrowthNotes: () => set({ growthNotes: [] }),
}), {
  name: "major-evolution-ai-professor-v1",
  version: 3,
  storage: createJSONStorage(() => localStorage),
  skipHydration: true,
  partialize: ({ messages, growthNotes, mapDecisions }) => ({
    messages,
    growthNotes,
    mapDecisions,
  }),
  migrate: (persistedState) => {
    const state = persistedState as Partial<AiProfessorState> | undefined;
    return {
      messages: Array.isArray(state?.messages)
        ? state.messages.map((message) => ({
          ...message,
          branchParentMessageId: typeof message.branchParentMessageId === "string"
            ? message.branchParentMessageId
            : null,
        }))
        : [],
      growthNotes: Array.isArray(state?.growthNotes) ? state.growthNotes : [],
      mapDecisions: state?.mapDecisions && typeof state.mapDecisions === "object"
        ? state.mapDecisions
        : {},
    };
  },
  onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
}));
