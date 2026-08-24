"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ResearchTutorialScreen } from "@/components/tutorial/research-tutorial-screen";
import styles from "./home-dashboard.module.css";

type ProjectQuickStartOverlayProps = {
  onClose: () => void;
};

export function ProjectQuickStartOverlay({ onClose }: ProjectQuickStartOverlayProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mounted, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={styles.quickOverlayBackdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={styles.quickOverlayDialog}
        role="dialog"
        aria-modal="true"
        aria-label="프로젝트 빠른 시작"
        tabIndex={-1}
      >
        <ResearchTutorialScreen presentation="overlay" onRequestClose={onClose} />
      </div>
    </div>,
    document.body,
  );
}
