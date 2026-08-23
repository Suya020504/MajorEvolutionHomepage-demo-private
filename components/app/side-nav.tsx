"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, CompassIcon, FlaskConical, GraduationCap, Home, MessagesSquare, TrendingUp, UserRound } from "lucide-react";
import { useEffect } from "react";
import { BrandLogo } from "@/components/brand/brand-logo";
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

  return (
    <nav
      className={[
        "service-bottom-nav",
        professorJourneyActive ? "has-active-professor-journey" : "",
        projectJourneyActive ? "has-active-project-journey" : "",
      ].filter(Boolean).join(" ")}
      aria-label="모바일 주요 메뉴"
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.section;
        const journey = navigationJourney(item.section);
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
            ].filter(Boolean).join(" ") || undefined}
            aria-current={isActive ? "page" : undefined}
            aria-label={journey ? `${item.label}, ${journey.label} ${journey.step}단계` : item.label}
          >
            <Icon size={21} aria-hidden="true" />
            <span>{item.shortLabel}</span>
          </Link>
        );
      })}
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
