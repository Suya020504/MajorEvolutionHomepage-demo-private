import { NextRequest } from "next/server";
import { saveChatLog } from "@/lib/chat-logs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ── Assistant persona + grounded facts about 모두의 창업 솔루션 ── */
const SYSTEM_PROMPT = `당신은 "모두의 창업 솔루션"의 친절한 한국어 AI 상담원입니다.
모두의 창업 솔루션은 아이디어를 실제 제품·서비스로 만들어 주는 창업 제작 솔루션으로, 제조와 개발을 함께 제공합니다.

[서비스]
- 제조 기반 시제품 제작: 제품 디자인 · 3D 모델링 · 시제품 제작 · 기본 후가공. 기본 150만원부터.
- 서비스 기반 MVP 개발: 웹/앱 MVP · 핵심 기능 구현 · 테스트 결과물. 기본 150만원부터.
- 두 트랙 모두 기본 시작 금액은 150만원이며, 범위에 따라 비용이 달라집니다.

[견적에 영향을 주는 변수]
- 제조: 제품 크기, 구조 복잡도, 도색 여부, 소재 종류, 제작 수량, 금형 필요 여부 등.
- 개발: 페이지 수, 기능 수, 로그인/관리자/결제 여부, DB 연동, 배포, 유지보수 등.

[제작 과정] 문의 접수 → 사전 검토 → 미팅 → 견적 산정 → 계약·착수 → 결과물 납품 (6단계).

[추가 지원] 지원사업 사업비 서류·행정 지원(세금계산서 발급 가능), 대면 결제 출장 서비스.

[파트너] 원더플라스틱(친환경 제조), RC BLOCK(웹·앱·MVP 개발), 워홀원모어(브랜딩·마케팅).

[상담 원칙]
- 한국어로 간결하고 따뜻하게, 보통 2~4문장으로 답하세요. 불필요하게 길게 늘어놓지 마세요.
- 사용자의 아이디어를 들으면 제조/개발 중 어느 쪽(또는 둘 다)이 맞을지 짚어주고, 다음 단계를 안내하세요.
- 정확한 금액·일정·계약 조건을 단정하지 마세요. "기본 150만원부터이며 범위에 따라 달라진다", "정확한 견적은 미팅에서 안내된다"고 솔직히 말하세요.
- 모르는 정보는 지어내지 말고, 아래의 정식 문의 폼으로 남기도록 자연스럽게 권유하세요.
- 회사·서비스와 무관한 일반 질문에는 가볍게만 답하고 본래 상담 주제로 돌아오세요.`;

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return new Response(
      "AI 상담이 아직 설정되지 않았습니다. 아래 문의 폼을 이용해 주세요.",
      { status: 503 }
    );
  }

  let messages: ChatMessage[] = [];
  let sessionId = "";
  try {
    const body = await req.json();
    messages = Array.isArray(body?.messages) ? body.messages : [];
    sessionId =
      typeof body?.sessionId === "string" ? body.sessionId.slice(0, 64) : "";
  } catch {
    return new Response("잘못된 요청입니다.", { status: 400 });
  }

  // sanitize: keep only role/content, cap length and history depth
  const safe = messages
    .slice(-12)
    .map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m?.content ?? "").slice(0, 2000),
    }))
    .filter((m) => m.content.trim().length > 0);

  if (safe.length === 0) {
    return new Response("메시지가 비어 있습니다.", { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        stream: true,
        temperature: 0.5,
        max_tokens: 600,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...safe],
      }),
    });
  } catch {
    return new Response("AI 응답을 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.", {
      status: 502,
    });
  }

  if (!upstream.ok || !upstream.body) {
    return new Response(
      "AI 응답을 가져오지 못했습니다. 잠시 후 다시 시도하거나 아래 폼으로 문의해 주세요.",
      { status: 502 }
    );
  }

  // Transform OpenAI SSE → plain text delta stream for the client
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  // 관리자 페이지 열람용 상담 로그 — 마지막 질문 + 전체 답변을 저장
  const lastUser = [...safe].reverse().find((m) => m.role === "user");
  let answer = "";
  const logExchange = async () => {
    if (!sessionId || !lastUser || !answer.trim()) return;
    await saveChatLog({
      session_id: sessionId,
      question: lastUser.content,
      answer: answer.trim(),
    });
  };

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.body!.getReader();
      let closed = false;
      const finish = async () => {
        if (closed) return;
        closed = true;
        await logExchange().catch(() => {});
        controller.close();
      };
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") {
              await finish();
              return;
            }
            try {
              const json = JSON.parse(data);
              const delta = json?.choices?.[0]?.delta?.content;
              if (delta) {
                answer += delta;
                controller.enqueue(encoder.encode(delta));
              }
            } catch {
              // ignore keep-alive / partial frames
            }
          }
        }
      } catch {
        // upstream interrupted — close gracefully
      } finally {
        await finish();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
