"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, CompassIcon, FlaskConical, GraduationCap, Home, MessagesSquare, TrendingUp, UserRound } from "lucide-react";
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { guideCharacter } from "@/lib/brand-assets";
import { useProfileStore } from "@/store/profile-store";

/**
 * 넓은 화면 좌측 내비.
 *
 * 와이어프레임의 데스크톱 사이드바를 그대로 옮긴 것으로, 모바일에서는 나타나지 않습니다.
 * 홈 다음에 두 사용자 여정을 순서대로 둡니다.
 * 1) 교수 매칭 → 교수 만남 준비
 * 2) AI 프로젝트 설계 → 맞춤 교수 추천
 * 마지막에는 두 여정에서 쌓인 기록을 돌아보는 성장 탭을 둡니다.
 */

export const NAV_ITEMS = [
  { href: "/home", section: "/home", label: "홈", shortLabel: "홈", icon: Home },
  { href: "/home?professor=quick", section: "/professors", label: "교수 매칭", shortLabel: "매칭", icon: CompassIcon },
  { href: "/quest", section: "/quest", label: "교수 만남 준비", shortLabel: "만남", icon: MessagesSquare },
  { href: "/home?project=quick", section: "/research", label: "AI 프로젝트 설계", shortLabel: "프로젝트", icon: FlaskConical },
  { href: "/project-professors", section: "/project-professors", label: "맞춤 교수 추천", shortLabel: "추천", icon: GraduationCap },
  { href: "/portfolio", section: "/portfolio", label: "나의 성장과정", shortLabel: "성장", icon: TrendingUp },
] as const;

const BOTTOM_NAV_GUIDE_STORAGE_KEY = "major-evolution-bottom-nav-guide-v1";

const NAV_GUIDE_STEPS = [
  {
    label: "홈",
    title: "오늘의 다음 행동을 먼저 확인해요",
    description: "진행 중인 교수 연결과 프로젝트, 최근 기록을 한눈에 이어볼 수 있어요.",
    anchor: "8.333%",
  },
  {
    label: "교수 매칭",
    title: "내 고민에서 첫 교수님을 찾아요",
    description: "고민을 정리한 뒤 학교 공식 정보를 근거로 대화할 교수님을 찾아요.",
    anchor: "25%",
  },
  {
    label: "교수 만남 준비",
    title: "첫 대화를 차근차근 준비해요",
    description: "첫 질문과 이메일부터 면담 후 기록까지 한 흐름으로 준비할 수 있어요.",
    anchor: "41.667%",
  },
  {
    label: "AI 프로젝트 설계",
    title: "관심사를 실행할 프로젝트로 만들어요",
    description: "AI와 질문을 주고받으며 수업·프로젝트·연구 아이디어를 구체화해요.",
    anchor: "58.333%",
  },
  {
    label: "맞춤 교수 추천",
    title: "프로젝트에 필요한 교수님을 연결해요",
    description: "설계한 주제와 방법을 기준으로 프로젝트 실행에 어울리는 교수님을 찾아요.",
    anchor: "75%",
  },
  {
    label: "나의 성장과정",
    title: "지금까지의 변화를 기록으로 남겨요",
    description: "교수 연결, 프로젝트, AI 교수님과 나눈 생각을 나만의 성장 흐름으로 모아요.",
    anchor: "91.667%",
  },
] as const;

/** /result와 /co-design은 만들다 흐름의 일부이므로 같은 항목을 활성으로 봅니다. */
const SECTION_PREFIX: Record<string, string> = {
  "/research": "/research",
  "/co-design": "/research",
  "/result": "/research",
  "/quest": "/quest",
  "/mentor-loop": "/quest",
  "/paper": "/quest",
  "/professors": "/professors",
  "/project-professors": "/project-professors",
  "/portfolio": "/portfolio",
  "/profile": "/profile",
  // 공개 랜딩은 루트, 로그인 후 통합 홈은 /home에 있습니다.
  "/home": "/home",
  "/mentoring": "/home",
};

function activeHref(pathname: string): string | null {
  const segment = `/${pathname.split("/")[1] ?? ""}`;
  return SECTION_PREFIX[segment] ?? null;
}

type NavigationJourney = {
  key: "professor" | "project";
  label: string;
  step: 1 | 2;
};

function navigationJourney(section: string): NavigationJourney | null {
  if (section === "/professors") return { key: "professor", label: "교수 연결 여정", step: 1 };
  if (section === "/quest") return { key: "professor", label: "교수 연결 여정", step: 2 };
  if (section === "/research") return { key: "project", label: "프로젝트 여정", step: 1 };
  if (section === "/project-professors") return { key: "project", label: "프로젝트 여정", step: 2 };
  return null;
}

export function ServiceBottomNav() {
  const pathname = usePathname() ?? "";
  const active = activeHref(pathname);
  const professorJourneyActive = active === "/professors" || active === "/quest";
  const projectJourneyActive = active === "/research" || active === "/project-professors";
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideStep, setGuideStep] = useState(0);
  const guide = NAV_GUIDE_STEPS[guideStep];

  const finishGuide = useCallback(() => {
    try {
      window.localStorage.setItem(BOTTOM_NAV_GUIDE_STORAGE_KEY, "complete");
    } catch {
      // 저장이 제한된 환경에서도 현재 세션의 안내는 정상적으로 닫습니다.
    }
    setGuideOpen(false);
  }, []);

  useEffect(() => {
    if (pathname !== "/home") {
      setGuideOpen(false);
      return;
    }

    const mobileViewport = window.matchMedia("(max-width: 1023px)");
    const syncGuideVisibility = () => {
      let hasCompletedGuide = false;
      try {
        hasCompletedGuide = window.localStorage.getItem(BOTTOM_NAV_GUIDE_STORAGE_KEY) === "complete";
      } catch {
        // 저장소를 읽을 수 없으면 이번 방문에는 안내를 제공합니다.
      }

      const isPlainHome = window.location.search.length === 0;
      if (mobileViewport.matches && isPlainHome && !hasCompletedGuide) {
        setGuideStep(0);
        setGuideOpen(true);
      } else {
        setGuideOpen(false);
      }
    };

    syncGuideVisibility();
    mobileViewport.addEventListener("change", syncGuideVisibility);
    return () => mobileViewport.removeEventListener("change", syncGuideVisibility);
  }, [pathname]);

  useEffect(() => {
    if (!guideOpen) return;
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") finishGuide();
    };
    window.addEventListener("keydown", closeWithEscape);
    return () => window.removeEventListener("keydown", closeWithEscape);
  }, [finishGuide, guideOpen]);

  useEffect(() => {
    if (!guideOpen) return;
    document.documentElement.setAttribute("data-service-nav-guide-open", "true");
    return () => document.documentElement.removeAttribute("data-service-nav-guide-open");
  }, [guideOpen]);

  const goToNextGuideStep = () => {
    if (guideStep === NAV_GUIDE_STEPS.length - 1) {
      finishGuide();
      return;
    }
    setGuideStep((current) => current + 1);
  };

  return (
    <nav
      className={[
        "service-bottom-nav",
        professorJourneyActive ? "has-active-professor-journey" : "",
        projectJourneyActive ? "has-active-project-journey" : "",
        guideOpen ? "is-guiding" : "",
      ].filter(Boolean).join(" ")}
      aria-label="모바일 주요 메뉴"
    >
      {NAV_ITEMS.map((item, index) => {
        const Icon = item.icon;
        const isActive = active === item.section;
        const journey = navigationJourney(item.section);
        const isGuideTarget = guideOpen && guideStep === index;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              isActive ? "is-active" : "",
              journey ? "is-journey" : "",
              journey ? `is-${journey.key}-journey` : "",
              journey?.step === 1 ? "is-journey-start" : "",
              journey?.step === 2 ? "is-journey-end" : "",
              journey?.key === "project" && journey.step === 1 ? "is-project-journey-start" : "",
              journey?.key === "professor" && journey.step === 1 ? "is-professor-journey-start" : "",
              isGuideTarget ? "is-guide-target" : "",
            ].filter(Boolean).join(" ") || undefined}
            aria-current={isActive ? "page" : undefined}
            aria-label={journey ? `${item.label}, ${journey.label} ${journey.step}단계` : item.label}
            aria-describedby={isGuideTarget ? "bottom-nav-guide-description" : undefined}
            onClick={() => {
              if (guideOpen) setGuideOpen(false);
            }}
          >
            <Icon size={21} aria-hidden="true" />
            <span>{item.shortLabel}</span>
          </Link>
        );
      })}
      {guideOpen ? (
        <aside
          key={guide.label}
          className="service-bottom-nav__guide"
          style={{ "--nav-guide-anchor": guide.anchor } as CSSProperties}
          role="dialog"
          aria-modal="false"
          aria-label="하단 메뉴 사용 가이드"
          aria-live="polite"
        >
          <button
            type="button"
            className="service-bottom-nav__guide-skip"
            onClick={finishGuide}
          >
            건너뛰기
          </button>
          <div className="service-bottom-nav__guide-message">
            <span className="service-bottom-nav__guide-mascot" aria-hidden="true">
              <Image
                src={guideCharacter.connectOpener}
                alt=""
                width={96}
                height={96}
                priority
              />
            </span>
            <div className="service-bottom-nav__guide-copy">
              <span>{guideStep + 1} / {NAV_GUIDE_STEPS.length} · {guide.label}</span>
              <strong>{guide.title}</strong>
              <p id="bottom-nav-guide-description">{guide.description}</p>
            </div>
          </div>
          <div className="service-bottom-nav__guide-footer">
            <div
              className="service-bottom-nav__guide-progress"
              aria-label={`${NAV_GUIDE_STEPS.length}단계 중 ${guideStep + 1}단계`}
            >
              {NAV_GUIDE_STEPS.map((step, index) => (
                <span
                  key={step.label}
                  className={index === guideStep ? "is-current" : index < guideStep ? "is-complete" : undefined}
                  aria-hidden="true"
                />
              ))}
            </div>
            <div className="service-bottom-nav__guide-actions">
              {guideStep > 0 ? (
                <button type="button" onClick={() => setGuideStep((current) => current - 1)}>
                  이전
                </button>
              ) : null}
              <button type="button" className="is-primary" onClick={goToNextGuideStep} autoFocus>
                {guideStep === NAV_GUIDE_STEPS.length - 1 ? "시작하기" : "다음"}
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        </aside>
      ) : null}
    </nav>
  );
}

export function SideNav() {
  const pathname = usePathname() ?? "";
  const active = activeHref(pathname);
  const hasProfileHydrated = useProfileStore((state) => state.hasHydrated);
  const hasEnteredService = useProfileStore((state) => state.hasEnteredService);
  const markServiceEntered = useProfileStore((state) => state.markServiceEntered);
  const profile = useProfileStore((state) => state.profile);

  useEffect(() => {
    if (hasProfileHydrated && !hasEnteredService) markServiceEntered();
  }, [hasEnteredService, hasProfileHydrated, markServiceEntered]);

  return (
    <nav className="side-nav" aria-label="주요 메뉴">
      <BrandLogo
        href="/home"
        tagline="찾다 · 준비하다 · 이어가다"
        compact
        className="side-nav__brand"
      />
      <ul>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.section;
          const journey = navigationJourney(item.section);
          return (
            <li
              key={item.href}
              className={journey
                ? `side-nav__journey-item side-nav__journey-item--${journey.key} side-nav__journey-item--step-${journey.step}`
                : undefined}
            >
              {journey?.step === 1 ? (
                <span className="side-nav__journey-label" aria-hidden="true">{journey.label}</span>
              ) : null}
              <Link
                href={item.href}
                className={isActive ? "is-active" : undefined}
                aria-current={isActive ? "page" : undefined}
                aria-label={journey ? `${item.label}, ${journey.label} ${journey.step}단계` : undefined}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
                {journey ? (
                  <span className="side-nav__journey-step" aria-hidden="true">{journey.step}/2</span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="side-nav__footer">
        <p className="side-nav__note">연락과 면담은 학생이 직접 진행합니다.</p>
        <Link
          href="/profile"
          className={`side-nav__profile${active === "/profile" ? " is-active" : ""}`}
          aria-current={active === "/profile" ? "page" : undefined}
        >
          <span className="side-nav__avatar" aria-hidden="true">
            {profile.name ? profile.name.slice(0, 1) : <UserRound size={18} />}
          </span>
          <span className="side-nav__profile-copy">
            <strong>{profile.name ? `${profile.name}님` : "내 정보 설정"}</strong>
            <small>{profile.major || "이 기기에 내 정보 저장"}</small>
          </span>
          <ChevronRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </nav>
  );
}
