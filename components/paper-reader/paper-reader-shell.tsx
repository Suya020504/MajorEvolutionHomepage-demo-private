"use client";

import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clipboard,
  Copy,
  ExternalLink,
  FileSearch,
  Lightbulb,
  ListChecks,
  LoaderCircle,
  RotateCcw,
  Save,
  ShieldCheck,
  Star,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AppShell,
  Card,
  LinkButton,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  SectionHeading,
  StatusBanner,
  Tag,
  TextButton,
} from "@/components/app/primitives";
import { FavoriteProfessorPaperPicker } from "@/components/paper-reader/favorite-professor-paper-picker";
import { PaperReadingSteps } from "@/components/paper-reader/paper-reading-steps";
import { requestPaperAnalysis } from "@/lib/ai-client";
import type { PaperAnalysisResult } from "@/lib/paper-analysis";
import type { ProfessorPaperSelection } from "@/lib/professor-domain";
import { requestFavoriteProfessorPaperCatalog } from "@/lib/professor-paper-client";
import { createProfessorPaperSelection } from "@/lib/professor-paper-selection";
import { useQuestStore } from "@/store/quest-store";
import { useResearchStore } from "@/store/research-store";

const MIN_CONTENT_LENGTH = 80;
const MAX_CONTENT_LENGTH = 12_000;

type BiteCardKey = "problem" | "method" | "result" | "limitations" | "questions";
type BiteDraft = Record<BiteCardKey, string>;
type PaperBiteWorkflowStep = "select" | "card";

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

function SelectedPaperBanner({
  selection,
  onChange,
  onClear,
}: {
  selection: ProfessorPaperSelection;
  onChange: () => void;
  onClear: () => void;
}) {
  return (
    <Card className="selected-professor-paper">
      <div className="selected-professor-paper__icon">
        <BookOpen size={20} aria-hidden="true" />
      </div>
      <div className="selected-professor-paper__body">
        <div className="selected-professor-paper__meta">
          <Tag tone="mint">공식 프로필 서지정보</Tag>
          <span>{selection.professorName} 교수 · {selection.professorDepartment}</span>
        </div>
        <h2>{selection.title}</h2>
        <p>
          {selection.publicationType}
          {" · "}
          {selection.publishedDate ?? "발행일 미기재"}
        </p>
        <small>
          제목과 출처만 자동 입력했습니다. 초록·본문은 같은 논문인지 확인한 뒤 직접 붙여 넣어 주세요.
        </small>
        <div className="selected-professor-paper__actions">
          <a
            href={selection.officialProfileUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            공식 프로필 확인 <ExternalLink size={13} aria-hidden="true" />
          </a>
          <button type="button" onClick={onChange}>다른 논문 선택</button>
          <button type="button" onClick={onClear}>선택 해제</button>
        </div>
      </div>
    </Card>
  );
}

export function PaperReaderShell({
  startFromFavorites = false,
  initialStep = startFromFavorites ? "select" : "card",
}: {
  startFromFavorites?: boolean;
  initialStep?: PaperBiteWorkflowStep;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [analysis, setAnalysis] = useState<PaperAnalysisResult | null>(null);
  const [draft, setDraft] = useState<BiteDraft | null>(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [workflowStep, setWorkflowStep] = useState<PaperBiteWorkflowStep>(initialStep);
  const [sourceConfirmed, setSourceConfirmed] = useState(false);
  const [paperValidationStatus, setPaperValidationStatus] = useState<
    "idle" | "validating" | "verified" | "error"
  >("idle");
  const [paperValidationError, setPaperValidationError] = useState("");
  const [paperValidationRetryKey, setPaperValidationRetryKey] = useState(0);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const verifiedPaperKeyRef = useRef<string | null>(null);
  const analysisAbortControllerRef = useRef<AbortController | null>(null);

  const moveWorkflowStep = (nextStep: PaperBiteWorkflowStep) => {
    setWorkflowStep(nextStep);
    const sourceQuery = startFromFavorites ? "&source=favorites" : "";
    router.replace(`/paper/reader?mode=bite${sourceQuery}&step=${nextStep}`, { scroll: false });
  };

  const hasQuestHydrated = useQuestStore((state) => state.hasHydrated);
  const savePaperBundle = useQuestStore((state) => state.savePaperBundle);
  const hasResearchHydrated = useResearchStore((state) => state.hasHydrated);
  const selectedProfessorId = useResearchStore((state) => state.selectedProfessorId);
  const selectedTopicId = useResearchStore((state) => state.selectedTopicId);
  const favoriteProfessorIds = useResearchStore((state) => state.favoriteProfessorIds);
  const removeFavoriteProfessors = useResearchStore((state) => state.removeFavoriteProfessors);
  const selectedProfessorPaper = useResearchStore((state) => state.selectedProfessorPaper);
  const selectProfessorPaper = useResearchStore((state) => state.selectProfessorPaper);
  const connectedProfessorIds = useMemo(
    () => Array.from(new Set([
      ...(selectedProfessorId ? [selectedProfessorId] : []),
      ...favoriteProfessorIds,
    ])),
    [favoriteProfessorIds, selectedProfessorId],
  );

  useEffect(() => {
    const selectionKey = selectedProfessorPaper
      ? `${selectedProfessorPaper.professorId}:${selectedProfessorPaper.paperId}`
      : null;
    if (
      !hasResearchHydrated
      || !selectedProfessorPaper
      || !selectionKey
      || verifiedPaperKeyRef.current === selectionKey
    ) {
      return;
    }

    const storedSelection = selectedProfessorPaper;
    const controller = new AbortController();
    let metadataMissing = false;
    setPaperValidationStatus("validating");
    setPaperValidationError("");
    void requestFavoriteProfessorPaperCatalog([storedSelection.professorId], {
      signal: controller.signal,
    })
      .then((response) => {
        const professor = response.professors.find(
          (item) => item.id === storedSelection.professorId,
        );
        const publication = professor?.publications.find(
          (item) => item.id === storedSelection.paperId,
        );
        if (!professor || !publication) {
          metadataMissing = true;
          throw new Error("저장된 논문이 최신 공식 프로필 목록에서 확인되지 않습니다.");
        }
        const verifiedSelection = createProfessorPaperSelection(professor, publication);
        verifiedPaperKeyRef.current = selectionKey;
        setPaperValidationStatus("verified");
        setPaperValidationError("");
        selectProfessorPaper({
          ...verifiedSelection,
          selectedAt: storedSelection.selectedAt,
        });
      })
      .catch((validationError) => {
        if (validationError instanceof DOMException && validationError.name === "AbortError") return;
        verifiedPaperKeyRef.current = null;
        const message = validationError instanceof Error
          ? validationError.message
          : "저장된 논문 정보를 확인하지 못했습니다.";
        if (metadataMissing) {
          selectProfessorPaper(null);
          setPaperValidationStatus("idle");
          setTitle("");
          setError(`${message} 교수님과 논문을 다시 선택해 주세요.`);
          return;
        }
        setPaperValidationStatus("error");
        setPaperValidationError(`${message} 저장된 선택은 유지했어요.`);
      });
    return () => controller.abort();
  }, [
    hasResearchHydrated,
    paperValidationRetryKey,
    selectProfessorPaper,
    selectedProfessorPaper,
  ]);

  useEffect(() => {
    if (
      hasResearchHydrated
      && selectedProfessorPaper
      && paperValidationStatus === "verified"
      && !title
      && !analysis
    ) {
      setTitle(selectedProfessorPaper.title);
    }
  }, [
    analysis,
    hasResearchHydrated,
    paperValidationStatus,
    selectedProfessorPaper,
    title,
  ]);

  useEffect(() => () => analysisAbortControllerRef.current?.abort(), []);

  useEffect(() => {
    setWorkflowStep(initialStep);
  }, [initialStep]);

  const verifiedProfessorPaper = paperValidationStatus === "verified"
    ? selectedProfessorPaper
    : null;
  const isPaperSelectionBlocked = Boolean(
    selectedProfessorPaper && !verifiedProfessorPaper,
  );
  const normalizedLength = content.trim().length;
  const isReady = normalizedLength >= MIN_CONTENT_LENGTH;
  const displayTitle = verifiedProfessorPaper?.title || analysis?.title || title.trim() || "제목 미입력 논문";
  const evidence = useMemo(() => verifiedProfessorPaper
    ? {
        label: "분석 근거: 사용자가 붙여 넣은 텍스트 범위(페이지 없음) · 서지 확인: 대학 공식 프로필",
        page: null,
        href: verifiedProfessorPaper.officialProfileUrl,
      }
    : TEXT_SCOPE_EVIDENCE, [verifiedProfessorPaper]);
  const fullCopy = useMemo(() => {
    if (!analysis || !draft) return "";
    return [
      `논문 한입 · ${displayTitle}`,
      verifiedProfessorPaper
        ? `${verifiedProfessorPaper.professorName} 교수 · ${verifiedProfessorPaper.professorDepartment}`
        : null,
      analysis.oneLine,
      ...BITE_CARD_META.map((card) => `${card.eyebrow} ${card.title}\n${draft[card.key]}`),
      `근거 범위\n${evidence.label}`,
    ].filter(Boolean).join("\n\n");
  }, [analysis, displayTitle, draft, evidence.label, verifiedProfessorPaper]);

  const analyze = async () => {
    const normalized = content.trim();
    if (normalized.length < MIN_CONTENT_LENGTH) {
      setError(`논문 초록이나 본문 일부를 ${MIN_CONTENT_LENGTH}자 이상 입력해 주세요.`);
      return;
    }
    if (verifiedProfessorPaper && !sourceConfirmed) {
      setError("붙여 넣은 텍스트가 선택한 논문의 초록 또는 본문인지 먼저 확인해 주세요.");
      return;
    }

    setError("");
    setFeedback("");
    setIsSaved(false);
    setIsLoading(true);
    analysisAbortControllerRef.current?.abort();
    const controller = new AbortController();
    analysisAbortControllerRef.current = controller;
    try {
      const nextAnalysis = await requestPaperAnalysis({
        title: title.trim(),
        content: normalized,
      }, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setAnalysis(nextAnalysis);
      setDraft(createBiteDraft(nextAnalysis));
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") return;
      setError(
        requestError instanceof Error
          ? requestError.message
          : "논문 분석을 완료하지 못했습니다.",
      );
    } finally {
      if (analysisAbortControllerRef.current === controller) {
        analysisAbortControllerRef.current = null;
        setIsLoading(false);
      }
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

    const bundleId = verifiedProfessorPaper
      ? `paper:${verifiedProfessorPaper.professorId}:${verifiedProfessorPaper.paperId}`
      : `manual:${analysis.generatedAt}`;
    try {
      savePaperBundle({
        bundleId,
        evidence,
        professorId: verifiedProfessorPaper?.professorId ?? selectedProfessorId,
        topicId: selectedTopicId,
        paperId: verifiedProfessorPaper?.paperId ?? null,
        cards: BITE_CARD_META.map((card) => ({
          slot: card.key,
          title: `${card.eyebrow} · ${displayTitle}`,
          body: draft[card.key].trim() || "아직 작성된 내용이 없어요.",
        })),
      });
      setIsSaved(true);
      setFeedback("교수님 퀘스트에 3분 준비 카드 5장을 저장했어요. 같은 논문은 최신 내용으로 갱신됩니다.");
    } catch {
      setIsSaved(false);
      setFeedback(
        "브라우저 저장 공간에 기록하지 못했어요. 전체 복사로 내용을 보관한 뒤 저장 공간 설정을 확인해 주세요.",
      );
    }
  };

  const clearWorkingState = () => {
    analysisAbortControllerRef.current?.abort();
    analysisAbortControllerRef.current = null;
    setIsLoading(false);
    setContent("");
    setAnalysis(null);
    setDraft(null);
    setError("");
    setFeedback("");
    setIsSaved(false);
    setSourceConfirmed(false);
  };

  const choosePaper = (selection: ProfessorPaperSelection) => {
    verifiedPaperKeyRef.current = `${selection.professorId}:${selection.paperId}`;
    setPaperValidationStatus("verified");
    setPaperValidationError("");
    selectProfessorPaper(selection);
    setTitle(selection.title);
    clearWorkingState();
    setIsPickerOpen(false);
    moveWorkflowStep("card");
    window.requestAnimationFrame(() => contentRef.current?.focus());
  };

  const useManualEntry = () => {
    verifiedPaperKeyRef.current = null;
    setPaperValidationStatus("idle");
    setPaperValidationError("");
    selectProfessorPaper(null);
    setTitle("");
    clearWorkingState();
    setIsPickerOpen(false);
    moveWorkflowStep("card");
    window.requestAnimationFrame(() => titleRef.current?.focus());
  };

  const clearPaperSelection = () => {
    verifiedPaperKeyRef.current = null;
    setPaperValidationStatus("idle");
    setPaperValidationError("");
    selectProfessorPaper(null);
    setTitle("");
    clearWorkingState();
    moveWorkflowStep("select");
  };

  const clearInput = () => {
    setContent("");
    setError("");
    setFeedback("");
    setIsSaved(false);
    setSourceConfirmed(false);
    contentRef.current?.focus();
  };

  const paperPicker = (
    <FavoriteProfessorPaperPicker
      open={isPickerOpen}
      favoriteProfessorIds={connectedProfessorIds}
      initialProfessorId={verifiedProfessorPaper?.professorId ?? selectedProfessorId}
      onClose={() => setIsPickerOpen(false)}
      onManualEntry={useManualEntry}
      onRemoveMissing={removeFavoriteProfessors}
      onSelect={choosePaper}
    />
  );

  if (analysis && draft) {
    return (
      <AppShell title="Q01 논문 한입" backHref="/quest" className="paper-bite-screen">
        <PageHeader
          eyebrow="교수님 퀘스트 · 만나기 전"
          title={displayTitle}
          description={analysis.oneLine}
        />
        <PaperReadingSteps current={2} />

        {verifiedProfessorPaper && (
          <SelectedPaperBanner
            selection={verifiedProfessorPaper}
            onChange={() => setIsPickerOpen(true)}
            onClear={clearPaperSelection}
          />
        )}

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
            <p>{evidence.label}</p>
            <small>
              인용·제출·교수님 면담 전에는 반드시 실제 원문의 문장과 페이지를 직접 확인하세요.
            </small>
          </div>
        </Card>

        <div className="paper-bite-actions">
          <SecondaryButton type="button" onClick={() => setIsPickerOpen(true)}>
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
        {feedback && (
          <p
            className={`action-feedback${feedback.includes("못했") ? " is-error" : ""}`}
            role={feedback.includes("못했") ? "alert" : "status"}
          >
            {feedback}
          </p>
        )}

        <PaperPdfNextStep ready={isSaved} />
        {paperPicker}
      </AppShell>
    );
  }

  return (
    <AppShell title="Q01 논문 한입" backHref="/quest" className="paper-bite-screen">
      <PageHeader
        eyebrow="교수님 퀘스트 · 만나기 전"
        title={workflowStep === "select" ? "읽을 논문 한 편을 고르세요" : "초록이나 본문을 3분 카드로 정리해요"}
        description={workflowStep === "select"
          ? "관심 교수님의 공식 논문 목록에서 준비할 한 편만 선택해요."
          : "선택한 논문의 초록이나 본문을 붙여 넣으면 문제·방법·결과·한계·질문으로 나눠드려요."}
      />
      <PaperReadingSteps current={workflowStep === "select" ? 1 : 2} />

      {paperValidationStatus === "validating" && (
        <StatusBanner icon={LoaderCircle} title="저장된 논문을 공식 데이터로 다시 확인하는 중" tone="lavender">
          교수님과 논문의 연결을 확인한 뒤 제목을 채웁니다.
        </StatusBanner>
      )}

      {paperValidationStatus === "error" && (
        <Card className="paper-validation-error" role="alert">
          <AlertTriangle size={20} aria-hidden="true" />
          <div>
            <h2>공식 서지정보를 다시 확인하지 못했어요</h2>
            <p>{paperValidationError}</p>
            <div>
              <button
                type="button"
                onClick={() => setPaperValidationRetryKey((current) => current + 1)}
              >
                다시 확인
              </button>
              <button type="button" onClick={() => setIsPickerOpen(true)}>논문 다시 선택</button>
              <button type="button" onClick={useManualEntry}>직접 입력으로 전환</button>
            </div>
          </div>
        </Card>
      )}

      {workflowStep === "select" ? (
        <>
          <Card className="paper-favorite-entry paper-bite-stage-card">
            <div>
              <Star size={20} fill="currentColor" aria-hidden="true" />
              <span>
                <strong>관심 교수님의 공식 논문 목록</strong>
                <small>
                  {hasResearchHydrated
                    ? `연결·저장한 교수님 ${connectedProfessorIds.length}명에서 찾아요.`
                    : "교수님 목록을 불러오는 중이에요."}
                </small>
              </span>
            </div>
            {verifiedProfessorPaper ? (
              <SecondaryButton
                type="button"
                disabled={!hasResearchHydrated || isLoading}
                onClick={() => setIsPickerOpen(true)}
              >
                <BookOpen size={17} aria-hidden="true" /> 다른 논문 선택
              </SecondaryButton>
            ) : (
              <PrimaryButton
                type="button"
                disabled={!hasResearchHydrated || isLoading}
                onClick={() => setIsPickerOpen(true)}
              >
                <BookOpen size={17} aria-hidden="true" /> 논문 1개 선택하기
              </PrimaryButton>
            )}
          </Card>

          {verifiedProfessorPaper ? (
            <>
              <SelectedPaperBanner
                selection={verifiedProfessorPaper}
                onChange={() => setIsPickerOpen(true)}
                onClear={clearPaperSelection}
              />
              <div className="paper-bite-stage-actions">
                <PrimaryButton type="button" onClick={() => moveWorkflowStep("card")}>
                  이 논문으로 3분 카드 만들기
                </PrimaryButton>
              </div>
            </>
          ) : null}

          <div className="paper-bite-manual-entry">
            <TextButton type="button" onClick={useManualEntry}>
              목록에 없는 논문은 제목·본문을 직접 입력할게요
            </TextButton>
          </div>
        </>
      ) : (
        <>
          <div className="paper-bite-step-back">
            <TextButton type="button" onClick={() => moveWorkflowStep("select")}>
              <ArrowLeft size={16} aria-hidden="true" /> 논문 선택으로
            </TextButton>
          </div>

          {verifiedProfessorPaper && (
            <SelectedPaperBanner
              selection={verifiedProfessorPaper}
              onChange={() => setIsPickerOpen(true)}
              onClear={clearPaperSelection}
            />
          )}

          <Card className="paper-input-card paper-bite-input">
            <label className="field-group" htmlFor="paper-title">
              <span className="field-label">
                논문 제목 <small>{verifiedProfessorPaper ? "공식 정보로 고정" : "직접 입력"}</small>
              </span>
              <input
                ref={titleRef}
                id="paper-title"
                className="input"
                value={title}
                onChange={(event) => setTitle(event.target.value.slice(0, 180))}
                readOnly={Boolean(verifiedProfessorPaper)}
                disabled={isPaperSelectionBlocked || isLoading}
                placeholder="예: 대학생의 진로 불안과 멘토링 효과"
              />
            </label>
            <label className="field-group" htmlFor="paper-content">
              <span className="field-label">초록 또는 본문</span>
              <textarea
                ref={contentRef}
                id="paper-content"
                className="textarea paper-input"
                value={content}
                onChange={(event) => {
                  setContent(event.target.value.slice(0, MAX_CONTENT_LENGTH));
                  setSourceConfirmed(false);
                }}
                disabled={isPaperSelectionBlocked || isLoading}
                placeholder={verifiedProfessorPaper
                  ? "선택한 논문의 초록이나 본문 일부를 직접 붙여 넣어 주세요."
                  : "분석할 논문 초록이나 본문 일부를 붙여 넣어 주세요."}
              />
            </label>
            {verifiedProfessorPaper && (
              <label className="paper-source-confirm">
                <input
                  type="checkbox"
                  checked={sourceConfirmed}
                  onChange={(event) => setSourceConfirmed(event.target.checked)}
                />
                <span>붙여 넣은 텍스트가 선택한 논문의 초록 또는 본문임을 확인했습니다.</span>
              </label>
            )}
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
              disabled={
                isLoading
                || isPaperSelectionBlocked
                || !isReady
                || Boolean(verifiedProfessorPaper && !sourceConfirmed)
              }
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
              <TextButton type="button" onClick={clearInput}>
                <RotateCcw size={16} aria-hidden="true" /> 입력 지우기
              </TextButton>
            </div>
          )}
        </>
      )}

      {paperPicker}
    </AppShell>
  );
}

function PaperPdfNextStep({ ready }: { ready: boolean }) {
  return (
    <section className="paper-bite-pdf-next" aria-labelledby="paper-pdf-next-title">
      <div className="paper-bite-pdf-next__copy">
        <span><BookOpen size={20} aria-hidden="true" /></span>
        <div>
          <small>3단계 · PDF 해설</small>
          <h2 id="paper-pdf-next-title">PDF 원문으로 더 깊게 읽을까요?</h2>
          <p>PDF를 직접 넣으면 현재 페이지를 중심으로 원문·번역·해설·요약·질문을 이어갈 수 있어요.</p>
        </div>
      </div>
      {ready ? (
        <LinkButton href="/paper/reader?mode=pdf">
          PDF 넣고 페이지별 해설·요약하기
        </LinkButton>
      ) : (
        <PrimaryButton type="button" disabled>
          먼저 3분 카드를 저장해 주세요
        </PrimaryButton>
      )}
      <small className="paper-bite-pdf-next__note">
        PDF 파일은 브라우저에서 열고, AI 요청에는 현재 확인 중인 페이지 텍스트만 전송해요.
      </small>
    </section>
  );
}
