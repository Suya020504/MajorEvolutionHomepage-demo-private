import type { AiGrowthNote, AiProfessorMessage } from "@/store/ai-professor-store";

export type ConversationMapNodeType = "question" | "insight" | "decision" | "action";

export type ConversationMapTopic = "진로 방향" | "프로젝트" | "교수 만남" | "생각 정리";

export type ConversationMapNode = {
  id: string;
  type: ConversationMapNodeType;
  typeLabel: "질문" | "발견" | "결정" | "다음 행동";
  topic: ConversationMapTopic;
  title: string;
  summary: string;
  userMessage: AiProfessorMessage | null;
  assistantMessage: AiProfessorMessage;
  isSaved: boolean;
  parentId: string | null;
  childIds: string[];
  depth: number;
  previousId: string | null;
  nextId: string | null;
};

const TYPE_LABELS: Record<ConversationMapNodeType, ConversationMapNode["typeLabel"]> = {
  question: "질문",
  insight: "발견",
  decision: "결정",
  action: "다음 행동",
};

function normalize(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function shorten(value: string, max: number) {
  const text = normalize(value);
  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
}

function classifyType(userText: string, assistantText: string, title: string): ConversationMapNodeType {
  const combined = `${userText} ${assistantText}`;
  if (/다음\s*(행동|단계|걸음)|실행|이번\s*주/.test(title)) return "action";
  if (/결정|선택|정하기|확정/.test(title)) return "decision";
  if (/다음\s*(행동|단계|걸음)|이번\s*주|먼저\s*해|시작해|실행|연락|작성해|준비해/.test(combined)) {
    return "action";
  }
  if (/결정|선택|정하기|정했|우선순위|확정|집중하기|방향으로/.test(combined)) {
    return "decision";
  }
  if (/알게|발견|깨달|정리하면|핵심은|관심은|강점|가능성/.test(assistantText)) {
    return "insight";
  }
  return "question";
}

function classifyTopic(value: string): ConversationMapTopic {
  if (/교수|면담|상담|이메일|연락|질문/.test(value)) return "교수 만남";
  if (/프로젝트|연구|아이디어|주제|실험|설계|개발/.test(value)) return "프로젝트";
  if (/진로|취업|직무|전공|적성|커리어/.test(value)) return "진로 방향";
  return "생각 정리";
}

export function buildConversationMap(
  messages: AiProfessorMessage[],
  growthNotes: AiGrowthNote[],
): ConversationMapNode[] {
  let lastUserMessage: AiProfessorMessage | null = null;
  let lastAssistantId: string | null = null;
  const savedIds = new Set(growthNotes.map((note) => note.sourceMessageId));
  const baseNodes: Omit<ConversationMapNode, "childIds" | "depth" | "previousId" | "nextId">[] = [];

  for (const message of messages) {
    if (message.role === "user") {
      lastUserMessage = message;
      continue;
    }

    const userText = lastUserMessage?.content ?? "";
    const reflectionTitle = message.reflection?.title ?? "";
    const reflectionBody = message.reflection?.body ?? "";
    const type = classifyType(userText, `${reflectionTitle} ${reflectionBody} ${message.content}`, reflectionTitle);
    const sourceForTopic = `${userText} ${reflectionTitle} ${reflectionBody}`;
    const requestedParentId = lastUserMessage?.branchParentMessageId ?? null;
    const parentId = requestedParentId && baseNodes.some((node) => node.id === requestedParentId)
      ? requestedParentId
      : lastAssistantId;

    baseNodes.push({
      id: message.id,
      type,
      typeLabel: TYPE_LABELS[type],
      topic: classifyTopic(sourceForTopic),
      title: shorten(reflectionTitle || userText || "대화에서 정리한 생각", 54),
      summary: shorten(reflectionBody || message.content, 170),
      userMessage: lastUserMessage,
      assistantMessage: message,
      isSaved: savedIds.has(message.id),
      parentId,
    });
    lastAssistantId = message.id;
  }

  const childrenByParent = new Map<string, string[]>();
  for (const node of baseNodes) {
    if (!node.parentId) continue;
    const children = childrenByParent.get(node.parentId) ?? [];
    children.push(node.id);
    childrenByParent.set(node.parentId, children);
  }

  const depthById = new Map<string, number>();
  const findDepth = (id: string, seen = new Set<string>()): number => {
    if (depthById.has(id)) return depthById.get(id) ?? 0;
    if (seen.has(id)) return 0;
    const node = baseNodes.find((item) => item.id === id);
    if (!node?.parentId) return 0;
    seen.add(id);
    const depth = findDepth(node.parentId, seen) + 1;
    depthById.set(id, depth);
    return depth;
  };

  return baseNodes.map((node) => {
    const childIds = childrenByParent.get(node.id) ?? [];
    return {
      ...node,
      childIds,
      depth: findDepth(node.id),
      previousId: node.parentId,
      nextId: childIds[0] ?? null,
    };
  });
}

export function getConversationMapRoots(nodes: ConversationMapNode[]) {
  const ids = new Set(nodes.map((node) => node.id));
  return nodes.filter((node) => !node.parentId || !ids.has(node.parentId));
}

export function countConversationMapTypes(nodes: ConversationMapNode[]) {
  return nodes.reduce<Record<ConversationMapNodeType, number>>((counts, node) => {
    counts[node.type] += 1;
    return counts;
  }, { question: 0, insight: 0, decision: 0, action: 0 });
}
