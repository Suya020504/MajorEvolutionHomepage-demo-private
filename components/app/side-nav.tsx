"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CompassIcon, FlaskConical, GraduationCap, Home, MessagesSquare } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";

/**
 * 넓은 화면 좌측 내비.
 *
 * 와이어프레임의 데스크톱 사이드바를 그대로 옮긴 것으로, 모바일에서는 나타나지 않습니다.
 * 홈 다음에 두 사용자 여정을 순서대로 둡니다.
 * 1) 교수 매칭 → 교수 만남 연계
 * 2) AI 프로젝트 설계 → 맞춤 교수 추천
 */

export const NAV_ITEMS = [
  { href: "/home", section: "/home", label: "홈", shortLabel: "홈", icon: Home },
  { href: "/professors", section: "/professors", label: "교수 매칭", shortLabel: "매칭", icon: CompassIcon },
  { href: "/quest", section: "/quest", label: "교수 만남 연계", shortLabel: "만남", icon: MessagesSquare },
  { href: "/research/tutorial", section: "/research", label: "AI 프로젝트 설계", shortLabel: "프로젝트", icon: FlaskConical },
  { href: "/project-professors", section: "/project-professors", label: "맞춤 교수 추천", shortLabel: "추천", icon: GraduationCap },
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
  // 성장 기록은 홈의 재방문·관리 기능으로 남기므로 홈을 활성으로 표시합니다.
  "/portfolio": "/home",
  // 공개 랜딩은 루트, 로그인 후 통합 홈은 /home에 있습니다.
  "/home": "/home",
  "/mentoring": "/home",
};

function activeHref(pathname: string): string | null {
  const segment = `/${pathname.split("/")[1] ?? ""}`;
  return SECTION_PREFIX[segment] ?? null;
}

export function ServiceBottomNav() {
  const pathname = usePathname() ?? "";
  const active = activeHref(pathname);

  return (
    <nav className="service-bottom-nav" aria-label="모바일 주요 메뉴">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.section;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={isActive ? "is-active" : undefined}
            aria-current={isActive ? "page" : undefined}
            aria-label={item.label}
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
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={isActive ? "is-active" : undefined}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon size={18} aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="side-nav__note">연락과 면담은 학생이 직접 진행합니다.</p>
    </nav>
  );
}
