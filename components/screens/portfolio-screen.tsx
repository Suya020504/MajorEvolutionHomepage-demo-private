"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  CalendarCheck,
  Check,
  Download,
  EyeOff,
  FileText,
  LoaderCircle,
  Search,
  ShieldCheck,
  User,
} from "lucide-react";
import {
  AppShell,
  Card,
  PageHeader,
  PrimaryButton,
  SectionHeading,
  StatusBanner,
} from "@/components/app/primitives";
import { DataControls } from "@/components/screens/data-controls";
import { cardsForTool, useQuestStore } from "@/store/quest-store";
import { useResearchStore } from "@/store/research-store";

/**
 * P-01 성장 포트폴리오.
 *
 * 교수님을 만난 결과가 아니라, 학생이 준비하고 바뀐 과정을 기록합니다.
 * 학생이 저장한 결과물만 증거로 씁니다. 없는 단계는 채워 넣지 않고 비어 있다고 말합니다.
 */

type StepId = "topic" | "professor" | "paper" | "prepare" | "revision" | "actions";

const STEP_META: Array<{ id: StepId; label: string; hint: string; icon: typeof Search }> = [
  { id: "topic", label: "주제 탐색", hint: "탐색한 주제와 고민, 질문", icon: Search },
  { id: "professor", label: "교수 근거", hint: "관심 교수와 연결된 이유", icon: User },
  { id: "paper", label: "읽은 논문", hint: "핵심 논문과 인사이트", icon: BookOpenCheck },
  { id: "prepare", label: "면담 준비", hint: "준비한 질문과 면담 목표", icon: FileText },
  { id: "revision", label: "수정 전후", hint: "아이디어가 어떻게 발전했는지", icon: ArrowRight },
  { id: "actions", label: "7일 행동", hint: "면담 후 7일 동안의 행동", icon: CalendarCheck },
];

type StepContent = { lines: string[] };

export function PortfolioScreen() {
  const hasHydrated = useResearchStore((state) => state.hasHydrated);
  const conditions = useResearchStore((state) => state.conditions);
  const result = useResearchStore((state) => state.result);
  const selectedTopicId = useResearchStore((state) => state.selectedTopicId);
  const matches = useResearchStore((state) => state.professorMatches);
  const selectedProfessorId = useResearchStore((state) => state.selectedProfessorId);
  const knockKitDrafts = useResearchStore((state) => state.knockKitDrafts);
  const mentorLoopEntries = useResearchStore((state) => state.mentorLoopEntries);
  const questCards = useQuestStore((state) => state.cards);

  const [excluded, setExcluded] = useState<Set<StepId>>(new Set());
  const [maskPersonal, setMaskPersonal] = useState(true);
  const [onlySelected, setOnlySelected] = useState(true);

  const topic = useMemo(() => {
    if (!result || !selectedTopicId) return null;
    if (result.kind === "ok") {
      return result.candidates.find((c) => c.topic.id === selectedTopicId)?.topic ?? null;
    }
    if (result.kind === "insufficient" && result.candidate.topic.id === selectedTopicId) {
      return result.candidate.topic;
    }
    return null;
  }, [result, selectedTopicId]);

  const match = matches.find((item) => item.professor.id === selectedProfessorId) ?? matches[0] ?? null;
  const loopKey = topic && match ? `${topic.id}:${match.professor.id}` : null;
  const loop = loopKey ? mentorLoopEntries[loopKey] : null;
  const draft = loopKey ? knockKitDrafts[loopKey] : null;

  const professorName = (): string => {
    if (!match) return "";
    return maskPersonal ? `${match.professor.name.slice(0, 1)}○○ 교수님` : `${match.professor.name} ${match.professor.title}`;
  };

  const content = useMemo<Record<StepId, StepContent>>(() => ({
    topic: {
      lines: [
        conditions.major ? `전공: ${conditions.major}` : "",
        conditions.interests.length ? `관심 분야: ${conditions.interests.join(" · ")}` : "",
        topic ? `선택한 주제: ${topic.title}` : "",
        topic ? `연구질문: ${topic.question}` : "",
      ].filter(Boolean),
    },
    professor: {
      lines: match
        ? [
            `연결한 교수: ${professorName()}`,
            `소속: ${match.professor.college} · ${match.professor.department}`,
            `연결 이유: ${match.reason}`,
            `직접 확인할 점: ${match.doesNotEstablish.join(" · ")}`,
          ]
        : [],
    },
    paper: {
      lines: cardsForTool(questCards, "paper-bite").map((card) =>
        `${card.title}: ${card.body}${card.evidence?.page ? ` (p.${card.evidence.page})` : ""}`),
    },
    prepare: {
      lines: [
        ...(draft ? draft.questions.map((question, i) => `준비한 질문 ${i + 1}: ${question}`) : []),
        ...cardsForTool(questCards, "first-line").map((card) => `첫마디(${card.title}): ${card.body}`),
        ...cardsForTool(questCards, "silence-rescue").map((card) => `대비 질문(${card.title}): ${card.body}`),
      ],
    },
    revision: {
      lines: loop
        ? [
            `수정 전 질문: ${loop.before.question}`,
            `수정 전 방법: ${loop.before.methodDetail}`,
            `수정 전 범위: ${loop.before.scope}`,
            `수정 후 질문: ${loop.after.question}`,
            `수정 후 방법: ${loop.after.methodDetail}`,
            `수정 후 범위: ${loop.after.scope}`,
          ].filter((line) => !line.endsWith(": "))
        : [],
    },
    actions: {
      lines: [
        ...(loop ? loop.sevenDayActions.filter(Boolean).map((action, i) => `${i + 1}일차 이후 행동: ${action}`) : []),
        ...cardsForTool(questCards, "next-seed").map((card) => `${card.title}: ${card.body}`),
      ],
    },
  }), [conditions, topic, match, questCards, draft, loop, maskPersonal]);

  if (!hasHydrated) {
    return (
      <div className="research-loading">
        <LoaderCircle className="spin" />
        <p>저장된 성장 기록을 불러오고 있어요.</p>
      </div>
    );
  }

  const toggleStep = (id: StepId) =>
    setExcluded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const includedSteps = STEP_META.filter((step) => !excluded.has(step.id));
  const previewSteps = includedSteps.filter(
    (step) => !onlySelected || content[step.id].lines.length > 0);
  const recordedCount = STEP_META.filter((step) => content[step.id].lines.length > 0).length;

  return (
    <AppShell title="성장 포트폴리오" backHref="/" className="portfolio-screen">
      <PageHeader
        title="성장 포트폴리오"
        description="교수님을 만난 결과가 아니라, 내가 준비하고 바뀐 과정을 기록해요."
      />

      <div className="portfolio-progress">
        <strong>{recordedCount} / 6 단계에 기록이 있어요</strong>
        <span>비어 있는 단계는 채워 넣지 않고 그대로 비워 둡니다.</span>
      </div>

      <SectionHeading title="기록한 과정" description="포트폴리오에 넣을 단계를 고르세요." />
      <ol className="portfolio-timeline">
        {STEP_META.map((step, order) => {
          const Icon = step.icon;
          const lines = content[step.id].lines;
          const included = !excluded.has(step.id);
          return (
            <li key={step.id} className={lines.length ? "portfolio-step" : "portfolio-step is-empty"}>
              <span className="portfolio-step__order">{order + 1}</span>
              <div className="portfolio-step__body">
                <div className="portfolio-step__head">
                  <Icon size={17} aria-hidden="true" />
                  <h2>{step.label}</h2>
                  <label className="portfolio-step__toggle">
                    <input
                      type="checkbox"
                      checked={included}
                      onChange={() => toggleStep(step.id)}
                      aria-label={`${step.label} 포함`}
                    />
                    <span>{included ? "포함" : "제외"}</span>
                  </label>
                </div>
                <p className="portfolio-step__hint">{step.hint}</p>
                {lines.length ? (
                  <ul className="portfolio-step__lines">
                    {lines.map((line) => <li key={line}>{line}</li>)}
                  </ul>
                ) : (
                  <p className="portfolio-step__empty">아직 저장한 기록이 없어요.</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <SectionHeading title="내보내기 설정" />
      <Card className="portfolio-options">
        <label>
          <input type="checkbox" checked={maskPersonal} onChange={() => setMaskPersonal((v) => !v)} />
          <span><EyeOff size={15} aria-hidden="true" /> 개인정보 가리기</span>
          <small>교수님 이름을 첫 글자만 남깁니다.</small>
        </label>
        <label>
          <input type="checkbox" checked={onlySelected} onChange={() => setOnlySelected((v) => !v)} />
          <span><Check size={15} aria-hidden="true" /> 기록이 있는 단계만 포함</span>
          <small>비어 있는 단계를 미리보기에서 뺍니다.</small>
        </label>
      </Card>

      <SectionHeading title="포트폴리오 미리보기" description="아래 내용 그대로 내보냅니다." />
      <section className="portfolio-preview" id="portfolio-preview">
        <h2>성장 포트폴리오</h2>
        <p className="portfolio-preview__lead">
          교수님을 만난 결과가 아니라, 준비하고 바뀐 과정의 기록입니다.
        </p>
        {previewSteps.length === 0 ? (
          <p className="portfolio-step__empty">내보낼 기록이 아직 없어요.</p>
        ) : (
          previewSteps.map((step) => (
            <article key={step.id}>
              <h3>{step.label}</h3>
              {content[step.id].lines.length ? (
                <ul>{content[step.id].lines.map((line) => <li key={line}>{line}</li>)}</ul>
              ) : (
                <p className="portfolio-step__empty">기록 없음</p>
              )}
            </article>
          ))
        )}
      </section>

      <PrimaryButton
        className="portfolio-export"
        disabled={previewSteps.length === 0}
        onClick={() => window.print()}
      >
        <Download size={17} /> PDF로 내보내기
      </PrimaryButton>

      <StatusBanner icon={ShieldCheck} title="내 기록은 내 기기에 있어요" tone="success">
        포트폴리오는 이 브라우저에 저장된 기록으로만 만들어지고, 내보내기는 학생이 직접 진행합니다.
        서버로 전송하지 않습니다.
      </StatusBanner>

      <DataControls />
    </AppShell>
  );
}
