import { BookOpenCheck, FileSearch, Mail, Upload } from "lucide-react";

const PAPER_READING_STEPS = [
  {
    number: 1,
    label: "논문 선택",
    description: "관심 교수님의 공식 목록",
    icon: BookOpenCheck,
  },
  {
    number: 2,
    label: "3분 카드",
    description: "초록·본문 핵심 정리",
    icon: FileSearch,
  },
  {
    number: 3,
    label: "PDF 해설",
    description: "원문 읽기·요약·질문",
    icon: Upload,
  },
  {
    number: 4,
    label: "컨택 메일",
    description: "요약 근거로 초안 작성",
    icon: Mail,
  },
] as const;

export function PaperReadingSteps({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    <nav className="paper-reading-steps" aria-label="논문 읽기 4단계">
      <ol>
        {PAPER_READING_STEPS.map((step) => {
          const Icon = step.icon;
          const state = step.number < current
            ? "complete"
            : step.number === current ? "current" : "upcoming";
          return (
            <li
              key={step.number}
              className={`is-${state}`}
              aria-current={state === "current" ? "step" : undefined}
            >
              <span className="paper-reading-steps__icon">
                <Icon size={17} aria-hidden="true" />
              </span>
              <span className="paper-reading-steps__copy">
                <small>{step.number}단계</small>
                <strong>{step.label}</strong>
                <em>{step.description}</em>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
