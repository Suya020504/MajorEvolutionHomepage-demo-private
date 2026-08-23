"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Bot,
  Check,
  GitBranch,
  GraduationCap,
  Lightbulb,
  LoaderCircle,
  MessageCircleMore,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { AppShell } from "@/components/app/primitives";
import { ServiceBottomNav } from "@/components/app/side-nav";
import { ServiceMobileHeader } from "@/components/app/service-hub";
import { AiConversationMap } from "@/components/screens/ai-conversation-map";
import { requestGrowthProfessorReply } from "@/lib/ai-client";
import type {
  GrowthProfessorContext,
  GrowthProfessorMessage,
} from "@/lib/ai-growth-professor";
import { useAiProfessorStore } from "@/store/ai-professor-store";
import { useResearchStore } from "@/store/research-store";
import styles from "./ai-professor-screen.module.css";

const QUICK_PROMPTS = [
  "내 진로 고민을 한 문장으로 정리하고 싶어요",
  "지금 프로젝트의 다음 한 걸음을 같이 정해요",
  "교수님께 물어볼 첫 질문을 만들고 싶어요",
] as const;

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "방금";
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function AiProfessorScreen() {
  const hasResearchHydrated = useResearchStore((state) => state.hasHydrated);
  const conditions = useResearchStore((state) => state.conditions);
  const discovery = useResearchStore((state) => state.professorDiscoverySummary);
  const directionBaseline = useResearchStore((state) => state.growthDirectionBaseline);
  const projects = useResearchStore((state) => state.growthProjectHistory);
  const professors = useResearchStore((state) => state.growthProfessorHistory);

  const hasAiHydrated = useAiProfessorStore((state) => state.hasHydrated);
  const messages = useAiProfessorStore((state) => state.messages);
  const growthNotes = useAiProfessorStore((state) => state.growthNotes);
  const mapDecisions = useAiProfessorStore((state) => state.mapDecisions);
  const addUserMessage = useAiProfessorStore((state) => state.addUserMessage);
  const addAssistantMessage = useAiProfessorStore((state) => state.addAssistantMessage);
  const saveReflection = useAiProfessorStore((state) => state.saveReflection);
  const removeGrowthNote = useAiProfessorStore((state) => state.removeGrowthNote);
  const setMapDecision = useAiProfessorStore((state) => state.setMapDecision);
  const clearMapDecision = useAiProfessorStore((state) => state.clearMapDecision);
  const clearConversation = useAiProfessorStore((state) => state.clearConversation);

  const [viewMode, setViewMode] = useState<"chat" | "map">("chat");
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [savedMessageId, setSavedMessageId] = useState<string | null>(null);
  const [branchOrigin, setBranchOrigin] = useState<{ parentId: string; title: string } | null>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const context = useMemo<GrowthProfessorContext>(() => {
    const latestProject = projects.at(-1) ?? null;
    const latestProfessor = [...professors].reverse().find((item) => item.selectedAt)
      ?? professors.at(-1)
      ?? null;
    return {
      major: conditions.major || discovery?.major || directionBaseline?.major || "전공 미입력",
      interests: conditions.interests.length
        ? conditions.interests
        : discovery?.interests.length
          ? discovery.interests
          : directionBaseline?.interests ?? [],
      careerConcerns: discovery?.careerConcerns.length
        ? discovery.careerConcerns
        : directionBaseline?.careerConcerns ?? [],
      project: latestProject ? {
        title: latestProject.title,
        question: latestProject.question,
        firstAction: "다음 행동을 대화로 구체화하는 중",
      } : null,
      professor: latestProfessor ? {
        name: latestProfessor.name,
        department: latestProfessor.department || latestProfessor.college,
        reason: latestProfessor.reason,
      } : null,
    };
  }, [conditions, directionBaseline, discovery, professors, projects]);

  const lastSuggestions = [...messages]
    .reverse()
    .find((message) => message.role === "assistant")
    ?.suggestedPrompts.slice(0, 3) ?? [];

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ block: "nearest" });
  }, [isSending, messages.length]);

  const requestReply = async (conversation: GrowthProfessorMessage[]) => {
    setError("");
    setSavedMessageId(null);
    setIsSending(true);
    try {
      addAssistantMessage(await requestGrowthProfessorReply({ context, messages: conversation }));
    } catch (caught) {
      setError(caught instanceof Error
        ? caught.message
        : "대화를 이어가지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsSending(false);
      window.requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  const sendMessage = async (preset?: string) => {
    const content = (preset ?? draft).trim();
    if (!content || isSending) return;
    setDraft("");
    const userMessage = addUserMessage(content, branchOrigin?.parentId ?? null);
    const parentIndex = branchOrigin
      ? messages.findIndex((message) => message.id === branchOrigin.parentId)
      : -1;
    const conversationBase = parentIndex >= 0 ? messages.slice(0, parentIndex + 1) : messages;
    setBranchOrigin(null);
    await requestReply(
      [...conversationBase, userMessage]
        .slice(-12)
        .map(({ role, content: messageContent }) => ({ role, content: messageContent })),
    );
  };

  const retryLastMessage = async () => {
    if (isSending || messages.at(-1)?.role !== "user") return;
    const lastUserMessage = messages.at(-1);
    const parentIndex = lastUserMessage?.branchParentMessageId
      ? messages.findIndex((message) => message.id === lastUserMessage.branchParentMessageId)
      : -1;
    const retryMessages = parentIndex >= 0 && lastUserMessage
      ? [...messages.slice(0, parentIndex + 1), lastUserMessage]
      : messages;
    await requestReply(
      retryMessages.slice(-12).map(({ role, content }) => ({ role, content })),
    );
  };

  if (!hasResearchHydrated || !hasAiHydrated) {
    return (
      <div className="research-loading">
        <LoaderCircle className="spin" />
        <p>나의 AI 교수님과 성장 기록을 불러오고 있어요.</p>
      </div>
    );
  }

  return (
    <AppShell showHeader={false} className={styles.shell} bottomNav={<ServiceBottomNav />}>
      <ServiceMobileHeader />
      <div className={styles.page}>
        <header className={styles.pageHeader}>
          <Link href="/portfolio" className={styles.backLink}>
            <ArrowLeft size={18} aria-hidden="true" /> 나의 성장과정
          </Link>
          <div className={styles.titleRow}>
            <span className={styles.titleIcon}><Bot size={28} aria-hidden="true" /></span>
            <div>
              <h1>나의 AI 교수님</h1>
              <p>교수님을 만나기 전후, 내 고민과 프로젝트 방향을 함께 정리하는 AI 성장 파트너예요.</p>
            </div>
          </div>
          <div className={styles.boundaryNote} role="note">
            <ShieldCheck size={17} aria-hidden="true" />
            <span>실제 교수님의 지도나 학교의 공식 답변을 대신하지 않으며, 중요한 결정은 직접 확인해요.</span>
          </div>
          <nav className={styles.viewTabs} aria-label="AI 교수님 보기 방식">
            <button
              type="button"
              aria-current={viewMode === "chat" ? "page" : undefined}
              onClick={() => setViewMode("chat")}
            >
              <MessageCircleMore size={17} aria-hidden="true" /> 대화하기
            </button>
            <button
              type="button"
              aria-current={viewMode === "map" ? "page" : undefined}
              onClick={() => setViewMode("map")}
            >
              <GitBranch size={17} aria-hidden="true" /> 대화 지도
              {messages.some((message) => message.role === "assistant") ? (
                <span>{messages.filter((message) => message.role === "assistant").length}</span>
              ) : null}
            </button>
          </nav>
        </header>

        {viewMode === "chat" ? <div className={styles.workspace}>
          <section className={styles.conversation} aria-labelledby="ai-professor-conversation">
            <header className={styles.conversationHeader}>
              <div>
                <h2 id="ai-professor-conversation"><MessageCircleMore size={19} /> 가볍게 이야기하기</h2>
                <p>정답을 받기보다, 지금 내 생각을 한 걸음 더 구체화해요.</p>
              </div>
              {messages.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("AI 교수님과 나눈 대화를 모두 삭제할까요? 성장 메모는 남아 있습니다.")) {
                      clearConversation();
                    }
                  }}
                  className={styles.clearButton}
                >
                  <Trash2 size={15} aria-hidden="true" /> 대화 비우기
                </button>
              ) : null}
            </header>

            <div className={styles.messageList} aria-live="polite">
              <article className={`${styles.message} ${styles.assistantMessage}`}>
                <span className={styles.avatar}><Sparkles size={17} aria-hidden="true" /></span>
                <div>
                  <div className={styles.bubble}>
                    <p>반가워요. 아직 생각이 정리되지 않아도 괜찮아요.</p>
                    <p>진로 고민, 해보고 싶은 프로젝트, 교수님을 만나기 전 준비 중 하나부터 편하게 들려주세요. 제가 질문을 하나씩 드리며 같이 정리해 볼게요.</p>
                  </div>
                  <time>대화 시작</time>
                </div>
              </article>

              {messages.map((message) => {
                const isSaved = growthNotes.some((note) => note.sourceMessageId === message.id);
                return (
                  <article
                    key={message.id}
                    className={`${styles.message} ${message.role === "user" ? styles.userMessage : styles.assistantMessage}`}
                  >
                    {message.role === "assistant" ? (
                      <span className={styles.avatar}><Sparkles size={17} aria-hidden="true" /></span>
                    ) : null}
                    <div>
                      <div className={styles.bubble}>
                        {message.role === "user" && message.branchParentMessageId ? (
                          <span className={styles.branchMessageLabel}><GitBranch size={12} /> 새 갈래에서 이어짐</span>
                        ) : null}
                        {message.content.split("\n").filter(Boolean).map((paragraph, index) => (
                          <p key={`${message.id}-${index}`}>{paragraph}</p>
                        ))}
                      </div>
                      <div className={styles.messageMeta}>
                        <time>{formatTime(message.createdAt)}</time>
                        {message.role === "assistant" && message.reflection ? (
                          <button
                            type="button"
                            disabled={isSaved}
                            onClick={() => {
                              const result = saveReflection(message.id);
                              if (result === "saved") setSavedMessageId(message.id);
                            }}
                          >
                            {isSaved ? <Check size={14} aria-hidden="true" /> : <BookOpenCheck size={14} aria-hidden="true" />}
                            {isSaved ? "성장 메모에 저장됨" : "성장 메모로 남기기"}
                          </button>
                        ) : null}
                      </div>
                      {savedMessageId === message.id ? (
                        <p className={styles.savedStatus} role="status">내 성장 메모에 남겼어요.</p>
                      ) : null}
                    </div>
                  </article>
                );
              })}

              {isSending ? (
                <article className={`${styles.message} ${styles.assistantMessage}`}>
                  <span className={styles.avatar}><Sparkles size={17} aria-hidden="true" /></span>
                  <div className={`${styles.bubble} ${styles.thinkingBubble}`}>
                    <LoaderCircle className="spin" size={18} aria-hidden="true" />
                    <p>지금까지의 성장 맥락과 대화를 함께 살펴보고 있어요.</p>
                  </div>
                </article>
              ) : null}
              <div ref={messageEndRef} />
            </div>

            <div className={styles.composerArea}>
              {error ? (
                <div className={styles.errorRow} role="alert">
                  <span>{error}</span>
                  <button type="button" onClick={() => void retryLastMessage()}>다시 보내기</button>
                </div>
              ) : null}
              {branchOrigin ? (
                <div className={styles.branchComposerContext} role="status">
                  <GitBranch size={16} aria-hidden="true" />
                  <span><strong>새 갈래로 이어가기</strong><small>{branchOrigin.title}</small></span>
                  <button
                    type="button"
                    aria-label="대화 갈래 만들기 취소"
                    onClick={() => setBranchOrigin(null)}
                  >
                    <X size={15} aria-hidden="true" />
                  </button>
                </div>
              ) : null}
              <div className={styles.promptSuggestions} aria-label="이어갈 대화 예시">
                {(lastSuggestions.length ? lastSuggestions : QUICK_PROMPTS).map((prompt) => (
                  <button key={prompt} type="button" onClick={() => {
                    setDraft(prompt);
                    inputRef.current?.focus();
                  }}>
                    {prompt}
                  </button>
                ))}
              </div>
              <div className={styles.composer}>
                <textarea
                  ref={inputRef}
                  value={draft}
                  rows={2}
                  maxLength={600}
                  placeholder="요즘 막막한 점이나 같이 정리하고 싶은 생각을 적어보세요"
                  aria-label="나의 AI 교수님께 보낼 내용"
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void sendMessage();
                    }
                  }}
                />
                <button
                  type="button"
                  disabled={!draft.trim() || isSending}
                  aria-label="메시지 보내기"
                  onClick={() => void sendMessage()}
                >
                  {isSending ? <LoaderCircle className="spin" size={19} /> : <Send size={19} />}
                </button>
              </div>
              <p className={styles.composerHint}>Enter로 보내기 · Shift+Enter로 줄바꿈 · 대화는 이 브라우저에 저장돼요.</p>
            </div>
          </section>

          <aside className={styles.growthRail} aria-label="나의 성장 맥락과 저장 메모">
            <section className={styles.contextSection}>
              <header><Lightbulb size={18} aria-hidden="true" /><h2>함께 보고 있는 내 맥락</h2></header>
              <dl>
                <div><dt>전공</dt><dd>{context.major}</dd></div>
                <div><dt>관심</dt><dd>{context.interests.length ? context.interests.join(" · ") : "대화로 찾아가는 중"}</dd></div>
                <div><dt>프로젝트</dt><dd>{context.project?.title ?? "아직 선택한 프로젝트 없음"}</dd></div>
                <div><dt>연결 교수</dt><dd>{context.professor ? `${context.professor.name} 교수` : "아직 선택한 교수 없음"}</dd></div>
              </dl>
              <p>저장한 내용만 참고하며, 입력하지 않은 성향이나 적성을 추정하지 않아요.</p>
            </section>

            <section className={styles.noteSection}>
              <header>
                <div><BookOpenCheck size={18} aria-hidden="true" /><h2>내 성장 메모</h2></div>
                <span>{growthNotes.length}개</span>
              </header>
              {growthNotes.length ? (
                <ul>
                  {[...growthNotes].reverse().slice(0, 5).map((note) => (
                    <li key={note.id}>
                      <div><strong>{note.title}</strong><p>{note.body}</p></div>
                      <button
                        type="button"
                        aria-label={`${note.title} 메모 삭제`}
                        onClick={() => {
                          if (window.confirm("이 성장 메모를 삭제할까요? 삭제한 메모는 되돌릴 수 없습니다.")) {
                            removeGrowthNote(note.id);
                          }
                        }}
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.emptyNote}>대화 중 남기고 싶은 내용을 직접 선택하면 여기에 쌓여요.</p>
              )}
            </section>

            <nav className={styles.nextLinks} aria-label="다음 성장 행동">
              <Link href="/quest">
                <GraduationCap size={19} aria-hidden="true" />
                <span><strong>실제 교수님 만남 준비</strong><small>첫 질문과 연락 초안 만들기</small></span>
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link href="/research/tutorial">
                <Lightbulb size={19} aria-hidden="true" />
                <span><strong>프로젝트로 구체화</strong><small>AI 공동설계 시작하기</small></span>
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </nav>
          </aside>
        </div> : (
          <AiConversationMap
            messages={messages}
            growthNotes={growthNotes}
            mapDecisions={mapDecisions}
            onSetDecision={setMapDecision}
            onClearDecision={clearMapDecision}
            onSaveReflection={saveReflection}
            onBackToChat={() => setViewMode("chat")}
            onStartBranch={(parentId, prompt, title) => {
              setBranchOrigin({ parentId, title });
              setDraft(prompt);
              setViewMode("chat");
              window.requestAnimationFrame(() => inputRef.current?.focus());
            }}
          />
        )}
      </div>
    </AppShell>
  );
}
