"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  CalendarClock,
  CircleAlert,
  ExternalLink,
  GraduationCap,
  LoaderCircle,
  SearchCheck,
  ShieldCheck,
  Star,
  ThumbsDown,
} from "lucide-react";
import {
  AppShell,
  Card,
  PrimaryButton,
  SectionHeading,
  StatusBanner,
  Tag,
} from "@/components/app/primitives";
import { SceneBanner } from "@/components/app/scene-banner";
import { ProfessorDiscoveryForm } from "@/components/screens/professor-discovery-form";
import type { ResearchTopic } from "@/data/research-mvp";
import { brandScene } from "@/lib/brand-assets";
import {
  findAcademicSelection,
  type ProfessorAcademicTaxonomy,
} from "@/lib/professor-academic-taxonomy";
import {
  discoveryContextToMatchTopic,
  isDankookUniversity,
  requestProfessorDiscoveryMatches,
  type ProfessorDiscoveryContext,
} from "@/lib/professor-discovery-client";
import {
  buildProfessorContextQuestions,
  DIRECT_ACADEMIC_ENTRY,
  EMPTY_PROFESSOR_DISCOVERY_CONTEXT,
  validateProfessorDiscoveryBasics,
  validateProfessorDiscoverySecondary,
} from "@/lib/professor-discovery-model";
import type {
  OfficialProfessor,
  ProfessorDataStatus,
  ProfessorMatch,
  ProfessorMatchRole,
} from "@/lib/professor-domain";
import { ProfessorMatchRequestAbortedError } from "@/lib/professor-match-http";
import { resolveProfessorPortrait } from "@/lib/professor-photo";
import { MAX_FAVORITE_PROFESSORS } from "@/lib/professor-paper-selection";
import { useResearchStore } from "@/store/research-store";

const ROLE_LABEL: Record<ProfessorMatchRole, string> = {
  TOPIC: "주제 연결형",
  METHOD: "방법 연결형",
  CONTEXT: "확장 관점형",
};

function officialDataStatusLabel(status: ProfessorDataStatus, subject: string): string {
  const labels: Record<ProfessorDataStatus, string> = {
    FOUND: `${subject} 확인`,
    NOT_LISTED_ON_OFFICIAL_PROFILE: `공식 프로필에 ${subject} 미기재`,
    PROFILE_UNAVAILABLE: "공식 프로필에 현재 접근할 수 없음",
    PARSE_FAILED: `${subject} 수집 형식을 확인하지 못함`,
    ROBOTS_BLOCKED: "공식 사이트 수집 정책으로 자동 확인 제한",
  };
  return labels[status];
}

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

function ProfessorFavoriteButton({
  professorId,
  professorName,
}: {
  professorId: string;
  professorName: string;
}) {
  const hasHydrated = useResearchStore((state) => state.hasHydrated);
  const favoriteProfessorIds = useResearchStore((state) => state.favoriteProfessorIds);
  const toggleFavoriteProfessor = useResearchStore((state) => state.toggleFavoriteProfessor);
  const [limitNotice, setLimitNotice] = useState(false);
  const isFavorite = favoriteProfessorIds.includes(professorId);
  const isAtLimit = !isFavorite && favoriteProfessorIds.length >= MAX_FAVORITE_PROFESSORS;
  const label = isFavorite ? "즐겨찾기 완료" : "즐겨찾기";
  const noticeId = `favorite-limit-${professorId}`;

  return (
    <div className="professor-favorite-control">
      <button
        type="button"
        className={`professor-favorite-button${isFavorite ? " is-active" : ""}`}
        aria-label={`${professorName} 교수님 ${isFavorite ? "즐겨찾기 해제" : "즐겨찾기 등록"}`}
        aria-pressed={isFavorite}
        aria-describedby={limitNotice ? noticeId : undefined}
        disabled={!hasHydrated}
        title={isAtLimit ? `즐겨찾기는 ${MAX_FAVORITE_PROFESSORS}명까지 등록할 수 있어요.` : undefined}
        onClick={() => {
          const result = toggleFavoriteProfessor(professorId);
          setLimitNotice(result === "full");
        }}
      >
        <Star size={16} fill={isFavorite ? "currentColor" : "none"} aria-hidden="true" />
        {hasHydrated ? label : "불러오는 중"}
      </button>
      {limitNotice && (
        <small id={noticeId} role="status">
          즐겨찾기는 {MAX_FAVORITE_PROFESSORS}명까지 등록할 수 있어요.
        </small>
      )}
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
  context,
  onOpen,
  onReject,
}: {
  match: ProfessorMatch;
  context: ProfessorDiscoveryContext;
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
  const contextQuestions = buildProfessorContextQuestions(
    context,
    professor.researchFields[0] ?? "",
  );
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

      <section className="match-card__block match-card__block--questions">
        <h3>내 고민으로 확인할 질문</h3>
        <ol>
          {contextQuestions.map((question) => <li key={question}>{question}</li>)}
        </ol>
        <p>학생이 입력한 진로·부전공·만남 맥락을 바탕으로 만든 면담 질문이며, 교수님의 답변을 미리 단정하지 않습니다.</p>
      </section>

      <footer className="match-card__actions">
        <button type="button" className="official-professor-open" onClick={onOpen}>
          상세 근거 보기 <ArrowRight size={16} />
        </button>
        <ProfessorFavoriteButton
          professorId={professor.id}
          professorName={professor.name}
        />
        <button type="button" className="match-card__reject" onClick={onReject}>
          <ThumbsDown size={15} /> 이 교수는 아니에요
        </button>
      </footer>
    </article>
  );
}

export function OfficialProfessorsScreen({
  taxonomy,
}: {
  taxonomy: ProfessorAcademicTaxonomy;
}) {
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

  const [context, setContext] = useState<ProfessorDiscoveryContext>(() => ({
    ...EMPTY_PROFESSOR_DISCOVERY_CONTEXT,
    interests: [],
    careerInterests: [],
    careerConcerns: [],
  }));
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
    setContext((current) => {
      const sourceMajor = current.major || conditions.major || "";
      const academicSelection = findAcademicSelection(taxonomy, sourceMajor);
      return {
        ...current,
        university: current.university
          || (isDankookUniversity(conditions.school) ? "단국대학교" : ""),
        college: current.college
          || academicSelection?.college
          || (sourceMajor ? DIRECT_ACADEMIC_ENTRY : ""),
        major: current.major || academicSelection?.department || sourceMajor,
        interests: current.interests.length > 0
          ? current.interests
          : conditions.interests.slice(0, 5),
        topic: current.topic || savedTopic?.title || "",
      };
    });
    setPrefilled(true);
  }, [hasHydrated, prefilled, conditions, savedTopic, taxonomy]);

  const runSearch = async (excludeIds: string[]) => {
    const interests = [...new Set(context.interests)].slice(0, 5);
    if (!context.university.trim()) {
      setInputError("단국대학교를 선택해 주세요.");
      return;
    }
    if (!isDankookUniversity(context.university)) {
      setInputError(null);
      setSearchAttempted(false);
      setScopeNotice("현재 교수님 연결은 단국대학교 공식 교수 1,051명 데이터 파일럿만 지원합니다. 다른 학교 학생도 전공 아이디어 만들기는 이용할 수 있어요.");
      return;
    }
    const basicIssue = validateProfessorDiscoveryBasics({ ...context, interests });
    if (basicIssue) {
      setInputError(basicIssue.message);
      return;
    }
    const secondaryIssue = validateProfessorDiscoverySecondary(context);
    if (secondaryIssue) {
      setInputError(secondaryIssue);
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
    <AppShell title="나의 교수님 — 찾다" backHref="/mentoring" className="find-professor-screen">
      <SceneBanner
        scene={brandScene.find}
        alt="공식 자료로 관심 분야에 맞는 교수님을 찾는 장면"
        eyebrow="CORE 01"
        title="나의 교수님 — 찾다"
        description="전공·관심 분야와 취업·진로 고민을 나눠 입력하면, 공식 근거와 함께 서로 다른 세 관점의 교수님을 찾아드려요."
        priority
      />

      <StatusBanner icon={ShieldCheck} title="현재 연결 범위: 단국대학교 공식 교수 1,051명" tone="info">
        현재는 단국대학교 버튼만 제공합니다. 캠퍼스는 묻지 않으며,
        단과대–학과 관계가 안전하게 확인된 공식 교수 데이터만 종속 선택지로 보여줍니다.
      </StatusBanner>

      <ProfessorDiscoveryForm
        taxonomy={taxonomy}
        context={context}
        inputError={inputError}
        loading={status === "loading"}
        rejectedCount={rejectedIds.length}
        onContextChange={updateContext}
        onSubmit={() => {
          setRejectedIds([]);
          void runSearch([]);
        }}
        onResetRejected={() => {
          setRejectedIds([]);
          void runSearch([]);
        }}
      />

      {scopeNotice && (
        <StatusBanner icon={CircleAlert} title="교수 데이터 범위를 확인해 주세요" tone="warning">
          {scopeNotice}
        </StatusBanner>
      )}

      {searchAttempted && status === "loading" && (
        <Card className="official-professor-empty">
          <LoaderCircle className="spin" size={26} />
          <h2>입력을 구조화해 세 관점을 찾고 있어요</h2>
          <p>주전공·관심 분야·희망 직무만 공식 연구근거에 대조하고, 진로 단계·고민·만남 정보는 면담 질문 맥락으로 분리하고 있습니다.</p>
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
          <h2>기본분석 5개 질문부터 시작하세요</h2>
          <p>학교·전공·현재 단계·관심 분야·진로 고민을 먼저 고르고, 선택 심층질문으로 면담 질문을 구체화할 수 있어요.</p>
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
                context={context}
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
          <ProfessorFavoriteButton
            professorId={professor.id}
            professorName={professor.name}
          />
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

      <SectionHeading title="공식 강의정보" description="대학이 공개한 강의·시간표를 확인합니다." />
      <Link className="official-courses-link" href={`/professors/${professor.id}/courses`}>
        <CalendarClock size={18} aria-hidden="true" />
        <div>
          <strong>공식 강의정보 보기</strong>
          <p>학기별 강의명·시간·강의실과 공식 시간표 링크</p>
        </div>
        <ArrowRight size={16} aria-hidden="true" />
      </Link>

      <SectionHeading title="공식 프로필의 연구분야" />
      <Card className="official-field-list">
        {professor.researchFieldsStatus === "FOUND"
          ? professor.researchFields.map((field) => (
              <div key={field}><GraduationCap size={18} /><span>{field}</span></div>
            ))
          : <p>{officialDataStatusLabel(professor.researchFieldsStatus, "연구분야")}</p>}
      </Card>

      <SectionHeading
        title="공식 프로필에 노출된 논문"
        description={professor.publicationsStatus === "FOUND"
          ? `공식 프로필에서 수집한 전체 ${professor.publicationCount}건 중 최근 논문 최대 6건`
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
            <strong>{officialDataStatusLabel(professor.publicationsStatus, "논문 목록")}</strong>
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
