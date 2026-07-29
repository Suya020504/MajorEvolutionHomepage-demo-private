"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Card, SectionHeading } from "@/components/app/primitives";
import { useQuestStore } from "@/store/quest-store";
import { useResearchStore } from "@/store/research-store";

/**
 * 내 기록 관리.
 *
 * 명세의 데이터·개인정보 항목을 만족하기 위해 종류별로 각각 삭제할 수 있어야 합니다.
 * 삭제 전에 범위와 되돌릴 수 없음을 알리고 명시적으로 확인받습니다.
 */

type Category = {
  id: string;
  label: string;
  describe: (count: number) => string;
  count: number;
  clear: () => void;
};

export function DataControls() {
  const matches = useResearchStore((state) => state.professorMatches);
  const knockKitDrafts = useResearchStore((state) => state.knockKitDrafts);
  const mentorLoopEntries = useResearchStore((state) => state.mentorLoopEntries);
  const clearProfessorMatches = useResearchStore((state) => state.clearProfessorMatches);
  const clearKnockKitDrafts = useResearchStore((state) => state.clearKnockKitDrafts);
  const clearMentorLoopEntries = useResearchStore((state) => state.clearMentorLoopEntries);
  const cards = useQuestStore((state) => state.cards);
  const clearCards = useQuestStore((state) => state.clearCards);

  const [pending, setPending] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const categories: Category[] = [
    {
      id: "matches",
      label: "교수 연결 결과",
      describe: (n) => `연결한 교수 ${n}명과 연결 근거`,
      count: matches.length,
      clear: clearProfessorMatches,
    },
    {
      id: "quest",
      label: "퀘스트 카드",
      describe: (n) => `첫마디·질문·논문 카드 ${n}장`,
      count: cards.length,
      clear: clearCards,
    },
    {
      id: "drafts",
      label: "메일 초안",
      describe: (n) => `저장한 면담 요청 초안 ${n}건`,
      count: Object.keys(knockKitDrafts).length,
      clear: clearKnockKitDrafts,
    },
    {
      id: "loops",
      label: "면담 메모",
      describe: (n) => `면담 피드백과 7일 행동 기록 ${n}건`,
      count: Object.keys(mentorLoopEntries).length,
      clear: clearMentorLoopEntries,
    },
  ];

  return (
    <>
      <SectionHeading
        title="내 기록 관리"
        description="종류별로 각각 지울 수 있습니다. 삭제한 기록은 되돌릴 수 없습니다."
      />
      <Card className="data-controls">
        {categories.map((category) => (
          <div key={category.id} className="data-controls__row">
            <div>
              <strong>{category.label}</strong>
              <p>{category.count === 0 ? "저장된 기록 없음" : category.describe(category.count)}</p>
            </div>
            {pending === category.id ? (
              <div className="quest-saved__confirm">
                <p>{category.label} {category.count}건을 모두 삭제합니다. 되돌릴 수 없습니다.</p>
                <div>
                  <button type="button" onClick={() => setPending(null)}>취소</button>
                  <button
                    type="button"
                    className="is-danger"
                    onClick={() => {
                      category.clear();
                      setPending(null);
                      setDone(`${category.label}을(를) 삭제했습니다.`);
                    }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="quest-saved__delete"
                disabled={category.count === 0}
                aria-label={`${category.label} 삭제`}
                onClick={() => {
                  setDone(null);
                  setPending(category.id);
                }}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </Card>
      {done && <p className="first-line-status" role="status">{done}</p>}
    </>
  );
}
