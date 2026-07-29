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

/**
 * 스트리밍 요청.
 *
 * 응답 전체를 기다리는 대신 글자가 오는 대로 onDelta로 넘겨 화면에 먼저 씁니다.
 * 총 소요 시간은 같지만, 첫 글자까지의 대기가 사라져 체감이 크게 달라집니다.
 * 스트리밍이 막힌 환경(프록시 버퍼링 등)에서는 일반 요청으로 물러납니다.
 */
export async function requestPaperAssistStream(
  task: PaperReaderTask,
  pages: Array<{ page: number; text: string }>,
  focus: string | undefined,
  onDelta: (text: string) => void,
): Promise<PaperReaderAssist> {
  let response: Response;
  try {
    response = await fetch("/api/ai/paper-reader?stream=1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task, pages, focus }),
    });
  } catch {
    return requestPaperAssist(task, pages, focus);
  }
  if (!response.ok || !response.body) {
    // 429 같은 오류는 일반 경로와 같은 메시지로 다루기 위해 그대로 넘깁니다.
    const data = await response.json().catch(() => ({})) as ErrorPayload;
    throw new Error(data.error?.message ?? "논문 도움을 완료하지 못했습니다.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: PaperReaderAssist | null = null;
  let failure: string | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";
    for (const chunk of chunks) {
      const eventLine = chunk.split("\n").find((l) => l.startsWith("event:"));
      const dataLine = chunk.split("\n").find((l) => l.startsWith("data:"));
      if (!eventLine || !dataLine) continue;
      const event = eventLine.slice(6).trim();
      let payload: { text?: string; message?: string } & Partial<PaperReaderAssist>;
      try {
        payload = JSON.parse(dataLine.slice(5).trim());
      } catch {
        continue;
      }
      if (event === "delta" && typeof payload.text === "string") onDelta(payload.text);
      else if (event === "done") result = payload as PaperReaderAssist;
      else if (event === "fail") failure = payload.message ?? "논문 도움을 완료하지 못했습니다.";
    }
  }

  if (failure) throw new Error(failure);
  if (!result) throw new Error("논문 도움을 완료하지 못했습니다.");
  return result;
}

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
