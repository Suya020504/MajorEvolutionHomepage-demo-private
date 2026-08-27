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

export type AiProfessorConversationSnapshot = {
  schemaVersion: 1;
  id: string;
  title: string;
  preview: string;
  createdAt: string;
  updatedAt: string;
  messages: AiProfessorMessage[];
  mapDecisions: Record<string, AiConversationMapDecision>;
};

export type SaveConversationResult =
  | { status: "saved" | "updated"; conversation: AiProfessorConversationSnapshot }
  | { status: "empty"; conversation: null };

type AiProfessorState = {
  hasHydrated: boolean;
  messages: AiProfessorMessage[];
  growthNotes: AiGrowthNote[];
  mapDecisions: Record<string, AiConversationMapDecision>;
  savedConversations: AiProfessorConversationSnapshot[];
  activeConversationId: string | null;
  setHasHydrated: (value: boolean) => void;
  addUserMessage: (content: string, branchParentMessageId?: string | null) => AiProfessorMessage;
  addAssistantMessage: (response: GrowthProfessorResponse) => AiProfessorMessage;
  saveReflection: (messageId: string) => "saved" | "already-saved" | "missing";
  removeConversationBranch: (messageId: string) => void;
  removeGrowthNote: (id: string) => void;
  setMapDecision: (messageId: string, decision: AiConversationMapDecision) => void;
  clearMapDecision: (messageId: string) => void;
  saveCurrentConversation: () => SaveConversationResult;
  startNewConversation: () => SaveConversationResult;
  openConversation: (id: string) => boolean;
  removeSavedConversation: (id: string) => void;
  clearConversation: () => void;
  clearGrowthNotes: () => void;
};

const MAX_MESSAGES = 40;
const MAX_NOTES = 20;
const MAX_SAVED_CONVERSATIONS = 12;

function createId(prefix: string) {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${random}`;
}

function trimText(value: string, max: number) {
  return value.trim().replace(/\s+/g, " ").slice(0, max);
}

function trimMultilineText(value: string, max: number) {
  return value
    .trim()
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim().replace(/[\t ]+/g, " "))
    .filter(Boolean)
    .join("\n")
    .slice(0, max);
}

function cloneMessages(messages: AiProfessorMessage[]) {
  return messages.map((message) => ({
    ...message,
    reflection: message.reflection ? { ...message.reflection } : null,
    suggestedPrompts: [...message.suggestedPrompts],
  }));
}

function conversationTitle(messages: AiProfessorMessage[]) {
  const firstUser = messages.find((message) => message.role === "user")?.content;
  const firstReflection = messages.find(
    (message) => message.role === "assistant" && message.reflection?.title,
  )?.reflection?.title;
  return trimText(firstUser || firstReflection || "AI 교수님과 나눈 대화", 36);
}

function conversationPreview(messages: AiProfessorMessage[]) {
  const latestAssistant = [...messages].reverse().find((message) => message.role === "assistant");
  const latestMessage = messages.at(-1);
  return trimText(
    latestAssistant?.reflection?.body || latestAssistant?.content || latestMessage?.content || "저장한 대화",
    96,
  );
}

function decisionsForMessages(
  messages: AiProfessorMessage[],
  mapDecisions: Record<string, AiConversationMapDecision>,
) {
  const messageIds = new Set(messages.map((message) => message.id));
  return Object.fromEntries(
    Object.entries(mapDecisions).filter(([id]) => messageIds.has(id)),
  );
}

function upsertCurrentConversation(
  state: Pick<
    AiProfessorState,
    "messages" | "mapDecisions" | "savedConversations" | "activeConversationId"
  >,
): SaveConversationResult & { savedConversations: AiProfessorConversationSnapshot[] } {
  if (!state.messages.length) {
    return { status: "empty", conversation: null, savedConversations: state.savedConversations };
  }

  const existing = state.activeConversationId
    ? state.savedConversations.find((conversation) => conversation.id === state.activeConversationId)
    : null;
  const now = new Date().toISOString();
  const conversation: AiProfessorConversationSnapshot = {
    schemaVersion: 1,
    id: existing?.id ?? createId("conversation"),
    title: existing?.title ?? conversationTitle(state.messages),
    preview: conversationPreview(state.messages),
    createdAt: existing?.createdAt ?? state.messages[0]?.createdAt ?? now,
    updatedAt: now,
    messages: cloneMessages(state.messages),
    mapDecisions: decisionsForMessages(state.messages, state.mapDecisions),
  };
  const savedConversations = [
    ...state.savedConversations.filter((item) => item.id !== conversation.id),
    conversation,
  ].slice(-MAX_SAVED_CONVERSATIONS);

  return {
    status: existing ? "updated" : "saved",
    conversation,
    savedConversations,
  };
}

function normalizeMessages(value: unknown): AiProfessorMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((message): message is AiProfessorMessage => (
      Boolean(message)
      && typeof message === "object"
      && typeof message.id === "string"
      && (message.role === "user" || message.role === "assistant")
      && typeof message.content === "string"
      && typeof message.createdAt === "string"
    ))
    .slice(-MAX_MESSAGES)
    .map((message) => ({
      ...message,
      branchParentMessageId: typeof message.branchParentMessageId === "string"
        ? message.branchParentMessageId
        : null,
      reflection: message.reflection && typeof message.reflection === "object"
        && typeof message.reflection.title === "string"
        && typeof message.reflection.body === "string"
        ? { title: message.reflection.title, body: message.reflection.body }
        : null,
      suggestedPrompts: Array.isArray(message.suggestedPrompts)
        ? message.suggestedPrompts.filter((prompt): prompt is string => typeof prompt === "string")
        : [],
    }));
}

function normalizeMapDecisions(value: unknown): Record<string, AiConversationMapDecision> {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, AiConversationMapDecision] => (
      entry[1] === "keep" || entry[1] === "exclude"
    )),
  );
}

function normalizeSavedConversations(value: unknown): AiProfessorConversationSnapshot[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw) => {
    if (!raw || typeof raw !== "object") return [];
    const item = raw as Partial<AiProfessorConversationSnapshot>;
    const messages = normalizeMessages(item.messages);
    if (!item.id || typeof item.id !== "string" || !messages.length) return [];
    const createdAt = typeof item.createdAt === "string" ? item.createdAt : messages[0]?.createdAt;
    const updatedAt = typeof item.updatedAt === "string" ? item.updatedAt : createdAt;
    return [{
      schemaVersion: 1 as const,
      id: item.id,
      title: trimText(typeof item.title === "string" ? item.title : conversationTitle(messages), 36),
      preview: trimText(typeof item.preview === "string" ? item.preview : conversationPreview(messages), 96),
      createdAt: createdAt ?? new Date(0).toISOString(),
      updatedAt: updatedAt ?? new Date(0).toISOString(),
      messages,
      mapDecisions: decisionsForMessages(messages, normalizeMapDecisions(item.mapDecisions)),
    }];
  }).slice(-MAX_SAVED_CONVERSATIONS);
}

function conversationBranchMessageIds(
  messages: AiProfessorMessage[],
  messageId: string,
): Set<string> {
  const assistantByUser = new Map<string, string>();
  const userByAssistant = new Map<string, string>();
  const parentByAssistant = new Map<string, string | null>();
  let pendingUser: AiProfessorMessage | null = null;
  let previousAssistantId: string | null = null;

  for (const message of messages) {
    if (message.role === "user") {
      pendingUser = message;
      continue;
    }

    if (pendingUser) {
      assistantByUser.set(pendingUser.id, message.id);
      userByAssistant.set(message.id, pendingUser.id);
    }
    parentByAssistant.set(
      message.id,
      pendingUser?.branchParentMessageId || previousAssistantId,
    );
    previousAssistantId = message.id;
    pendingUser = null;
  }

  const rootAssistantId = parentByAssistant.has(messageId)
    ? messageId
    : assistantByUser.get(messageId) ?? null;
  if (!rootAssistantId) return new Set([messageId]);

  const removedAssistantIds = new Set([rootAssistantId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const [assistantId, parentId] of parentByAssistant) {
      if (parentId && removedAssistantIds.has(parentId) && !removedAssistantIds.has(assistantId)) {
        removedAssistantIds.add(assistantId);
        changed = true;
      }
    }
  }

  const removedMessageIds = new Set<string>(removedAssistantIds);
  for (const assistantId of removedAssistantIds) {
    const userId = userByAssistant.get(assistantId);
    if (userId) removedMessageIds.add(userId);
  }
  return removedMessageIds;
}

export const useAiProfessorStore = create<AiProfessorState>()(persist((set, get) => ({
  hasHydrated: false,
  messages: [],
  growthNotes: [],
  mapDecisions: {},
  savedConversations: [],
  activeConversationId: null,
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
      content: trimMultilineText(response.reply, 220),
      createdAt: response.generatedAt,
      branchParentMessageId: null,
      reflection: {
        title: trimText(response.reflection.title, 80),
        body: trimMultilineText(response.reflection.body, 180),
      },
      suggestedPrompts: response.suggestedPrompts.map((item) => trimText(item, 40)),
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
  removeConversationBranch: (messageId) => set((state) => {
    const removedMessageIds = conversationBranchMessageIds(state.messages, messageId);
    const mapDecisions = Object.fromEntries(
      Object.entries(state.mapDecisions).filter(([id]) => !removedMessageIds.has(id)),
    );
    return {
      messages: state.messages.filter((message) => !removedMessageIds.has(message.id)),
      mapDecisions,
    };
  }),
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
  saveCurrentConversation: () => {
    const result = upsertCurrentConversation(get());
    if (result.status === "empty") return result;
    set({
      savedConversations: result.savedConversations,
      activeConversationId: result.conversation.id,
    });
    return result;
  },
  startNewConversation: () => {
    const result = upsertCurrentConversation(get());
    set({
      savedConversations: result.savedConversations,
      activeConversationId: null,
      messages: [],
      mapDecisions: {},
    });
    return result;
  },
  openConversation: (id) => {
    const state = get();
    const target = state.savedConversations.find((conversation) => conversation.id === id);
    if (!target) return false;
    if (state.activeConversationId === id) return true;

    const current = upsertCurrentConversation(state);
    let savedConversations = current.savedConversations;
    if (!savedConversations.some((conversation) => conversation.id === id)) {
      savedConversations = [
        ...savedConversations.slice(-(MAX_SAVED_CONVERSATIONS - 1)),
        target,
      ];
    }
    const latestTarget = savedConversations.find((conversation) => conversation.id === id) ?? target;
    set({
      savedConversations,
      activeConversationId: id,
      messages: cloneMessages(latestTarget.messages),
      mapDecisions: { ...latestTarget.mapDecisions },
    });
    return true;
  },
  removeSavedConversation: (id) => set((state) => ({
    savedConversations: state.savedConversations.filter((conversation) => conversation.id !== id),
    activeConversationId: state.activeConversationId === id ? null : state.activeConversationId,
  })),
  clearConversation: () => set({ messages: [], mapDecisions: {}, activeConversationId: null }),
  clearGrowthNotes: () => set({ growthNotes: [] }),
}), {
  name: "major-evolution-ai-professor-v1",
  version: 4,
  storage: createJSONStorage(() => localStorage),
  skipHydration: true,
  partialize: ({
    messages,
    growthNotes,
    mapDecisions,
    savedConversations,
    activeConversationId,
  }) => ({
    messages,
    growthNotes,
    mapDecisions,
    savedConversations,
    activeConversationId,
  }),
  migrate: migrateAiProfessorState,
  onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
}));

export function migrateAiProfessorState(persistedState: unknown) {
  const state = persistedState && typeof persistedState === "object"
    ? persistedState as Partial<AiProfessorState>
    : {};
  const savedConversations = normalizeSavedConversations(state.savedConversations);
  const activeConversationId = typeof state.activeConversationId === "string"
    && savedConversations.some((conversation) => conversation.id === state.activeConversationId)
    ? state.activeConversationId
    : null;
  return {
    messages: normalizeMessages(state.messages),
    growthNotes: Array.isArray(state.growthNotes) ? state.growthNotes : [],
    mapDecisions: normalizeMapDecisions(state.mapDecisions),
    savedConversations,
    activeConversationId,
  };
}
