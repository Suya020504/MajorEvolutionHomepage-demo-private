"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  CircleAlert,
  ExternalLink,
  GraduationCap,
  LoaderCircle,
  SearchCheck,
  ShieldCheck,
  ThumbsDown,
} from "lucide-react";
import {
  AppShell,
  Card,
  PageHeader,
  PrimaryButton,
  SectionHeading,
  StatusBanner,
  Tag,
} from "@/components/app/primitives";
import type { ResearchTopic } from "@/data/research-mvp";
import {
  discoveryContextToMatchTopic,
  isDankookUniversity,
  requestProfessorDiscoveryMatches,
  type ProfessorDiscoveryContext,
} from "@/lib/professor-discovery-client";
import type {
  OfficialProfessor,
  ProfessorMatch,
  ProfessorMatchRole,
} from "@/lib/professor-domain";
import { ProfessorMatchRequestAbortedError } from "@/lib/professor-match-http";
import { resolveProfessorPortrait } from "@/lib/professor-photo";
import { useResearchStore } from "@/store/research-store";

const ROLE_LABEL: Record<ProfessorMatchRole, string> = {
  TOPIC: "주제 연결형",
  METHOD: "방법 연결형",
  CONTEXT: "확장 관점형",
};

const GOAL_OPTIONS = [
  "전공·진로 방향 찾기",
  "수업·연구 주제 탐색",
  "프로젝트·학부연구 참여",
  "대학원·연구실 탐색",
] as const;

const INTEREST_OPTIONS = [
  "AI·데이터",
  "환경·지속가능성",
  "교육·학습",
  "문화·콘텐츠",
  "건강·생명",
  "사회·정책",
  "창업·비즈니스",
  "공학·기술",
] as const;

const CAREER_OPTIONS = ["취업", "대학원", "창업", "아직 탐색 중"] as const;
const MEETING_OPTIONS = ["수업 후 질문", "오피스아워", "이메일", "연구실 방문"] as const;
const MAJOR_OPTIONS = [
  "경영학",
  "경제학",
  "국어국문학",
  "심리학",
  "사회학",
  "정치외교학",
  "교육학",
  "컴퓨터공학",
  "소프트웨어학",
  "인공지능학",
  "전자전기공학",
  "기계공학",
  "화학공학",
  "생명과학",
  "식품자원경제학",
  "디자인학",
] as const;

/** 저장된 연구주제. 만들다에서 넘어온 경우에만 존재합니다. */
function useSelectedTopic(): ResearchTopic | null {
  const result = useResearchStore((state) => state.result);
  const selectedTopicId = useResearchStore((state) => state.selectedTopicId);
  return useMemo(() => {
    if (!result || !selectedTopicId) return null;
    if (result.kind === "ok") {
      return result.candidates.find((c) => c.topic.id === selectedTopicId)?.topic ?? null;
    }
    if (result.kind === "insufficient" && result.candidate.topic.id === selectedTopicId) {
      return result.candidate.topic;
    }
    return null;
  }, [result, selectedTopicId]);
}

/**
 * 승인된 공식 사진만 실제 사진으로 표시하고, 그 외에는 역할별 브랜드 일러스트를 씁니다.
 */
function ProfessorPortrait({
  professor,
  variant,
  large = false,
}: {
  professor: OfficialProfessor;
  variant: ProfessorMatchRole | "PROFILE";
  large?: boolean;
}) {
  const portrait = resolveProfessorPortrait({
    professorId: professor.id,
    professorName: professor.name,
    variant,
  });
  return (
    <div
      className={`official-professor-avatar${large ? " official-professor-avatar--large" : ""}`}
      title={portrait.sourceLabel}
    >
      <Image
        src={portrait.src}
        alt={portrait.alt}
        width={large ? 64 : 48}
        height={large ? 64 : 48}
        style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "inherit" }}
      />
    </div>
  );
}

/**
 * 주제·방법·확장 관점 카드.
 *
 * 궁합도·순위·면담 가능성은 표시하지 않습니다(제품 경계).
 * 대신 왜 연결됐는지, 무엇을 근거로 봤는지, 무엇을 직접 확인해야 하는지를 나눠 보여줍니다.
 */
function MatchCard({
  match,
  onOpen,
  onReject,
}: {
  match: ProfessorMatch;
  onOpen: () => void;
  onReject: () => void;
}) {
  const professor = match.professor;
  const hasPublications = professor.publicationsStatus === "FOUND";
  const portrait = resolveProfessorPortrait({
    professorId: professor.id,
    professorName: professor.name,
    variant: match.role,
  });
  const cardVariant = match.role === "TOPIC" ? "primary" : "alternative";
  return (
    <article className={`match-card match-card--${cardVariant}`}>
      <header className="match-card__head">
        <span className="match-card__role">{ROLE_LABEL[match.role]}</span>
        <ProfessorPortrait professor={professor} variant={match.role} />
        <Tag tone={portrait.isActualProfessorPhoto ? "mint" : "violet"}>
          {portrait.badgeLabel}
        </Tag>
        <h2>{professor.name} {professor.title}</h2>
        <p>{professor.university} · {professor.college} · {professor.department}</p>
        <div className="tag-row">
          <Tag tone={match.role === "TOPIC" ? "mint" : "blue"}>{ROLE_LABEL[match.role]}</Tag>
          {match.matchedTerms.slice(0, 3).map((term) => <Tag key={term}>{term}</Tag>)}
        </div>
      </header>

      <section className="match-card__block">
        <h3>왜 연결됐나요?</h3>
        <p>{match.reason}</p>
      </section>

      <section className="match-card__block">
        <h3>확인한 근거</h3>
        <ul className="match-card__evidence">
          <li>
            <ShieldCheck size={15} aria-hidden="true" />
            <span>공식 프로필 연구분야 {professor.researchFields.length}건</span>
          </li>
          <li>
            <BookOpenCheck size={15} aria-hidden="true" />
            <span>
              {hasPublications
                ? `공식 프로필 노출 논문 ${professor.publicationCount}건`
                : "공식 프로필에 논문 목록 미기재"}
            </span>
          </li>
        </ul>
        <p className="match-card__evidence-ids">근거 ID {match.evidenceIds.join(" · ")}</p>
        <Link href={professor.officialProfileUrl} target="_blank" rel="noopener noreferrer" className="match-card__source">
          <ExternalLink size={15} /> 대학 공식 프로필 열기
        </Link>
      </section>

      <section className="match-card__block match-card__block--check">
        <h3>직접 확인할 점</h3>
        <ul>
          {match.doesNotEstablish.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <footer className="match-card__actions">
        <button type="button" className="official-professor-open" onClick={onOpen}>
          상세 근거 보기 <ArrowRight size={16} />
        </button>
        <button type="button" className="match-card__reject" onClick={onReject}>
          <ThumbsDown size={15} /> 이 교수는 아니에요
        </button>
      </footer>
    </article>
  );
}

export function OfficialProfessorsScreen() {
  const router = useRouter();
  const hasHydrated = useResearchStore((state) => state.hasHydrated);
  const conditions = useResearchStore((state) => state.conditions);
  const matches = useResearchStore((state) => state.professorMatches);
  const coverage = useResearchStore((state) => state.professorCoverage);
  const status = useResearchStore((state) => state.professorMatchStatus);
  const matchError = useResearchStore((state) => state.professorMatchError);
  const setLoading = useResearchStore((state) => state.setProfessorMatchLoading);
  const setMatches = useResearchStore((state) => state.setProfessorMatches);
  const setError = useResearchStore((state) => state.setProfessorMatchError);
  const clearProfessorMatches = useResearchStore((state) => state.clearProfessorMatches);
  const selectProfessor = useResearchStore((state) => state.selectProfessor);
  const savedTopic = useSelectedTopic();

  const [context, setContext] = useState<ProfessorDiscoveryContext>({
    university: "",
    goal: "",
    major: "",
    interests: [],
    topic: "",
    careerGoal: "",
    meetingSituation: "",
    additionalContext: "",
  });
  const [customInterest, setCustomInterest] = useState("");
  const [rejectedIds, setRejectedIds] = useState<string[]>([]);
  const [inputError, setInputError] = useState<string | null>(null);
  const [scopeNotice, setScopeNotice] = useState<string | null>(null);
  const [prefilled, setPrefilled] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const activeRequestRef = useRef<AbortController | null>(null);

  const markInputsChanged = () => {
    activeRequestRef.current?.abort();
    activeRequestRef.current = null;
    clearProfessorMatches();
    setSearchAttempted(false);
    setScopeNotice(null);
    setInputError(null);
    setRejectedIds([]);
  };

  const updateContext = (
    updater: (current: ProfessorDiscoveryContext) => ProfessorDiscoveryContext,
  ) => {
    markInputsChanged();
    setContext(updater);
  };

  useEffect(() => () => {
    activeRequestRef.current?.abort();
  }, []);

  // 만들다에서 넘어왔다면 확인한 전공·관심·주제를 한 번만 채웁니다.
  useEffect(() => {
    if (!hasHydrated || prefilled) return;
    setContext((current) => ({
      ...current,
      university: current.university || conditions.school,
      major: current.major || conditions.major || "",
      interests: current.interests.length > 0
        ? current.interests
        : conditions.interests.slice(0, 3),
      topic: current.topic || savedTopic?.title || "",
    }));
    setPrefilled(true);
  }, [hasHydrated, prefilled, conditions, savedTopic]);

  const toggleInterest = (interest: string) => {
    updateContext((current) => {
      const selected = current.interests.includes(interest);
      if (selected) {
        return { ...current, interests: current.interests.filter((item) => item !== interest) };
      }
      if (current.interests.length >= 3) return current;
      return { ...current, interests: [...current.interests, interest] };
    });
  };

  const addCustomInterest = () => {
    const interest = customInterest.trim();
    if (!interest) return;
    updateContext((current) => {
      if (current.interests.includes(interest) || current.interests.length >= 3) return current;
      return { ...current, interests: [...current.interests, interest] };
    });
    setCustomInterest("");
  };

  const runSearch = async (excludeIds: string[]) => {
    const interests = [...new Set([
      ...context.interests,
      customInterest.trim(),
    ].filter(Boolean))].slice(0, 3);
    if (!context.university.trim()) {
      setInputError("교수 데이터 범위를 확인하려면 학교를 선택해 주세요.");
      return;
    }
    if (!isDankookUniversity(context.university)) {
      setInputError(null);
      setSearchAttempted(false);
      setScopeNotice("현재 교수님 연결은 단국대학교 공식 교수 1,051명 데이터 파일럿만 지원합니다. 다른 학교 학생도 전공 아이디어 만들기는 이용할 수 있어요.");
      return;
    }
    if (!context.goal.trim()) {
      setInputError("교수님에게 어떤 도움을 받고 싶은지 선택해 주세요.");
      return;
    }
    if (!context.major.trim()) {
      setInputError("학과·전공을 입력해 주세요.");
      return;
    }
    if (interests.length === 0) {
      setInputError("관심 분야를 하나 이상 선택하거나 직접 입력해 주세요.");
      return;
    }

    const requestContext = { ...context, university: "단국대학교", interests };
    const useSaved = Boolean(savedTopic && savedTopic.title === context.topic.trim());
    const matchTopic = discoveryContextToMatchTopic(requestContext, useSaved ? savedTopic : null);
    activeRequestRef.current?.abort();
    const requestController = new AbortController();
    activeRequestRef.current = requestController;
    setInputError(null);
    setScopeNotice(null);
    setSearchAttempted(true);
    setLoading(matchTopic.id);
    try {
      const response = await requestProfessorDiscoveryMatches(requestContext, {
        excludeIds,
        savedTopic: useSaved ? savedTopic : null,
        signal: requestController.signal,
      });
      if (activeRequestRef.current !== requestController) return;
      setMatches(response);
    } catch (error) {
      if (
        error instanceof ProfessorMatchRequestAbortedError
        || activeRequestRef.current !== requestController
      ) {
        return;
      }
      setError(
        matchTopic.id,
        error instanceof Error ? error.message : "공식 교수 데이터를 연결하지 못했습니다.",
      );
    } finally {
      if (activeRequestRef.current === requestController) {
        activeRequestRef.current = null;
      }
    }
  };

  const rejectMatch = (professorId: string) => {
    const next = [...rejectedIds, professorId];
    setRejectedIds(next);
    void runSearch(next);
  };

  const openProfessor = (match: ProfessorMatch) => {
    selectProfessor(match.professor.id);
    router.push(`/professors/${match.professor.id}`);
  };

  const visibleMatches = searchAttempted && isDankookUniversity(context.university)
    ? matches
    : [];

  return (
    <AppShell title="나의 교수님 — 찾다" backHref="/" className="find-professor-screen">
      <PageHeader
        title="나의 교수님 — 찾다"
        description="몇 가지만 고르면 단국대학교 공식 교수 데이터에서 서로 다른 세 관점의 연결 근거를 찾아드려요."
      />

      <StatusBanner icon={ShieldCheck} title="현재 연결 범위: 단국대학교 공식 교수 1,051명" tone="info">
        학교 선택은 아이디어 생성 조건이 아니라 교수 데이터의 출처 범위를 확인하기 위한 절차입니다.
        단국대학교를 직접 선택한 경우에만 교수 연결을 실행합니다.
      </StatusBanner>

      <Card className="context-panel">
        <h2>이번 탐색 조건</h2>
        <p className="match-card__evidence-ids">필수 조건은 연결 근거를 만들고, 선택 조건은 결과의 맥락을 더 구체화합니다.</p>

        <section>
          <label htmlFor="professor-university">
            <span>학교 <Tag tone="warning">교수 연결 시 필수</Tag></span>
            <input
              id="professor-university"
              type="text"
              value={context.university}
              placeholder="학교명을 입력하세요"
              maxLength={80}
              onChange={(event) => updateContext((current) => ({
                ...current,
                university: event.target.value,
              }))}
            />
          </label>
          <div className="chip-grid">
            <button
              type="button"
              className={`choice-chip${isDankookUniversity(context.university) ? " is-selected" : ""}`}
              aria-pressed={isDankookUniversity(context.university)}
              onClick={() => updateContext((current) => ({ ...current, university: "단국대학교" }))}
            >
              단국대학교 교수 데이터로 찾아보기
            </button>
          </div>
        </section>

        <section>
          <h3>1. 어떤 도움을 받고 싶나요? <Tag tone="warning">필수</Tag></h3>
          <p className="match-card__evidence-ids">예: 프로젝트를 시작하고 싶다면 ‘프로젝트·학부연구 참여’를 선택하세요.</p>
          <div className="chip-grid">
            {GOAL_OPTIONS.map((goal) => (
              <button
                key={goal}
                type="button"
                className={`choice-chip${context.goal === goal ? " is-selected" : ""}`}
                aria-pressed={context.goal === goal}
                onClick={() => updateContext((current) => ({ ...current, goal }))}
              >
                {goal}
              </button>
            ))}
          </div>
        </section>

        <section>
          <label htmlFor="professor-major">
            <span>2. 학과·전공 <Tag tone="warning">필수</Tag></span>
            <input
              id="professor-major"
              type="text"
              list="professor-major-options"
              value={context.major}
              placeholder="검색하거나 직접 입력하세요 · 예: 경제학"
              maxLength={80}
              onChange={(event) => updateContext((current) => ({
                ...current,
                major: event.target.value,
              }))}
            />
            <datalist id="professor-major-options">
              {MAJOR_OPTIONS.map((major) => <option key={major} value={major} />)}
            </datalist>
          </label>
        </section>

        <section>
          <h3>3. 관심 분야 <Tag tone="warning">필수</Tag></h3>
          <p className="match-card__evidence-ids">1~3개를 선택하세요. 목록에 없다면 바로 아래에서 직접 입력할 수 있어요.</p>
          <div className="chip-grid">
            {INTEREST_OPTIONS.map((interest) => {
              const selected = context.interests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  className={`choice-chip${selected ? " is-selected" : ""}`}
                  aria-pressed={selected}
                  disabled={!selected && context.interests.length >= 3}
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </button>
              );
            })}
          </div>
          <label htmlFor="professor-custom-interest">
            <span>목록에 없는 관심 분야 직접 입력 ({context.interests.length}/3)</span>
            <input
              id="professor-custom-interest"
              type="text"
              value={customInterest}
              placeholder="예: 스포츠 데이터 · 입력 후 추가"
              maxLength={60}
              disabled={context.interests.length >= 3}
              onChange={(event) => {
                markInputsChanged();
                setCustomInterest(event.target.value);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addCustomInterest();
                }
              }}
            />
          </label>
          <button
            type="button"
            className="choice-chip"
            disabled={!customInterest.trim() || context.interests.length >= 3}
            onClick={addCustomInterest}
          >
            관심 분야 추가
          </button>
          {context.interests.length > 0 && (
            <div className="chip-grid" aria-label="선택한 관심 분야">
              {context.interests.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  className="choice-chip is-selected"
                  aria-label={`${interest} 관심 분야 제거`}
                  onClick={() => toggleInterest(interest)}
                >
                  {interest} ×
                </button>
              ))}
            </div>
          )}
        </section>

        <section>
          <h3>정확도를 높이는 선택 정보 <Tag>선택</Tag></h3>
          <label htmlFor="professor-topic">
            <span>구체 연구주제</span>
            <input
              id="professor-topic"
              type="text"
              value={context.topic}
              placeholder="예: 친환경 식품의 소비자 선택 요인"
              maxLength={160}
              onChange={(event) => updateContext((current) => ({
                ...current,
                topic: event.target.value,
              }))}
            />
          </label>

          <span>진로 목표</span>
          <div className="chip-grid">
            {CAREER_OPTIONS.map((careerGoal) => (
              <button
                key={careerGoal}
                type="button"
                className={`choice-chip${context.careerGoal === careerGoal ? " is-selected" : ""}`}
                aria-pressed={context.careerGoal === careerGoal}
                onClick={() => updateContext((current) => ({ ...current, careerGoal }))}
              >
                {careerGoal}
              </button>
            ))}
          </div>

          <span>교수님을 만날 상황</span>
          <div className="chip-grid">
            {MEETING_OPTIONS.map((meetingSituation) => (
              <button
                key={meetingSituation}
                type="button"
                className={`choice-chip${context.meetingSituation === meetingSituation ? " is-selected" : ""}`}
                aria-pressed={context.meetingSituation === meetingSituation}
                onClick={() => updateContext((current) => ({
                  ...current,
                  meetingSituation,
                }))}
              >
                {meetingSituation}
              </button>
            ))}
          </div>

          <label htmlFor="professor-additional-context">
            <span>추가 맥락</span>
            <input
              id="professor-additional-context"
              type="text"
              value={context.additionalContext}
              placeholder="예: 통계는 처음이지만 실제 데이터를 다뤄보고 싶어요"
              maxLength={300}
              onChange={(event) => updateContext((current) => ({
                ...current,
                additionalContext: event.target.value,
              }))}
            />
          </label>
        </section>

        {inputError && <p className="context-panel__error" role="alert">{inputError}</p>}
        <PrimaryButton
          className="context-panel__submit"
          onClick={() => {
            setRejectedIds([]);
            void runSearch([]);
          }}
          disabled={status === "loading"}
        >
          {status === "loading" ? "공식 근거를 찾는 중…" : "세 관점의 교수님 찾기"}
          {status !== "loading" && <SearchCheck size={17} />}
        </PrimaryButton>
        {rejectedIds.length > 0 && (
          <button
            type="button"
            className="context-panel__reset"
            onClick={() => {
              setRejectedIds([]);
              void runSearch([]);
            }}
          >
            제외한 교수 {rejectedIds.length}명 다시 포함하기
          </button>
        )}
      </Card>

      {scopeNotice && (
        <StatusBanner icon={CircleAlert} title="교수 데이터 범위를 확인해 주세요" tone="warning">
          {scopeNotice}
        </StatusBanner>
      )}

      {searchAttempted && status === "loading" && (
        <Card className="official-professor-empty">
          <LoaderCircle className="spin" size={26} />
          <h2>공식 데이터에서 세 관점을 찾고 있어요</h2>
          <p>입력한 전공·관심 분야·목적을 단국대학교 공식 프로필 근거와 대조하는 중입니다.</p>
        </Card>
      )}

      {searchAttempted && status === "error" && (
        <StatusBanner icon={CircleAlert} title="연결하지 못했어요" tone="warning">
          {matchError ?? "공식 교수 데이터를 연결하지 못했습니다."} 입력한 내용은 그대로 두었으니 다시 시도해 주세요.
        </StatusBanner>
      )}

      {!searchAttempted && !scopeNotice && (
        <Card className="official-professor-empty">
          <SearchCheck size={28} />
          <h2>선택형 질문부터 가볍게 시작하세요</h2>
          <p>목적·전공·관심 분야까지만 필수예요. 구체 주제와 만남 상황을 더하면 연결 이유가 선명해집니다.</p>
        </Card>
      )}

      {searchAttempted && status !== "loading" && status !== "error" && visibleMatches.length === 0 && (
        <Card className="official-professor-empty">
          <CircleAlert size={28} />
          <h2>공식 근거가 있는 후보를 찾지 못했어요</h2>
          <p>관심 분야를 더 구체적인 연구 키워드로 바꾸거나 구체 연구주제를 추가해 다시 찾아보세요.</p>
        </Card>
      )}

      {searchAttempted && status !== "loading" && visibleMatches.length > 0 && (
        <>
          <SectionHeading
            title={`${visibleMatches.length}명의 교수님 연결`}
            description="주제·방법·확장 관점별로 서로 다른 역할을 맡습니다. 같은 교수는 중복 추천하지 않습니다."
          />
          {visibleMatches.length < 3 && (
            <StatusBanner icon={CircleAlert} title="세 관점을 모두 채우지 못했어요" tone="warning">
              공식 프로필에서 확인 가능한 직접 근거가 있는 교수만 표시했습니다. 키워드를 보완하면 다른 관점이 추가될 수 있습니다.
            </StatusBanner>
          )}
          <div
            className="match-grid"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}
          >
            {visibleMatches.map((match) => (
              <MatchCard
                key={match.professor.id}
                match={match}
                onOpen={() => openProfessor(match)}
                onReject={() => rejectMatch(match.professor.id)}
              />
            ))}
          </div>
          {coverage && <p className="prof-scope-note">{coverage.note}</p>}
        </>
      )}
    </AppShell>
  );
}

export function OfficialProfessorDetailScreen({ professor }: { professor: OfficialProfessor }) {
  const router = useRouter();
  const matches = useResearchStore((state) => state.professorMatches);
  const selectProfessor = useResearchStore((state) => state.selectProfessor);
  const match = useMemo(
    () => matches.find((item) => item.professor.id === professor.id),
    [matches, professor.id],
  );
  const recentPublications = professor.publications.slice(0, 6);

  return (
    <AppShell
      title="교수 공식 근거"
      backHref="/professors"
      stickyAction={(
        <>
          <PrimaryButton onClick={() => {
            selectProfessor(professor.id);
            router.push("/quest");
          }}>
            교수님 퀘스트 준비 <ArrowRight size={17} />
          </PrimaryButton>
        </>
      )}
    >
      <p className="official-data-pill"><ShieldCheck size={14} /> 대학 공식 페이지 수집 데이터</p>
      <section className="official-professor-hero">
        <ProfessorPortrait professor={professor} variant="PROFILE" large />
        <div>
          <h1>{professor.name} {professor.title}</h1>
          <p>{professor.university} · {professor.college} · {professor.department}</p>
          <div className="tag-row">
            {professor.researchFields.map((field) => <Tag key={field}>{field}</Tag>)}
          </div>
        </div>
      </section>

      {match ? (
        <>
          <SectionHeading title="선택한 주제와의 연결" description="연결 역할과 공식 근거 ID를 확인하세요." />
          <Card className="official-match-detail">
            <Tag tone={match.strength === "LIMITED" ? "warning" : "mint"}>{ROLE_LABEL[match.role]}</Tag>
            <p>{match.reason}</p>
            <dl>
              <div><dt>근거 ID</dt><dd>{match.evidenceIds.join(" · ")}</dd></div>
              <div><dt>판단하지 않은 항목</dt><dd>{match.doesNotEstablish.join(" · ")}</dd></div>
            </dl>
          </Card>
        </>
      ) : (
        <StatusBanner icon={CircleAlert} title="주제 연결 맥락 없음" tone="warning">
          이 주소로 직접 들어왔기 때문에 선택 주제와의 연결 이유는 표시하지 않습니다. 연구 결과 화면에서 다시 연결해 주세요.
        </StatusBanner>
      )}

      <SectionHeading title="공식 프로필의 연구분야" />
      <Card className="official-field-list">
        {professor.researchFieldsStatus === "FOUND"
          ? professor.researchFields.map((field) => (
              <div key={field}><GraduationCap size={18} /><span>{field}</span></div>
            ))
          : <p>{professor.researchFieldsStatus}</p>}
      </Card>

      <SectionHeading
        title="공식 프로필에 노출된 논문"
        description={professor.publicationsStatus === "FOUND"
          ? `전체 ${professor.publicationCount}건 중 최근 목록 순서 ${recentPublications.length}건`
          : "논문이 없다는 뜻이 아니라 공식 프로필에 목록이 노출되지 않았다는 뜻입니다."}
      />
      {recentPublications.length > 0 ? (
        <div className="official-publication-list">
          {recentPublications.map((publication) => (
            <article key={publication.id}>
              <BookOpenCheck size={18} />
              <div>
                <h3>{publication.title}</h3>
                <p>{publication.publicationType} · {publication.publishedDate ?? "발행일 미기재"}</p>
                <small>{publication.id}</small>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Card className="official-publication-empty">
          <CircleAlert size={18} />
          <div>
            <strong>{professor.publicationsStatus}</strong>
            <p>공식 프로필에 논문 목록이 노출되지 않아 논문 근거를 만들지 않았습니다.</p>
          </div>
        </Card>
      )}

      <SectionHeading title="공식 출처" description={`수집일 ${new Date(professor.collectedAt).toLocaleDateString("ko-KR")}`} />
      <div className="official-source-actions">
        <Link href={professor.officialProfileUrl} target="_blank" rel="noopener noreferrer">
          <ExternalLink size={17} /> 대학 공식 프로필 열기
        </Link>
        <Link href={professor.sourceUrl} target="_blank" rel="noopener noreferrer">
          <ExternalLink size={17} /> 학과 교수 목록 열기
        </Link>
      </div>
      <StatusBanner icon={CircleAlert} title="직접 확인할 점" tone="warning">
        교수의 면담·지도·모집 가능 여부는 수집하거나 추정하지 않습니다. 연락 전 공식 페이지의 최신 안내를 직접 확인하세요.
      </StatusBanner>
    </AppShell>
  );
}
