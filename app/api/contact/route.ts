import { NextRequest } from "next/server";
import { contactPage } from "@/lib/content";
import { saveInquiry } from "@/lib/inquiries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const { recipients, tracks } = contactPage;

/* 대표 수신자(트랙 미상 시 fallback) — 개발 담당(연빈) */
const FALLBACK_TO = recipients.develop ?? Object.values(recipients)[0];

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const key = process.env.RESEND_API_KEY;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }

  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const track = str(body.track);
  const name = str(body.name);
  const email = str(body.email);
  const message = str(body.message);

  if (!name || !EMAIL_RE.test(email) || !message) {
    return Response.json(
      { ok: false, error: "이름·이메일·문의 내용을 다시 확인해 주세요." },
      { status: 400 }
    );
  }

  // DB 저장(관리자 페이지 노출용) — 메일과 독립적으로 최선-노력 저장.
  // 메일이 실패해도 저장됐으면 접수로 처리해 리드를 잃지 않는다.
  const saved = await saveInquiry({
    track,
    name,
    email,
    phone: str(body.phone),
    company: str(body.company),
    message,
    payload: body,
  });

  if (!key) {
    if (saved) return Response.json({ ok: true });
    return Response.json(
      { ok: false, error: "메일 발송이 아직 설정되지 않았습니다. 잠시 후 다시 시도하거나 이메일로 직접 연락 주세요." },
      { status: 503 }
    );
  }

  const trackLabel = tracks.find((t) => t.id === track)?.label ?? track ?? "문의";
  const devSel = Array.isArray(body.devSel)
    ? (body.devSel as unknown[]).map((x) => String(x)).join(", ")
    : "";

  // 라벨 · 값 쌍 (빈 값은 제외) — 트랙별 항목 포함
  const rows: [string, string][] = [
    ["이름", name],
    ["이메일", email],
    ["연락처", str(body.phone)],
    ["회사/팀", str(body.company)],
    ["제작 유형", trackLabel],
    ["제작 제품", track === "manufacture" ? str(body.product) : ""],
    ["예상 수량", track === "manufacture" ? str(body.quantity) : ""],
    ["개발 서비스", track === "develop" ? devSel : ""],
    ["필요 기능", track === "develop" ? str(body.features) : ""],
    ["희망 일정", str(body.schedule)],
    ["예산", str(body.budget)],
    ["참고자료", str(body.refs)],
  ].filter(([, v]) => v.length > 0) as [string, string][];

  const text =
    rows.map(([k, v]) => `■ ${k}: ${v}`).join("\n") +
    `\n\n■ 문의 내용\n${message}`;

  const html = `<div style="font-family:-apple-system,'Segoe UI',Roboto,'Malgun Gothic',sans-serif;max-width:640px;margin:0 auto;color:#111">
    <h2 style="font-size:18px;margin:0 0 4px">[제작 문의] ${esc(trackLabel)}</h2>
    <p style="color:#666;font-size:13px;margin:0 0 16px">모두의 창업 솔루션 웹사이트 문의 폼</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      ${rows
        .map(
          ([k, v]) =>
            `<tr><td style="padding:8px 12px;background:#f6f6f7;border:1px solid #eee;white-space:nowrap;font-weight:600;width:110px">${esc(
              k
            )}</td><td style="padding:8px 12px;border:1px solid #eee">${esc(v)}</td></tr>`
        )
        .join("")}
    </table>
    <h3 style="font-size:15px;margin:20px 0 6px">문의 내용</h3>
    <p style="white-space:pre-wrap;line-height:1.6;font-size:14px;margin:0">${esc(message)}</p>
  </div>`;

  // 트랙별 수신자 (콤마 구분 다중 수신 지원). 미상 트랙은 대표 수신자로.
  const to = (recipients[track] ?? FALLBACK_TO)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const fromRaw = process.env.CONTACT_FROM_EMAIL || "onboarding@resend.dev";
  const from = fromRaw.includes("<") ? fromRaw : `모두의 창업 솔루션 <${fromRaw}>`;

  let res: Response;
  try {
    res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        from,
        to,
        reply_to: email,
        subject: `[제작 문의] ${trackLabel} · ${name}`,
        text,
        html,
      }),
    });
  } catch {
    if (saved) return Response.json({ ok: true }); // 접수는 완료 — 메일만 실패
    return Response.json(
      { ok: false, error: "메일 전송 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 502 }
    );
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("[contact] Resend error", res.status, detail);
    if (saved) return Response.json({ ok: true }); // 접수는 완료 — 메일만 실패
    return Response.json(
      { ok: false, error: "메일 전송에 실패했습니다. 잠시 후 다시 시도하거나 이메일로 직접 연락 주세요." },
      { status: 502 }
    );
  }

  return Response.json({ ok: true });
}
