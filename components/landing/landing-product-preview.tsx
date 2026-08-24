"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  CircleHelp,
  FlaskConical,
  GitBranch,
  GraduationCap,
  Lightbulb,
  ListChecks,
  MessageCircleMore,
  SearchCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import styles from "./landing-product-preview.module.css";

type PreviewId = "ai-professor" | "professor-match" | "project-design";

const PREVIEWS = [
  {
    id: "ai-professor" as const,
    tab: "AI 교수님",
    eyebrow: "대화가 생각 지도로",
    title: "말로 풀어낸 고민이, 다시 볼 수 있는 생각의 길이 됩니다.",
    description:
      "AI 교수님과 나눈 긴 대화는 한 줄 핵심으로 정리되고, 질문이 달라지는 순간 실제 가지처럼 갈라집니다. 카드를 누르면 그 생각이 나온 원문 대화까지 다시 확인할 수 있어요.",
    features: ["한 줄 핵심 카드", "새 질문은 별도 갈래로", "원문 대화와 성장 메모 연결"],
    href: "/portfolio/ai-professor",
    cta: "AI 교수님과 이야기하기",
  },
  {
    id: "professor-match" as const,
    tab: "교수 3인 피칭",
    eyebrow: "가까운 연결부터 역할별 비교",
    title: "한 줄 순위 대신, 왜 이 교수님과 이야기할지 비교합니다.",
    description:
      "내 학과에서 먼저 이야기하기 쉬운 교수 한 명과, 다른 학과의 주제·방법 연결 교수를 함께 보여줍니다. 공식 근거, 확인할 점, 첫 질문이 한 카드 안에서 이어져요.",
    features: ["내 학과 연결 한 명", "주제·방법 역할 구분", "공식 근거와 첫 질문"],
    href: "/tutorial",
    cta: "내 교수 연결 시작하기",
  },
  {
    id: "project-design" as const,
    tab: "AI 프로젝트 설계",
    eyebrow: "관심을 실행 가능한 주제로",
    title: "한 번에 한 질문씩 답하며 프로젝트의 범위를 좁혀갑니다.",
    description:
      "공통 질문으로 출발점을 잡고, 앞선 답변에 따라 달라지는 맞춤 질문으로 문제·방법·결과물을 구체화합니다. 완성한 프로젝트에는 필요한 전문성의 교수를 다시 연결해요.",
    features: ["공통 질문 뒤 맞춤 질문", "답변 방향을 직접 선택", "프로젝트 기반 교수 추천"],
    href: "/research/tutorial",
    cta: "프로젝트 설계 시작하기",
  },
] as const;

export function LandingProductPreview() {
  const [activeId, setActiveId] = useState<PreviewId>("ai-professor");
  const active = PREVIEWS.find((preview) => preview.id === activeId) ?? PREVIEWS[0];

  const moveTab = (event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (currentIndex + 1) % PREVIEWS.length;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (currentIndex - 1 + PREVIEWS.length) % PREVIEWS.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = PREVIEWS.length - 1;
    if (nextIndex === currentIndex) return;
    event.preventDefault();
    const next = PREVIEWS[nextIndex];
    setActiveId(next.id);
    requestAnimationFrame(() => document.getElementById(`preview-tab-${next.id}`)?.focus());
  };

  return (
    <section id="preview" className={styles.section} aria-labelledby="product-preview-title">
      <div className={styles.inner}>
        <header className={styles.heading}>
          <span><Sparkles size={15} aria-hidden="true" /> 실제 서비스 미리보기</span>
          <h2 id="product-preview-title">
            설명만 듣지 말고,
            <br />실제 흐름을 먼저 살펴보세요.
          </h2>
          <p>교수 연결, 프로젝트 설계, 성장 대화가 어떤 화면으로 이어지는지 확인해보세요. 실제 MVP 예시이며 입력 내용과 저장 상태에 따라 달라져요.</p>
        </header>

        <div className={styles.tabs} role="tablist" aria-label="서비스 화면 선택">
          {PREVIEWS.map((preview, index) => (
            <button
              key={preview.id}
              id={`preview-tab-${preview.id}`}
              type="button"
              role="tab"
              aria-selected={activeId === preview.id}
              aria-controls={`preview-panel-${preview.id}`}
              tabIndex={activeId === preview.id ? 0 : -1}
              onClick={() => setActiveId(preview.id)}
              onKeyDown={(event) => moveTab(event, index)}
            >
              {preview.id === "ai-professor" ? <Bot size={17} /> : null}
              {preview.id === "professor-match" ? <GraduationCap size={18} /> : null}
              {preview.id === "project-design" ? <FlaskConical size={17} /> : null}
              {preview.tab}
            </button>
          ))}
        </div>

        <div
          id={`preview-panel-${active.id}`}
          className={styles.panel}
          role="tabpanel"
          aria-labelledby={`preview-tab-${active.id}`}
        >
          <div className={styles.copy}>
            <span>{active.eyebrow}</span>
            <h3>{active.title}</h3>
            <p>{active.description}</p>
            <ul>
              {active.features.map((feature) => (
                <li key={feature}><CheckCircle2 size={16} aria-hidden="true" /> {feature}</li>
              ))}
            </ul>
            <Link href={active.href}>
              {active.cta} <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>

          <figure className={styles.browserFrame} aria-label={`${active.tab} 실제 서비스 화면 예시`}>
            <div className={styles.browserTopbar} aria-hidden="true">
              <span /><span /><span />
              <strong>너의 교수님은?</strong>
              <small>실제 서비스 화면 예시</small>
            </div>
            {active.id === "ai-professor" ? <AiProfessorPreview /> : null}
            {active.id === "professor-match" ? <ProfessorMatchPreview /> : null}
            {active.id === "project-design" ? <ProjectDesignPreview /> : null}
            <figcaption className={styles.screenReaderOnly}>{active.tab} 기능을 축약해 보여주는 실제 MVP 예시 화면</figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

function AiProfessorPreview() {
  return (
    <div className={styles.aiPreview}>
      <section className={styles.chatPane} aria-label="AI 교수님 대화 예시">
        <header><Bot size={18} aria-hidden="true" /><div><strong>나의 AI 교수님</strong><small>고민을 함께 정리해요</small></div></header>
        <div className={styles.chatMessages}>
          <p className={styles.userBubble}>수학 전공을 살려 AI 분야로 가고 싶은데, 어떤 경험부터 해보면 좋을까요?</p>
          <p className={styles.aiBubble}>지금은 진로를 하나로 정하기보다, 데이터 분석과 머신러닝 경험을 작은 프로젝트로 비교해보면 좋아요.</p>
        </div>
        <div className={styles.chatPrompt}><span>데이터 분석부터 비교해볼래요</span><ArrowRight size={14} /></div>
      </section>

      <section className={styles.mapPane} aria-label="대화에서 만들어진 생각 진화 지도 예시">
        <header><GitBranch size={16} aria-hidden="true" /><strong>생각 진화 지도</strong><span>대화와 함께 자라요</span></header>
        <div className={styles.thoughtMap}>
          <span className={styles.mapStart}><MessageCircleMore size={13} /> 대화 시작</span>
          <span className={styles.mapStem} aria-hidden="true" />
          <article className={styles.mapRoot}>
            <span><CircleHelp size={12} /> 생각 씨앗</span>
            <strong>AI 진로의 첫 경험 찾기</strong>
            <small>전공을 살릴 두 방향을 비교해요</small>
          </article>
          <span className={styles.mapFork} aria-hidden="true" />
          <div className={styles.mapChildren}>
            <article>
              <span><Lightbulb size={12} /> 발견한 단서</span>
              <strong>데이터 분석 경험</strong>
              <small>관심을 확인할 작은 실험</small>
            </article>
            <article>
              <span><ListChecks size={12} /> 다음 발걸음</span>
              <strong>2주 미니 프로젝트</strong>
              <small>결과물로 방향 비교하기</small>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}

function ProfessorMatchPreview() {
  const cards = [
    { icon: GraduationCap, type: "내 학과 연결", role: "가까운 시작점", title: "우리 학과 교수님", copy: "전공 수업과 학과 맥락 안에서 첫 질문을 시작해요." },
    { icon: SearchCheck, type: "주제 연결", role: "관심 길잡이", title: "관심 주제 교수님", copy: "공식 연구 주제에서 내 관심과 만나는 근거를 확인해요." },
    { icon: FlaskConical, type: "방법 연결", role: "방법 코치", title: "실행 방법 교수님", copy: "프로젝트에 필요한 데이터·실험 방법을 함께 비교해요." },
  ] as const;

  return (
    <div className={styles.matchPreview}>
      <header><div><span>교수 3인 피칭</span><strong>역할이 다른 세 분을 비교해보세요</strong></div><small>공식 정보 기반</small></header>
      <div className={styles.matchCards}>
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.type}>
              <div className={styles.matchCardTop}><span><Icon size={17} /></span><small>{card.role}</small></div>
              <em>{card.type}</em>
              <strong>{card.title}</strong>
              <p>{card.copy}</p>
              <span className={styles.matchCardAction}>연결 근거 보기 <ArrowRight size={13} /></span>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function ProjectDesignPreview() {
  const options = [
    { icon: Target, title: "문제를 더 좁혀보기", copy: "누구의 어떤 불편을 다룰지 정해요." },
    { icon: FlaskConical, title: "사용할 방법 비교하기", copy: "데이터와 실행 조건을 함께 봐요." },
    { icon: Lightbulb, title: "가능성을 열어두기", copy: "답변에 따라 다음 질문이 달라져요." },
  ] as const;

  return (
    <div className={styles.projectPreview}>
      <section className={styles.projectQuestion}>
        <span><Sparkles size={14} /> AI 공동설계 · 2 / 5</span>
        <h4>이 아이디어로 가장 먼저 바꾸고 싶은 것은 무엇인가요?</h4>
        <p>앞선 답변을 반영해 질문을 하나씩 보여드려요.</p>
        <div><strong>내 답변</strong><span>학생이 실제로 겪는 진로 정보의 막막함을 줄이고 싶어요.</span></div>
      </section>
      <section className={styles.projectOptions}>
        <header><strong>이어갈 방향</strong><small>한 가지를 골라보세요</small></header>
        {options.map((option, index) => {
          const Icon = option.icon;
          return (
            <article key={option.title} data-selected={index === 0 ? "true" : "false"}>
              <span><Icon size={17} /></span>
              <div><strong>{option.title}</strong><p>{option.copy}</p></div>
              <i>{index === 0 ? <CheckCircle2 size={17} /> : null}</i>
            </article>
          );
        })}
      </section>
    </div>
  );
}
