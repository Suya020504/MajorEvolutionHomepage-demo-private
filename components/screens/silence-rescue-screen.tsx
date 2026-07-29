"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  LoaderCircle,
  MicOff,
  Plus,
  Trash2,
  WifiOff,
} from "lucide-react";
import {
  AppShell,
  Card,
  ChoiceChip,
  PageHeader,
  PrimaryButton,
  SectionHeading,
  StatusBanner,
  Tag,
} from "@/components/app/primitives";
import { useQuestContext } from "@/lib/quest-context";
import { cardsForTool, useQuestStore } from "@/store/quest-store";

/**
 * Q-03 침묵 구조대.
 *
 * 대화가 끊겼을 때 꺼내 볼 질문을 미리 저장해 두고, 현장에서 큰 글자로 조용히 확인합니다.
 * 마이크·녹음·실시간 면담 분석은 이 화면에 존재하지 않습니다.
 * 저장된 질문은 localStorage에 있으므로 오프라인에서도 열립니다.
 */

const CATEGORIES = [
  { id: "논문", placeholder: "예) 이 결과를 학부 수준에서 확인하려면 무엇부터 봐야 할까요?" },
  { id: "진로", placeholder: "예) 이 분야로 가려면 지금 학년에서 무엇을 준비하면 좋을까요?" },
  { id: "다음 행동", placeholder: "예) 다음에 뵐 때 무엇을 준비해 오면 좋을까요?" },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

export function SilenceRescueScreen() {
  const hasHydrated = useQuestStore((state) => state.hasHydrated);
  const cards = useQuestStore((state) => state.cards);
  const saveCard = useQuestStore((state) => state.saveCard);
  const deleteCard = useQuestStore((state) => state.deleteCard);
  const { topic, match } = useQuestContext();

  const [mode, setMode] = useState<"prepare" | "live">("prepare");
  const [category, setCategory] = useState<CategoryId>("논문");
  const [text, setText] = useState("");
  const [index, setIndex] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  if (!hasHydrated) {
    return (
      <div className="research-loading">
        <LoaderCircle className="spin" />
        <p>저장된 질문 카드를 불러오고 있어요.</p>
      </div>
    );
  }

  const saved = cardsForTool(cards, "silence-rescue");
  const current = saved[Math.min(index, Math.max(0, saved.length - 1))];

  const addQuestion = () => {
    const body = text.trim();
    if (!body) return;
    saveCard({
      tool: "silence-rescue",
      title: category,
      body,
      professorId: match?.professor.id ?? null,
      topicId: topic?.id ?? null,
    });
    setText("");
  };

  if (mode === "live") {
    return (
      <AppShell title="침묵 구조대" onBack={() => setMode("prepare")} className="silence-live-screen">
        {saved.length === 0 ? (
          <Card className="official-professor-empty">
            <CircleAlert size={26} />
            <h2>저장한 질문이 없어요</h2>
            <p>준비 화면에서 질문을 먼저 저장해 주세요.</p>
            <PrimaryButton onClick={() => setMode("prepare")}>질문 준비하기</PrimaryButton>
          </Card>
        ) : (
          <div className="silence-live">
            <p className="silence-live__meta">
              {index + 1} / {saved.length} · {current.title}
            </p>
            <p className="silence-live__question">{current.body}</p>
            <div className="silence-live__nav">
              <button
                type="button"
                aria-label="이전 질문"
                disabled={index === 0}
                onClick={() => setIndex((n) => Math.max(0, n - 1))}
              >
                <ChevronLeft size={28} />
              </button>
              <button
                type="button"
                aria-label="다음 질문"
                disabled={index >= saved.length - 1}
                onClick={() => setIndex((n) => Math.min(saved.length - 1, n + 1))}
              >
                <ChevronRight size={28} />
              </button>
            </div>
            <p className="silence-live__note">
              <WifiOff size={14} aria-hidden="true" /> 저장된 질문이라 인터넷 없이도 열립니다.
            </p>
          </div>
        )}
      </AppShell>
    );
  }

  return (
    <AppShell title="침묵 구조대" backHref="/quest" className="silence-rescue-screen">
      <PageHeader
        eyebrow="교수님, 말 걸어도 돼요?"
        title="침묵 구조대"
        description="말이 끊겼을 때 꺼내 볼 질문을 미리 저장해 두고, 현장에서는 큰 글자로 조용히 확인합니다."
      />

      <StatusBanner icon={MicOff} title="듣지 않습니다" tone="lavender">
        마이크·녹음·실시간 면담 분석은 이 화면에 없습니다. 저장한 질문을 그대로 보여줄 뿐입니다.
      </StatusBanner>

      <SectionHeading title="질문 종류" />
      <div className="filter-scroll">
        {CATEGORIES.map((item) => (
          <ChoiceChip key={item.id} selected={category === item.id} onClick={() => setCategory(item.id)}>
            {item.id}
          </ChoiceChip>
        ))}
      </div>

      <Card className="silence-add">
        <label>
          <span>미리 저장할 질문</span>
          <textarea
            rows={3}
            value={text}
            placeholder={CATEGORIES.find((c) => c.id === category)?.placeholder}
            onChange={(event) => setText(event.target.value)}
          />
        </label>
        <button type="button" onClick={addQuestion} disabled={!text.trim()}>
          <Plus size={16} /> 질문 저장
        </button>
      </Card>

      <SectionHeading
        title={`저장한 질문 ${saved.length}개`}
        description="면담 중에는 이 목록만 큰 글자로 넘겨 봅니다."
      />
      {saved.length === 0 ? (
        <Card className="official-professor-empty">
          <CircleAlert size={26} />
          <h2>아직 저장한 질문이 없어요</h2>
          <p>논문·진로·다음 행동 질문을 미리 적어 두면 대화가 끊겼을 때 꺼내 볼 수 있어요.</p>
        </Card>
      ) : (
        <div className="silence-list">
          {saved.map((card) => (
            <article key={card.id} className="silence-item">
              <div>
                <Tag tone="violet">{card.title}</Tag>
                <p>{card.body}</p>
              </div>
              {pendingDelete === card.id ? (
                <div className="quest-saved__confirm">
                  <p>이 질문 1개를 삭제합니다. 되돌릴 수 없습니다.</p>
                  <div>
                    <button type="button" onClick={() => setPendingDelete(null)}>취소</button>
                    <button
                      type="button"
                      className="is-danger"
                      onClick={() => {
                        deleteCard(card.id);
                        setPendingDelete(null);
                        setIndex(0);
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
                  aria-label={`${card.body} 삭제`}
                  onClick={() => setPendingDelete(card.id)}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </article>
          ))}
        </div>
      )}

      <PrimaryButton
        className="silence-start"
        disabled={saved.length === 0}
        onClick={() => {
          setIndex(0);
          setMode("live");
        }}
      >
        큰 글자로 보기
      </PrimaryButton>
    </AppShell>
  );
}
