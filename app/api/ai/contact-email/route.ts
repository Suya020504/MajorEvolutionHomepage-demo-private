import { NextResponse } from "next/server";
import type { ContactEmailRequest } from "@/lib/contact-email";
import { AiServiceError, draftContactEmail } from "@/lib/openai-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 논문 요약 기반 컨택 메일 초안.
 *
 * /api/ai 아래 두어 middleware.ts의 레이트리밋을 그대로 받습니다.
 * 이 경로 밖에 AI 호출을 만들면 분당·일일·전역 상한이 적용되지 않습니다.
 */
export async function POST(request: Request) {
  let body: ContactEmailRequest;
  try {
    body = await request.json() as ContactEmailRequest;
  } catch {
    return NextResponse.json(
      { error: { code: "invalid_request", message: "요청 형식이 올바르지 않습니다." } },
      { status: 400 },
    );
  }

  const professorName = typeof body?.professorName === "string" ? body.professorName.trim() : "";
  const paperTitle = typeof body?.paperTitle === "string" ? body.paperTitle.trim() : "";
  const summary = body?.summary;
  const oneLine = typeof summary?.oneLine === "string" ? summary.oneLine.trim() : "";
  const question = typeof summary?.question === "string" ? summary.question.trim() : "";

  if (!professorName || !paperTitle) {
    return NextResponse.json(
      { error: { code: "invalid_request", message: "교수님과 논문을 먼저 선택해 주세요." } },
      { status: 400 },
    );
  }

  // 요약 없이 메일을 만들면 논문을 읽지 않고 보내는 글이 된다. 이 서비스가 하려는 것과 반대다.
  if (!oneLine && !question) {
    return NextResponse.json(
      { error: { code: "invalid_request", message: "먼저 3분 카드로 논문 요약을 만들어 주세요." } },
      { status: 400 },
    );
  }

  try {
    const result = await draftContactEmail(body);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const serviceError = error instanceof AiServiceError
      ? error
      : new AiServiceError("upstream", "컨택 메일 초안을 만들지 못했습니다.", 502);
    console.error("[ai/contact-email]", serviceError.code);
    return NextResponse.json(
      { error: { code: serviceError.code, message: serviceError.message } },
      { status: serviceError.status },
    );
  }
}
