"use client";

import {
  AlertTriangle,
  BookOpen,
  BotMessageSquare,
  CheckCircle2,
  Clipboard,
  Copy,
  FileImage,
  FileSearch,
  Languages,
  Lightbulb,
  ListChecks,
  LoaderCircle,
  PencilLine,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  AppShell,
  Card,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  SectionHeading,
  StatusBanner,
  Tag,
  TextButton,
} from "@/components/app/primitives";
import { requestPaperAnalysis } from "@/lib/ai-client";
import type { PaperAnalysisResult } from "@/lib/paper-analysis";
import {
  PAPER_READER_CAPABILITIES,
  type PaperReaderCapabilityId,
} from "@/lib/paper-reader-contract";
import { useQuestStore } from "@/store/quest-store";
import { useResearchStore } from "@/store/research-store";

const MIN_CONTENT_LENGTH = 80;
const MAX_CONTENT_LENGTH = 12_000;

const capabilityIcons: Partial<Record<PaperReaderCapabilityId, typeof BookOpen>> = {
  original: BookOpen,
  translation: Languages,
  qa: BotMessageSquare,
  figure: FileImage,
};

const FOLLOW_UP_CAPABILITIES = PAPER_READER_CAPABILITIES.filter(
  (capability) => capability.id !== "summary",
);

type BiteCardKey = "problem" | "method" | "result" | "limitations" | "questions";
type BiteDraft = Record<BiteCardKey, string>;

const BITE_CARD_META: ReadonlyArray<{
  key: BiteCardKey;
  eyebrow: string;
  title: string;
  description: string;
  icon: typeof Lightbulb;
}> = [
  {
    key: "problem",
    eyebrow: "01 문제",
    title: "왜 시작한 연구인가요?",
    description: "논문이 풀려는 배경과 문제를 확인해요.",
    icon: Lightbulb,
  },
  {
    key: "method",
    eyebrow: "02 방법",
    title: "어떻게 확인했나요?",
    description: "자료와 분석 절차를 쉬운 문장으로 정리해요.",
    icon: FileSearch,
  },
  {
    key: "result",
    eyebrow: "03 결과",
    title: "무엇을 발견했나요?",
    description: "붙여 넣은 범위 안의 핵심 결과를 모아요.",
    icon: CheckCircle2,
  },
  {
    key: "limitations",
    eyebrow: "04 한계",
    title: "어디까지 믿어야 하나요?",
    description: "해석할 때 주의할 점과 빈틈을 남겨요.",
    icon: AlertTriangle,
  },
  {
    key: "questions",
    eyebrow: "05 질문",
    title: "교수님께 무엇을 물어볼까요?",
    description: "면담에서 바로 꺼낼 수 있는 질문을 준비해요.",
    icon: ListChecks,
  },
] as const;

const TEXT_SCOPE_EVIDENCE = {
  label: "사용자가 붙여 넣은 텍스트 범위 · 페이지 정보 없음",
  page: null,
  href: null,
} as const;

function createBiteDraft(result: PaperAnalysisResult): BiteDraft {
  return {
    problem: result.background,
    method: result.methods.join("\n"),
    result: result.findings.join("\n"),
    limitations: result.limitations.join("\n"),
    questions: [result.question, ...result.nextQuestions].filter(Boolean).join("\n"),
  };
}

export function PaperReaderShell() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [analysis, setAnalysis] = useState<PaperAnalysisResult | null>(null);
  const [draft, setDraft] = useState<BiteDraft | null>(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savedCardIds, setSavedCardIds] = useState<Partial<Record<BiteCardKey, string>>>({});

  const hasQuestHydrated = useQuestStore((state) => state.hasHydrated);
  const saveCard = useQuestStore((state) => state.saveCard);
  const updateCard = useQuestStore((state) => state.updateCard);
  const selectedProfessorId = useResearchStore((state) => state.selectedProfessorId);
  const selectedTopicId = useResearchStore((state) => state.selectedTopicId);

  const normalizedLength = content.trim().length;
  const isReady = normalizedLength >= MIN_CONTENT_LENGTH;
  const fullCopy = useMemo(() => {
    if (!analysis || !draft) return "";
    return [
      `논문 한입 · ${analysis.title}`,
      analysis.oneLine,
      ...BITE_CARD_META.map((card) => `${card.eyebrow} ${card.title}\n${draft[card.key]}`),
      `근거 범위\n${TEXT_SCOPE_EVIDENCE.label}`,
    ].join("\n\n");
  }, [analysis, draft]);

  const analyze = async () => {
    const normalized = content.trim();
    if (normalized.length < MIN_CONTENT_LENGTH) {
      setError(`논문 초록이나 본문 일부를 ${MIN_CONTENT_LENGTH}자 이상 입력해 주세요.`);
      return;
    }

    setError("");
    setFeedback("");
    setIsSaved(false);
    setIsLoading(true);
    try {
      const nextAnalysis = await requestPaperAnalysis({
        title: title.trim(),
        content: normalized,
      });
      setAnalysis(nextAnalysis);
      setDraft(createBiteDraft(nextAnalysis));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "논문 분석을 완료하지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const updateDraft = (key: BiteCardKey, value: string) => {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
    setIsSaved(false);
    setFeedback("");
  };

  const copyText = async (value: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setFeedback(successMessage);
    } catch {
      setFeedback("복사하지 못했어요. 브라우저의 클립보드 권한을 확인해 주세요.");
    }
  };

  const saveToQuest = () => {
    if (!analysis || !draft || !hasQuestHydrated) return;

    const nextSavedCardIds = { ...savedCardIds };
    let updatedExistingCards = false;
    BITE_CARD_META.forEach((card) => {
      const cardTitle = `${card.eyebrow} · ${analysis.title}`;
      const cardBody = draft[card.key].trim() || "아직 작성된 내용이 없어요.";
      const savedCardId = savedCardIds[card.key];
      if (savedCardId) {
        updateCard(savedCardId, { title: cardTitle, body: cardBody });
        updatedExistingCards = true;
        return;
      }
      nextSavedCardIds[card.key] = saveCard({
        tool: "paper-bite",
        title: cardTitle,
        body: cardBody,
        evidence: TEXT_SCOPE_EVIDENCE,
        professorId: selectedProfessorId,
        topicId: selectedTopicId,
      });
    });
    setSavedCardIds(nextSavedCardIds);
    setIsSaved(true);
    setFeedback(
      updatedExistingCards
        ? "수정한 논문 한입 카드 5장을 업데이트했어요."
        : "교수님 퀘스트에 논문 한입 카드 5장을 저장했어요.",
    );
  };

  const reset = () => {
    setTitle("");
    setContent("");
    setAnalysis(null);
    setDraft(null);
    setError("");
    setFeedback("");
    setIsSaved(false);
    setSavedCardIds({});
  };

  if (analysis && draft) {
    return (
      <AppShell title="Q01 논문 한입" backHref="/quest" className="paper-bite-screen">
        <PageHeader
          eyebrow="교수님 퀘스트 · 만나기 전"
          title={analysis.title}
          description={analysis.oneLine}
        />

        <StatusBanner icon={CheckCircle2} title="붙여 넣은 텍스트 분석 완료" tone="success">
          PDF 전체가 아니라 입력한 범위만 분석했습니다. 페이지 번호와 원문 위치는 확인할 수 없어요.
        </StatusBanner>

        <div className="paper-bite-meta">
          <Tag tone="violet">3분 카드 5장</Tag>
          <span>{new Date(analysis.generatedAt).toLocaleString("ko-KR")}</span>
          <span>{analysis.model}</span>
        </div>

        <SectionHeading
          title="교수님께 가져갈 논문 한입"
          description="AI 초안을 그대로 믿지 말고 원문과 대조한 뒤, 내 말로 고쳐 저장하세요."
        />

        <div className="paper-bite-grid">
          {BITE_CARD_META.map((card) => {
            const Icon = card.icon;
            return (
              <Card className="paper-bite-card" key={card.key}>
                <div className="paper-bite-card__heading">
                  <span><Icon size={19} aria-hidden="true" /></span>
                  <div>
                    <small>{card.eyebrow}</small>
                    <h2>{card.title}</h2>
                    <p>{card.description}</p>
                  </div>
                </div>
                <label htmlFor={`paper-bite-${card.key}`}>
                  <span className="sr-only">{card.title} 내용 편집</span>
                  <textarea
                    id={`paper-bite-${card.key}`}
                    className="textarea paper-bite-card__editor"
                    value={draft[card.key]}
                    onChange={(event) => updateDraft(card.key, event.target.value)}
                    rows={7}
                  />
                </label>
                <TextButton
                  type="button"
                  onClick={() => void copyText(draft[card.key], `${card.eyebrow} 카드를 복사했어요.`)}
                >
                  <Copy size={15} aria-hidden="true" /> 이 카드 복사
                </TextButton>
              </Card>
            );
          })}
        </div>

        <Card className="paper-bite-evidence">
          <ShieldCheck size={21} aria-hidden="true" />
          <div>
            <h2>근거 범위</h2>
            <p>{TEXT_SCOPE_EVIDENCE.label}</p>
            <small>
              인용·제출·교수님 면담 전에는 반드시 실제 원문의 문장과 페이지를 직접 확인하세요.
            </small>
          </div>
        </Card>

        <div className="paper-bite-actions">
          <SecondaryButton type="button" onClick={reset}>
            <RotateCcw size={17} aria-hidden="true" /> 다른 논문
          </SecondaryButton>
          <SecondaryButton type="button" onClick={() => void copyText(fullCopy, "카드 5장을 모두 복사했어요.")}>
            <Clipboard size={17} aria-hidden="true" /> 전체 복사
          </SecondaryButton>
          <PrimaryButton
            type="button"
            onClick={saveToQuest}
            disabled={!hasQuestHydrated || isSaved}
          >
            {isSaved
              ? <><CheckCircle2 size={17} aria-hidden="true" /> 저장 완료</>
              : <><Save size={17} aria-hidden="true" /> 퀘스트에 저장</>}
          </PrimaryButton>
        </div>

        {!hasQuestHydrated && (
          <p className="paper-bite-hydration" role="status">
            저장 공간을 불러오는 중이에요. 잠시 후 저장 버튼이 활성화됩니다.
          </p>
        )}
        {feedback && <p className="action-feedback" role="status">{feedback}</p>}

        <FollowUpModules />
      </AppShell>
    );
  }

  return (
    <AppShell title="Q01 논문 한입" backHref="/quest" className="paper-bite-screen">
      <PageHeader
        eyebrow="교수님 퀘스트 · 만나기 전"
        title="논문을 읽고 온 학생의 3분 준비 카드"
        description="교수님의 논문 초록이나 본문을 붙여 넣으면 문제·방법·결과·한계·질문 카드로 나눠 드려요."
      />

      <StatusBanner icon={Sparkles} title="원문을 대신하지 않는 읽기 보조 도구" tone="lavender">
        현재 MVP는 텍스트만 분석합니다. AI가 만든 내용은 원문과 대조하고, 내 말로 수정한 뒤 사용하세요.
      </StatusBanner>

      <Card className="paper-input-card paper-bite-input">
        <label className="field-group" htmlFor="paper-title">
          <span className="field-label">논문 제목 <small>선택</small></span>
          <input
            id="paper-title"
            className="input"
            value={title}
            onChange={(event) => setTitle(event.target.value.slice(0, 180))}
            placeholder="예: 대학생의 진로 불안과 멘토링 효과"
          />
        </label>
        <label className="field-group" htmlFor="paper-content">
          <span className="field-label">초록 또는 본문</span>
          <textarea
            id="paper-content"
            className="textarea paper-input"
            value={content}
            onChange={(event) => setContent(event.target.value.slice(0, MAX_CONTENT_LENGTH))}
            placeholder="분석할 논문 초록이나 본문 일부를 붙여 넣어 주세요."
          />
        </label>
        <div className="paper-input-meta">
          <span className={isReady ? "is-ready" : ""}>
            {content.length.toLocaleString()} / {MAX_CONTENT_LENGTH.toLocaleString()}자
          </span>
          <small>최소 {MIN_CONTENT_LENGTH}자</small>
        </div>
        {error && <p className="field-error" role="alert">{error}</p>}
        <PrimaryButton
          type="button"
          onClick={analyze}
          disabled={isLoading || !isReady}
        >
          {isLoading
            ? <><LoaderCircle size={18} className="spin" aria-hidden="true" /> 논문 한입 만드는 중</>
            : <><FileSearch size={18} aria-hidden="true" /> 3분 카드 만들기</>}
        </PrimaryButton>
      </Card>

      <div className="paper-privacy">
        <ShieldCheck size={17} aria-hidden="true" />
        <p>
          입력 내용은 분석 요청을 위해 OpenAI API로 전송됩니다. 미공개 논문, 개인정보,
          연구실 내부 자료는 붙여 넣지 마세요.
        </p>
      </div>

      {content && !isLoading && (
        <div className="context-actions">
          <TextButton type="button" onClick={reset}>
            <RotateCcw size={16} aria-hidden="true" /> 입력 지우기
          </TextButton>
        </div>
      )}

      <FollowUpModules />
    </AppShell>
  );
}

function FollowUpModules() {
  return (
    <section className="paper-bite-follow-up" aria-labelledby="paper-follow-up-title">
      <SectionHeading
        title="PDF 통합 리더는 다음 단계"
        description="지금 동작하는 텍스트 요약과 아직 연결되지 않은 기능을 구분했어요."
      />
      <h2 className="sr-only" id="paper-follow-up-title">후속 논문 리더 모듈</h2>
      <div className="paper-reader-capabilities">
        {FOLLOW_UP_CAPABILITIES.map((capability) => {
          const Icon = capabilityIcons[capability.id] ?? BookOpen;
          return (
            <article key={capability.id}>
              <span><Icon size={20} aria-hidden="true" /></span>
              <div>
                <h3>{capability.label}</h3>
                <p>{capability.description}</p>
              </div>
              <small>후속 모듈</small>
            </article>
          );
        })}
      </div>
      <div className="paper-reader-safety">
        <PencilLine size={18} aria-hidden="true" />
        <p>
          PDF 업로드·전체 번역·근거 기반 자유 질의응답·그림 해설은 현재 MVP에서 동작하지 않습니다.
        </p>
      </div>
    </section>
  );
}
