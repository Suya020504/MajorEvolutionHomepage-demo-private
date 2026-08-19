"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CompassIcon, FlaskConical, Home, MessagesSquare, NotebookPen } from "lucide-react";
import { brandLogo } from "@/lib/brand-assets";

/**
 * 넓은 화면 좌측 내비.
 *
 * 와이어프레임의 데스크톱 사이드바를 그대로 옮긴 것으로, 모바일에서는 나타나지 않습니다.
 * 핵심 3기능을 같은 무게로 나열하고 나의 여정을 마지막에 둡니다.
 */

const NAV_ITEMS = [
  { href: "/home", label: "홈", icon: Home },
  { href: "/professors", label: "나의 교수님", icon: CompassIcon },
  { href: "/research", label: "전공 진화 실험실", icon: FlaskConical },
  { href: "/quest", label: "교수님 퀘스트", icon: MessagesSquare },
  { href: "/portfolio", label: "나의 여정", icon: NotebookPen },
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
      <Link href="/home" className="side-nav__brand">
        <Image src={brandLogo.mark} alt="" aria-hidden="true" width={34} height={34} unoptimized />
        <span>
          <strong>너의 교수님은?</strong>
          <small>찾다 · 만들다 · 잇다</small>
        </span>
      </Link>
      <ul>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.href;
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
