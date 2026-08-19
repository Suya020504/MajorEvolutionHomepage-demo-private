"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  CalendarCheck2,
  CheckCircle2,
  Compass,
  FileCheck2,
  FileText,
  FlaskConical,
  Mail,
  Menu,
  MessageCircleQuestion,
  Route,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";
import { brandLogo, brandScene } from "@/lib/brand-assets";
import styles from "./landing-page.module.css";

const NAV_ITEMS = [
  { href: "#about", label: "서비스 소개" },
  { href: "#solution", label: "해결 방식" },
  { href: "#flow", label: "이용 흐름" },
  { href: "#trust", label: "신뢰 원칙" },
] as const;

const PROBLEMS = [
  {
    icon: MessageCircleQuestion,
    title: "고민을 어떻게 설명할지 막막해요",
    description: "관심은 있지만 진로, 수업, 프로젝트 중 무엇부터 물어야 할지 정리하기 어렵습니다.",
  },
  {
    icon: SearchCheck,
    title: "누구에게 왜 물어볼지 모르겠어요",
    description: "교수 정보는 많아도 내 고민과 어떤 연결점이 있는지 한눈에 알기 어렵습니다.",
  },
  {
    icon: Route,
    title: "조언이 다음 행동으로 이어지지 않아요",
    description: "좋은 이야기를 들어도 수업 선택이나 프로젝트 시작으로 옮길 구체적인 계획이 남지 않습니다.",
  },
] as const;

const FLOW = [
  {
    number: "01",
    title: "고민을 정리하다",
    description:
      "긴 신청서 대신 한 번에 한 질문씩 답합니다. 3분 동안 전공·진로 고민과 지금 필요한 도움을 한 문장으로 정리해요.",
    points: ["질문 하나씩 진행", "기본 분석 후 심층 분석 선택", "답은 언제든 수정 가능"],
    image: brandScene.home.w1440,
    alt: "학생과 AI 가이드가 캠퍼스에서 전공과 진로 방향을 정리하는 장면",
  },
  {
    number: "02",
    title: "근거로 교수를 찾다",
    description:
      "학교와 학과의 공식 정보를 바탕으로, 순위가 아니라 지금 필요한 대화 역할이 다른 교수 연결을 제안합니다.",
    points: ["학교 공식 정보와 출처", "연결 이유와 직접 확인할 점", "궁합 점수·교수 순위 없음"],
    image: brandScene.find.w1440,
    alt: "학생이 학교 공식 정보를 바탕으로 교수 연결 이유를 살펴보는 장면",
  },
  {
    number: "03",
    title: "첫 대화와 다음 행동을 잇다",
    description:
      "교수 정보를 읽는 데서 끝내지 않습니다. 첫 질문과 연락 초안을 준비하고, 면담에서 얻은 조언을 다음 행동으로 바꿔요.",
    points: ["논문 한입과 첫 질문", "학생이 검토하는 이메일 초안", "면담 후 7일 행동"],
    image: brandScene.connect.w1440,
    alt: "학생이 교수와 대화를 준비하고 다음 행동을 연결하는 장면",
  },
] as const;

const OUTCOMES = [
  {
    icon: Compass,
    title: "교수 연결 이유",
    description: "내 고민과 교수의 공개 분야가 어디서 만나는지 핵심만 확인합니다.",
  },
  {
    icon: FileText,
    title: "논문 한입 메모",
    description: "원문이 있을 때 문제·방법·결과·한계를 내 질문과 연결해 읽습니다.",
  },
  {
    icon: Mail,
    title: "첫 질문과 이메일 초안",
    description: "예의를 갖춘 초안을 만들고 내가 검토·수정한 뒤 직접 사용합니다.",
  },
  {
    icon: CalendarCheck2,
    title: "면담 후 7일 행동",
    description: "수업·프로젝트·진로 중 바로 실행할 작은 행동을 기록합니다.",
  },
] as const;

const AUDIENCES = [
  { icon: Compass, title: "진로 방향", copy: "내 전공으로 가능한 선택을 교수와 점검하고 싶을 때" },
  { icon: BookOpen, title: "수업 선택", copy: "관심 분야를 위해 어떤 수업부터 들을지 궁금할 때" },
  { icon: BriefcaseBusiness, title: "프로젝트", copy: "작은 경험으로 내 관심과 적성을 시험해 보고 싶을 때" },
  { icon: FlaskConical, title: "연구·대학원", copy: "연구실과 대학원 생활을 현실적으로 알아보고 싶을 때" },
] as const;

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.logo} aria-label="너의 교수님은? 첫 화면">
            <Image src={brandLogo.lockup} alt="너의 교수님은?" width={186} height={30} priority unoptimized />
          </Link>

          <nav className={styles.desktopNav} aria-label="랜딩페이지 주요 메뉴">
            {NAV_ITEMS.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>

          <div className={styles.headerActions}>
            <Link href="/home" className={styles.resumeLink}>
              이어하기
            </Link>
            <Link href="/professors" className={styles.headerCta}>
              3분 방향 찾기
            </Link>
          </div>

          <button
            type="button"
            className={styles.menuButton}
            aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={menuOpen}
            aria-controls="landing-mobile-menu"
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen && (
          <nav id="landing-mobile-menu" className={styles.mobileMenu} aria-label="모바일 메뉴">
            {NAV_ITEMS.map((item) => (
              <a key={item.href} href={item.href} onClick={closeMenu}>
                {item.label}
              </a>
            ))}
            <Link href="/home" onClick={closeMenu}>
              이어하기
            </Link>
            <Link href="/professors" className={styles.mobileMenuCta} onClick={closeMenu}>
              3분 방향 찾기 <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </nav>
        )}
      </header>

      <main id="main-content">
        <section className={styles.hero} aria-labelledby="landing-title">
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <h1 id="landing-title">
                막막한 전공·진로 고민,
                <br />
                이제 <em>누구와 이야기할지</em>부터 찾으세요.
              </h1>
              <p>
                고민을 정리하고, 학교 공식 정보로 교수를 찾고,
                <br className={styles.desktopBreak} /> 첫 질문과 다음 행동까지 준비합니다.
              </p>
              <div className={styles.heroActions}>
                <Link href="/professors" className={styles.primaryCta}>
                  3분 방향 찾기 <ArrowRight size={19} aria-hidden="true" />
                </Link>
                <a href="#flow" className={styles.secondaryCta}>
                  서비스 흐름 보기 <ArrowRight size={18} aria-hidden="true" />
                </a>
              </div>
              <div className={styles.trustNote}>
                <ShieldCheck size={18} aria-hidden="true" />
                <span>학교 공식 정보 기반 · 교수에게 자동으로 연락하지 않아요</span>
              </div>
            </div>

            <div className={styles.heroMedia}>
              <Image
                src={brandScene.home.w1920 ?? brandScene.home.w1440}
                alt="학생과 AI 가이드가 캠퍼스에서 교수 연결과 다음 행동을 탐색하는 모습"
                fill
                priority
                sizes="(max-width: 767px) 100vw, 54vw"
              />
            </div>
          </div>
          <a href="#about" className={styles.scrollCue} aria-label="서비스 문제 설명으로 이동">
            <span>왜 필요한가요?</span>
            <span className={styles.scrollLine} aria-hidden="true" />
          </a>
        </section>

        <section id="about" className={styles.problemSection} aria-labelledby="problem-title">
          <div className={styles.sectionInner}>
            <div className={styles.problemIntro}>
              <h2 id="problem-title">
                교수 정보는 많지만,
                <br />
                <em>첫 대화까지 가는 길</em>은 흩어져 있습니다.
              </h2>
              <p>
                학생에게 부족한 것은 검색 결과보다, 내 고민을 설명하고 적절한 사람에게 질문한 뒤
                행동으로 옮기는 과정입니다.
              </p>
            </div>

            <div className={styles.problemList}>
              {PROBLEMS.map((problem) => {
                const Icon = problem.icon;
                return (
                  <article key={problem.title}>
                    <span className={styles.problemIcon} aria-hidden="true">
                      <Icon size={23} />
                    </span>
                    <div>
                      <h3>{problem.title}</h3>
                      <p>{problem.description}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="solution" className={styles.promiseSection} aria-labelledby="promise-title">
          <div className={styles.promiseInner}>
            <Sparkles size={28} aria-hidden="true" />
            <h2 id="promise-title">
              그래서 검색이 아니라,
              <br />
              <em>대화를 시작하는 과정</em>을 설계했습니다.
            </h2>
            <p>AI는 고민과 근거를 정리하고, 진짜 방향 설계는 교수와의 대화에서 시작됩니다.</p>
          </div>
        </section>

        <section id="flow" className={styles.flowSection} aria-labelledby="flow-title">
          <div className={styles.sectionInner}>
            <div className={styles.sectionHeading}>
              <h2 id="flow-title">처음 와도, 다음 할 일이 한눈에 보여요.</h2>
              <p>고민을 입력하는 순간부터 첫 대화 이후까지 하나의 흐름으로 이어집니다.</p>
            </div>

            <div className={styles.flowList}>
              {FLOW.map((step, index) => (
                <article key={step.number} className={styles.flowItem}>
                  <div className={styles.flowCopy}>
                    <span className={styles.flowNumber}>{step.number}</span>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                    <ul>
                      {step.points.map((point) => (
                        <li key={point}>
                          <CheckCircle2 size={17} aria-hidden="true" /> {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <figure className={styles.flowMedia}>
                    <Image
                      src={step.image}
                      alt={step.alt}
                      fill
                      sizes="(max-width: 767px) 100vw, 58vw"
                      loading={index === 0 ? "eager" : "lazy"}
                    />
                  </figure>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.outcomeSection} aria-labelledby="outcome-title">
          <div className={styles.sectionInner}>
            <div className={styles.outcomeHeading}>
              <div>
                <h2 id="outcome-title">
                  첫 매칭 이후,
                  <br />
                  <em>이런 준비</em>까지 할 수 있어요.
                </h2>
                <p>모든 결과는 내가 확인하고 수정할 수 있습니다.</p>
              </div>
              <figure className={styles.outcomeMedia}>
                <Image
                  src={brandScene.paperBite.w1440}
                  alt="학생과 AI 가이드가 교수의 공개 논문 정보를 읽고 질문을 준비하는 모습"
                  fill
                  sizes="(max-width: 767px) 100vw, 43vw"
                />
              </figure>
            </div>

            <div className={styles.outcomeRail}>
              {OUTCOMES.map((outcome, index) => {
                const Icon = outcome.icon;
                return (
                  <article key={outcome.title}>
                    <span className={styles.outcomeIndex}>{index + 1}</span>
                    <span className={styles.outcomeIcon} aria-hidden="true">
                      <Icon size={25} />
                    </span>
                    <h3>{outcome.title}</h3>
                    <p>{outcome.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="trust" className={styles.trustSection} aria-labelledby="trust-title">
          <div className={styles.trustInner}>
            <div className={styles.trustHeading}>
              <ShieldCheck size={31} aria-hidden="true" />
              <h2 id="trust-title">
                AI는 답을 대신하지 않고,
                <br />
                사람과의 <em>대화를 준비합니다.</em>
              </h2>
            </div>

            <div className={styles.trustGrid}>
              <article>
                <FileCheck2 size={24} aria-hidden="true" />
                <h3>공식 출처와 확인일</h3>
                <p>학과·대학·연구실 등 확인 가능한 출처와 마지막 확인 시점을 함께 보여줍니다.</p>
              </article>
              <article>
                <SearchCheck size={24} aria-hidden="true" />
                <h3>사실과 질문을 분리</h3>
                <p>확인된 정보와 교수에게 직접 물어봐야 할 최신 정보를 구분합니다.</p>
              </article>
              <article>
                <Mail size={24} aria-hidden="true" />
                <h3>학생이 직접 연락</h3>
                <p>초안은 사용자가 검토·수정하며, 최종 연락과 선택은 학생이 직접 진행합니다.</p>
              </article>
            </div>
          </div>
        </section>

        <section className={styles.audienceSection} aria-labelledby="audience-title">
          <div className={styles.sectionInner}>
            <div className={styles.sectionHeading}>
              <h2 id="audience-title">지금 고민의 모양이 달라도 시작할 수 있어요.</h2>
              <p>연구만을 위한 서비스가 아닙니다. 대학생활에서 방향을 정해야 하는 순간을 함께 다룹니다.</p>
            </div>
            <div className={styles.audienceList}>
              {AUDIENCES.map((audience) => {
                const Icon = audience.icon;
                return (
                  <article key={audience.title}>
                    <Icon size={22} aria-hidden="true" />
                    <div>
                      <h3>{audience.title}</h3>
                      <p>{audience.copy}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className={styles.closingSection} aria-labelledby="closing-title">
          <div className={styles.closingInner}>
            <div className={styles.closingCopy}>
              <h2 id="closing-title">
                혼자 고민하던 시간을,
                <br />
                <em>첫 대화의 시작</em>으로 바꿔보세요.
              </h2>
              <p>가입 없이 3분이면 기본 방향과 첫 교수 연결을 확인할 수 있어요.</p>
              <div className={styles.closingActions}>
                <Link href="/professors" className={styles.primaryCta}>
                  3분 방향 찾기 <ArrowRight size={19} aria-hidden="true" />
                </Link>
                <Link href="/home" className={styles.closingResume}>
                  이미 이어서 하고 있어요 <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </div>
            <figure className={styles.closingMedia}>
              <Image
                src={brandScene.nextSeed.w1440}
                alt="학생이 교수와의 대화 후 다음 행동 계획을 세우는 모습"
                fill
                sizes="(max-width: 767px) 100vw, 58vw"
              />
            </figure>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <Image src={brandLogo.wordmarkMonoWhite} alt="너의 교수님은?" width={154} height={30} unoptimized />
            <p>대학생의 고민과 교수의 전문성을 첫 대화로 연결합니다.</p>
          </div>
          <nav aria-label="푸터 메뉴">
            <a href="#about">서비스 소개</a>
            <a href="#flow">이용 흐름</a>
            <a href="#trust">신뢰 원칙</a>
            <Link href="/home">서비스 홈</Link>
          </nav>
          <p className={styles.footerNote}>교수 정보는 공식 출처를 우선하며, 연락과 최종 선택은 학생이 직접 진행합니다.</p>
        </div>
      </footer>
    </div>
  );
}
