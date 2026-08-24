"use client";

import Link from "next/link";
import {
  BookOpenCheck,
  CalendarCheck,
  ChevronDown,
  Download,
  FileText,
  FlaskConical,
  GraduationCap,
  HardDrive,
  Heart,
  History,
  MessageCircleMore,
  NotebookPen,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { useQuestStore } from "@/store/quest-store";
import { useResearchStore } from "@/store/research-store";
import { useAiProfessorStore } from "@/store/ai-professor-store";
import { useProfileStore } from "@/store/profile-store";
import { buildConversationMap } from "@/lib/ai-conversation-map";
import styles from "./data-controls.module.css";

type CategoryGroup = "direction" | "meeting" | "ai";

type RecordItem = {
  id: string;
  title: string;
  description: string;
  latestAt: string | null;
  remove: () => void;
  warning?: string;
};

type Category = {
  id: string;
  group: CategoryGroup;
  label: string;
  description: string;
  details: string[];
  items: RecordItem[];
  unit: string;
  icon: LucideIcon;
  tone: "violet" | "mint" | "blue";
};

const GROUPS: Array<{
  id: CategoryGroup;
  label: string;
  description: string;
}> = [
  {
    id: "direction",
    label: "나의 방향과 프로젝트",
    description: "처음 입력한 고민부터 선택한 프로젝트까지 비교에 쓰는 기록이에요.",
  },
  {
    id: "meeting",
    label: "교수 연결과 만남",
    description: "교수를 찾고 대화를 준비한 뒤 남긴 행동 기록이에요.",
  },
  {
    id: "ai",
    label: "나의 AI 교수님",
    description: "생각을 정리한 대화와 직접 저장한 성장 메모예요.",
  },
];

function latestDate(values: Array<string | null | undefined>): string | null {
  const timestamps = values
    .map((value) => value ? new Date(value).getTime() : Number.NaN)
    .filter((value) => Number.isFinite(value));
  if (!timestamps.length) return null;
  return new Date(Math.max(...timestamps)).toISOString();
}

function formatDate(value: string | null): string {
  if (!value) return "저장 시각 없음";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "최근 저장됨";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function hasProfileValue(profile: ReturnType<typeof useProfileStore.getState>["profile"]): boolean {
  return Boolean(
    profile.name
    || profile.school
    || profile.major
    || profile.grade
    || profile.careerConcern
    || profile.interests.length,
  );
}

function excerpt(value: string, max = 84): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized.length > max ? `${normalized.slice(0, max).trim()}…` : normalized;
}

const PROFESSOR_SOURCE_LABEL = {
  student: "내 고민으로 연결",
  project: "프로젝트로 연결",
  paper: "논문에서 연결",
} as const;

const QUEST_TOOL_LABEL = {
  "paper-bite": "논문 한입",
  "first-line": "첫 질문",
  "silence-rescue": "침묵 구조대",
  "email-guard": "이메일 초안",
  "next-seed": "다음 만남 씨앗",
} as const;

export function DataControls({ showHeading = true }: { showHeading?: boolean }) {
  const profile = useProfileStore((state) => state.profile);
  const clearProfile = useProfileStore((state) => state.clearProfile);
  const matches = useResearchStore((state) => state.professorMatches);
  const growthDirectionBaseline = useResearchStore((state) => state.growthDirectionBaseline);
  const growthProjectHistory = useResearchStore((state) => state.growthProjectHistory);
  const growthProfessorHistory = useResearchStore((state) => state.growthProfessorHistory);
  const selectedProfessorPaper = useResearchStore((state) => state.selectedProfessorPaper);
  const favoriteProfessorIds = useResearchStore((state) => state.favoriteProfessorIds);
  const knockKitDrafts = useResearchStore((state) => state.knockKitDrafts);
  const mentorLoopEntries = useResearchStore((state) => state.mentorLoopEntries);
  const clearGrowthDirectionBaseline = useResearchStore((state) => state.clearGrowthDirectionBaseline);
  const removeGrowthProjectRecord = useResearchStore((state) => state.removeGrowthProjectRecord);
  const removeGrowthProfessorRecord = useResearchStore((state) => state.removeGrowthProfessorRecord);
  const removeFavoriteProfessors = useResearchStore((state) => state.removeFavoriteProfessors);
  const deleteKnockKitDraft = useResearchStore((state) => state.deleteKnockKitDraft);
  const deleteMentorLoopEntry = useResearchStore((state) => state.deleteMentorLoopEntry);
  const cards = useQuestStore((state) => state.cards);
  const deleteCard = useQuestStore((state) => state.deleteCard);
  const aiMessages = useAiProfessorStore((state) => state.messages);
  const aiGrowthNotes = useAiProfessorStore((state) => state.growthNotes);
  const aiMapDecisions = useAiProfessorStore((state) => state.mapDecisions);
  const removeConversationBranch = useAiProfessorStore((state) => state.removeConversationBranch);
  const removeGrowthNote = useAiProfessorStore((state) => state.removeGrowthNote);

  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [pending, setPending] = useState<{ categoryId: string; itemId: string } | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const professorNameById = new Map<string, { name: string; department: string }>();
  for (const match of matches) {
    professorNameById.set(match.professor.id, {
      name: `${match.professor.name} ${match.professor.title}`.trim(),
      department: match.professor.department,
    });
  }
  for (const record of growthProfessorHistory) {
    professorNameById.set(record.professorId, {
      name: `${record.name} ${record.title}`.trim(),
      department: record.department || record.college,
    });
  }

  const professorLabel = (professorId: string) => professorNameById.get(professorId) ?? {
    name: "저장한 교수님",
    department: `교수 ID ${professorId}`,
  };

  const profileItems: RecordItem[] = hasProfileValue(profile) ? [{
    id: "profile",
    title: profile.name ? `${profile.name}님의 기본 정보` : "내 기본 정보",
    description: [profile.school, profile.major, profile.grade].filter(Boolean).join(" · ")
      || excerpt(profile.careerConcern || profile.interests.join(", ")),
    latestAt: profile.updatedAt,
    remove: clearProfile,
  }] : [];

  const directionItems: RecordItem[] = growthDirectionBaseline ? [{
    id: "direction-baseline",
    title: growthDirectionBaseline.major || "처음 저장한 진로 방향",
    description: excerpt([
      ...growthDirectionBaseline.interests,
      ...growthDirectionBaseline.careerConcerns,
    ].join(" · ")),
    latestAt: growthDirectionBaseline.capturedAt,
    remove: clearGrowthDirectionBaseline,
  }] : [];

  const projectItems: RecordItem[] = growthProjectHistory.map((record) => ({
    id: record.topicId,
    title: record.title,
    description: excerpt(record.question || "선택한 프로젝트 질문"),
    latestAt: record.selectedAt,
    remove: () => removeGrowthProjectRecord(record.topicId),
  }));

  const professorItems: RecordItem[] = growthProfessorHistory.map((record) => ({
    id: `${record.source}:${record.professorId}`,
    title: `${record.name} ${record.title}`.trim(),
    description: excerpt([
      PROFESSOR_SOURCE_LABEL[record.source],
      record.department || record.college,
      record.reason,
    ].filter(Boolean).join(" · ")),
    latestAt: record.selectedAt || record.connectedAt,
    remove: () => removeGrowthProfessorRecord(record.professorId, record.source),
  }));

  const favoriteItems: RecordItem[] = favoriteProfessorIds.map((professorId) => {
    const professor = professorLabel(professorId);
    const connectedAt = growthProfessorHistory.find(
      (record) => record.professorId === professorId,
    )?.connectedAt ?? null;
    return {
      id: professorId,
      title: professor.name,
      description: professor.department || "관심 교수로 저장됨",
      latestAt: connectedAt,
      remove: () => removeFavoriteProfessors([professorId]),
    };
  });

  const questItems: RecordItem[] = cards.map((card) => ({
    id: card.id,
    title: card.title,
    description: excerpt(`${QUEST_TOOL_LABEL[card.tool]} · ${card.body}`),
    latestAt: card.updatedAt,
    remove: () => deleteCard(card.id),
  }));

  const draftItems: RecordItem[] = Object.entries(knockKitDrafts).map(([key, draft]) => {
    const professor = professorLabel(draft.professorId);
    return {
      id: key,
      title: `${professor.name} 면담 요청 초안`,
      description: excerpt(draft.agenda || draft.emailDraft || professor.department),
      latestAt: draft.updatedAt,
      remove: () => deleteKnockKitDraft(key),
    };
  });

  const loopItems: RecordItem[] = Object.entries(mentorLoopEntries).map(([key, entry]) => {
    const professor = professorLabel(entry.professorId);
    return {
      id: key,
      title: `${professor.name} 면담 후 기록`,
      description: excerpt(entry.feedbackSummary || entry.commitment || entry.after.question),
      latestAt: entry.updatedAt,
      remove: () => deleteMentorLoopEntry(key),
    };
  });

  const conversationNodes = buildConversationMap(aiMessages, aiGrowthNotes);
  const pairedUserIds = new Set(
    conversationNodes.flatMap((node) => node.userMessage ? [node.userMessage.id] : []),
  );
  const conversationItems: RecordItem[] = [
    ...conversationNodes.map((node) => ({
      id: node.id,
      title: node.title,
      description: excerpt(`${node.topic} · ${node.summary}`),
      latestAt: node.assistantMessage.createdAt,
      remove: () => removeConversationBranch(node.id),
      warning: node.childIds.length
        ? `이 주제에서 갈라진 후속 대화 ${node.childIds.length}개도 함께 삭제돼요.`
        : "이 질문과 AI 답변 한 묶음만 삭제해요.",
    })),
    ...aiMessages
      .filter((message) => message.role === "user" && !pairedUserIds.has(message.id))
      .map((message) => ({
        id: message.id,
        title: "답변 전 저장된 내 질문",
        description: excerpt(message.content),
        latestAt: message.createdAt,
        remove: () => removeConversationBranch(message.id),
      })),
  ];

  const growthNoteItems: RecordItem[] = aiGrowthNotes.map((note) => ({
    id: note.id,
    title: note.title,
    description: excerpt(note.body),
    latestAt: note.createdAt,
    remove: () => removeGrowthNote(note.id),
  }));

  const categories: Category[] = [
    {
      id: "profile",
      group: "direction",
      label: "내 기본 정보",
      description: "반복 입력을 줄이기 위해 저장한 학교·전공·관심 정보",
      details: ["이름, 학교, 전공, 학년", "진로 고민과 관심 키워드"],
      items: profileItems,
      unit: "개 프로필",
      icon: UserRound,
      tone: "blue",
    },
    {
      id: "direction",
      group: "direction",
      label: "처음 진로 방향",
      description: "관심과 고민이 어떻게 변했는지 비교하는 첫 기준",
      details: ["처음 확인한 전공·관심사", "처음 남긴 진로 고민"],
      items: directionItems,
      unit: "개 기준",
      icon: History,
      tone: "violet",
    },
    {
      id: "projects",
      group: "direction",
      label: "프로젝트 설계 이력",
      description: "AI와 구체화하고 최종 선택한 프로젝트의 제목과 질문",
      details: ["선택한 프로젝트 제목", "프로젝트 질문과 선택 시각"],
      items: projectItems,
      unit: "개 프로젝트",
      icon: FlaskConical,
      tone: "violet",
    },
    {
      id: "matches",
      group: "meeting",
      label: "교수 연결 결과",
      description: "추천된 교수와 연결 근거, 내가 선택한 교수 기록",
      details: ["학생·프로젝트 기준 추천 결과", "연결 이유와 선택한 교수"],
      items: professorItems,
      unit: "명",
      icon: GraduationCap,
      tone: "mint",
    },
    {
      id: "favorites",
      group: "meeting",
      label: "관심 교수",
      description: "다시 확인하려고 저장한 교수 목록",
      details: ["교수 즐겨찾기 ID", "공식 프로필을 다시 찾기 위한 연결값"],
      items: favoriteItems,
      unit: "명",
      icon: Heart,
      tone: "mint",
    },
    {
      id: "quest",
      group: "meeting",
      label: "대화 준비 카드",
      description: "논문 한입·첫 질문·침묵 구조대·다음 행동 카드",
      details: ["학생이 저장한 카드 제목과 내용", "논문 출처·교수·프로젝트 연결값"],
      items: questItems,
      unit: "장",
      icon: BookOpenCheck,
      tone: "blue",
    },
    {
      id: "drafts",
      group: "meeting",
      label: "면담 요청 초안",
      description: "교수님께 보낼 첫 연락과 면담 질문 준비 내용",
      details: ["자기소개와 질문 3개", "면담 안건과 이메일 초안"],
      items: draftItems,
      unit: "건",
      icon: FileText,
      tone: "blue",
    },
    {
      id: "loops",
      group: "meeting",
      label: "면담 후 성장 기록",
      description: "받은 피드백과 프로젝트 수정 전후, 7일 행동",
      details: ["면담 요약과 추천 자료", "수정 전후 비교와 다음 행동"],
      items: loopItems,
      unit: "건",
      icon: CalendarCheck,
      tone: "mint",
    },
    {
      id: "ai-conversation",
      group: "ai",
      label: "AI 교수님 대화",
      description: "진로 고민과 프로젝트 방향을 정리한 대화",
      details: ["내 질문과 AI 답변", "대화 지도에서 남김·제외한 선택"],
      items: conversationItems,
      unit: "개 주제",
      icon: MessageCircleMore,
      tone: "violet",
    },
    {
      id: "ai-growth-notes",
      group: "ai",
      label: "AI 성장 메모",
      description: "대화에서 골라 직접 성장과정에 저장한 메모",
      details: ["메모 제목과 본문", "원본 대화 연결값과 저장 시각"],
      items: growthNoteItems,
      unit: "개 메모",
      icon: Sparkles,
      tone: "violet",
    },
  ];

  const totalRecords = categories.reduce((sum, category) => sum + category.items.length, 0);
  const activeCategories = categories.filter((category) => category.items.length > 0).length;

  const downloadBackup = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      storageNotice: "이 파일은 사용자가 현재 브라우저에 저장한 기록의 개인 백업입니다.",
      profile,
      growth: {
        directionBaseline: growthDirectionBaseline,
        projectHistory: growthProjectHistory,
        professorHistory: growthProfessorHistory,
      },
      professorConnection: {
        currentMatches: matches,
        selectedProfessorPaper,
        favoriteProfessorIds,
        knockKitDrafts,
        mentorLoopEntries,
      },
      questCards: cards,
      aiProfessor: {
        messages: aiMessages,
        growthNotes: aiGrowthNotes,
        mapDecisions: aiMapDecisions,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `너의교수님은-내기록-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setDone("현재 기기에 저장된 기록을 백업 파일로 내려받았습니다.");
  };

  return (
    <div className={styles.manager}>
      {showHeading ? (
        <header className={styles.heading}>
          <p>LOCAL RECORDS</p>
          <h2>내 기록 관리</h2>
          <span>저장 범위를 확인하고 필요한 기록만 직접 정리할 수 있어요.</span>
        </header>
      ) : null}

      <section className={styles.overview} aria-label="저장 기록 요약">
        <div className={styles.overviewCopy}>
          <span className={styles.overviewIcon}><NotebookPen size={24} aria-hidden="true" /></span>
          <div>
            <p>현재 이 기기에</p>
            <strong>{totalRecords}개의 기록이 저장되어 있어요</strong>
            <small>{activeCategories} / {categories.length}개 기록 종류 사용 중</small>
          </div>
        </div>
        <button type="button" className={styles.downloadButton} onClick={downloadBackup} disabled={totalRecords === 0}>
          <Download size={17} aria-hidden="true" />
          기록 내려받기
        </button>
      </section>

      <aside className={styles.localNotice}>
        <span><HardDrive size={20} aria-hidden="true" /></span>
        <div>
          <strong>현재 브라우저에만 저장돼요</strong>
          <p>별도 서버 계정으로 전송하지 않아요. 브라우저 데이터를 지우거나 다른 기기로 이동하면 기록이 보이지 않을 수 있어요.</p>
        </div>
        <ShieldCheck size={20} aria-hidden="true" />
      </aside>

      {GROUPS.map((group) => {
        const groupedCategories = categories.filter((category) => category.group === group.id);
        const groupCount = groupedCategories.reduce((sum, category) => sum + category.items.length, 0);
        return (
          <section key={group.id} className={styles.group} aria-labelledby={`record-group-${group.id}`}>
            <header className={styles.groupHeading}>
              <div>
                <h3 id={`record-group-${group.id}`}>{group.label}</h3>
                <p>{group.description}</p>
              </div>
              <span>{groupCount}개 저장</span>
            </header>
            <div className={styles.categoryGrid}>
              {groupedCategories.map((category) => {
                const Icon = category.icon;
                const count = category.items.length;
                const isExpanded = expandedCategory === category.id;
                const categoryLatestAt = latestDate(category.items.map((item) => item.latestAt));
                const visibleItems = [...category.items].sort((a, b) => {
                  const aTime = a.latestAt ? new Date(a.latestAt).getTime() : 0;
                  const bTime = b.latestAt ? new Date(b.latestAt).getTime() : 0;
                  return bTime - aTime;
                });
                return (
                  <article key={category.id} className={`${styles.categoryCard} ${styles[`tone_${category.tone}`]}`}>
                    <div className={styles.categoryTop}>
                      <span className={styles.categoryIcon}><Icon size={21} aria-hidden="true" /></span>
                      <span className={count ? styles.savedBadge : styles.emptyBadge}>
                        {count ? `${count}${category.unit}` : "저장 전"}
                      </span>
                    </div>
                    <div className={styles.categoryCopy}>
                      <h4>{category.label}</h4>
                      <p>{category.description}</p>
                    </div>
                    <ul className={styles.detailList}>
                      {category.details.map((detail) => <li key={detail}>{detail}</li>)}
                    </ul>
                    <div className={styles.categoryMeta}>
                      <span>{count
                        ? categoryLatestAt ? `최근 ${formatDate(categoryLatestAt)}` : "저장 시각 정보 없음"
                        : "아직 저장된 내용이 없어요"}</span>
                    </div>
                    <button
                      type="button"
                      className={styles.manageButton}
                      disabled={count === 0}
                      aria-expanded={isExpanded}
                      aria-controls={`record-items-${category.id}`}
                      onClick={() => {
                        setDone(null);
                        setPending(null);
                        setExpandedCategory(isExpanded ? null : category.id);
                      }}
                    >
                      <span>{count ? isExpanded ? "항목 닫기" : `${count}개 항목별 관리` : "관리할 기록 없음"}</span>
                      {count ? <ChevronDown size={16} aria-hidden="true" /> : null}
                    </button>

                    {isExpanded ? (
                      <div id={`record-items-${category.id}`} className={styles.itemPanel}>
                        <p className={styles.itemGuide}>삭제할 항목만 골라 정리하세요. 나머지 기록은 그대로 남아요.</p>
                        <ul className={styles.itemList}>
                          {visibleItems.map((item) => {
                            const isPending = pending?.categoryId === category.id
                              && pending.itemId === item.id;
                            return (
                              <li key={item.id} className={styles.recordItem}>
                                <div className={styles.recordItemRow}>
                                  <div className={styles.recordItemCopy}>
                                    <strong>{item.title}</strong>
                                    <p>{item.description || "저장된 세부 내용"}</p>
                                    <time>{formatDate(item.latestAt)}</time>
                                  </div>
                                  {!isPending ? (
                                    <button
                                      type="button"
                                      className={styles.itemDeleteButton}
                                      aria-label={`${item.title} 삭제`}
                                      onClick={() => {
                                        setDone(null);
                                        setPending({ categoryId: category.id, itemId: item.id });
                                      }}
                                    >
                                      <Trash2 size={15} aria-hidden="true" />
                                      삭제
                                    </button>
                                  ) : null}
                                </div>
                                {isPending ? (
                                  <div className={styles.confirmBox} role="alert">
                                    <strong>‘{item.title}’ 항목만 삭제할까요?</strong>
                                    <p>{item.warning || "이 항목만 삭제하고 같은 종류의 다른 기록은 남겨둡니다."}</p>
                                    <div>
                                      <button type="button" onClick={() => setPending(null)}>취소</button>
                                      <button
                                        type="button"
                                        className={styles.dangerButton}
                                        onClick={() => {
                                          item.remove();
                                          setPending(null);
                                          setDone(`‘${item.title}’ 항목만 삭제했습니다.`);
                                        }}
                                      >
                                        이 항목 삭제
                                      </button>
                                    </div>
                                  </div>
                                ) : null}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}

      <footer className={styles.footerActions}>
        <Link href="/portfolio">성장과정에서 기록 보기</Link>
        <Link href="/profile">내 기본 정보 수정</Link>
      </footer>
      {done ? <p className={styles.status} role="status">{done}</p> : null}
    </div>
  );
}
