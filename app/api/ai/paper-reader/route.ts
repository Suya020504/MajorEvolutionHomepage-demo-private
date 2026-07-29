import { NextResponse } from "next/server";
import {
  AiServiceError,
  assistPaperReading,
  type PaperReaderAssistRequest,
  type PaperReaderTask,
} from "@/lib/openai-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TASKS: PaperReaderTask[] = ["translate", "qa", "figure", "simplify"];
/** 페이지 텍스트를 통째로 보내면 비용이 커지므로 요청 크기를 제한합니다. */
const MAX_BODY_BYTES = 200_000;

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: { code: "invalid_request", message: "한 번에 보낼 수 있는 분량을 넘었습니다. 페이지를 나눠 요청해 주세요." } },
      { status: 413 },
    );
  }

  let body: PaperReaderAssistRequest;
  try {
    body = await request.json() as PaperReaderAssistRequest;
  } catch {
    return NextResponse.json({ error: { code: "invalid_request", message: "요청 형식이 올바르지 않습니다." } }, { status: 400 });
  }

  if (!TASKS.includes(body?.task)) {
    return NextResponse.json({ error: { code: "invalid_request", message: "지원하지 않는 요청입니다." } }, { status: 400 });
  }
  if (!Array.isArray(body?.pages) || body.pages.length === 0) {
    return NextResponse.json({ error: { code: "invalid_request", message: "근거로 쓸 페이지를 함께 보내 주세요." } }, { status: 400 });
  }

  try {
    const result = await assistPaperReading(body);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const serviceError = error instanceof AiServiceError
      ? error
      : new AiServiceError("upstream", "논문 도움을 완료하지 못했습니다.", 502);
    console.error("[ai/paper-reader]", serviceError.code);
    return NextResponse.json(
      { error: { code: serviceError.code, message: serviceError.message } },
      { status: serviceError.status },
    );
  }
}
