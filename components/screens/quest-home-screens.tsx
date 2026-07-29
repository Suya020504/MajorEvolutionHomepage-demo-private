"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CalendarPlus,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  Database,
  Download,
  ExternalLink,
  FileText,
  GraduationCap,
  Home,
  Lightbulb,
  ListChecks,
  Mail,
  Printer,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { BottomNav } from "@/components/app/bottom-nav";
import { BottomSheet } from "@/components/app/bottom-sheet";
import {
  AppLogo,
  AppShell,
  Card,
  cx,
  EmptyState,
  LinkButton,
  PageHeader,
  PrimaryButton,
  ProgressBar,
  SaveButton,
  SecondaryButton,
  SectionHeading,
  StatusBanner,
  Tag,
  TextButton,
} from "@/components/app/primitives";
import {
  dnaResult,
  ideaSets,
  professors,
} from "@/data/prototype";
import { getAvailableIdeas } from "@/lib/ai-journey";
import { usePrototypeStore } from "@/store/prototype-store";

/** 레거시 프로토타입 홈이 진행률을 표시할 때 쓰는 단계 목록입니다. */
const QUEST_STEPS = [
  { id: "first-action", label: "첫 30분 행동" },
  { id: "data-plan", label: "데이터 계획" },
  { id: "method-plan", label: "방법론 사다리" },
  { id: "interview-questions", label: "면담 질문" },
  { id: "email-ready", label: "이메일 준비" },
  { id: "project-package", label: "실행 패키지" },
] as const;

export function HomeScreen() {
  const router = useRouter();
  const profile = usePrototypeStore((state) => state.profile);
  const selectedIdeaId = usePrototypeStore((state) => state.selectedIdeaId);
  const aiJourney = usePrototypeStore((state) => state.aiJourney);
  const aiIdeaArchive = usePrototypeStore((state) => state.aiIdeaArchive);
  const selectedProfessorId = usePrototypeStore((state) => state.selectedProfessorId);
  const completedQuestIds = usePrototypeStore((state) => state.completedQuestIds);
  const savedIdeaCount = usePrototypeStore((state) => state.savedIdeaIds.length);
  const savedProfessorCount = usePrototypeStore((state) => state.savedProfessorIds.length);
  const idea = [...getAvailableIdeas(aiJourney), ...aiIdeaArchive].find((item) => item.id === selectedIdeaId);
  const professor = professors.find((item) => item.id === selectedProfessorId);
  const completedCount = QUEST_STEPS.filter((step) => completedQuestIds.includes(step.id)).length;
  const nextStep = QUEST_STEPS.find((step) => !completedQuestIds.includes(step.id));

  if (!idea) {
    return (
      <AppShell showHeader={false} bottomNav={<BottomNav />}>
        <div className="home-brand"><AppLogo /><Tag tone="violet">홈</Tag></div>
        <EmptyState
          image="/mvp-assets/robot-pose-3.png"
          title="아직 진화 중인 프로젝트가 없어요"
          description="전공 DNA부터 첫 아이디어를 만들어보세요."
          action={<PrimaryButton onClick={() => router.push("/goal")}>전공 진화 시작하기</PrimaryButton>}
        />
      </AppShell>
    );
  }

  return (
    <AppShell showHeader={false} bottomNav={<BottomNav />}>
      <div className="home-brand"><AppLogo /><Tag tone="violet">홈</Tag></div>
      <header className="home-greeting"><p>안녕하세요, {profile.name || "김학생"}님</p><h1>오늘 이어서 할 일이 있어요</h1></header>

      <section className="current-project">
        <div className="current-project__top"><Tag tone="mint">{completedCount === 6 ? "준비 완료" : "진행 중"}</Tag><span>{completedCount} / 6 완료</span></div>
        <h2>{idea.title}</h2>
        <p>{professor ? `${professor.name} 연결 · ` : ""}{idea.type} · {idea.weeks}주</p>
        <ProgressBar value={completedCount} max={6} label={`프로젝트 ${completedCount}/6 완료`} />
        <div className="next-action"><span><ListChecks size={18} /></span><div><small>{nextStep ? "다음 행동" : "완료"}</small><strong>{nextStep?.label ?? "실제 프로젝트 기록 시작하기"}</strong></div></div>
        <PrimaryButton onClick={() => router.push("/quest")}>계속하기 <ArrowRight size={18} /></PrimaryButton>
      </section>

      <SectionHeading title="내 전공 DNA" />
      <Card className="home-dna"><Sparkles size={22} /><div><strong>{(aiJourney?.dna ?? dnaResult).axes.join(" × ")}</strong><p>{(aiJourney?.dna ?? dnaResult).summary}</p></div></Card>

      <SectionHeading title="저장한 항목" />
      <div className="saved-summary">
        <Link href="/saved"><Lightbulb size={20} /><span><strong>{savedIdeaCount}</strong><small>아이디어</small></span><ChevronRight size={18} /></Link>
        <Link href="/saved"><GraduationCap size={20} /><span><strong>{savedProfessorCount}</strong><small>교수</small></span><ChevronRight size={18} /></Link>
        <Link href="/professors"><BookOpenCheck size={20} /><span><strong>{professor?.sources.length ?? 0}</strong><small>출처</small></span><ChevronRight size={18} /></Link>
      </div>

      <SectionHeading title="최근 성장 기록" />
      <div className="activity-list">
        {completedCount > 0 ? <div><CheckCircle2 size={19} /><span><strong>실행 준비 {completedCount}단계 완료</strong><small>최근 상태가 저장됐어요</small></span></div> : <div><Timer size={19} /><span><strong>실행 퀘스트 생성</strong><small>첫 행동을 기다리고 있어요</small></span></div>}
        <div><Save size={19} /><span><strong>아이디어 패스포트 완성</strong><small>{idea.title}</small></span></div>
      </div>
    </AppShell>
  );
}

const exploreItems = [
  { href: "/mentoring", icon: Sparkles, title: "교수 연결 여정", description: "찾기·준비하기·피드백 반영 3단계 보기", tone: "violet" },
  { href: "/research", icon: Lightbulb, title: "연구 주제 공동설계", description: "질문을 통해 전략이 다른 후보 2개 비교", tone: "mint" },
  { href: "/paper", icon: FileText, title: "논문 이해", description: "초록과 본문을 질문·방법·결과·한계로 나눠 읽기", tone: "violet" },
  { href: "/professors", icon: GraduationCap, title: "나의 교수님 — 찾다", description: "선택한 주제와 공식 연구 정보의 연결 근거 보기", tone: "blue" },
];

export function ExploreScreen() {
  const aiJourney = usePrototypeStore((state) => state.aiJourney);
  const selectedTrendId = usePrototypeStore((state) => state.selectedTrendId);
  const selectedTrend = aiJourney?.trends.find((trend) => trend.id === selectedTrendId) ?? aiJourney?.trends[0];
  return (
    <AppShell title="탐색" bottomNav={<BottomNav />}>
      <PageHeader eyebrow="다시 보기" title="전공에서 시작해 더 멀리 탐색해보세요" description="완성한 결과를 다시 열거나 다른 단계로 이동할 수 있어요." />
      <div className="explore-list">
        {exploreItems.map(({ href, icon: Icon, title, description, tone }) => (
          <Link key={href} href={href}><span className={`explore-icon explore-icon--${tone}`}><Icon size={22} /></span><div><h2>{title}</h2><p>{description}</p></div><ChevronRight size={19} /></Link>
        ))}
      </div>
      <SectionHeading title="현재 추천 방향" />
      <StatusBanner icon={Target} title={selectedTrend?.title ?? "ESG·그린워싱 탐지"} tone="lavender">{selectedTrend?.summary ?? "친환경 표현을 텍스트와 소비자 반응으로 분석하는 방향이에요."}</StatusBanner>
    </AppShell>
  );
}

export function SavedScreen() {
  const aiJourney = usePrototypeStore((state) => state.aiJourney);
  const aiIdeaArchive = usePrototypeStore((state) => state.aiIdeaArchive);
  const savedIdeaIds = usePrototypeStore((state) => state.savedIdeaIds);
  const savedProfessorIds = usePrototypeStore((state) => state.savedProfessorIds);
  const toggleSavedIdea = usePrototypeStore((state) => state.toggleSavedIdea);
  const toggleSavedProfessor = usePrototypeStore((state) => state.toggleSavedProfessor);
  const setSelectedIdea = usePrototypeStore((state) => state.setSelectedIdea);
  const router = useRouter();
  const availableIdeas = [...getAvailableIdeas(aiJourney), ...aiIdeaArchive];
  const ideas = savedIdeaIds.map((id) => availableIdeas.find((idea) => idea.id === id)).filter(Boolean);
  const savedProfessors = savedProfessorIds.map((id) => professors.find((professor) => professor.id === id)).filter(Boolean);
  const empty = ideas.length === 0 && savedProfessors.length === 0;

  return (
    <AppShell title="보관함" bottomNav={<BottomNav />}>
      <PageHeader eyebrow="저장한 결과" title="다시 보고 싶은 결과를 모았어요" description="저장 상태는 이 브라우저에 유지돼요." />
      {empty ? (
        <EmptyState
          image="/mvp-assets/robot-pose-3.png"
          title="아직 저장한 항목이 없어요"
          description="아이디어나 교수 카드의 저장 아이콘을 누르면 이곳에 모여요."
          action={<LinkButton href="/research">연구 주제 만들기</LinkButton>}
        />
      ) : (
        <>
          {ideas.length > 0 && <SectionHeading title={`아이디어 ${ideas.length}`} />}
          <div className="saved-list">
            {ideas.map((idea) => idea && <article key={idea.id}><span><Lightbulb size={19} /></span><div><Tag tone="violet">{idea.type}</Tag><h2>{idea.title}</h2><p>{idea.subtitle}</p><button type="button" className="saved-detail" onClick={() => { setSelectedIdea(idea.id); router.push("/passport"); }}>자세히 보기 <ChevronRight size={14} /></button></div><SaveButton saved onClick={() => toggleSavedIdea(idea.id)} label="아이디어 저장" /></article>)}
          </div>
          {savedProfessors.length > 0 && <SectionHeading title={`교수 ${savedProfessors.length}`} />}
          <div className="saved-list">
            {savedProfessors.map((professor) => professor && <article key={professor.id}><Image src={professor.portrait} alt="" width={52} height={52} /><div><Tag tone="mint">{professor.role}</Tag><h2>{professor.name}</h2><p>{professor.affiliation}</p><Link href={`/professors/${professor.id}`}>상세 보기 <ChevronRight size={14} /></Link></div><SaveButton saved onClick={() => toggleSavedProfessor(professor.id)} label="교수 저장" /></article>)}
          </div>
        </>
      )}
    </AppShell>
  );
}

export function ProfileScreen() {
  const router = useRouter();
  const profile = usePrototypeStore((state) => state.profile);
  const aiJourney = usePrototypeStore((state) => state.aiJourney);
  const updateProfile = usePrototypeStore((state) => state.updateProfile);
  const resetDemo = usePrototypeStore((state) => state.resetDemo);
  const [resetOpen, setResetOpen] = useState(false);

  const reset = () => {
    resetDemo();
    setResetOpen(false);
    router.replace("/");
  };

  return (
    <AppShell title="마이" bottomNav={<BottomNav />}>
      <PageHeader eyebrow="프로필" title="내 전공 DNA와 설정" description="프로필을 바꾸면 다음 여정에서 입력값으로 사용해요." />
      <Card className="profile-card">
        <div className="profile-avatar"><UserRound size={26} /></div>
        <label className="field-group"><span className="field-label">이름</span><input className="input" value={profile.name} onChange={(event) => updateProfile({ name: event.target.value })} /></label>
        <label className="field-group"><span className="field-label">학교</span><input className="input" value={profile.school} onChange={(event) => updateProfile({ school: event.target.value })} /></label>
      </Card>

      <SectionHeading title="전공 DNA 요약" />
      <Card className="profile-dna">
        <strong>{(aiJourney?.dna ?? dnaResult).axes.join(" × ")}</strong>
        <p>{profile.major || "전공 미입력"} · {profile.minor || "부전공 없음"} · {profile.grade}</p>
        <div className="tag-row">{profile.interests.slice(0, 5).map((item) => <Tag key={item}>{item}</Tag>)}</div>
      </Card>

      <SectionHeading title="데이터와 설정" />
      <StatusBanner icon={ShieldCheck} title="API 키는 서버에서만 사용해요" tone="success">분석할 때 입력 정보가 OpenAI API로 전송되며, 결과와 진행 상태는 이 브라우저에 저장돼요.</StatusBanner>
      <button type="button" className="reset-button" onClick={() => setResetOpen(true)}><RotateCcw size={18} /><span><strong>데모 초기화</strong><small>입력, 저장, 진행 상태를 처음으로 되돌려요.</small></span><ChevronRight size={18} /></button>
      <p className="app-version">너의 교수님은? Prototype v1.0</p>

      <BottomSheet
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="데모를 초기화할까요?"
        description="이 브라우저에 저장된 입력, 아이디어, 교수, 퀘스트 상태가 모두 초기화돼요."
        footer={<><SecondaryButton onClick={() => setResetOpen(false)}>취소</SecondaryButton><PrimaryButton onClick={reset}>초기화</PrimaryButton></>}
      >
        <StatusBanner icon={RotateCcw} title="되돌릴 수 없어요" tone="warning">필요한 내용이 있다면 초기화 전에 확인해 주세요.</StatusBanner>
      </BottomSheet>
    </AppShell>
  );
}
