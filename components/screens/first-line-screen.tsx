"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Bookmark, CircleAlert, Copy, LoaderCircle, Shuffle } from "lucide-react";
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
import { SceneBanner } from "@/components/app/scene-banner";
import { brandScene } from "@/lib/brand-assets";
import {
  buildFirstLines,
  PURPOSES,
  SITUATIONS,
  type FirstLinePurpose,
  type FirstLineSituation,
} from "@/lib/first-line";
import { evidencePhrase, useQuestContext } from "@/lib/quest-context";
import { useQuestStore } from "@/store/quest-store";
import { useResearchStore } from "@/store/research-store";

/**
 * Q-02 첫마디 랜덤박스.
 *
 * 상황·목적·연결 근거를 받아 목적은 같고 표현이 다른 첫 문장 3개를 만듭니다.
 * 학생이 직접 고치고 복사합니다. 앱이 대신 보내지 않습니다.
 */
export function FirstLineScreen() {
  const router = useRouter();
  const hasHydrated = useResearchStore((state) => state.hasHydrated);
  const { topic, match } = useQuestContext();
  const saveCard = useQuestStore((state) => state.saveCard);

  const [situation, setSituation] = useState<FirstLineSituation>("after-class");
  const [purpose, setPurpose] = useState<FirstLinePurpose>("focus");
  const [evidence, setEvidence] = useState("");
  const [shuffle, setShuffle] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");
  const [prefilled, setPrefilled] = useState(false);

  // 찾다에서 확인한 근거를 한 번만 채워 둡니다. 이후에는 학생 입력이 우선입니다.
  useEffect(() => {
    if (!hasHydrated || prefilled) return;
    const phrase = evidencePhrase(match);
    if (phrase) setEvidence(phrase);
    setPrefilled(true);
  }, [hasHydrated, prefilled, match]);

  const sentences = useMemo(
    () => buildFirstLines({ situation, purpose, evidence, shuffle }),
    [situation, purpose, evidence, shuffle],
  );

  if (!hasHydrated) {
    return (
      <div className="research-loading">
        <LoaderCircle className="spin" />
        <p>저장된 준비 상태를 불러오고 있어요.</p>
      </div>
    );
  }

  const textOf = (id: string, fallback: string) => drafts[id] ?? fallback;

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("첫 문장을 복사했어요. 보내기 전에 직접 읽어 보세요.");
    } catch {
      setStatus("자동 복사에 실패했어요. 문장을 직접 선택해 복사해 주세요.");
    }
  };

  const save = (id: string, text: string, purposeLabel: string) => {
    saveCard({
      tool: "first-line",
      title: `${SITUATIONS.find((s) => s.id === situation)?.label} · ${purposeLabel}`,
      body: text,
      evidence: { label: evidence.trim(), page: null, href: null },
      professorId: match?.professor.id ?? null,
      topicId: topic?.id ?? null,
    });
    setStatus("대화 시작 카드로 저장했어요. 퀘스트 허브에서 다시 볼 수 있어요.");
  };

  return (
    <AppShell title="첫마디 랜덤박스" backHref="/quest" className="first-line-screen">
      <SceneBanner
        scene={brandScene.firstLine}
        alt="수업이 끝난 뒤 교수님께 첫마디를 건네는 장면"
        eyebrow="교수님, 말 걸어도 돼요?"
        title="첫마디 랜덤박스"
        description="상황과 목적을 고르면 목적은 같고 표현이 다른 첫 문장 3개를 만듭니다."
        priority
      />

      <StatusBanner icon={CircleAlert} title="추정하지 않는 것" tone="lavender">
        교수님의 성격이나 친밀도는 추정하지 않습니다. 문장은 학생이 직접 확인한 근거로만 만들고,
        고치고 복사하는 것도 학생이 합니다.
      </StatusBanner>

      <SectionHeading title="어떤 상황인가요?" />
      <div className="filter-scroll">
        {SITUATIONS.map((item) => (
          <ChoiceChip key={item.id} selected={situation === item.id} onClick={() => setSituation(item.id)}>
            {item.label}
          </ChoiceChip>
        ))}
      </div>
      <p className="first-line-hint">{SITUATIONS.find((s) => s.id === situation)?.hint}</p>

      <SectionHeading title="무엇을 묻고 싶나요?" />
      <div className="filter-scroll">
        {PURPOSES.map((item) => (
          <ChoiceChip key={item.id} selected={purpose === item.id} onClick={() => setPurpose(item.id)}>
            {item.label}
          </ChoiceChip>
        ))}
      </div>

      <Card className="first-line-evidence">
        <label>
          <span>연결 근거</span>
          <input
            type="text"
            value={evidence}
            placeholder="예) 소비자 행동 연구분야 · 읽은 논문 제목"
            onChange={(event) => setEvidence(event.target.value)}
          />
        </label>
        <p>내가 실제로 확인한 것만 적어 주세요. 근거가 없으면 문장을 만들지 않습니다.</p>
      </Card>

      {sentences.length === 0 ? (
        <Card className="official-professor-empty">
          <CircleAlert size={26} />
          <h2>연결 근거를 먼저 적어 주세요</h2>
          <p>읽은 논문 제목이나 공식 프로필에서 확인한 연구분야를 적으면 첫 문장을 만듭니다.</p>
          {!match && (
            <PrimaryButton onClick={() => router.push("/professors")}>
              나의 교수님 — 찾다에서 근거 확인
            </PrimaryButton>
          )}
        </Card>
      ) : (
        <>
          <SectionHeading
            title="첫 문장 셔플"
            action={(
              <button type="button" className="first-line-shuffle" onClick={() => setShuffle((n) => n + 1)}>
                <Shuffle size={15} /> 다시 섞기
              </button>
            )}
          />
          <div className="first-line-list">
            {sentences.map((sentence, index) => {
              const text = textOf(sentence.id, sentence.text);
              return (
                <article key={sentence.id} className="first-line-card">
                  <header>
                    <span className="first-line-card__index">{index + 1}</span>
                    <Tag tone="violet">{sentence.purposeLabel}</Tag>
                  </header>
                  <textarea
                    value={text}
                    rows={4}
                    aria-label={`첫 문장 ${index + 1}`}
                    onChange={(event) =>
                      setDrafts((current) => ({ ...current, [sentence.id]: event.target.value }))
                    }
                  />
                  <div className="first-line-card__actions">
                    <button type="button" onClick={() => void copy(text)}>
                      <Copy size={15} /> 복사
                    </button>
                    <button type="button" onClick={() => save(sentence.id, text, sentence.purposeLabel)}>
                      <Bookmark size={15} /> 대화 시작 카드 저장
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      {status && <p className="first-line-status" role="status">{status}</p>}
      <p className="prof-scope-note">실제 연락과 면담은 학생이 직접 진행합니다.</p>
    </AppShell>
  );
}
