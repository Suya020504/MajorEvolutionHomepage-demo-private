"use client";

export type PaperReaderTask = "translate" | "qa" | "figure" | "simplify";

export type PaperReaderAssist = {
  answer: string;
  grounded: boolean;
  citations: Array<{ page: number; quote: string }>;
  terms: Array<{ term: string; meaning: string }>;
  generatedAt: string;
  model: string;
};

type ErrorPayload = { error?: { code?: string; message?: string } };

/** 화면에 열려 있는 페이지만 근거로 보냅니다. 파일 자체는 서버로 가지 않습니다. */
export async function requestPaperAssist(
  task: PaperReaderTask,
  pages: Array<{ page: number; text: string }>,
  focus?: string,
): Promise<PaperReaderAssist> {
  const response = await fetch("/api/ai/paper-reader", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task, pages, focus }),
  });
  const data = await response.json() as PaperReaderAssist | ErrorPayload;
  if (!response.ok) {
    const message = "error" in data ? data.error?.message : undefined;
    throw new Error(message ?? "논문 도움을 완료하지 못했습니다.");
  }
  return data as PaperReaderAssist;
}
