import type { PaperAnalysisRequest, PaperAnalysisResult } from "@/lib/paper-analysis";
import type {
  CoDesignRequest,
  CoDesignResponse,
} from "@/lib/co-design-ai";

type ApiErrorPayload = { error?: { message?: string } };

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json() as T & ApiErrorPayload;
  if (!response.ok) throw new Error(payload.error?.message || "AI 요청을 완료하지 못했습니다.");
  return payload;
}

export function requestPaperAnalysis(body: PaperAnalysisRequest): Promise<PaperAnalysisResult> {
  return postJson<PaperAnalysisResult>("/api/ai/paper", body);
}

export function requestCoDesignCandidates(body: CoDesignRequest): Promise<CoDesignResponse> {
  return postJson<CoDesignResponse>("/api/ai/co-design", body);
}
