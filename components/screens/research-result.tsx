"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  Database,
  ExternalLink,
  FlaskConical,
  Info,
  RotateCw,
  ShieldCheck,
  Sliders,
  Sparkles,
  Timer,
} from "lucide-react";
import { AppShell, Card, PageHeader, PrimaryButton, SecondaryButton, Tag, cx } from "@/components/app/primitives";
import { SceneBanner } from "@/components/app/scene-banner";
import { brandScene, guideCharacter } from "@/lib/brand-assets";
import { modeById } from "@/data/co-design";
import {
  PROFESSOR_DATA_NOTE,
  PROFESSOR_DISCLAIMER,
  type CheckStatus,
} from "@/data/research-mvp";
import { isDankookUniversity } from "@/lib/professor-discovery-client";
import { requestProfessorMatches } from "@/lib/professor-client";
import { ProfessorMatchRequestAbortedError } from "@/lib/professor-match-http";
import type {
  ProfessorMatch,
  ProfessorMatchResponse,
  ProfessorMatchRole,
  ProfessorMatchStrength,
} from "@/lib/professor-domain";
import { resolveProfessorPortrait } from "@/lib/professor-photo";
import { CRITERION_LABELS, type CriterionKey, type TopicWithChecks } from "@/lib/recommend";
import { useResearchStore } from "@/store/research-store";

const STATUS_TONE: Record<CheckStatus, string> = { "확인됨": "ok", "조건부": "cond", "확인 필요": "need" };
function StatusPill({ status }: { status: CheckStatus }) {
  const Icon = status === "확인됨" ? CircleCheck : status === "조건부" ? CircleDashed : CircleAlert;
  return (
    <span className={cx("status-pill", `status-pill--${STATUS_TONE[status]}`)}>
      <Icon size={13} /> {status}
    </span>
  );
}

const CRIT_ICON: Record<CriterionKey, typeof Database> = {
  personalLink: Info,
  dataAccess: Database,
  method: FlaskConical,
  period: Timer,
  uncertainty: ShieldCheck,
};

function CandidateCard({ cand, label, selected, onSelect }: { cand: TopicWithChecks; label: "A" | "B"; selected: boolean; onSelect: () => void }) {
  const t = cand.topic;
  return (
    <article className={cx("cand-card", selected && "is-selected")}>
      <header className="cand-card__head">
        <span className="cand-badge">{label}</span>
        <Tag tone={t.variant === "안전 축소형" ? "mint" : "violet"}>{t.variant}</Tag>
      </header>
      <h2>{t.title}</h2>
      <p className="cand-q"><strong>연구질문</strong> {t.question}</p>

      <div className="cand-reason">
        <strong>내 조건과 연결</strong>
        <p>{t.reason}</p>
        {(cand.matchedInterests.length > 0 || cand.matchedMethods.length > 0) && (
          <div className="tag-row">
            {cand.matchedInterests.map((i) => <Tag key={i} tone="blue">{i}</Tag>)}
            {cand.matchedMethods.map((m) => <Tag key={m}>{m}</Tag>)}
          </div>
        )}
      </div>

      <dl className="cand-meta">
        <div>
          <dt><Database size={14} /> 데이터 후보</dt>
          <dd>
            {t.dataOptions.map((d) => (
              <span key={d.name} className="cand-data-row">{d.name} <StatusPill status={d.status} /></span>
            ))}
          </dd>
        </div>
        <div><dt><FlaskConical size={14} /> 방법</dt><dd>{t.methodDetail}</dd></div>
        <div><dt><Timer size={14} /> 예상 범위</dt><dd>{t.scope}</dd></div>
        <div><dt><ShieldCheck size={14} /> 확인할 점</dt><dd>{t.uncertainties.join(" ")}</dd></div>
      </dl>

      <div className="cand-first">
        <strong>첫 30분 행동</strong>
        <p>{t.firstAction}</p>
      </div>

      <div className="cand-src">
        <ShieldCheck size={13} /> 근거 {t.evidence.length}개 · {t.evidence.map((e) => e.type).join(", ")} · 최근 확인 {t.evidence[0]?.verifiedAt}
      </div>

      <button type="button" className={cx("cand-select", selected && "is-selected")} onClick={onSelect} aria-pressed={selected}>
        {selected ? "선택됨" : "이 주제로 선택"}
      </button>
    </article>
  );
}

/**
 * 전공 진화 실험실 — 한 질문씩 공동설계 + 아이디어 1·2 비교.
 *
 * 와이어프레임대로 왼쪽에 공동설계 진행 상태를 두고, 오른쪽 두 아이디어를
 * 같은 다섯 항목(방법·데이터·범위·불확실성·첫 행동)으로 나란히 비교합니다.
 * 어느 쪽이 더 낫다는 점수는 표시하지 않습니다.
 */
const DESIGN_STEPS = [
  { id: "problem", label: "문제" },
  { id: "target", label: "대상" },
  { id: "method", label: "방법" },
  { id: "evidence", label: "데이터" },
  { id: "scope", label: "범위" },
] as const;

function IdeaLab({
  candidates,
  answers,
  selectedTopicId,
  onSelect,
}: {
  candidates: TopicWithChecks[];
  answers: { questionId: string; label: string; value: string }[];
  selectedTopicId: string | null;
  onSelect: (id: string) => void;
}) {
  const answerFor = (id: string) => answers.find((a) => a.questionId === id) ?? null;

  return (
    <div className="lab-layout">
      <Card className="lab-panel">
        <h2>한 질문씩 공동설계</h2>
        <ol>
          {DESIGN_STEPS.map((step) => {
            const answer = answerFor(step.id);
            return (
              <li key={step.id} className={answer ? "is-done" : undefined}>
                <span className="lab-panel__dot" aria-hidden="true" />
                <div>
                  <strong>{step.label}</strong>
                  <p>{answer ? answer.value : "아직 확인 전"}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </Card>

      <div className="lab-ideas">
        {candidates.map((candidate, index) => {
          const t = candidate.topic;
          const selected = selectedTopicId === t.id;
          const rows: Array<[string, ReactNode]> = [
            ["방법", t.methodDetail],
            ["데이터", t.dataOptions.map((d) => d.name).join(" · ")],
            ["범위", t.scope],
            ["불확실성", t.uncertainties.join(" ")],
            ["첫 행동", t.firstAction],
          ];
          return (
            <article key={t.id} className={cx("lab-idea", selected && "is-selected")}>
              <span className="lab-idea__index">아이디어 {index + 1}</span>
              <h3>{t.question}</h3>
              <p className="lab-idea__title">{t.title}</p>
              <dl>
                {rows.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <button
                type="button"
                className={cx("lab-idea__select", selected && "is-selected")}
                aria-pressed={selected}
                onClick={() => onSelect(t.id)}
              >
                {selected ? "선택됨" : "이 주제로 선택"}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function IdeaComparisonTable({
  candidates,
  selectedTopicId,
  onSelect,
}: {
  candidates: [TopicWithChecks, TopicWithChecks];
  selectedTopicId: string | null;
  onSelect: (id: string) => void;
}) {
  const labels = ["A", "B"] as const;
  const cell = (candidate: TopicWithChecks, index: number) => {
    const topic = candidate.topic;
    return (
      <div className="idea-compare-head">
        <span className="cand-badge">{labels[index]}</span>
        <div>
          <Tag tone={topic.variant === "안전 축소형" ? "mint" : "violet"}>{topic.variant}</Tag>
          <strong>{topic.title}</strong>
        </div>
      </div>
    );
  };

  return (
    <div className="idea-compare-scroll" tabIndex={0} aria-label="연구 아이디어 2개 비교표">
      <table className="idea-compare-table">
        <caption>두 연구 아이디어를 같은 항목으로 비교</caption>
        <thead>
          <tr>
            <th scope="col">비교 항목</th>
            {candidates.map((candidate, index) => (
              <th scope="col" key={candidate.topic.id}>{cell(candidate, index)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">문제 정의</th>
            {candidates.map(({ topic }) => (
              <td key={topic.id}>{topic.problem ?? "검수된 로컬 후보에는 별도 문제 정의가 없어요."}</td>
            ))}
          </tr>
          <tr>
            <th scope="row">연구질문</th>
            {candidates.map(({ topic }) => <td key={topic.id}>{topic.question}</td>)}
          </tr>
          <tr>
            <th scope="row">사용자 확인</th>
            {candidates.map(({ topic }) => (
              <td key={topic.id}>
                {topic.userConfirmed?.length
                  ? topic.userConfirmed.map((item) => <span className="idea-fact-row" key={item}><CircleCheck size={13} /> {item}</span>)
                  : "상단의 ‘AI와 확인한 맥락’을 참고하세요."}
              </td>
            ))}
          </tr>
          <tr>
            <th scope="row">AI 제안</th>
            {candidates.map(({ topic }) => (
              <td key={topic.id}>
                {topic.aiProposed?.length
                  ? topic.aiProposed.map((item) => <span className="idea-proposal-row" key={item}><Sparkles size={13} /> {item}</span>)
                  : "검수된 로컬 후보에는 별도 AI 제안이 없어요."}
              </td>
            ))}
          </tr>
          <tr>
            <th scope="row">내 조건과 연결</th>
            {candidates.map(({ topic, matchedInterests, matchedMethods }) => (
              <td key={topic.id}>
                <p>{topic.reason}</p>
                <div className="tag-row">
                  {matchedInterests.map((item) => <Tag key={item} tone="blue">{item}</Tag>)}
                  {matchedMethods.map((item) => <Tag key={item}>{item}</Tag>)}
                </div>
              </td>
            ))}
          </tr>
          <tr>
            <th scope="row">데이터 후보</th>
            {candidates.map(({ topic }) => (
              <td key={topic.id}>
                {topic.dataOptions.map((item) => (
                  <span className="cand-data-row" key={item.name}>
                    {item.name} <StatusPill status={item.status} />
                  </span>
                ))}
              </td>
            ))}
          </tr>
          <tr>
            <th scope="row">방법</th>
            {candidates.map(({ topic }) => <td key={topic.id}>{topic.methodDetail}</td>)}
          </tr>
          <tr>
            <th scope="row">예상 범위</th>
            {candidates.map(({ topic }) => <td key={topic.id}>{topic.scope}</td>)}
          </tr>
          <tr>
            <th scope="row">확인할 점</th>
            {candidates.map(({ topic }) => <td key={topic.id}>{topic.uncertainties.join(" ")}</td>)}
          </tr>
          <tr>
            <th scope="row">첫 30분 행동</th>
            {candidates.map(({ topic }) => <td key={topic.id}>{topic.firstAction}</td>)}
          </tr>
          <tr>
            <th scope="row">근거 상태</th>
            {candidates.map(({ topic }) => (
              <td key={topic.id}>
                {topic.evidence.map((item) => (
                  <span className="idea-evidence-row" key={item.id}>
                    <ShieldCheck size={13} /> {item.type} · {item.verifiedAt}
                  </span>
                ))}
              </td>
            ))}
          </tr>
          <tr>
            <th scope="row">선택</th>
            {candidates.map(({ topic }) => {
              const selected = selectedTopicId === topic.id;
              return (
                <td key={topic.id}>
                  <button
                    type="button"
                    className={cx("cand-select", selected && "is-selected")}
                    onClick={() => onSelect(topic.id)}
                    aria-pressed={selected}
                  >
                    {selected ? "선택됨" : "이 주제로 선택"}
                  </button>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

const ROLE_LABEL: Record<ProfessorMatchRole, string> = {
  TOPIC: "연구주제 연결",
  METHOD: "방법론 연결",
  CONTEXT: "응용 맥락 연결",
};

const STRENGTH_LABEL: Record<ProfessorMatchStrength, string> = {
  DIRECT: "직접 근거",
  RELATED: "연관 근거",
  LIMITED: "추가 확인 필요",
};

function ProfessorBlock({
  topic,
  matches,
  coverage,
  status,
  error,
  scopeMessage,
  onLoad,
  onSelectProfessor,
}: {
  topic: TopicWithChecks["topic"];
  matches: ProfessorMatch[];
  coverage: Pick<
    ProfessorMatchResponse,
    "officialRecordCount" | "scopeStatus" | "coverageGaps" | "note"
  > | null;
  status: "idle" | "loading" | "success" | "error";
  error: string | null;
  scopeMessage: string | null;
  onLoad: () => void;
  onSelectProfessor: (id: string) => void;
}) {
  if (scopeMessage) {
    return (
      <section id="professor-connection" className="prof-block">
        <div className="section-heading"><h2>교수 공식 정보 연결</h2></div>
        <Card className="prof-note prof-note--pending">
          <span><CircleAlert size={18} /></span>
          <div>
            <strong>현재 단국대학교 교수 데이터 파일럿이에요</strong>
            <p>{scopeMessage}</p>
            <Link href="/professors" className="prof-load-button">
              <ShieldCheck size={16} /> 교수 찾기에서 학교 확인하기
            </Link>
          </div>
        </Card>
        <p className="prof-disclaimer">{PROFESSOR_DISCLAIMER}</p>
      </section>
    );
  }
  if (status === "idle" || status === "loading" || status === "error") {
    return (
      <section id="professor-connection" className="prof-block">
        <div className="section-heading"><h2>교수 공식 정보 연결</h2></div>
        <Card className="prof-note prof-note--pending">
          <span><CircleAlert size={18} /></span>
          <div>
            <strong>
              {status === "loading"
                ? "공식 프로필 근거를 연결하고 있어요"
                : status === "error"
                  ? "공식 교수 연결을 완료하지 못했어요"
                  : "선택한 주제와 공식 교수 데이터를 연결할 수 있어요"}
            </strong>
            <p>
              {error ?? "주제·방법·확장 관점별 연결 이유와 공식 근거 ID를 확인합니다."}
            </p>
            {status !== "loading" && (
              <button type="button" className="prof-load-button" onClick={onLoad}>
                <ShieldCheck size={16} /> {status === "error" ? "다시 연결하기" : "세 관점의 교수님 찾기"}
              </button>
            )}
          </div>
        </Card>
        <p className="prof-disclaimer">{PROFESSOR_DISCLAIMER}</p>
      </section>
    );
  }
  return (
    <section id="professor-connection" className="prof-block">
      <div className="section-heading"><h2>교수 공식 정보 연결</h2></div>
      <Card className="prof-note">
        <span><ShieldCheck size={18} /></span>
        <div>
          <strong>공식 근거로만 연결했어요</strong>
          <p>{PROFESSOR_DATA_NOTE} 현재 {coverage?.officialRecordCount ?? matches.length}명의 단국대 공식 교수 레코드 안에서 비교했습니다.</p>
        </div>
      </Card>
      <div className="official-match-grid">
      {matches.map((match) => {
        const professor = match.professor;
        const portrait = resolveProfessorPortrait({
          professorId: professor.id,
          professorName: professor.name,
          variant: match.role,
        });
        return (
        <article key={professor.id} className="prof-card official-match-card">
          <div className="prof-card__top">
            <div className="prof-card__identity">
              <div className="official-professor-avatar" title={portrait.sourceLabel}>
                <Image
                  src={portrait.src}
                  alt={portrait.alt}
                  width={48}
                  height={48}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    borderRadius: "inherit",
                  }}
                />
              </div>
              <div>
                <span className="official-match-order">{ROLE_LABEL[match.role]}</span>
                <h3>{professor.name} {professor.title}</h3>
                <small>{professor.university} · {professor.department}</small>
              </div>
            </div>
            <Tag tone={match.strength === "LIMITED" ? "warning" : "mint"}>{ROLE_LABEL[match.role]}</Tag>
          </div>
          <div className="tag-row">
            <Tag tone={portrait.isActualProfessorPhoto ? "mint" : "violet"}>
              {portrait.badgeLabel}
            </Tag>
            <Tag tone={match.strength === "LIMITED" ? "warning" : "blue"}>{STRENGTH_LABEL[match.strength]}</Tag>
            {professor.researchFields.map((field) => <Tag key={field}>{field}</Tag>)}
          </div>
          <p className="official-match-reason"><CircleCheck size={15} /> <span>{match.reason}</span></p>
          <dl className="official-evidence-list">
            <div><dt>근거 ID</dt><dd>{match.evidenceIds.join(" · ")}</dd></div>
            <div>
              <dt>논문 상태</dt>
              <dd>
                {professor.publicationsStatus === "FOUND"
                  ? `공식 프로필 노출 논문 ${professor.publicationCount}건`
                  : "공식 프로필 미기재"}
              </dd>
            </div>
            <div><dt>근거가 말하지 않는 것</dt><dd>{match.doesNotEstablish.join(" · ")}</dd></div>
          </dl>
          <div className="prof-meta">
            <span><ShieldCheck size={13} /> 수집 확인 {new Date(professor.collectedAt).toLocaleDateString("ko-KR")}</span>
            <span className="prof-unknown"><CircleAlert size={13} /> 모집·면담 가능 여부 미확인</span>
          </div>
          <div className="official-match-actions">
            <Link className="prof-link" href={`/professors/${professor.id}`} onClick={() => onSelectProfessor(professor.id)}>
              상세 근거 보기 <ArrowUpRight size={14} />
            </Link>
            <Link className="prof-link prof-link--secondary" href={professor.officialProfileUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={15} /> 대학 공식 프로필
            </Link>
          </div>
        </article>
      );})}
      </div>
      {coverage?.coverageGaps.map((gap) => (
        <Card
          className="prof-coverage-gap"
          key={`${gap.university}-${gap.department ?? "unknown"}-${gap.status}-${gap.sourceUrl}`}
        >
          <CircleAlert size={17} />
          <div>
            <strong>{gap.university} · {gap.department ?? gap.status}</strong>
            {gap.department && <small>{gap.status}</small>}
            <p>{gap.scopeImpact}</p>
          </div>
        </Card>
      ))}
      {coverage && <p className="prof-scope-note">{coverage.note}</p>}
      <p className="prof-disclaimer">{PROFESSOR_DISCLAIMER}</p>
    </section>
  );
}

export function ResearchResultScreen() {
  const router = useRouter();
  const hasHydrated = useResearchStore((s) => s.hasHydrated);
  const result = useResearchStore((s) => s.result);
  const conditions = useResearchStore((s) => s.conditions);
  const ideaMode = useResearchStore((s) => s.ideaMode);
  const coDesignAnswers = useResearchStore((s) => s.coDesignAnswers);
  const resultOrigin = useResearchStore((s) => s.resultOrigin);
  const groundingNote = useResearchStore((s) => s.groundingNote);
  const selectedTopicId = useResearchStore((s) => s.selectedTopicId);
  const professorMatches = useResearchStore((s) => s.professorMatches);
  const professorCoverage = useResearchStore((s) => s.professorCoverage);
  const professorMatchStatus = useResearchStore((s) => s.professorMatchStatus);
  const professorMatchError = useResearchStore((s) => s.professorMatchError);
  const selectTopic = useResearchStore((s) => s.selectTopic);
  const setProfessorMatchLoading = useResearchStore((s) => s.setProfessorMatchLoading);
  const setProfessorMatches = useResearchStore((s) => s.setProfessorMatches);
  const setProfessorMatchError = useResearchStore((s) => s.setProfessorMatchError);
  const selectProfessor = useResearchStore((s) => s.selectProfessor);
  const reRecommend = useResearchStore((s) => s.reRecommend);
  const reRecommendNote = useResearchStore((s) => s.reRecommendNote);
  const loadKey = useResearchStore((s) => s.loadKey);

  const [loading, setLoading] = useState(true);
  const [cooldown, setCooldown] = useState(false);
  const professorRequestRef = useRef<AbortController | null>(null);

  useEffect(() => () => {
    professorRequestRef.current?.abort();
  }, []);

  useEffect(() => {
    if (hasHydrated && result === null) {
      router.replace("/research");
      return;
    }
  }, [hasHydrated, result, router]);

  useEffect(() => {
    setLoading(true);
    const t = window.setTimeout(() => setLoading(false), 900);
    return () => window.clearTimeout(t);
  }, [loadKey]);

  const onReRecommend = () => {
    if (cooldown) return;
    setCooldown(true);
    reRecommend();
    window.setTimeout(() => setCooldown(false), 1200);
  };

  const loadProfessorMatches = async (topic: TopicWithChecks["topic"]) => {
    if (!isDankookUniversity(conditions.school)) return;
    professorRequestRef.current?.abort();
    const requestController = new AbortController();
    professorRequestRef.current = requestController;
    setProfessorMatchLoading(topic.id);
    try {
      const response = await requestProfessorMatches(
        topic,
        conditions.major ?? "",
        conditions.school,
        { signal: requestController.signal },
      );
      if (professorRequestRef.current !== requestController) return;
      setProfessorMatches(response);
    } catch (matchError) {
      if (
        matchError instanceof ProfessorMatchRequestAbortedError
        || professorRequestRef.current !== requestController
      ) {
        return;
      }
      setProfessorMatchError(
        topic.id,
        matchError instanceof Error ? matchError.message : "공식 교수 데이터를 연결하지 못했습니다.",
      );
    } finally {
      if (professorRequestRef.current === requestController) {
        professorRequestRef.current = null;
      }
    }
  };

  const onSelectTopic = (id: string) => {
    const currentResult = result;
    if (!currentResult) return;
    const chosen = currentResult.kind === "ok"
      ? currentResult.candidates.find((candidate) => candidate.topic.id === id)
      : currentResult.kind === "insufficient" && currentResult.candidate.topic.id === id
        ? currentResult.candidate
        : undefined;
    if (!chosen) return;
    selectTopic(id);
    void loadProfessorMatches(chosen.topic);
  };

  if (!hasHydrated || result === null) {
    return (
      <div className="research-loading">
        <Image src="/mvp-assets/robot-pose-2.png" alt="" width={92} height={92} priority />
        <p>저장된 연구 결과를 불러오고 있어요.</p>
      </div>
    );
  }

  const summaryChips = [
    modeById(ideaMode)?.label,
    conditions.major,
    ...conditions.interests,
    conditions.experience,
    ...conditions.methods,
    conditions.period,
    conditions.dataAccess,
  ].filter(Boolean) as string[];
  const professorScopeMessage = !conditions.school.trim()
    ? "학교는 아이디어 생성에서는 선택 정보이지만, 교수 연결에서는 공식 데이터 범위를 확인해야 합니다. 현재는 학교가 선택되지 않았어요."
    : !isDankookUniversity(conditions.school)
      ? `${conditions.school} 학생도 연구 아이디어 기능은 이용할 수 있지만, 교수 연결 데이터는 아직 단국대학교 1,051명만 지원합니다.`
      : null;

  const stickyAction = (
    <>
      <SecondaryButton onClick={() => router.push("/research")}>조건 바꾸기</SecondaryButton>
      <PrimaryButton onClick={onReRecommend} disabled={cooldown || loading}>
        <RotateCw size={17} className={cooldown ? "spin" : ""} /> 후보 다시 만들기
      </PrimaryButton>
    </>
  );

  return (
    <AppShell title="전공 진화 실험실 — 만들다" onBack={() => router.push("/research")} className="research-screen result-screen" stickyAction={stickyAction}>
      {loading ? (
        <div className="research-loading">
          <Image src={guideCharacter.processing} alt="" width={92} height={92} priority unoptimized />
          <p>조건에 맞는 연구주제 후보를 찾고 있어요.</p>
        </div>
      ) : (
        <>
          <SceneBanner
            scene={brandScene.make}
            alt="내 전공과 다른 분야를 조합해 연구 아이디어를 만드는 장면"
            eyebrow="CORE 02"
            title="전공 진화 실험실 — 만들다"
            description="점수 대신 근거·데이터·방법·범위와 확인할 조건으로 비교했어요."
            priority
          />

          <Card className={cx("result-grounding", resultOrigin === "ai" ? "is-ai" : "is-fallback")}>
            <span>{resultOrigin === "ai" ? <Sparkles size={18} /> : <ShieldCheck size={18} />}</span>
            <div>
              <strong>{resultOrigin === "ai" ? "AI 공동설계 후보" : "검수된 로컬 후보"}</strong>
              <p>{groundingNote ?? "사용자 확인 답변과 확인 필요 항목을 분리해 구성했어요."}</p>
            </div>
          </Card>

          <div className="cond-summary">
            <span className="cond-summary__label">선택한 조건</span>
            <div className="tag-row">{summaryChips.map((s, i) => <Tag key={`${s}-${i}`}>{s}</Tag>)}</div>
            {coDesignAnswers.length > 0 && (
              <details className="co-answer-summary">
                <summary>AI와 확인한 맥락 {coDesignAnswers.length}개</summary>
                <dl>
                  {coDesignAnswers.map((answer) => (
                    <div key={answer.questionId}>
                      <dt>{answer.label}</dt>
                      <dd>{answer.value}</dd>
                    </div>
                  ))}
                </dl>
              </details>
            )}
          </div>

          {result.kind === "empty" && (
            <EmptyBlock icon={CircleAlert} title="현재 조건에 맞는 연구주제를 찾지 못했어요." desc="관심 분야나 준비 조건을 바꿔 다시 시도해 주세요." onChange={() => router.push("/research")} onRetry={onReRecommend} />
          )}

          {result.kind === "insufficient" && (
            <>
              <Card className="cond-warn">
                <span><CircleAlert size={18} /></span>
                <div><strong>비교할 두 번째 연구주제가 부족해요</strong><p>확인된 후보 1개만 보여드려요. 조건을 조금 바꾸면 비교 후보를 더 찾을 수 있어요.</p></div>
              </Card>
              <div className="cand-list cand-list--one">
                <CandidateCard cand={result.candidate} label="A" selected={selectedTopicId === result.candidate.topic.id} onSelect={() => onSelectTopic(result.candidate.topic.id)} />
              </div>
            </>
          )}

          {result.kind === "ok" && (
            <>
              <IdeaLab
                candidates={result.candidates}
                answers={coDesignAnswers}
                selectedTopicId={selectedTopicId}
                onSelect={onSelectTopic}
              />

              <details className="lab-full-compare">
                <summary>항목별 전체 비교표 보기</summary>
                <IdeaComparisonTable
                  candidates={result.candidates}
                  selectedTopicId={selectedTopicId}
                  onSelect={onSelectTopic}
                />
              </details>

              <section className="compare-block">
                <div className="section-heading"><h2><Sliders size={18} /> 정성 비교</h2><p>숫자 점수 없이 조건별 근거로 비교해요.</p></div>
                {(Object.keys(CRITERION_LABELS) as CriterionKey[]).map((key) => {
                  const Icon = CRIT_ICON[key];
                  const a = result.candidates[0].checks[key];
                  const b = result.candidates[1].checks[key];
                  return (
                    <div key={key} className="compare-row">
                      <div className="compare-row__title"><Icon size={15} /> {CRITERION_LABELS[key]}</div>
                      <div className="compare-row__sides">
                        <div><span className="compare-ab">A</span><StatusPill status={a.status} /><p>{a.note}</p></div>
                        <div><span className="compare-ab">B</span><StatusPill status={b.status} /><p>{b.note}</p></div>
                      </div>
                    </div>
                  );
                })}
                <p className="compare-foot">어느 후보가 절대적으로 더 좋다고 단정하지 않아요. 선택 이유는 직접 정해요.</p>
                {selectedTopicId && (
                  <a className="prof-jump-link" href="#professor-connection">
                    선택한 주제의 교수 연결 상태 보기 <ArrowUpRight size={14} />
                  </a>
                )}
              </section>
            </>
          )}

          {reRecommendNote && <div className="rerec-note" role="status"><Info size={15} /> {reRecommendNote}</div>}

          {selectedTopicId && (() => {
            const chosen =
              result.kind === "ok"
                ? result.candidates.find((c) => c.topic.id === selectedTopicId)
                : result.kind === "insufficient" && result.candidate.topic.id === selectedTopicId
                  ? result.candidate
                  : undefined;
            return chosen ? (
              <ProfessorBlock
                topic={chosen.topic}
                matches={professorMatches}
                coverage={professorCoverage}
                status={professorMatchStatus}
                error={professorMatchError}
                scopeMessage={professorScopeMessage}
                onLoad={() => void loadProfessorMatches(chosen.topic)}
                onSelectProfessor={selectProfessor}
              />
            ) : null;
          })()}
        </>
      )}
    </AppShell>
  );
}

function EmptyBlock({ icon: Icon, title, desc, onChange, onRetry }: { icon: typeof CircleAlert; title: string; desc: string; onChange: () => void; onRetry?: () => void }) {
  return (
    <div className="research-empty">
      <Image src={guideCharacter.confused} alt="" width={96} height={92} unoptimized />
      <Icon size={22} />
      <h2>{title}</h2>
      <p>{desc}</p>
      <div className="research-empty__actions">
        <PrimaryButton onClick={onChange}>조건 바꾸기</PrimaryButton>
        {onRetry && <SecondaryButton onClick={onRetry}>다시 시도</SecondaryButton>}
      </div>
    </div>
  );
}
