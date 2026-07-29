"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Brain, Check, CircleAlert, Compass, GitCompareArrows, ScanSearch, Sparkles } from "lucide-react";
import { AppLogo, AppShell, Card, PageHeader, PrimaryButton, cx } from "@/components/app/primitives";
import {
  MAJOR_AREAS,
  MAJOR_SUGGESTIONS,
  UNIVERSITY_SUGGESTIONS,
  UNIVERSAL_INTEREST_TAGS,
} from "@/data/academic-options";
import { IDEA_MODES, type IdeaMode } from "@/data/co-design";
import {
  AVOID_TAGS,
  DATA_ACCESS,
  EXPERIENCE_LEVELS,
  METHOD_TAGS,
  PERIODS,
} from "@/data/research-mvp";
import { useResearchStore } from "@/store/research-store";

const CHIP = (selected: boolean, disabled = false) =>
  cx("choice-chip", selected && "is-selected", disabled && "");
const INTEREST_TAG_SET = new Set<string>(UNIVERSAL_INTEREST_TAGS);

export function ConditionSelectScreen() {
  const router = useRouter();
  const c = useResearchStore((s) => s.conditions);
  const ideaMode = useResearchStore((s) => s.ideaMode);
  const setIdeaMode = useResearchStore((s) => s.setIdeaMode);
  const setSchool = useResearchStore((s) => s.setSchool);
  const setMajorArea = useResearchStore((s) => s.setMajorArea);
  const setMajor = useResearchStore((s) => s.setMajor);
  const toggleInterest = useResearchStore((s) => s.toggleInterest);
  const addInterest = useResearchStore((s) => s.addInterest);
  const setExperience = useResearchStore((s) => s.setExperience);
  const toggleMethod = useResearchStore((s) => s.toggleMethod);
  const setPeriod = useResearchStore((s) => s.setPeriod);
  const setDataAccess = useResearchStore((s) => s.setDataAccess);
  const toggleAvoid = useResearchStore((s) => s.toggleAvoid);
  const submit = useResearchStore((s) => s.submit);

  const [errors, setErrors] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState("");
  const [interestInputError, setInterestInputError] = useState<string | null>(null);
  const refs: Record<string, React.RefObject<HTMLDivElement | null>> = {
    ideaMode: useRef(null),
    majorArea: useRef(null),
    major: useRef(null),
    interests: useRef(null),
    experience: useRef(null),
    methods: useRef(null),
    period: useRef(null),
    dataAccess: useRef(null),
  };
  const hasError = (k: string) => errors.includes(k);
  const interestsFull = c.interests.length >= 3;
  const methodsFull = c.methods.length >= 2;
  const majorSuggestions = c.majorArea ? MAJOR_SUGGESTIONS[c.majorArea] : [];
  const customInterests = c.interests.filter((interest) => !INTEREST_TAG_SET.has(interest));

  const onAddInterest = () => {
    const result = addInterest(customInterest);
    if (result === "added") {
      setCustomInterest("");
      setInterestInputError(null);
      return;
    }
    if (result === "duplicate") {
      setInterestInputError("이미 선택한 관심 분야예요.");
      return;
    }
    if (result === "full") {
      setInterestInputError("관심 분야는 최대 3개까지 선택할 수 있어요.");
      return;
    }
    setInterestInputError("관심 분야를 입력해 주세요.");
  };

  const onSubmit = () => {
    const missing = submit();
    setErrors(missing);
    if (missing.length) {
      refs[missing[0]]?.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    router.push("/co-design");
  };

  const modeIcon: Record<IdeaMode, typeof Brain> = {
    free: Brain,
    trend: ScanSearch,
    fusion: GitCompareArrows,
  };

  return (
    <AppShell
      showHeader={false}
      className="research-screen"
      stickyAction={<PrimaryButton onClick={onSubmit}>AI와 공동설계 시작하기</PrimaryButton>}
    >
      <div className="research-brand">
        <AppLogo />
        <Image src="/mvp-assets/robot-flag.png" alt="" width={64} height={62} priority />
      </div>

      <PageHeader
        eyebrow="연구주제 공동설계"
        title="탐색 방식을 고르고, AI와 질문을 좁혀 보세요"
        description="한 번에 한 질문씩 답하면 현재 조건에 맞는 후보 2개와 비교 근거를 만들어요."
      />

      <Card className="research-notice">
        <span><Sparkles size={18} /></span>
        <div>
          <strong>점수가 아니라 근거로 비교해요</strong>
          <p>사용자 확인 사실, AI 제안, 확인 필요 항목을 분리해 보여드려요. 연구실 합격·교수 답변·독창성은 보장하지 않아요.</p>
        </div>
      </Card>

      <div ref={refs.ideaMode} className={cx("cond-group", "mode-select-group", hasError("ideaMode") && "has-error")}>
        <div className="field-label">아이디어 탐색 방식 <small>필수 · 1개 선택</small></div>
        <div className="mode-option-list">
          {IDEA_MODES.map((mode) => {
            const Icon = modeIcon[mode.id];
            const selected = ideaMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                className={cx("mode-option", selected && "is-selected")}
                onClick={() => setIdeaMode(mode.id)}
                aria-pressed={selected}
              >
                <span className="mode-option__icon"><Icon size={21} /></span>
                <span className="mode-option__copy">
                  <strong>{mode.label}</strong>
                  <small>{mode.description}</small>
                </span>
                <span className="mode-option__check" aria-hidden="true">{selected ? <Check size={16} /> : null}</span>
              </button>
            );
          })}
        </div>
        {hasError("ideaMode") && <p className="field-error">아이디어 탐색 방식을 선택해 주세요.</p>}
      </div>

      {/* 학교 — 추천 범위를 뜻하지 않는 선택 맥락 */}
      <div className="cond-group">
        <label htmlFor="school-input" className="field-label">
          학교
          <small>선택 · 직접 입력 가능</small>
        </label>
        <input
          id="school-input"
          className="input"
          type="text"
          list="university-options"
          value={c.school}
          maxLength={80}
          placeholder="예) 단국대학교"
          onChange={(event) => setSchool(event.target.value)}
        />
        <datalist id="university-options">
          {UNIVERSITY_SUGGESTIONS.map((university) => (
            <option key={university} value={university} />
          ))}
        </datalist>
        <p className="field-help">학교를 입력하지 않아도 이용할 수 있으며, 교수 데이터 범위가 자동으로 넓어지는 것은 아니에요.</p>
      </div>

      {/* 보편 전공 계열 */}
      <div ref={refs.majorArea} className={cx("cond-group", hasError("majorArea") && "has-error")}>
        <div className="field-label">전공 계열 <small>필수 · 1개</small></div>
        <div className="chip-grid">
          {MAJOR_AREAS.map((area) => (
            <button
              key={area}
              type="button"
              className={CHIP(c.majorArea === area)}
              onClick={() => setMajorArea(area)}
              aria-pressed={c.majorArea === area}
            >
              {area}
            </button>
          ))}
        </div>
        {hasError("majorArea") && <p className="field-error">전공 계열을 선택해 주세요.</p>}
      </div>

      {/* 검색 또는 직접 입력하는 실제 학과·전공 */}
      <div ref={refs.major} className={cx("cond-group", hasError("major") && "has-error")}>
        <label htmlFor="major-input" className="field-label">
          학과·전공
          <small>필수 · 검색 또는 직접 입력</small>
        </label>
        <input
          id="major-input"
          className="input"
          type="text"
          list="major-options"
          value={c.major ?? ""}
          maxLength={80}
          disabled={!c.majorArea}
          placeholder={c.majorArea ? "예) 컴퓨터공학과" : "먼저 전공 계열을 선택해 주세요"}
          onChange={(event) => setMajor(event.target.value)}
          aria-invalid={hasError("major")}
        />
        <datalist id="major-options">
          {majorSuggestions.map((major) => (
            <option key={major} value={major} />
          ))}
        </datalist>
        <p className="field-help">목록에 없는 학과·학부·전공도 직접 입력할 수 있어요.</p>
        {hasError("major") && <p className="field-error">학과·전공을 입력해 주세요.</p>}
      </div>

      {/* 관심 연구 분야 1~3 */}
      <div ref={refs.interests} className={cx("cond-group", hasError("interests") && "has-error")}>
        <div className="field-label">관심 연구 분야 <small>필수 · 직접 입력 가능 · 최대 3개</small></div>
        <div className="chip-grid">
          {UNIVERSAL_INTEREST_TAGS.map((t) => {
            const on = c.interests.includes(t);
            return (
              <button key={t} type="button" className={CHIP(on)} disabled={!on && interestsFull} onClick={() => toggleInterest(t)} aria-pressed={on}>
                {t}
              </button>
            );
          })}
          {customInterests.map((interest) => (
            <button
              key={interest}
              type="button"
              className={CHIP(true)}
              onClick={() => toggleInterest(interest)}
              aria-pressed={true}
              aria-label={`${interest} 관심 분야 해제`}
            >
              {interest} ×
            </button>
          ))}
        </div>
        <label htmlFor="custom-interest-input" className="field-help">목록에 없는 관심 분야 직접 입력</label>
        <input
          id="custom-interest-input"
          className="input"
          type="text"
          value={customInterest}
          maxLength={60}
          disabled={interestsFull}
          placeholder="예) 우주산업, 고전문학, 스포츠과학"
          onChange={(event) => {
            setCustomInterest(event.target.value);
            setInterestInputError(null);
          }}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            onAddInterest();
          }}
        />
        <button
          type="button"
          className="choice-chip"
          disabled={interestsFull || !customInterest.trim()}
          onClick={onAddInterest}
        >
          입력한 관심 분야 추가
        </button>
        {interestInputError && <p className="field-error" role="alert">{interestInputError}</p>}
        {interestsFull && <p className="cond-hint">최대 3개를 골랐어요. 바꾸려면 하나를 해제하세요.</p>}
        {hasError("interests") && <p className="field-error">관심 분야를 1개 이상 골라 주세요.</p>}
      </div>

      {/* 관련 경험 수준 */}
      <div ref={refs.experience} className={cx("cond-group", hasError("experience") && "has-error")}>
        <div className="field-label">관련 경험 수준 <small>필수</small></div>
        <div className="option-list">
          {EXPERIENCE_LEVELS.map((e) => (
            <button key={e} type="button" className={c.experience === e ? "is-selected" : ""} onClick={() => setExperience(e)} aria-pressed={c.experience === e}>
              <span>{e}</span>
            </button>
          ))}
        </div>
        {hasError("experience") && <p className="field-error">경험 수준을 골라 주세요.</p>}
      </div>

      {/* 사용할 수 있는 방법·도구 1~2 */}
      <div ref={refs.methods} className={cx("cond-group", hasError("methods") && "has-error")}>
        <div className="field-label">사용할 수 있는 방법·도구 <small>필수 · 최대 2개</small></div>
        <div className="chip-grid">
          {METHOD_TAGS.map((t) => {
            const on = c.methods.includes(t);
            return (
              <button key={t} type="button" className={CHIP(on)} disabled={!on && methodsFull} onClick={() => toggleMethod(t)} aria-pressed={on}>
                {t}
              </button>
            );
          })}
        </div>
        {methodsFull && <p className="cond-hint">최대 2개를 골랐어요. 바꾸려면 하나를 해제하세요.</p>}
        {hasError("methods") && <p className="field-error">방법·도구를 1개 이상 골라 주세요.</p>}
      </div>

      {/* 준비 가능 기간 */}
      <div ref={refs.period} className={cx("cond-group", hasError("period") && "has-error")}>
        <div className="field-label">준비 가능 기간 <small>필수</small></div>
        <div className="segmented" style={{ "--segments": 3 } as React.CSSProperties}>
          {PERIODS.map((p) => (
            <button key={p.label} type="button" className={c.period === p.label ? "is-selected" : ""} onClick={() => setPeriod(p.label)} aria-pressed={c.period === p.label}>
              {p.label}
            </button>
          ))}
        </div>
        {hasError("period") && <p className="field-error">준비 가능 기간을 골라 주세요.</p>}
      </div>

      {/* 데이터 접근 상황 */}
      <div ref={refs.dataAccess} className={cx("cond-group", hasError("dataAccess") && "has-error")}>
        <div className="field-label">데이터 접근 상황 <small>필수</small></div>
        <div className="option-list">
          {DATA_ACCESS.map((d) => (
            <button key={d} type="button" className={c.dataAccess === d ? "is-selected" : ""} onClick={() => setDataAccess(d)} aria-pressed={c.dataAccess === d}>
              <span>{d}</span>
            </button>
          ))}
        </div>
        {hasError("dataAccess") && <p className="field-error">데이터 접근 상황을 골라 주세요.</p>}
      </div>

      {/* 피하고 싶은 주제·방식 (선택) */}
      <div className="cond-group">
        <div className="field-label">피하고 싶은 방식 <small>선택</small></div>
        <div className="chip-grid">
          {AVOID_TAGS.map((t) => (
            <button key={t} type="button" className={CHIP(c.avoid.includes(t))} onClick={() => toggleAvoid(t)} aria-pressed={c.avoid.includes(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {errors.length > 0 && (
        <div className="cond-error-banner" role="alert">
          <CircleAlert size={18} /> 추천을 받으려면 표시된 조건을 모두 선택해 주세요.
        </div>
      )}

      <p className="research-foot"><Compass size={14} /> 공식 근거가 없는 정보는 ‘확인 필요’로 남기며, 현재 입력과 선택은 이 브라우저에 저장해요.</p>
    </AppShell>
  );
}
