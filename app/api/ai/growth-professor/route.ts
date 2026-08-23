import { NextResponse } from "next/server";
import { AiServiceError, generateGrowthProfessorReply } from "@/lib/openai-server";
import type { GrowthProfessorRequest } from "@/lib/ai-growth-professor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: GrowthProfessorRequest;
  try {
    body = await request.json() as GrowthProfessorRequest;
  } catch {
    return NextResponse.json(
      { error: { code: "invalid_request", message: "대화 요청 형식이 올바르지 않습니다." } },
      { status: 400 },
    );
  }

  if (!body?.context || !Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json(
      { error: { code: "invalid_request", message: "대화에 필요한 성장 맥락을 확인해 주세요." } },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(
      await generateGrowthProfessorReply(body),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const serviceError = error instanceof AiServiceError
      ? error
      : new AiServiceError("upstream", "AI 성장 대화를 이어가지 못했습니다.", 502);
    console.error("[ai/growth-professor]", serviceError.code);
    return NextResponse.json(
      { error: { code: serviceError.code, message: serviceError.message } },
      { status: serviceError.status },
    );
  }
}
