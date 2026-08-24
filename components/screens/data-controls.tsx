"use client";

import Link from "next/link";
import {
  BookOpenCheck,
  CalendarCheck,
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
import styles from "./data-controls.module.css";

type CategoryGroup = "direction" | "meeting" | "ai";

type Category = {
  id: string;
  group: CategoryGroup;
  label: string;
  description: string;
  details: string[];
  count: number;
  unit: string;
  latestAt: string | null;
  clear: () => void;
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
  const clearGrowthProjectHistory = useResearchStore((state) => state.clearGrowthProjectHistory);
  const clearProfessorMatches = useResearchStore((state) => state.clearProfessorMatches);
  const clearFavoriteProfessors = useResearchStore((state) => state.clearFavoriteProfessors);
  const clearKnockKitDrafts = useResearchStore((state) => state.clearKnockKitDrafts);
  const clearMentorLoopEntries = useResearchStore((state) => state.clearMentorLoopEntries);
  const cards = useQuestStore((state) => state.cards);
  const clearCards = useQuestStore((state) => state.clearCards);
  const aiMessages = useAiProfessorStore((state) => state.messages);
  const aiGrowthNotes = useAiProfessorStore((state) => state.growthNotes);
  const aiMapDecisions = useAiProfessorStore((state) => state.mapDecisions);
  const clearAiConversation = useAiProfessorStore((state) => state.clearConversation);
  const clearAiGrowthNotes = useAiProfessorStore((state) => state.clearGrowthNotes);

  const [pending, setPending] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const draftValues = Object.values(knockKitDrafts);
  const loopValues = Object.values(mentorLoopEntries);
  const profileCount = hasProfileValue(profile) ? 1 : 0;
  const professorCount = growthProfessorHistory.length || matches.length;

  const categories: Category[] = [
    {
      id: "profile",
      group: "direction",
      label: "내 기본 정보",
      description: "반복 입력을 줄이기 위해 저장한 학교·전공·관심 정보",
      details: ["이름, 학교, 전공, 학년", "진로 고민과 관심 키워드"],
      count: profileCount,
      unit: "개 프로필",
      latestAt: profile.updatedAt,
      clear: clearProfile,
      icon: UserRound,
      tone: "blue",
    },
    {
      id: "direction",
      group: "direction",
      label: "처음 진로 방향",
      description: "관심과 고민이 어떻게 변했는지 비교하는 첫 기준",
      details: ["처음 확인한 전공·관심사", "처음 남긴 진로 고민"],
      count: growthDirectionBaseline ? 1 : 0,
      unit: "개 기준",
      latestAt: growthDirectionBaseline?.capturedAt ?? null,
      clear: clearGrowthDirectionBaseline,
      icon: History,
      tone: "violet",
    },
    {
      id: "projects",
      group: "direction",
      label: "프로젝트 설계 이력",
      description: "AI와 구체화하고 최종 선택한 프로젝트의 제목과 질문",
      details: ["선택한 프로젝트 제목", "프로젝트 질문과 선택 시각"],
      count: growthProjectHistory.length,
      unit: "개 프로젝트",
      latestAt: latestDate(growthProjectHistory.map((record) => record.selectedAt)),
      clear: clearGrowthProjectHistory,
      icon: FlaskConical,
      tone: "violet",
    },
    {
      id: "matches",
      group: "meeting",
      label: "교수 연결 결과",
      description: "추천된 교수와 연결 근거, 내가 선택한 교수 기록",
      details: ["학생·프로젝트 기준 추천 결과", "연결 이유와 선택한 교수"],
      count: professorCount,
      unit: "명",
      latestAt: latestDate(growthProfessorHistory.flatMap((record) => [record.selectedAt, record.connectedAt])),
      clear: clearProfessorMatches,
      icon: GraduationCap,
      tone: "mint",
    },
    {
      id: "favorites",
      group: "meeting",
      label: "관심 교수",
      description: "다시 확인하려고 저장한 교수 목록",
      details: ["교수 즐겨찾기 ID", "공식 프로필을 다시 찾기 위한 연결값"],
      count: favoriteProfessorIds.length,
      unit: "명",
      latestAt: null,
      clear: clearFavoriteProfessors,
      icon: Heart,
      tone: "mint",
    },
    {
      id: "quest",
      group: "meeting",
      label: "대화 준비 카드",
      description: "논문 한입·첫 질문·침묵 구조대·다음 행동 카드",
      details: ["학생이 저장한 카드 제목과 내용", "논문 출처·교수·프로젝트 연결값"],
      count: cards.length,
      unit: "장",
      latestAt: latestDate(cards.map((card) => card.updatedAt)),
      clear: clearCards,
      icon: BookOpenCheck,
      tone: "blue",
    },
    {
      id: "drafts",
      group: "meeting",
      label: "면담 요청 초안",
      description: "교수님께 보낼 첫 연락과 면담 질문 준비 내용",
      details: ["자기소개와 질문 3개", "면담 안건과 이메일 초안"],
      count: draftValues.length,
      unit: "건",
      latestAt: latestDate(draftValues.map((draft) => draft.updatedAt)),
      clear: clearKnockKitDrafts,
      icon: FileText,
      tone: "blue",
    },
    {
      id: "loops",
      group: "meeting",
      label: "면담 후 성장 기록",
      description: "받은 피드백과 프로젝트 수정 전후, 7일 행동",
      details: ["면담 요약과 추천 자료", "수정 전후 비교와 다음 행동"],
      count: loopValues.length,
      unit: "건",
      latestAt: latestDate(loopValues.map((entry) => entry.updatedAt)),
      clear: clearMentorLoopEntries,
      icon: CalendarCheck,
      tone: "mint",
    },
    {
      id: "ai-conversation",
      group: "ai",
      label: "AI 교수님 대화",
      description: "진로 고민과 프로젝트 방향을 정리한 대화",
      details: ["내 질문과 AI 답변", "대화 지도에서 남김·제외한 선택"],
      count: aiMessages.length,
      unit: "개 메시지",
      latestAt: latestDate(aiMessages.map((message) => message.createdAt)),
      clear: clearAiConversation,
      icon: MessageCircleMore,
      tone: "violet",
    },
    {
      id: "ai-growth-notes",
      group: "ai",
      label: "AI 성장 메모",
      description: "대화에서 골라 직접 성장과정에 저장한 메모",
      details: ["메모 제목과 본문", "원본 대화 연결값과 저장 시각"],
      count: aiGrowthNotes.length,
      unit: "개 메모",
      latestAt: latestDate(aiGrowthNotes.map((note) => note.createdAt)),
      clear: clearAiGrowthNotes,
      icon: Sparkles,
      tone: "violet",
    },
  ];

  const totalRecords = categories.reduce((sum, category) => sum + category.count, 0);
  const activeCategories = categories.filter((category) => category.count > 0).length;

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
        const groupCount = groupedCategories.reduce((sum, category) => sum + category.count, 0);
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
                const isPending = pending === category.id;
                return (
                  <article key={category.id} className={`${styles.categoryCard} ${styles[`tone_${category.tone}`]}`}>
                    <div className={styles.categoryTop}>
                      <span className={styles.categoryIcon}><Icon size={21} aria-hidden="true" /></span>
                      <span className={category.count ? styles.savedBadge : styles.emptyBadge}>
                        {category.count ? `${category.count}${category.unit}` : "저장 전"}
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
                      <span>{category.count
                        ? category.latestAt ? `최근 ${formatDate(category.latestAt)}` : "저장 시각 정보 없음"
                        : "아직 저장된 내용이 없어요"}</span>
                    </div>
                    {isPending ? (
                      <div className={styles.confirmBox} role="alert">
                        <strong>‘{category.label}’ 기록을 삭제할까요?</strong>
                        <p>이 종류의 기록 {category.count}{category.unit}을 모두 삭제하며 되돌릴 수 없어요.</p>
                        <div>
                          <button type="button" onClick={() => setPending(null)}>취소</button>
                          <button
                            type="button"
                            className={styles.dangerButton}
                            onClick={() => {
                              category.clear();
                              setPending(null);
                              setDone(`‘${category.label}’ 기록을 삭제했습니다.`);
                            }}
                          >
                            삭제하기
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className={styles.deleteButton}
                        disabled={category.count === 0}
                        onClick={() => {
                          setDone(null);
                          setPending(category.id);
                        }}
                      >
                        <Trash2 size={15} aria-hidden="true" />
                        {category.count ? "이 종류 기록 삭제" : "삭제할 기록 없음"}
                      </button>
                    )}
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
