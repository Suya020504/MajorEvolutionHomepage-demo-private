"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
  contextToMatchTopic,
  requestProfessorMatches,
  requestProfessorMatchesByContext,
  type ProfessorSearchContext,
} from "@/lib/professor-client";
import type {
  OfficialProfessor,
  ProfessorMatch,
  ProfessorMatchRole,
} from "@/lib/professor-domain";
import { useResearchStore } from "@/store/research-store";

const ROLE_LABEL: Record<ProfessorMatchRole, string> = {
  TOPIC: "연구주제",
  METHOD: "방법론",
  CONTEXT: "응용 맥락",
};

const CONTEXT_FIELDS = [
  { key: "major", label: "전공", placeholder: "예) 경제학과" },
  { key: "interest", label: "관심 분야", placeholder: "예) 데이터 정책" },
  { key: "career", label: "진로 방향", placeholder: "예) 리서치" },
  { key: "topic", label: "선택 연구주제", placeholder: "예) 공공데이터 기반 정책 평가" },
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
 * 연결 교수 / 다른 관점의 대안 카드.
 *
 * 궁합도·순위·면담 가능성은 표시하지 않습니다(제품 경계).
 * 대신 왜 연결됐는지, 무엇을 근거로 봤는지, 무엇을 직접 확인해야 하는지를 나눠 보여줍니다.
 */
function MatchCard({
  match,
  variant,
  onOpen,
  onReject,
}: {
  match: ProfessorMatch;
  variant: "primary" | "alternative";
  onOpen: () => void;
  onReject: () => void;
}) {
  const professor = match.professor;
  const hasPublications = professor.publicationsStatus === "FOUND";
  return (
    <article className={`match-card match-card--${variant}`}>
      <header className="match-card__head">
        <span className="match-card__role">
          {variant === "primary" ? "연결 교수" : "다른 관점의 대안"}
        </span>
        <div className="official-professor-avatar" aria-hidden="true">{professor.name.slice(0, 1)}</div>
        <h2>{professor.name} {professor.title}</h2>
        <p>{professor.university} · {professor.college} · {professor.department}</p>
        <div className="tag-row">
          <Tag tone={variant === "primary" ? "mint" : "blue"}>{ROLE_LABEL[match.role]} 연결</Tag>
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
  const selectProfessor = useResearchStore((state) => state.selectProfessor);
  const savedTopic = useSelectedTopic();

  const [context, setContext] = useState<ProfessorSearchContext>({
    major: "",
    interest: "",
    career: "",
    topic: "",
  });
  const [rejectedIds, setRejectedIds] = useState<string[]>([]);
  const [inputError, setInputError] = useState<string | null>(null);
  const [prefilled, setPrefilled] = useState(false);

  // 만들다에서 넘어왔다면 이미 확인한 맥락을 한 번만 채워 둡니다.
  useEffect(() => {
    if (!hasHydrated || prefilled) return;
    setContext((current) => ({
      major: current.major || conditions.major || "",
      interest: current.interest || conditions.interests[0] || "",
      career: current.career,
      topic: current.topic || savedTopic?.title || "",
    }));
    setPrefilled(true);
  }, [hasHydrated, prefilled, conditions.major, conditions.interests, savedTopic]);

  const runSearch = async (excludeIds: string[]) => {
    if (!context.major.trim()) {
      setInputError("전공을 입력해 주세요.");
      return;
    }
    if (!context.topic.trim() && !context.interest.trim()) {
      setInputError("관심 분야나 연구주제 중 하나는 입력해 주세요.");
      return;
    }
    setInputError(null);
    // 저장된 주제를 그대로 쓰면 방법·범위까지 근거로 쓸 수 있습니다.
    const useSaved = savedTopic && savedTopic.title === context.topic.trim();
    setLoading(useSaved ? savedTopic.id : contextToMatchTopic(context).id);
    try {
      const response = useSaved
        ? await requestProfessorMatches(savedTopic, context.major.trim(), { excludeIds })
        : await requestProfessorMatchesByContext(context, { excludeIds });
      setMatches(response);
    } catch (error) {
      setError(error instanceof Error ? error.message : "공식 교수 데이터를 연결하지 못했습니다.");
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

  const [primary, alternative] = matches;
  const limitedEvidence = matches.length > 0 && matches.every((m) => m.strength === "LIMITED");

  return (
    <AppShell title="나의 교수님 — 찾다" backHref="/mentoring" className="find-professor-screen">
      <PageHeader
        title="나의 교수님 — 찾다"
        description="점수 대신 연결 근거와 직접 확인할 점을 보여줍니다."
      />

      <Card className="context-panel">
        <h2>내 맥락 입력</h2>
        {CONTEXT_FIELDS.map((field) => (
          <label key={field.key}>
            <span>{field.label}</span>
            <input
              type="text"
              value={context[field.key]}
              placeholder={field.placeholder}
              onChange={(event) =>
                setContext((current) => ({ ...current, [field.key]: event.target.value }))
              }
            />
          </label>
        ))}
        {inputError && <p className="context-panel__error">{inputError}</p>}
        <PrimaryButton
          className="context-panel__submit"
          onClick={() => {
            setRejectedIds([]);
            void runSearch([]);
          }}
          disabled={status === "loading"}
        >
          {status === "loading" ? "찾는 중…" : "교수님 찾기"}
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
            거절한 교수 {rejectedIds.length}명 다시 포함하기
          </button>
        )}
      </Card>

      {status === "loading" && (
        <Card className="official-professor-empty">
          <LoaderCircle className="spin" size={26} />
          <h2>공식 데이터에서 연결 근거를 찾고 있어요</h2>
          <p>입력한 맥락과 대학 공식 프로필을 대조하는 중입니다.</p>
        </Card>
      )}

      {status === "error" && (
        <StatusBanner icon={CircleAlert} title="연결하지 못했어요" tone="warning">
          {matchError ?? "공식 교수 데이터를 연결하지 못했습니다."} 입력한 내용은 그대로 두었으니 다시
          시도해 주세요.
        </StatusBanner>
      )}

      {status !== "loading" && matches.length === 0 && (
        <Card className="official-professor-empty">
          <SearchCheck size={28} />
          <h2>아직 연결한 교수님이 없어요</h2>
          <p>위에 내 맥락을 입력하고 교수님 찾기를 눌러 주세요.</p>
        </Card>
      )}

      {status !== "loading" && matches.length > 0 && (
        <>
          {limitedEvidence && (
            <StatusBanner icon={CircleAlert} title="공식 근거가 부족합니다" tone="warning">
              현재 수집 범위의 공식 프로필에서 직접 일치하는 근거를 찾지 못했습니다. 아래는 관점을
              넓히기 위한 후보이며, 다른 키워드로 다시 찾아보시길 권합니다.
            </StatusBanner>
          )}
          <div className="match-grid">
            {primary && (
              <MatchCard
                match={primary}
                variant="primary"
                onOpen={() => openProfessor(primary)}
                onReject={() => rejectMatch(primary.professor.id)}
              />
            )}
            {alternative && (
              <MatchCard
                match={alternative}
                variant="alternative"
                onOpen={() => openProfessor(alternative)}
                onReject={() => rejectMatch(alternative.professor.id)}
              />
            )}
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
        <div className="official-professor-avatar official-professor-avatar--large" aria-hidden="true">
          {professor.name.slice(0, 1)}
        </div>
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
          <SectionHeading title="선택한 주제와의 연결" description="내부 점수 대신 역할과 근거 ID를 확인하세요." />
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
