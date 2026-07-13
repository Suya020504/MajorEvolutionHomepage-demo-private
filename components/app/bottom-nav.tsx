"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Compass, Home, ListChecks, UserRound } from "lucide-react";
import { cx } from "@/components/app/primitives";

const items = [
  { href: "/home", label: "홈", icon: Home },
  { href: "/explore", label: "탐색", icon: Compass },
  { href: "/quest", label: "실행", icon: ListChecks },
  { href: "/saved", label: "보관함", icon: Bookmark },
  { href: "/profile", label: "마이", icon: UserRound },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="bottom-nav" aria-label="주요 메뉴">
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href === "/quest" && pathname.startsWith("/quest"));
        return (
          <Link key={href} href={href} className={cx("bottom-nav__item", active && "is-active")} aria-current={active ? "page" : undefined}>
            <Icon size={21} strokeWidth={active ? 2.4 : 1.8} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
