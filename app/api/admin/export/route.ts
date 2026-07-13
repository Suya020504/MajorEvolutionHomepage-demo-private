import { listInquiries } from "@/lib/inquiries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const esc = (v: unknown) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** 문의 내역 CSV 다운로드 (미들웨어로 관리자 세션 보호됨) */
export async function GET() {
  const items = await listInquiries();
  if (items === null) {
    return Response.json(
      { ok: false, error: "DB가 설정되지 않았거나 조회에 실패했습니다." },
      { status: 503 }
    );
  }

  const header = [
    "접수일시",
    "상태",
    "트랙",
    "이름",
    "이메일",
    "연락처",
    "회사/팀",
    "문의내용",
    "메모",
  ];
  const rows = items.map((it) =>
    [
      new Date(it.created_at).toLocaleString("ko-KR"),
      it.status,
      it.track ?? "",
      it.name,
      it.email,
      it.phone ?? "",
      it.company ?? "",
      it.message,
      it.memo ?? "",
    ]
      .map(esc)
      .join(",")
  );

  // BOM — 엑셀에서 한글이 깨지지 않도록
  const csv = "\uFEFF" + [header.join(","), ...rows].join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inquiries-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}
