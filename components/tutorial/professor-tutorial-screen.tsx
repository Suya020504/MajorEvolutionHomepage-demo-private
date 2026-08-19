"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  LoaderCircle,
  MessageCircleQuestion,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { brandLogoV2, tutorialScene } from "@/lib/brand-assets";
import {
  CAREER_CONCERN_OPTIONS,
  CAREER_GOAL_OPTIONS,
  CAREER_INTEREST_OPTIONS,
  DIRECT_ACADEMIC_ENTRY,
  EMPTY_PROFESSOR_DISCOVERY_CONTEXT,
  GOAL_OPTIONS,
  INTEREST_OPTIONS,
  MAX_CAREER_CONCERNS,
  MAX_CAREER_INTERESTS,
  MAX_DISCOVERY_INTERESTS,
  MEETING_OPTIONS,
  STUDENT_STAGE_OPTIONS,
  SUPPORT_STYLE_OPTIONS,
  discoveryContextToMatchTopic,
  toggleLimitedValue,
  validateProfessorDiscoveryBasics,
  validateProfessorDiscoverySecondary,
  type ProfessorDiscoveryContext,
} from "@/lib/professor-discovery-model";
import { requestProfessorDiscoveryMatches } from "@/lib/professor-discovery-client";
import {
  getDepartmentsForCollege,
  type ProfessorAcademicTaxonomy,
} from "@/lib/professor-academic-taxonomy";
import { useResearchStore } from "@/store/research-store";
import styles from "./professor-tutorial.module.css";

const STORAGE_KEY = "major-evolution-professor-tutorial-v1";

const BASIC_STEPS = ["academic", "stage", "goal", "interests", "concerns"] as const;
const DEEP_STEPS = ["career", "support", "context", "review"] as const;
const ALL_STEPS = ["welcome", ...BASIC_STEPS, "depth", ...DEEP_STEPS] as const;
type TutorialStep = (typeof ALL_STEPS)[number];

type StoredDraft = {
  version: 1;
  step: TutorialStep;
  context: ProfessorDiscoveryContext;
  directMajor: boolean;
};

const STEP_COPY: Record<TutorialStep, { eyebrow: string; title: string; description: string }> = {
  welcome: {
    eyebrow: "첫 교수 연결 튜토리얼",
    title: "혼자 정리하기 어려운 고민부터 들려주세요.",
    description: "질문은 한 번에 하나씩 보여드려요. 기본 질문 다섯 개면 첫 교수 연결을 확인할 수 있습니다.",
  },
  academic: {
    eyebrow: "기본 질문 1 · 학교와 전공",
    title: "지금 공부하고 있는 전공은 무엇인가요?",
    description: "현재 파일럿은 단국대학교 공식 교수 정보를 기준으로 연결합니다.",
  },
  stage: {
    eyebrow: "기본 질문 2 · 현재 단계",
    title: "요즘 나는 어떤 단계에 가장 가까운가요?",
    description: "학년보다 지금 실제로 겪는 상황에 가까운 답을 골라주세요.",
  },
  goal: {
    eyebrow: "기본 질문 3 · 필요한 도움",
    title: "교수님과의 대화에서 무엇을 얻고 싶나요?",
    description: "이번 첫 대화의 목적과 가장 가까운 한 가지를 선택해 주세요.",
  },
  interests: {
    eyebrow: "기본 질문 4 · 관심 분야",
    title: "요즘 눈길이 가는 분야는 무엇인가요?",
    description: `하나 이상, 최대 ${MAX_DISCOVERY_INTERESTS}개까지 선택할 수 있어요.`,
  },
  concerns: {
    eyebrow: "기본 질문 5 · 현재 고민",
    title: "지금 가장 풀고 싶은 고민은 무엇인가요?",
    description: `교수님께 물어볼 첫 질문을 준비할 수 있도록 최대 ${MAX_CAREER_CONCERNS}개를 골라주세요.`,
  },
  depth: {
    eyebrow: "기본 방향 정리 완료",
    title: "이제 첫 교수 연결을 확인할 수 있어요.",
    description: "바로 매칭을 보거나, 2분 더 알려주고 교수님께 드릴 첫 질문을 더 구체화할 수 있습니다.",
  },
  career: {
    eyebrow: "심층 질문 1 · 진로 맥락",
    title: "관심 있는 직무와 진로 목표가 있나요?",
    description: "아직 정하지 못했어도 괜찮아요. 이 정보는 교수의 우열이 아니라 대화 질문을 구체화하는 데 사용합니다.",
  },
  support: {
    eyebrow: "심층 질문 2 · 대화 방식",
    title: "어떤 도움을, 어떤 상황에서 받고 싶나요?",
    description: "실제로 꺼내기 쉬운 첫 질문과 준비물을 만드는 데 반영합니다.",
  },
  context: {
    eyebrow: "심층 질문 3 · 나의 언어",
    title: "교수님께 꼭 확인하고 싶은 내용을 적어주세요.",
    description: "완벽한 문장이 아니어도 괜찮아요. 키워드나 해본 경험만 적어도 됩니다.",
  },
  review: {
    eyebrow: "첫 매칭 전 확인",
    title: "이 고민으로 교수님과의 첫 대화를 준비할게요.",
    description: "AI는 입력을 정리하고 공식 정보를 대조합니다. 최종 연락과 선택은 학생이 직접 진행합니다.",
  },
};

const LOADING_PHASES = ["입력한 고민 정리", "학교 공식 정보 대조", "첫 교수 연결 구성"] as const;

function isTutorialStep(value: unknown): value is TutorialStep {
  return typeof value === "string" && (ALL_STEPS as readonly string[]).includes(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function tutorialStorage(): Storage | null {
  try {
    return typeof window !== "undefined" && window.localStorage
      ? window.localStorage
      : null;
  } catch {
    return null;
  }
}

function restoreDraft(value: string): StoredDraft | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!isRecord(parsed) || parsed.version !== 1 || !isTutorialStep(parsed.step)) return null;
    if (!isRecord(parsed.context)) return null;
    const context = parsed.context as Partial<ProfessorDiscoveryContext>;
    return {
      version: 1,
      step: parsed.step,
      directMajor: parsed.directMajor === true,
      context: {
        ...EMPTY_PROFESSOR_DISCOVERY_CONTEXT,
        ...context,
        interests: Array.isArray(context.interests) ? context.interests.filter((item): item is string => typeof item === "string") : [],
        careerInterests: Array.isArray(context.careerInterests) ? context.careerInterests.filter((item): item is string => typeof item === "string") : [],
        careerConcerns: Array.isArray(context.careerConcerns) ? context.careerConcerns.filter((item): item is string => typeof item === "string") : [],
      },
    };
  } catch {
    return null;
  }
}

function ChoiceButton({
  selected,
  children,
  onClick,
}: {
  selected: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`${styles.choice} ${selected ? styles.choiceSelected : ""}`}
      aria-pressed={selected}
      onClick={onClick}
    >
      <span>{children}</span>
      <span className={styles.choiceCheck} aria-hidden="true">
        {selected ? <Check size={16} strokeWidth={3} /> : null}
      </span>
    </button>
  );
}

export function ProfessorTutorialScreen({
  taxonomy,
}: {
  taxonomy: ProfessorAcademicTaxonomy;
}) {
  const router = useRouter();
  const setLoading = useResearchStore((state) => state.setProfessorMatchLoading);
  const setMatches = useResearchStore((state) => state.setProfessorMatches);
  const setDiscoveryTopic = useResearchStore((state) => state.setProfessorDiscoveryTopic);
  const setDiscoverySummary = useResearchStore((state) => state.setProfessorDiscoverySummary);
  const setMatchError = useResearchStore((state) => state.setProfessorMatchError);
  const setRejectedIds = useResearchStore((state) => state.setProfessorRejectedIds);
  const clearProfessorMatches = useResearchStore((state) => state.clearProfessorMatches);

  const [step, setStep] = useState<TutorialStep>("welcome");
  const [context, setContext] = useState<ProfessorDiscoveryContext>({
    ...EMPTY_PROFESSOR_DISCOVERY_CONTEXT,
    university: taxonomy.university,
    interests: [],
    careerInterests: [],
    careerConcerns: [],
  });
  const [directMajor, setDirectMajor] = useState(false);
  const [restored, setRestored] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const saved = restoreDraft(tutorialStorage()?.getItem(STORAGE_KEY) ?? "");
    if (saved) {
      setStep(saved.step);
      setContext({ ...saved.context, university: taxonomy.university });
      setDirectMajor(saved.directMajor);
    }
    setRestored(true);
  }, [taxonomy.university]);

  useEffect(() => {
    if (!restored || isMatching) return;
    const draft: StoredDraft = { version: 1, step, context, directMajor };
    tutorialStorage()?.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [context, directMajor, isMatching, restored, step]);

  useEffect(() => () => requestRef.current?.abort(), []);

  useEffect(() => {
    if (!isMatching) return;
    setLoadingPhase(0);
    const timer = window.setInterval(() => {
      setLoadingPhase((current) => Math.min(current + 1, LOADING_PHASES.length - 1));
    }, 900);
    return () => window.clearInterval(timer);
  }, [isMatching]);

  const departments = useMemo(
    () => getDepartmentsForCollege(taxonomy, context.college),
    [context.college, taxonomy],
  );
  const stepCopy = STEP_COPY[step];
  const basicIndex = BASIC_STEPS.indexOf(step as (typeof BASIC_STEPS)[number]);
  const deepIndex = DEEP_STEPS.indexOf(step as (typeof DEEP_STEPS)[number]);
  const progressLabel = step === "welcome"
    ? "시작 전"
    : basicIndex >= 0
      ? `기본 질문 ${basicIndex + 1}/${BASIC_STEPS.length}`
      : step === "depth"
        ? "기본 질문 완료"
        : `심층 질문 ${Math.min(deepIndex + 1, 3)}/3`;
  const progressValue = step === "welcome"
    ? 0
    : basicIndex >= 0
      ? ((basicIndex + 1) / BASIC_STEPS.length) * 68
      : step === "depth"
        ? 68
        : 68 + ((deepIndex + 1) / DEEP_STEPS.length) * 32;

  const update = (patch: Partial<ProfessorDiscoveryContext>) => {
    setError(null);
    setContext((current) => ({ ...current, ...patch }));
  };

  const resetTutorial = () => {
    requestRef.current?.abort();
    tutorialStorage()?.removeItem(STORAGE_KEY);
    clearProfessorMatches();
    setContext({
      ...EMPTY_PROFESSOR_DISCOVERY_CONTEXT,
      university: taxonomy.university,
      interests: [],
      careerInterests: [],
      careerConcerns: [],
    });
    setDirectMajor(false);
    setError(null);
    setStep("welcome");
  };

  const goBack = () => {
    const currentIndex = ALL_STEPS.indexOf(step);
    if (currentIndex <= 0) return;
    setError(null);
    setStep(ALL_STEPS[currentIndex - 1]);
  };

  const startMatch = async () => {
    const basicIssue = validateProfessorDiscoveryBasics(context);
    if (basicIssue) {
      setError(basicIssue.message);
      setStep(BASIC_STEPS.find((item) => {
        if (item === "academic") return ["university", "college", "major"].includes(basicIssue.field);
        if (item === "stage") return basicIssue.field === "studentStage";
        if (item === "goal") return basicIssue.field === "goal";
        if (item === "interests") return basicIssue.field === "interests";
        return basicIssue.field === "careerConcerns";
      }) ?? "academic");
      return;
    }
    const secondaryIssue = validateProfessorDiscoverySecondary(context);
    if (secondaryIssue) {
      setError(secondaryIssue);
      return;
    }

    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    const matchTopic = discoveryContextToMatchTopic(context);
    setError(null);
    setIsMatching(true);
    clearProfessorMatches();
    setRejectedIds([]);
    setLoading(matchTopic.id);
    try {
      const response = await requestProfessorDiscoveryMatches(context, { signal: controller.signal });
      if (requestRef.current !== controller) return;
      setMatches(response);
      setDiscoveryTopic(matchTopic);
      setDiscoverySummary({
        major: context.major,
        interests: context.interests,
        careerConcerns: context.careerConcerns,
      });
      tutorialStorage()?.removeItem(STORAGE_KEY);
      router.push("/professors/pitch");
    } catch (caught) {
      if (requestRef.current !== controller || controller.signal.aborted) return;
      const message = caught instanceof Error
        ? caught.message
        : "공식 교수 정보를 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.";
      setMatchError(matchTopic.id, message);
      setError(message);
      setIsMatching(false);
    }
  };

  const primaryDisabled = (
    (step === "academic" && (!context.college || !context.major.trim()))
    || (step === "stage" && !context.studentStage)
    || (step === "goal" && !context.goal)
    || (step === "interests" && context.interests.length === 0)
    || (step === "concerns" && context.careerConcerns.length === 0)
  );

  const renderQuestion = () => {
    if (step === "welcome") {
      return (
        <div className={styles.welcomePanel}>
          <div className={styles.timeBadge}><Clock3 size={16} /> 약 3분</div>
          <div className={styles.promiseList}>
            <p><CheckCircle2 size={18} /> 질문은 한 번에 하나씩</p>
            <p><ShieldCheck size={18} /> 학교 공식 정보와 연결 이유 확인</p>
            <p><MessageCircleQuestion size={18} /> 교수님께 드릴 첫 질문까지 준비</p>
          </div>
          <button type="button" className={styles.primaryButton} onClick={() => setStep("academic")}>
            내 고민부터 시작하기 <ArrowRight size={19} />
          </button>
          <p className={styles.smallNote}>가입 없이 시작 · 교수에게 자동으로 연락하지 않아요</p>
        </div>
      );
    }

    if (step === "academic") {
      const selectValue = directMajor
        ? DIRECT_ACADEMIC_ENTRY
        : departments.includes(context.major) ? context.major : "";
      return (
        <div className={styles.formStack}>
          <label className={styles.field}>
            <span>학교</span>
            <div className={styles.fixedField}>
              <ShieldCheck size={18} /> {taxonomy.university}
              <small>공식 교수 {taxonomy.officialProfessorCount.toLocaleString("ko-KR")}명 데이터 파일럿</small>
            </div>
          </label>
          <label className={styles.field}>
            <span>단과대</span>
            <div className={styles.selectWrap}>
              <select
                value={context.college}
                onChange={(event) => {
                  update({ college: event.target.value, major: "" });
                  setDirectMajor(false);
                }}
              >
                <option value="">단과대를 선택해 주세요</option>
                {taxonomy.colleges.map((college) => <option key={college.name} value={college.name}>{college.name}</option>)}
              </select>
              <ChevronDown size={18} aria-hidden="true" />
            </div>
          </label>
          <label className={styles.field}>
            <span>주전공</span>
            <div className={styles.selectWrap}>
              <select
                value={selectValue}
                disabled={!context.college}
                onChange={(event) => {
                  const value = event.target.value;
                  setDirectMajor(value === DIRECT_ACADEMIC_ENTRY);
                  update({ major: value === DIRECT_ACADEMIC_ENTRY ? "" : value });
                }}
              >
                <option value="">전공을 선택해 주세요</option>
                {departments.map((department) => <option key={department} value={department}>{department}</option>)}
                <option value={DIRECT_ACADEMIC_ENTRY}>목록에 없어요 · 직접 입력</option>
              </select>
              <ChevronDown size={18} aria-hidden="true" />
            </div>
          </label>
          {directMajor && (
            <label className={styles.field}>
              <span>전공 직접 입력</span>
              <input
                value={context.major}
                maxLength={60}
                placeholder="예: 모바일시스템공학과"
                autoFocus
                onChange={(event) => update({ major: event.target.value })}
              />
            </label>
          )}
        </div>
      );
    }

    if (step === "stage") {
      return <div className={styles.choiceGrid}>{STUDENT_STAGE_OPTIONS.map((option) => <ChoiceButton key={option} selected={context.studentStage === option} onClick={() => update({ studentStage: option })}>{option}</ChoiceButton>)}</div>;
    }

    if (step === "goal") {
      return <div className={styles.choiceGrid}>{GOAL_OPTIONS.map((option) => <ChoiceButton key={option} selected={context.goal === option} onClick={() => update({ goal: option })}>{option}</ChoiceButton>)}</div>;
    }

    if (step === "interests") {
      return (
        <>
          <div className={styles.selectionCount}>{context.interests.length}/{MAX_DISCOVERY_INTERESTS} 선택</div>
          <div className={styles.chipGrid}>{INTEREST_OPTIONS.map((option) => <ChoiceButton key={option} selected={context.interests.includes(option)} onClick={() => update({ interests: toggleLimitedValue(context.interests, option, MAX_DISCOVERY_INTERESTS) })}>{option}</ChoiceButton>)}</div>
        </>
      );
    }

    if (step === "concerns") {
      return (
        <>
          <div className={styles.selectionCount}>{context.careerConcerns.length}/{MAX_CAREER_CONCERNS} 선택</div>
          <div className={styles.choiceGrid}>{CAREER_CONCERN_OPTIONS.map((option) => <ChoiceButton key={option} selected={context.careerConcerns.includes(option)} onClick={() => update({ careerConcerns: toggleLimitedValue(context.careerConcerns, option, MAX_CAREER_CONCERNS) })}>{option}</ChoiceButton>)}</div>
        </>
      );
    }

    if (step === "depth") {
      return (
        <div className={styles.depthGrid}>
          <button type="button" className={styles.depthPrimary} onClick={startMatch}>
            <span className={styles.depthIcon}><Sparkles size={23} /></span>
            <strong>이 정보로 첫 매칭 보기</strong>
            <small>기본 방향과 공식 연결 근거를 먼저 확인해요</small>
            <ArrowRight size={19} />
          </button>
          <button type="button" className={styles.depthSecondary} onClick={() => setStep("career")}>
            <span className={styles.depthIcon}><MessageCircleQuestion size={23} /></span>
            <strong>2분 더 알려주기</strong>
            <small>나의 상황에 맞는 첫 질문을 더 구체화해요</small>
            <ArrowRight size={19} />
          </button>
          <div className={styles.explainBox}>
            <ShieldCheck size={19} />
            <p><strong>어느 쪽을 골라도 교수 연결 근거는 공식 정보로 확인합니다.</strong> 심층 질문은 내 상황을 설명하고 무엇을 물을지 준비하는 데만 사용해요.</p>
          </div>
        </div>
      );
    }

    if (step === "career") {
      return (
        <div className={styles.deepFields}>
          <div className={styles.fieldGroup}>
            <div className={styles.fieldLegend}>관심 직무 <small>최대 {MAX_CAREER_INTERESTS}개 · 선택</small></div>
            <div className={styles.chipGrid}>{CAREER_INTEREST_OPTIONS.map((option) => <ChoiceButton key={option} selected={context.careerInterests.includes(option)} onClick={() => update({ careerInterests: toggleLimitedValue(context.careerInterests, option, MAX_CAREER_INTERESTS) })}>{option}</ChoiceButton>)}</div>
          </div>
          <div className={styles.fieldGroup}>
            <div className={styles.fieldLegend}>진로 목표 <small>선택</small></div>
            <div className={styles.choiceGrid}>{CAREER_GOAL_OPTIONS.map((option) => <ChoiceButton key={option} selected={context.careerGoal === option} onClick={() => update({ careerGoal: context.careerGoal === option ? "" : option })}>{option}</ChoiceButton>)}</div>
          </div>
        </div>
      );
    }

    if (step === "support") {
      return (
        <div className={styles.deepFields}>
          <div className={styles.fieldGroup}>
            <div className={styles.fieldLegend}>원하는 도움 방식 <small>선택</small></div>
            <div className={styles.choiceGrid}>{SUPPORT_STYLE_OPTIONS.map((option) => <ChoiceButton key={option} selected={context.preferredSupport === option} onClick={() => update({ preferredSupport: context.preferredSupport === option ? "" : option })}>{option}</ChoiceButton>)}</div>
          </div>
          <div className={styles.fieldGroup}>
            <div className={styles.fieldLegend}>예상하는 첫 대화 상황 <small>선택</small></div>
            <div className={styles.chipGrid}>{MEETING_OPTIONS.map((option) => <ChoiceButton key={option} selected={context.meetingSituation === option} onClick={() => update({ meetingSituation: context.meetingSituation === option ? "" : option })}>{option}</ChoiceButton>)}</div>
          </div>
        </div>
      );
    }

    if (step === "context") {
      return (
        <div className={styles.formStack}>
          <label className={styles.field}>
            <span>궁금한 주제 <small>선택</small></span>
            <input value={context.topic} maxLength={100} placeholder="예: AI를 활용한 서비스 기획을 어떻게 시작할지" onChange={(event) => update({ topic: event.target.value })} />
          </label>
          <label className={styles.field}>
            <span>해본 경험이나 준비한 것 <small>선택</small></span>
            <textarea value={context.experience} maxLength={300} rows={3} placeholder="수업, 프로젝트, 동아리처럼 관련된 경험을 적어주세요." onChange={(event) => update({ experience: event.target.value })} />
          </label>
          <label className={styles.field}>
            <span>교수님께 함께 전하고 싶은 맥락 <small>선택</small></span>
            <textarea value={context.additionalContext} maxLength={300} rows={3} placeholder="시간 제약, 망설이는 선택지 등 자유롭게 적어주세요." onChange={(event) => update({ additionalContext: event.target.value })} />
          </label>
        </div>
      );
    }

    return (
      <div className={styles.reviewPanel}>
        <div className={styles.reviewHero}>
          <span className={styles.reviewMark}><Check size={22} strokeWidth={2.5} /></span>
          <div><span>{context.major}</span><strong>{context.goal}</strong></div>
        </div>
        <dl className={styles.reviewList}>
          <div><dt>현재 단계</dt><dd>{context.studentStage}</dd></div>
          <div><dt>관심 분야</dt><dd>{context.interests.join(" · ")}</dd></div>
          <div><dt>현재 고민</dt><dd>{context.careerConcerns.join(" · ")}</dd></div>
          {(context.careerInterests.length > 0 || context.careerGoal) && <div><dt>진로 맥락</dt><dd>{[...context.careerInterests, context.careerGoal].filter(Boolean).join(" · ")}</dd></div>}
          {(context.preferredSupport || context.meetingSituation) && <div><dt>대화 준비</dt><dd>{[context.preferredSupport, context.meetingSituation].filter(Boolean).join(" · ")}</dd></div>}
          {context.topic && <div><dt>궁금한 주제</dt><dd>{context.topic}</dd></div>}
        </dl>
        <div className={styles.sourcePromise}><ShieldCheck size={18} /><span>교수의 전문 분야는 학교 공식 정보로 대조하고, 나의 진로 고민은 첫 질문에만 반영해요.</span></div>
      </div>
    );
  };

  const nextStep = () => {
    const index = ALL_STEPS.indexOf(step);
    if (index >= 0 && index < ALL_STEPS.length - 1) setStep(ALL_STEPS[index + 1]);
  };

  if (isMatching) {
    return (
      <main id="main-content" className={styles.loadingPage}>
        <div className={styles.loadingCard} aria-live="polite">
          <div className={styles.processingVisual}>
            <Image src={brandLogoV2.mark} alt="" width={86} height={86} priority unoptimized />
          </div>
          <span className={styles.eyebrow}>첫 교수 연결 준비 중</span>
          <h1>내 고민과 공식 정보를 연결하고 있어요.</h1>
          <p>교수님께 연락하거나 결정을 대신하지 않아요.</p>
          <ol className={styles.loadingSteps}>
            {LOADING_PHASES.map((phase, index) => (
              <li key={phase} className={index <= loadingPhase ? styles.loadingStepActive : ""}>
                {index < loadingPhase ? <Check size={16} /> : index === loadingPhase ? <LoaderCircle size={16} className={styles.spinner} /> : <span />}
                {phase}
              </li>
            ))}
          </ol>
        </div>
      </main>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <BrandLogo href="/" tagline="전공·진로 첫 대화" className={styles.brand} />
        <div className={styles.headerMeta}>
          <span><ShieldCheck size={15} /> 입력은 이 브라우저에 임시저장돼요</span>
          {step !== "welcome" && <button type="button" onClick={resetTutorial}><RotateCcw size={15} /> 처음부터</button>}
        </div>
      </header>

      <main id="main-content" className={styles.shell}>
        <aside className={styles.contextPanel}>
          <div className={styles.progressTop}>
            <span>{progressLabel}</span>
            <strong>{Math.round(progressValue)}%</strong>
          </div>
          <div className={styles.progressTrack} aria-hidden="true"><span style={{ width: `${progressValue}%` }} /></div>
          <div className={styles.contextCopy}>
            <span className={styles.eyebrow}>{stepCopy.eyebrow}</span>
            <h1>{stepCopy.title}</h1>
            <p>{stepCopy.description}</p>
          </div>
          <figure className={styles.contextMedia}>
            <Image
              src={tutorialScene.firstPath}
              alt="캠퍼스에서 자신의 고민을 정리하며 교수와의 첫 대화를 준비하는 학생"
              fill
              sizes="(max-width: 760px) 100vw, 48vw"
              priority
            />
          </figure>
          <div className={styles.contextTip}>
            <CheckCircle2 size={19} aria-hidden="true" />
            <p><strong>답이 달라져도 괜찮아요.</strong> 뒤로 가서 언제든 수정할 수 있습니다.</p>
          </div>
          <div className={styles.scopeTag}><ShieldCheck size={16} /> 단국대학교 공식 데이터 파일럿</div>
        </aside>

        <section className={styles.questionPanel} aria-labelledby="tutorial-question">
          <div className={styles.mobileProgress}>
            <span>{progressLabel}</span>
            <div className={styles.progressTrack}><span style={{ width: `${progressValue}%` }} /></div>
          </div>
          <div className={styles.mobileQuestionCopy}>
            <span className={styles.eyebrow}>{stepCopy.eyebrow}</span>
            <h1 id="tutorial-question">{stepCopy.title}</h1>
            <p>{stepCopy.description}</p>
          </div>

          {(step === "welcome" || step === "academic") && (
            <figure className={styles.mobileHeroMedia}>
              <Image
                src={tutorialScene.firstPath}
                alt="캠퍼스에서 자신의 고민을 정리하며 교수와의 첫 대화를 준비하는 학생"
                fill
                sizes="100vw"
                priority
              />
            </figure>
          )}

          <div className={styles.questionBody}>{renderQuestion()}</div>

          {error && <div className={styles.errorBox} role="alert">{error}</div>}

          {step !== "welcome" && step !== "depth" && (
            <div className={styles.actions}>
              <button type="button" className={styles.backButton} onClick={goBack}><ArrowLeft size={18} /> 이전</button>
              {DEEP_STEPS.includes(step as (typeof DEEP_STEPS)[number]) && step !== "review" && (
                <button type="button" className={styles.skipButton} onClick={nextStep}>이 단계 건너뛰기</button>
              )}
              {step === "review" ? (
                <button type="button" className={styles.primaryButton} onClick={startMatch}>첫 매칭 시작 <ArrowRight size={18} /></button>
              ) : (
                <button type="button" className={styles.primaryButton} disabled={primaryDisabled} onClick={nextStep}>다음 질문 <ArrowRight size={18} /></button>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
