"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Bookmark,
  Check,
  ChevronDown,
  CircleHelp,
  Compass,
  Eye,
  EyeOff,
  GitBranch,
  Lightbulb,
  ListChecks,
  LocateFixed,
  Map as MapIcon,
  MessageCircleMore,
  RotateCcw,
  Sparkles,
  Target,
} from "lucide-react";
import {
  buildConversationMap,
  countConversationMapTypes,
  getConversationMapRoots,
  type ConversationMapNode,
  type ConversationMapNodeType,
} from "@/lib/ai-conversation-map";
import type {
  AiConversationMapDecision,
  AiGrowthNote,
  AiProfessorMessage,
} from "@/store/ai-professor-store";
import styles from "./ai-professor-screen.module.css";

type AiConversationMapProps = {
  messages: AiProfessorMessage[];
  growthNotes: AiGrowthNote[];
  mapDecisions: Record<string, AiConversationMapDecision>;
  onSetDecision: (messageId: string, decision: AiConversationMapDecision) => void;
  onClearDecision: (messageId: string) => void;
  onSaveReflection: (messageId: string) => "saved" | "already-saved" | "missing";
  onBackToChat: () => void;
  onStartBranch: (parentId: string, prompt: string, title: string) => void;
};

const TYPE_ICONS = {
  question: CircleHelp,
  insight: Lightbulb,
  decision: Target,
  action: ListChecks,
} satisfies Record<ConversationMapNodeType, typeof CircleHelp>;

const JOURNEY_LABELS = {
  question: "생각 씨앗",
  insight: "발견한 단서",
  decision: "선택한 갈림길",
  action: "다음 발걸음",
} satisfies Record<ConversationMapNodeType, string>;

const BRANCH_AXES = ["비교·결정", "근거·역량", "프로젝트·실행", "교수 대화"] as const;

const FALLBACK_BRANCH_PROMPTS = {
  "진로 방향": [
    "비슷한 진로를 기준별로 비교해 볼래요",
    "이 방향에 필요한 역량을 확인할래요",
    "일주일 안에 해볼 작은 경험을 정할래요",
    "교수님께 물어볼 첫 질문을 만들래요",
  ],
  프로젝트: [
    "두 아이디어의 장단점을 비교해 볼래요",
    "이 주제에 필요한 근거와 역량을 볼래요",
    "가장 작은 실험부터 설계해 볼래요",
    "교수님께 검토받을 질문을 만들래요",
  ],
  "교수 만남": [
    "어떤 교수님부터 만날지 비교해 볼래요",
    "대화 전 확인할 근거를 정리할래요",
    "면담 뒤 실행할 한 걸음을 정할래요",
    "교수님께 드릴 핵심 질문을 다듬을래요",
  ],
  "생각 정리": [
    "선택 기준을 세워 비교해 볼래요",
    "내 생각의 근거와 빈틈을 확인할래요",
    "작게 시험해 볼 행동을 정할래요",
    "교수님께 물어볼 말로 바꿔 볼래요",
  ],
} satisfies Record<ConversationMapNode["topic"], [string, string, string, string]>;

function getBranchPrompts(node: ConversationMapNode) {
  const prompts = node.assistantMessage.suggestedPrompts.filter(Boolean);
  return prompts.length >= 4 ? prompts.slice(0, 4) : FALLBACK_BRANCH_PROMPTS[node.topic];
}

function excerpt(value: string, max = 260) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > max ? `${normalized.slice(0, max).trim()}…` : normalized;
}

export function AiConversationMap({
  messages,
  growthNotes,
  mapDecisions,
  onSetDecision,
  onClearDecision,
  onSaveReflection,
  onBackToChat,
  onStartBranch,
}: AiConversationMapProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showExcluded, setShowExcluded] = useState(false);
  const [status, setStatus] = useState("");
  const [isPanning, setIsPanning] = useState(false);
  const nodeDetailRef = useRef<HTMLElement>(null);
  const mapCanvasRef = useRef<HTMLDivElement>(null);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, left: 0, top: 0 });

  const nodes = useMemo(
    () => buildConversationMap(messages, growthNotes),
    [growthNotes, messages],
  );
  const visibleNodes = useMemo(
    () => nodes.filter((node) => showExcluded || mapDecisions[node.id] !== "exclude"),
    [mapDecisions, nodes, showExcluded],
  );
  const counts = useMemo(() => countConversationMapTypes(nodes), [nodes]);
  const roots = useMemo(() => getConversationMapRoots(visibleNodes), [visibleNodes]);
  const excludedCount = nodes.filter((node) => mapDecisions[node.id] === "exclude").length;
  const selectedNode = nodes.find((node) => node.id === selectedId) ?? visibleNodes[0] ?? null;
  const branchPrompts = selectedNode ? getBranchPrompts(selectedNode) : [];

  const focusMap = useCallback((behavior: ScrollBehavior = "smooth") => {
    const canvas = mapCanvasRef.current;
    if (!canvas) return;

    canvas.scrollTo({
      left: Math.max(0, (canvas.scrollWidth - canvas.clientWidth) / 2),
      top: 0,
      behavior,
    });
  }, []);

  const beginMapPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest("button, a, input, textarea, select, [role='button']")) return;

    const canvas = event.currentTarget;
    panStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      left: canvas.scrollLeft,
      top: canvas.scrollTop,
    };
    canvas.setPointerCapture(event.pointerId);
    isPanningRef.current = true;
    setIsPanning(true);
  };

  const moveMapPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isPanningRef.current || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const canvas = event.currentTarget;
    canvas.scrollLeft = panStartRef.current.left - (event.clientX - panStartRef.current.x);
    canvas.scrollTop = panStartRef.current.top - (event.clientY - panStartRef.current.y);
    event.preventDefault();
  };

  const endMapPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    isPanningRef.current = false;
    setIsPanning(false);
  };

  const moveMapWithKeyboard = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const distances: Partial<Record<string, [number, number]>> = {
      ArrowLeft: [-80, 0],
      ArrowRight: [80, 0],
      ArrowUp: [0, -80],
      ArrowDown: [0, 80],
    };
    if (event.key === "Home") {
      event.preventDefault();
      focusMap();
      return;
    }
    const distance = distances[event.key];
    if (!distance) return;
    event.preventDefault();
    event.currentTarget.scrollBy({ left: distance[0], top: distance[1], behavior: "smooth" });
  };

  const selectNode = (id: string) => {
    setSelectedId(id);
    setStatus("");
    window.requestAnimationFrame(() => {
      nodeDetailRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  };

  useEffect(() => {
    if (!selectedId && visibleNodes[0]) setSelectedId(visibleNodes[0].id);
    if (selectedId && !nodes.some((node) => node.id === selectedId)) {
      setSelectedId(visibleNodes[0]?.id ?? null);
      setStatus("");
    }
  }, [nodes, selectedId, visibleNodes]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => focusMap("auto"));
    return () => window.cancelAnimationFrame(frame);
  }, [focusMap, showExcluded, visibleNodes.length]);

  if (!nodes.length) {
    return (
      <section className={styles.mapEmpty} aria-labelledby="conversation-map-title">
        <span className={styles.mapEmptyIcon}><GitBranch size={31} aria-hidden="true" /></span>
        <p className={styles.mapEyebrow}>대화 지도</p>
        <h2 id="conversation-map-title">대화를 나누면 생각의 흐름이 여기에 연결돼요</h2>
        <p>내 질문과 AI 교수님의 답변을 바탕으로 질문·발견·결정·다음 행동 카드를 만들어요. 임의의 성향이나 성장 점수는 만들지 않아요.</p>
        <button type="button" onClick={onBackToChat}>
          <MessageCircleMore size={18} aria-hidden="true" /> 첫 대화 시작하기
        </button>
      </section>
    );
  }

  return (
    <section className={styles.mapSection} aria-labelledby="conversation-map-title">
      <header className={styles.mapHeader}>
        <div>
          <p className={styles.mapEyebrow}><Sparkles size={14} aria-hidden="true" /> 대화에서 자동 정리</p>
          <h2 id="conversation-map-title">대화가 자라는 나의 생각 지도</h2>
          <p>긴 대화는 한 줄 핵심으로 접고, 새 질문이 생기면 실제 가지처럼 갈라져요. 노드를 누르면 원문과 앞뒤 흐름이 열려요.</p>
        </div>
        <div className={styles.mapSummary} aria-label="대화 지도 요약">
          <span><strong>{nodes.length}</strong>개 주제</span>
          <span><strong>{counts.decision + counts.action}</strong>개 결정·행동</span>
          <span><strong>{growthNotes.length}</strong>개 성장 메모</span>
        </div>
      </header>

      <div className={styles.mapWorkspace}>
        <div className={styles.mapCanvasWrap}>
          <div className={styles.mapCanvasToolbar}>
            <div>
              <MapIcon size={17} aria-hidden="true" />
              <strong>생각 진화 지도</strong>
              <span>씨앗부터 다음 발걸음까지</span>
            </div>
            {excludedCount ? (
              <button
                type="button"
                aria-pressed={showExcluded}
                onClick={() => setShowExcluded((value) => !value)}
              >
                {showExcluded ? <EyeOff size={15} /> : <Eye size={15} />}
                제외 {excludedCount}개 {showExcluded ? "숨기기" : "보기"}
              </button>
            ) : null}
          </div>

          <div
            ref={mapCanvasRef}
            className={styles.mapCanvas}
            data-panning={isPanning ? "true" : "false"}
            aria-label="나의 생각 진화 갈래 지도. 빈 공간을 드래그하거나 방향키로 이동할 수 있습니다."
            tabIndex={0}
            onKeyDown={moveMapWithKeyboard}
            onPointerDown={beginMapPan}
            onPointerMove={moveMapPan}
            onPointerUp={endMapPan}
            onPointerCancel={endMapPan}
          >
            <div className={styles.mapGraph}>
              <p className={styles.mapSignatureNote}>
                <GitBranch size={14} aria-hidden="true" /> 대화가 깊어지면 새 질문은 옆 가지로 자라요 · 빈 공간을 드래그해 살펴보세요
              </p>
              <div className={styles.mapStartNode}>
                <span><MessageCircleMore size={17} aria-hidden="true" /></span>
                <div><strong>대화 시작</strong><small>내 고민을 말했어요</small></div>
              </div>
              <ArrowDown className={styles.mapDownArrow} size={18} aria-hidden="true" />

              <ol className={styles.mapTree}>
                {roots.map((node) => (
                  <ConversationTreeNode
                    key={node.id}
                    node={node}
                    nodes={visibleNodes}
                    selectedId={selectedNode?.id ?? null}
                    decisions={mapDecisions}
                    onSelect={selectNode}
                  />
                ))}
              </ol>

              {!visibleNodes.length ? (
                <div className={styles.allExcluded}>
                  <EyeOff size={21} aria-hidden="true" />
                  <p>현재 보이는 흐름이 없어요.</p>
                  <button type="button" onClick={() => setShowExcluded(true)}>제외한 흐름 확인하기</button>
                </div>
              ) : (
                <>
                  <ArrowDown className={styles.mapOutcomeArrow} size={18} aria-hidden="true" />
                  <div className={styles.mapOutcomeNode}>
                    <Compass size={18} aria-hidden="true" />
                    <div><strong>지금의 나침반</strong><small>남긴 핵심을 교수 만남과 프로젝트로 이어가요</small></div>
                  </div>
                </>
              )}
            </div>
          </div>
          <button
            type="button"
            className={styles.mapFocusButton}
            onClick={() => focusMap()}
            aria-label="생각 지도의 시작점으로 초점 맞추기"
          >
            <LocateFixed size={16} aria-hidden="true" /> 초점
          </button>
        </div>

        {selectedNode ? (
          <aside ref={nodeDetailRef} className={styles.nodeDetail} aria-label="선택한 대화 주제 세부 카드">
            <header className={styles.nodeDetailHeader}>
              <div className={styles.nodeTags}>
                <span data-type={selectedNode.type}>{selectedNode.typeLabel}</span>
                <span>{selectedNode.topic}</span>
                <span>AI 정리</span>
              </div>
              <h3>{selectedNode.title}</h3>
              <p>{selectedNode.mapSummary}</p>
              <button
                type="button"
                className={styles.nodeResumeButton}
                aria-label={`‘${selectedNode.title}’ 대화에서 새 갈래 이어가기`}
                onClick={() => onStartBranch(selectedNode.id, "", selectedNode.title)}
              >
                <span className={styles.nodeResumeIcon}><GitBranch size={17} aria-hidden="true" /></span>
                <span className={styles.nodeResumeCopy}>
                  <strong>이 대화에서 이어가기</strong>
                  <small>선택한 대화까지 이어받아 새 질문을 시작해요</small>
                </span>
                <ArrowRight size={17} aria-hidden="true" />
              </button>
            </header>

            <div className={styles.nodeDecisionBox}>
              <strong>지도 표시</strong>
              <p>원문 대화는 삭제되지 않아요.</p>
              <div>
                <button
                  type="button"
                  data-active={mapDecisions[selectedNode.id] === "keep"}
                  aria-pressed={mapDecisions[selectedNode.id] === "keep"}
                  onClick={() => {
                    onSetDecision(selectedNode.id, "keep");
                    setStatus("이 생각을 핵심 흐름으로 남겼어요.");
                  }}
                >
                  <Bookmark size={16} aria-hidden="true" /> 핵심으로 남기기
                </button>
                <button
                  type="button"
                  data-active={mapDecisions[selectedNode.id] === "exclude"}
                  aria-pressed={mapDecisions[selectedNode.id] === "exclude"}
                  onClick={() => {
                    onSetDecision(selectedNode.id, "exclude");
                    setStatus("지도에서 제외했어요. 원문 대화는 그대로 남아 있어요.");
                  }}
                >
                  <EyeOff size={16} aria-hidden="true" /> 지도에서 제외
                </button>
              </div>
              {mapDecisions[selectedNode.id] ? (
                <button
                  type="button"
                  className={styles.resetDecision}
                  onClick={() => {
                    onClearDecision(selectedNode.id);
                    setStatus("지도 표시를 기본 상태로 되돌렸어요.");
                  }}
                >
                  <RotateCcw size={13} aria-hidden="true" /> 선택 되돌리기
                </button>
              ) : null}
            </div>

            <details key={`source-${selectedNode.id}`} className={styles.nodeSources}>
              <summary>
                <span>
                  <strong>원문 대화</strong>
                  <small>내 질문과 AI 답변 전체 보기</small>
                </span>
                <ChevronDown size={16} aria-hidden="true" />
              </summary>
              <div className={styles.nodeSourcesBody}>
                <article>
                  <span>내 질문</span>
                  <p>{selectedNode.userMessage ? excerpt(selectedNode.userMessage.content) : "연결된 질문이 없어요."}</p>
                </article>
                <article>
                  <span>AI 교수님 답변</span>
                  <p className={styles.nodeSourceFullText}>{selectedNode.assistantMessage.content}</p>
                </article>
              </div>
            </details>

            <section className={styles.nodeConnections}>
              <h4><GitBranch size={15} aria-hidden="true" /> 연결된 흐름</h4>
              <div>
                <ConnectionButton
                  direction="previous"
                  node={nodes.find((node) => node.id === selectedNode.previousId) ?? null}
                  onSelect={selectNode}
                />
                {selectedNode.childIds.length ? selectedNode.childIds.map((childId) => (
                  <ConnectionButton
                    key={childId}
                    direction="next"
                    node={nodes.find((node) => node.id === childId) ?? null}
                    onSelect={selectNode}
                  />
                )) : (
                  <ConnectionButton direction="next" node={null} onSelect={selectNode} />
                )}
              </div>
            </section>

            <section className={styles.nodeBranches}>
              <div className={styles.nodeBranchesHeading}>
                <div>
                  <h4><GitBranch size={15} aria-hidden="true" /> 이 생각에서 새 갈래 만들기</h4>
                  <p>비교·근거·실행·교수 대화 중 다른 관점을 골라 별도 흐름으로 이어가요.</p>
                </div>
                <span>{branchPrompts.length}개 관점</span>
              </div>
              {branchPrompts.length ? (
                <div className={styles.branchSuggestions}>
                  {branchPrompts.map((prompt, index) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => onStartBranch(selectedNode.id, prompt, selectedNode.title)}
                    >
                      <span>{index + 1}</span>
                      <span className={styles.branchSuggestionCopy}>
                        <small>{BRANCH_AXES[index]}</small>
                        <strong>{prompt}</strong>
                      </span>
                      <ArrowRight size={15} aria-hidden="true" />
                    </button>
                  ))}
                </div>
              ) : null}
            </section>

            <button
              type="button"
              className={styles.saveToGrowth}
              disabled={selectedNode.isSaved || !selectedNode.assistantMessage.reflection}
              onClick={() => {
                const result = onSaveReflection(selectedNode.id);
                setStatus(result === "saved" ? "나의 성장과정 메모에 반영했어요." : "이미 성장 메모에 반영된 내용이에요.");
              }}
            >
              {selectedNode.isSaved ? <Check size={17} /> : <BookOpenCheck size={17} />}
              {selectedNode.isSaved ? "성장 메모에 반영됨" : "나의 성장과정에 반영하기"}
            </button>
            {status ? <p className={styles.nodeStatus} role="status">{status}</p> : null}
          </aside>
        ) : null}
      </div>
    </section>
  );
}

function ConversationTreeNode({
  node,
  nodes,
  selectedId,
  decisions,
  onSelect,
}: {
  node: ConversationMapNode;
  nodes: ConversationMapNode[];
  selectedId: string | null;
  decisions: Record<string, AiConversationMapDecision>;
  onSelect: (id: string) => void;
}) {
  const Icon = TYPE_ICONS[node.type];
  const journeyLabel = JOURNEY_LABELS[node.type];
  const decision = decisions[node.id];
  const children = node.childIds
    .map((id) => nodes.find((candidate) => candidate.id === id))
    .filter((candidate): candidate is ConversationMapNode => Boolean(candidate));

  return (
    <li
      className={styles.mapTreeItem}
      data-depth={node.depth}
      data-child-count={children.length}
    >
      <button
        type="button"
        className={styles.mapNode}
        data-type={node.type}
        data-selected={selectedId === node.id ? "true" : "false"}
        data-decision={decision ?? "none"}
        data-branching={children.length > 1 ? "true" : "false"}
        aria-pressed={selectedId === node.id}
        onClick={() => onSelect(node.id)}
      >
        <span className={styles.mapNodeMeta}>
          <span><Icon size={14} aria-hidden="true" /> {journeyLabel}</span>
          <small>{node.topic}</small>
        </span>
        <strong>{node.title}</strong>
        <p>{node.mapSummary}</p>
        <span className={styles.mapNodeState}>
          {decision === "keep" ? <><Bookmark size={13} fill="currentColor" /> 핵심으로 남김</> : null}
          {decision === "exclude" ? <><EyeOff size={13} /> 지도에서 제외됨</> : null}
          {!decision && children.length > 1 ? <><GitBranch size={13} /> 생각 가지 {children.length}개가 열렸어요</> : null}
          {!decision && children.length <= 1 && node.isSaved ? <><Check size={13} /> 성장 메모에 반영</> : null}
          {!decision && children.length <= 1 && !node.isSaved ? <>원문 대화 열기 <ArrowRight size={13} /></> : null}
        </span>
      </button>
      {children.length ? (
        <ol>
          {children.map((child) => (
            <ConversationTreeNode
              key={child.id}
              node={child}
              nodes={nodes}
              selectedId={selectedId}
              decisions={decisions}
              onSelect={onSelect}
            />
          ))}
        </ol>
      ) : null}
    </li>
  );
}

function ConnectionButton({
  direction,
  node,
  onSelect,
}: {
  direction: "previous" | "next";
  node: ConversationMapNode | null;
  onSelect: (id: string) => void;
}) {
  return (
    <button type="button" disabled={!node} onClick={() => node && onSelect(node.id)}>
      {direction === "previous" ? <ArrowLeft size={14} /> : null}
      <span>
        <small>{direction === "previous" ? "이전 흐름" : "다음 흐름"}</small>
        <strong>{node?.title ?? (direction === "previous" ? "대화 시작" : "현재 마지막 흐름")}</strong>
      </span>
      {direction === "next" ? <ArrowRight size={14} /> : null}
    </button>
  );
}
