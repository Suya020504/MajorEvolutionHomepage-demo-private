"use client";

import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  BookOpenCheck,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  Database,
  Gauge,
  GraduationCap,
  Lightbulb,
  Pencil,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  WandSparkles,
} from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";
import { BottomSheet } from "@/components/app/bottom-sheet";
import { CriteriaBar, RadarChart } from "@/components/app/data-visuals";
import {
  AppShell,
  Card,
  ChoiceChip,
  IconButton,
  PageHeader,
  PrimaryButton,
  SaveButton,
  SecondaryButton,
  SectionHeading,
  StatusBanner,
  Tag,
  TextButton,
  cx,
} from "@/components/app/primitives";
import {
  allIdeas,
  comparisonLabels,
  defaultPassport,
  difficultyCopy,
  dnaResult,
  ideaSets,
  trends,
  type ComparisonCriterion,
  type Difficulty,
  type EditablePassport,
  type Idea,
} from "@/data/prototype";
import { usePrototypeStore } from "@/store/prototype-store";

export function EvolutionReportScreen() {
  const router = useRouter();
  const profile = usePrototypeStore((state) => state.profile);
  const isSampleMode = usePrototypeStore((state) => state.isSampleMode);
  const selectedTrendId = usePrototypeStore((state) => state.selectedTrendId);
  const setSelectedTrend = usePrototypeStore((state) => state.setSelectedTrend);
  const [helpOpen, setHelpOpen] = useState(false);
  const [contextNote, setContextNote] = useState("");
  const selectedTrend = trends.find((trend) => trend.id === selectedTrendId) ?? trends[0];
  const otherTrends = trends.filter((trend) => trend.id !== selectedTrend.id);

  const applySuggestion = (type: "easy" | "major") => {
    setContextNote(
      type === "easy"
        ? "쉽게 말하면, 제품의 친환경 문구와 소비자 반응을 숫자로 비교해보는 방향이에요."
        : `${profile.major || "주전공"}의 모델링 강점을 더 쓰도록 지표 설계와 회귀 분석 비중을 높였어요.`,
    );
    setHelpOpen(false);
  };

  return (
    <AppShell
      title="전공 진화 리포트"
      backHref={isSampleMode ? "/" : "/dna"}
      stickyAction={<PrimaryButton onClick={() => router.push("/ideas")}>이 방향으로 아이디어 3개 만들기</PrimaryButton>}
    >
      <PageHeader
        eyebrow={isSampleMode ? "샘플 결과" : "나의 분석 결과"}
        title="네 전공은 이렇게 진화할 수 있어요"
        description={`${profile.major || "수학"}과 ${profile.minor || "관심 분야"}를 AI 연구 방향과 연결했어요.`}
      />

      <section className="dna-result" aria-labelledby="dna-result-title">
        <div className="dna-result__topline" />
        <div className="dna-result__header">
          <div>
            <p className="eyebrow">나의 전공 DNA</p>
            <h2 id="dna-result-title">{dnaResult.axes.join(" × ")}</h2>
          </div>
          <Tag tone="mint">연결 높음</Tag>
        </div>
        <p>{dnaResult.summary}</p>
        <div className="tag-row">
          {dnaResult.strengths.map((strength) => <Tag key={strength} tone="violet">{strength}</Tag>)}
        </div>
      </section>

      <SectionHeading title="전공 역량 연결도" description="차트와 숫자를 함께 확인할 수 있어요." />
      <RadarChart values={dnaResult.radar} labels={dnaResult.radarLabels} />

      <SectionHeading title="가장 가까운 연구 방향" description="관심과 경험을 가장 많이 함께 쓰는 방향이에요." />
      <Card className="trend-hero">
        <div className="trend-hero__header">
          <div><Tag tone="mint">연결 {selectedTrend.connection}</Tag><h2>{selectedTrend.title}</h2></div>
          <BrainCircuit size={28} aria-hidden="true" />
        </div>
        <p className="trend-summary">{selectedTrend.summary}</p>
        <dl className="trend-detail-grid">
          <div><dt>데이터</dt><dd>{selectedTrend.data.join(" · ")}</dd></div>
          <div><dt>방법</dt><dd>{selectedTrend.methods.join(" · ")}</dd></div>
        </dl>
        <div className="trend-fit-reason">
          <strong>왜 나와 맞나요?</strong>
          <p>{selectedTrend.fitReason}</p>
        </div>
        <div className="source-meta"><BookOpenCheck size={15} aria-hidden="true" /> 공식·학술 출처 {selectedTrend.sourceCount}개 · {selectedTrend.verifiedAt} 검증</div>
      </Card>

      <SectionHeading title="다른 가능성" description="카드를 선택하면 대표 방향이 바뀌어요." />
      <div className="horizontal-scroll" role="list">
        {otherTrends.map((trend) => (
          <button key={trend.id} type="button" className="trend-mini" onClick={() => setSelectedTrend(trend.id)} role="listitem">
            <span><Tag tone={trend.connection === "높음" ? "mint" : "blue"}>연결 {trend.connection}</Tag><ChevronRight size={18} aria-hidden="true" /></span>
            <strong>{trend.title}</strong>
            <p>{trend.summary}</p>
            <small>{trend.data.slice(0, 2).join(" · ")}</small>
          </button>
        ))}
      </div>

      <SectionHeading title="준비하면 좋은 기술" />
      <div className="preparation-list">
        {dnaResult.preparation.map((item, index) => (
          <div key={item}><span>{index + 1}</span><p>{item}</p><Check size={17} aria-hidden="true" /></div>
        ))}
      </div>

      <div className="context-actions">
        <TextButton onClick={() => setHelpOpen(true)}><WandSparkles size={17} aria-hidden="true" /> 이 방향을 조정해줘</TextButton>
      </div>
      {contextNote && <StatusBanner icon={Sparkles} title="설명을 조정했어요" tone="lavender">{contextNote}</StatusBanner>}

      <BottomSheet open={helpOpen} onClose={() => setHelpOpen(false)} title="어떻게 바꿔볼까요?" description="현재 전공 진화 리포트에 맞는 요청만 보여드려요.">
        <div className="sheet-choice-list">
          <button type="button" onClick={() => applySuggestion("easy")}><Lightbulb size={19} /><span><strong>이 분야를 더 쉽게 설명해줘</strong><small>전문용어를 줄이고 한 문장 예시를 붙여요.</small></span><ChevronRight size={18} /></button>
          <button type="button" onClick={() => applySuggestion("major")}><Target size={19} /><span><strong>내 전공을 더 많이 쓰는 방향 보기</strong><small>모델링과 경제적 해석 비중을 높여요.</small></span><ChevronRight size={18} /></button>
        </div>
      </BottomSheet>
    </AppShell>
  );
}

function IdeaCard({
  idea,
  selectedIndex,
  selected,
  saved,
  onSelect,
  onSave,
}: {
  idea: Idea;
  selectedIndex?: number;
  selected: boolean;
  saved: boolean;
  onSelect: () => void;
  onSave: () => void;
}) {
  return (
    <article className={cx("idea-card", selected && "is-selected")}>
      <header className="idea-card__header">
        <div className="idea-card__labels">
          <Tag tone={idea.type === "연구형" ? "violet" : idea.type === "프로젝트형" ? "blue" : "mint"}>{idea.type}</Tag>
          {selected && <Tag tone="violet">비교 {selectedIndex}</Tag>}
        </div>
        <SaveButton saved={saved} onClick={onSave} label="아이디어 저장" />
      </header>
      <h2>{idea.title}</h2>
      <p className="idea-card__subtitle">{idea.subtitle}</p>
      <dl className="idea-meta">
        <div><dt><Database size={15} /> 데이터</dt><dd>{idea.data.join(" · ")}</dd></div>
        <div><dt><BarChart3 size={15} /> 방법</dt><dd>{idea.methods.slice(0, 2).join(" · ")}</dd></div>
        <div><dt><Clock3 size={15} /> 기간</dt><dd>{idea.weeks}주</dd></div>
      </dl>
      <div className="idea-score-pair">
        <CriteriaBar label="개인 적합" value={idea.scores.personalFit} emphasized />
        <CriteriaBar label="데이터 확보" value={idea.scores.dataAccess} />
      </div>
      <button type="button" className={cx("idea-select", selected && "is-selected")} aria-pressed={selected} onClick={onSelect}>
        {selected ? <><Check size={18} /> 비교에서 빼기</> : "비교 대상으로 선택"}
      </button>
    </article>
  );
}

export function IdeasScreen() {
  const router = useRouter();
  const ideaSetVersion = usePrototypeStore((state) => state.ideaSetVersion);
  const regenerateIdeas = usePrototypeStore((state) => state.regenerateIdeas);
  const selectedIdeaIds = usePrototypeStore((state) => state.selectedIdeaIds);
  const toggleIdeaSelection = usePrototypeStore((state) => state.toggleIdeaSelection);
  const savedIdeaIds = usePrototypeStore((state) => state.savedIdeaIds);
  const toggleSavedIdea = usePrototypeStore((state) => state.toggleSavedIdea);
  const ideas = ideaSets[ideaSetVersion];

  return (
    <AppShell
      title="아이디어 랩"
      backHref="/evolution-report"
      stickyAction={<PrimaryButton disabled={selectedIdeaIds.length !== 2} onClick={() => router.push("/ideas/compare")}>선택한 2개 비교하기</PrimaryButton>}
    >
      <PageHeader
        eyebrow="전공 DNA × 연구 트렌드"
        title="너에게 맞는 아이디어 3개를 만들었어요"
        description="연구형·프로젝트형·서비스형을 같은 기준으로 비교해보세요."
      />
      <div className="idea-selection-status" aria-live="polite">
        <span>비교 대상</span><strong>{selectedIdeaIds.length} / 2</strong>
      </div>
      <div className="idea-list">
        {ideas.map((idea) => {
          const selectedIndex = selectedIdeaIds.indexOf(idea.id);
          return (
            <IdeaCard
              key={idea.id}
              idea={idea}
              selected={selectedIndex >= 0}
              selectedIndex={selectedIndex >= 0 ? selectedIndex + 1 : undefined}
              saved={savedIdeaIds.includes(idea.id)}
              onSelect={() => toggleIdeaSelection(idea.id)}
              onSave={() => toggleSavedIdea(idea.id)}
            />
          );
        })}
      </div>
      <div className="regenerate-row">
        <TextButton onClick={regenerateIdeas}><RotateCcw size={17} aria-hidden="true" /> {ideaSetVersion === 0 ? "다른 방향으로 다시 만들기" : "처음 아이디어로 돌아가기"}</TextButton>
        <p>고정된 대체 세트를 사용해 결과가 일관되게 유지돼요.</p>
      </div>
    </AppShell>
  );
}

export function IdeasCompareScreen() {
  const router = useRouter();
  const ideaSetVersion = usePrototypeStore((state) => state.ideaSetVersion);
  const selectedIdeaIds = usePrototypeStore((state) => state.selectedIdeaIds);
  const selectedIdeaId = usePrototypeStore((state) => state.selectedIdeaId);
  const setSelectedIdea = usePrototypeStore((state) => state.setSelectedIdea);
  const criteria = usePrototypeStore((state) => state.comparisonCriteria);
  const toggleCriterion = usePrototypeStore((state) => state.toggleCriterion);
  const difficulty = usePrototypeStore((state) => state.difficulty);
  const setDifficulty = usePrototypeStore((state) => state.setDifficulty);
  const ideas = ideaSets[ideaSetVersion];
  const compared = selectedIdeaIds.length === 2
    ? selectedIdeaIds.map((id) => allIdeas.find((idea) => idea.id === id)).filter(Boolean) as Idea[]
    : ideas.slice(0, 2);
  const activeIdeaId = selectedIdeaId && compared.some((idea) => idea.id === selectedIdeaId) ? selectedIdeaId : compared[0].id;
  const activeIdea = compared.find((idea) => idea.id === activeIdeaId) ?? compared[0];
  const comparisonKeys = Object.keys(comparisonLabels) as ComparisonCriterion[];

  const proceed = () => {
    setSelectedIdea(activeIdea.id);
    router.push("/feasibility");
  };

  return (
    <AppShell
      title="아이디어 비교"
      backHref="/ideas"
      stickyAction={<PrimaryButton onClick={proceed}>{activeIdea.title}로 진행하기</PrimaryButton>}
    >
      <PageHeader
        eyebrow="1:1 비교"
        title="어떤 아이디어가 지금의 나에게 더 맞을까요?"
        description="AI 추천과 최종 선택은 다를 수 있어요. 중요한 기준부터 골라보세요."
      />

      {selectedIdeaIds.length !== 2 && <StatusBanner icon={CircleHelp} title="샘플 비교를 열었어요">저장된 비교 대상이 없어 현재 세트의 첫 두 아이디어를 보여드려요.</StatusBanner>}

      <SectionHeading title="나에게 중요한 기준" description="최대 2개" />
      <div className="chip-grid">
        {(["personalFit", "dataAccess", "feasibility", "careerValue"] as ComparisonCriterion[]).map((criterion) => (
          <ChoiceChip key={criterion} selected={criteria.includes(criterion)} onClick={() => toggleCriterion(criterion)} disabled={!criteria.includes(criterion) && criteria.length >= 2}>
            {comparisonLabels[criterion]}
          </ChoiceChip>
        ))}
      </div>

      <div className="compare-headings">
        {compared.map((idea, index) => <div key={idea.id}><Tag tone={index === 0 ? "violet" : "blue"}>{index === 0 ? "A" : "B"}</Tag><strong>{idea.title}</strong></div>)}
      </div>

      <div className="comparison-list">
        {comparisonKeys.map((criterion) => (
          <div key={criterion} className={cx("comparison-row", criteria.includes(criterion) && "is-emphasized")}>
            <strong>{comparisonLabels[criterion]}</strong>
            <div className="comparison-values">
              {compared.map((idea) => (
                <div key={idea.id}><span>{idea.scores[criterion]}</span><i style={{ "--value": `${idea.scores[criterion]}%` } as CSSProperties} /></div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <StatusBanner icon={Sparkles} title={`AI 추천: ${compared[0].title}`} tone="lavender">
        ESG 관심과 설문분석 경험, 경제적 해석 강점을 가장 많이 함께 사용할 수 있어요. 데이터 범위는 조정이 필요해요.
      </StatusBanner>

      <SectionHeading title="최종 아이디어 선택" />
      <div className="final-idea-choice">
        {compared.map((idea) => (
          <button key={idea.id} type="button" className={activeIdeaId === idea.id ? "is-selected" : ""} onClick={() => setSelectedIdea(idea.id)} aria-pressed={activeIdeaId === idea.id}>
            <span><strong>{idea.title}</strong><small>{idea.subtitle}</small></span>
            <span className="radio-dot" />
          </button>
        ))}
      </div>

      <SectionHeading title="난이도 조절" description="범위와 방법이 함께 달라져요." />
      <div className="difficulty-grid">
        {(Object.keys(difficultyCopy) as Difficulty[]).map((value) => (
          <button key={value} type="button" className={difficulty === value ? "is-selected" : ""} onClick={() => setDifficulty(value)} aria-pressed={difficulty === value}>
            <strong>{difficultyCopy[value].label}</strong><small>{difficultyCopy[value].spice}</small>
          </button>
        ))}
      </div>
      <Card className="difficulty-result">
        <Gauge size={22} aria-hidden="true" />
        <div><strong>{difficultyCopy[difficulty].label} · {difficultyCopy[difficulty].spice}</strong><p>{difficultyCopy[difficulty].description}</p></div>
      </Card>
    </AppShell>
  );
}

const feasibilityItems = [
  { title: "데이터 접근", original: "범위 조정 필요", adjusted: "시작 가능", detail: "제품 설명과 가격은 공개 수집, 설문은 소규모 직접 수집", status: "adjust" },
  { title: "기간", original: "4주 버전 가능", adjusted: "4주 안에 가능", detail: "범위를 한 식품군과 제품 100개 이하로 제한", status: "ready" },
  { title: "현재 역량", original: "시작 가능", adjusted: "시작 가능", detail: "Python과 설문분석 경험을 기준 방법에 활용", status: "ready" },
  { title: "비용·도구", original: "무료 대안 있음", adjusted: "무료로 가능", detail: "공개 데이터와 무료 분석 도구 사용", status: "ready" },
  { title: "윤리·개인정보", original: "확인 필요", adjusted: "확인 필요", detail: "설문 참여 동의와 익명 처리 문구 준비", status: "check" },
  { title: "평가 기준", original: "보완 필요", adjusted: "기준 추가", detail: "기준 모델, 오류 기록, 해석 가능성을 함께 평가", status: "adjust" },
];

export function FeasibilityScreen() {
  const router = useRouter();
  const selectedIdeaId = usePrototypeStore((state) => state.selectedIdeaId);
  const version = usePrototypeStore((state) => state.feasibilityVersion);
  const setVersion = usePrototypeStore((state) => state.setFeasibilityVersion);
  const idea = allIdeas.find((item) => item.id === selectedIdeaId) ?? ideaSets[0][0];
  const adjusted = version === "four-week";

  const stickyAction = adjusted ? (
    <>
      <SecondaryButton onClick={() => setVersion("original")}>원래 범위 보기</SecondaryButton>
      <PrimaryButton onClick={() => router.push("/passport")}>아이디어 패스포트 만들기</PrimaryButton>
    </>
  ) : (
    <PrimaryButton onClick={() => setVersion("four-week")}>4주 버전 적용하기</PrimaryButton>
  );

  return (
    <AppShell title="실현성 게이트" backHref="/ideas/compare" stickyAction={stickyAction}>
      <PageHeader
        eyebrow={idea.title}
        title={adjusted ? "이제 시작할 수 있어요" : "조건부로 시작할 수 있어요"}
        description={adjusted ? "핵심 질문은 유지하고 4주 안에 가능한 범위로 정리했어요." : "범위를 조금 줄이면 4주 안에 첫 결과를 만들 수 있어요."}
      />
      <StatusBanner icon={adjusted ? CheckCircle2 : AlertTriangle} title={adjusted ? "4주 버전 적용 완료" : "탈락시키는 단계가 아니에요"} tone={adjusted ? "success" : "warning"}>
        {adjusted ? "데이터와 방법, 결과물의 범위가 함께 바뀌었어요." : "부족한 조건과 확인할 질문을 보여주는 단계예요."}
      </StatusBanner>

      <SectionHeading title="시작 조건 6가지" />
      <div className="feasibility-list">
        {feasibilityItems.map((item) => {
          const ready = adjusted || item.status === "ready";
          const Icon = ready ? CheckCircle2 : item.status === "check" ? CircleHelp : AlertTriangle;
          return (
            <div key={item.title} className={cx("feasibility-row", ready && "is-ready", !ready && item.status === "check" && "needs-check")}>
              <span><Icon size={20} aria-hidden="true" /></span>
              <div><strong>{item.title}</strong><p>{item.detail}</p></div>
              <Tag tone={ready ? "mint" : item.status === "check" ? "warning" : "blue"}>{adjusted ? item.adjusted : item.original}</Tag>
            </div>
          );
        })}
      </div>

      <SectionHeading title="4주 버전 범위" />
      <div className="scope-comparison">
        <div><span>원래 범위</span><p>여러 식품군, 대규모 설문, 고급 텍스트 모델</p></div>
        <ChevronRight size={20} aria-hidden="true" />
        <div className={adjusted ? "is-active" : ""}><span>조정 범위</span><p>한 식품군, 제품 100개 이하, 30~50명 탐색 설문, 키워드 사전 + 회귀분석</p></div>
      </div>
      {!adjusted && <TextButton className="keep-original" onClick={() => router.push("/passport")}>원래 범위 유지하고 계속하기</TextButton>}
      <p className="trust-copy"><ShieldCheck size={18} aria-hidden="true" /> 이 점검은 아이디어를 평가하거나 탈락시키지 않아요.</p>
    </AppShell>
  );
}

const passportLabels: Record<keyof EditablePassport, { title: string; icon: typeof Lightbulb }> = {
  problem: { title: "문제", icon: AlertTriangle },
  question: { title: "연구 질문", icon: CircleHelp },
  data: { title: "데이터", icon: Database },
  methods: { title: "방법론 사다리", icon: BarChart3 },
  output: { title: "예상 결과물", icon: Target },
  risks: { title: "리스크", icon: ShieldCheck },
  professorQuestions: { title: "교수에게 확인할 점", icon: GraduationCap },
};

export function PassportScreen() {
  const router = useRouter();
  const selectedIdeaId = usePrototypeStore((state) => state.selectedIdeaId);
  const idea = allIdeas.find((item) => item.id === selectedIdeaId) ?? ideaSets[0][0];
  const difficulty = usePrototypeStore((state) => state.difficulty);
  const passport = usePrototypeStore((state) => state.passport);
  const updatePassport = usePrototypeStore((state) => state.updatePassport);
  const profile = usePrototypeStore((state) => state.profile);
  const [editing, setEditing] = useState<keyof EditablePassport | null>(null);
  const [draft, setDraft] = useState("");

  const openEditor = (field: keyof EditablePassport) => {
    setEditing(field);
    setDraft(passport[field]);
  };

  const saveEdit = () => {
    if (!editing || !draft.trim()) return;
    updatePassport(editing, draft.trim());
    setEditing(null);
  };

  return (
    <AppShell
      title="아이디어 패스포트"
      backHref="/feasibility"
      stickyAction={<PrimaryButton onClick={() => router.push("/professors")}>이 아이디어와 맞는 교수님 찾기</PrimaryButton>}
    >
      <PageHeader eyebrow="진화 프로젝트 4 / 6" title="아이디어가 실행 가능한 계획으로 진화했어요" />
      <div className="journey-progress" aria-label="진화 프로젝트 진행 단계">
        {["DNA", "아이디어", "실현성", "패스포트", "교수 연결", "실행"].map((label, index) => <span key={label} className={index <= 3 ? "is-complete" : ""}><i>{index <= 3 ? <Check size={13} /> : index + 1}</i>{label}</span>)}
      </div>

      <section className="passport-header">
        <Tag tone="violet">PROJECT PASSPORT</Tag>
        <h2>{idea.title}</h2>
        <p>{idea.type} · {profile.availableWeeks}주 · {difficultyCopy[difficulty].spice}</p>
        <div className="tag-row"><Tag>{profile.major || "수학"}</Tag><Tag>{profile.minor || "식품자원경제"}</Tag><Tag tone="mint">AI</Tag></div>
      </section>

      <div className="passport-sections">
        {(Object.keys(passportLabels) as Array<keyof EditablePassport>).map((field) => {
          const { title, icon: Icon } = passportLabels[field];
          return (
            <article key={field} className="passport-section">
              <header><span><Icon size={18} aria-hidden="true" /></span><h3>{title}</h3><IconButton label={`${title} 편집`} onClick={() => openEditor(field)}><Pencil size={17} aria-hidden="true" /></IconButton></header>
              <p>{passport[field] || defaultPassport[field]}</p>
            </article>
          );
        })}
      </div>

      <BottomSheet
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing ? `${passportLabels[editing].title} 편집` : "편집"}
        description="수정한 내용은 이 브라우저에 바로 저장돼요."
        footer={<PrimaryButton disabled={!draft.trim()} onClick={saveEdit}>변경 저장</PrimaryButton>}
      >
        <label className="field-group" htmlFor="passport-editor">
          <span className="field-label">내용</span>
          <textarea id="passport-editor" aria-label="내용" className="textarea passport-editor" value={draft} onChange={(event) => setDraft(event.target.value)} autoFocus />
        </label>
      </BottomSheet>
    </AppShell>
  );
}
