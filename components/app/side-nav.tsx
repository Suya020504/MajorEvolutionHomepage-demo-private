"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CompassIcon, FlaskConical, Home, MessagesSquare, NotebookPen } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";

/**
 * 넓은 화면 좌측 내비.
 *
 * 와이어프레임의 데스크톱 사이드바를 그대로 옮긴 것으로, 모바일에서는 나타나지 않습니다.
 * 핵심 3기능을 같은 무게로 나열하고 나의 여정을 마지막에 둡니다.
 */

const NAV_ITEMS = [
  { href: "/home", section: "/home", label: "홈", icon: Home },
  { href: "/professors", section: "/professors", label: "교수 찾기", icon: CompassIcon },
  { href: "/research/tutorial", section: "/research", label: "전공 아이디어", icon: FlaskConical },
  { href: "/quest", section: "/quest", label: "대화 준비", icon: MessagesSquare },
  { href: "/portfolio", section: "/portfolio", label: "성장 기록", icon: NotebookPen },
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
  "/portfolio": "/portfolio",
  // 공개 랜딩은 루트, 로그인 후 통합 홈은 /home에 있습니다.
  "/home": "/home",
  "/mentoring": "/home",
};

function activeHref(pathname: string): string | null {
  const segment = `/${pathname.split("/")[1] ?? ""}`;
  return SECTION_PREFIX[segment] ?? null;
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
