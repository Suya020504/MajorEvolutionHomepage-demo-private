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
  mapSummary: string;
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
  const normalizedTitle = normalize(title);
  if (/다음\s*(행동|단계|걸음)|실행|이번\s*주|해볼\s*일/.test(normalizedTitle)) return "action";
  if (/결정|선택|정하기|확정|우선순위/.test(normalizedTitle)) return "decision";
  if (/발견|깨달|알게|핵심|정리|가능성|강점/.test(normalizedTitle)) return "insight";
  if (/고민|질문|궁금|비교/.test(normalizedTitle)) return "question";

  // 성장 대화 답변에는 항상 '다음 행동'이 포함되므로 답변 전체만으로 유형을
  // 분류하면 모든 카드가 행동으로 보입니다. 제목과 학생의 실제 질문을 우선합니다.
  if (/[?？]|어떤|무엇|어떻게|고민|궁금/.test(userText)) return "question";
  if (/결정|선택|정하기|확정|우선순위/.test(userText)) return "decision";
  if (/실행|시작|연락|작성|준비/.test(userText)) return "action";
  if (/알게|발견|깨달|핵심은|관심은|강점|가능성/.test(assistantText)) return "insight";
  return "question";
}

const REFLECTION_SECTION = /(?:^|\s)(현재\s*고민|시도할\s*방향|다음\s*(?:행동|단계|걸음)|핵심|발견|선택)\s*[:：]\s*/g;

function reflectionSections(value: string) {
  const text = normalize(value);
  const matches = [...text.matchAll(REFLECTION_SECTION)];
  if (!matches.length) return [{ label: "", body: text }];

  return matches.map((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[index + 1]?.index ?? text.length;
    return { label: normalize(match[1]), body: text.slice(start, end).trim() };
  });
}

function buildMapSummary(value: string, type: ConversationMapNodeType, title: string) {
  const sections = reflectionSections(value).filter((section) => section.body);
  const preferredLabels = type === "action"
    ? [/다음/]
    : type === "decision"
      ? [/선택|시도할 방향/]
      : /고민|질문/.test(title)
        ? [/현재 고민/]
        : [/시도할 방향|핵심|발견/, /현재 고민/];
  const preferred = preferredLabels
    .map((pattern) => sections.find((section) => pattern.test(section.label)))
    .find(Boolean);
  return shorten(preferred?.body || sections[0]?.body || value, 48);
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
    const parentId = requestedParentId
      ? baseNodes.some((node) => node.id === requestedParentId)
        ? requestedParentId
        : null
      : lastAssistantId;
    const title = shorten(reflectionTitle || userText || "대화에서 정리한 생각", 54);
    const summarySource = reflectionBody || message.content;

    baseNodes.push({
      id: message.id,
      type,
      typeLabel: TYPE_LABELS[type],
      topic: classifyTopic(sourceForTopic),
      title,
      summary: shorten(summarySource, 170),
      mapSummary: buildMapSummary(summarySource, type, title),
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

/**
 * 선택한 AI 답변까지의 실제 부모 경로만 대화 순서로 복원합니다.
 * 다른 갈래의 형제 메시지는 AI 요청 문맥에 섞지 않습니다.
 */
export function conversationLineageToAssistant(
  messages: AiProfessorMessage[],
  assistantId: string,
): AiProfessorMessage[] {
  const nodes = buildConversationMap(messages, []);
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const lineage: ConversationMapNode[] = [];
  const seen = new Set<string>();
  let current = nodeById.get(assistantId) ?? null;

  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    lineage.unshift(current);
    current = current.parentId ? nodeById.get(current.parentId) ?? null : null;
  }

  return lineage.flatMap((node) => (
    node.userMessage
      ? [node.userMessage, node.assistantMessage]
      : [node.assistantMessage]
  ));
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
