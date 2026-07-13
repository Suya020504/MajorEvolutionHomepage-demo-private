import type { Metadata } from "next";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import {
  inquiryDbConfigured,
  listInquiries,
  updateInquiryMemo,
  updateInquiryStatus,
  type Inquiry,
  type InquiryStatus,
} from "@/lib/inquiries";
import { listChatLogs, type ChatLog } from "@/lib/chat-logs";
import { cn } from "@/lib/utils";
import { LogoutButton } from "./logout-button";

export const metadata: Metadata = {
  title: "관리자 — 문의 내역",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/* ── 상태 정의 ── */
const STATUS: { key: InquiryStatus; label: string; cls: string }[] = [
  { key: "new", label: "신규", cls: "bg-brand/10 text-brand border-brand/30" },
  {
    key: "checked",
    label: "확인중",
    cls: "bg-amber-50 text-amber-700 border-amber-300",
  },
  {
    key: "done",
    label: "완료",
    cls: "bg-secondary text-muted-foreground border-border",
  },
];
const TRACKS = [
  { key: "manufacture", label: "제조" },
  { key: "develop", label: "개발" },
];

/* ── 서버 액션 ── */
async function setStatus(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as InquiryStatus;
  if (id && ["new", "checked", "done"].includes(status)) {
    await updateInquiryStatus(id, status);
    revalidatePath("/admin");
  }
}

async function saveMemo(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  const memo = String(formData.get("memo") ?? "").slice(0, 2000);
  if (id) {
    await updateInquiryMemo(id, memo);
    revalidatePath("/admin");
  }
}

/* ── 유틸 ── */
function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

function chipCls(active: boolean) {
  return cn(
    "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
    active
      ? "border-foreground bg-foreground text-background"
      : "border-border text-foreground/60 hover:border-foreground/40 hover:text-foreground"
  );
}

function Detail({ label, value }: { label: string; value: unknown }) {
  const v = typeof value === "string" ? value.trim() : "";
  if (!v) return null;
  return (
    <div className="flex gap-3 text-sm">
      <span className="w-20 shrink-0 font-medium text-foreground/50">{label}</span>
      <span className="whitespace-pre-wrap">{v}</span>
    </div>
  );
}

/* ── 문의 카드 ── */
function InquiryCard({ item }: { item: Inquiry }) {
  const status = STATUS.find((s) => s.key === item.status) ?? STATUS[0];
  const p = item.payload ?? {};
  return (
    <article className="rounded-2xl border border-border bg-white p-6">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-semibold",
            status.cls
          )}
        >
          {status.label}
        </span>
        <span className="text-sm font-bold">{item.name}</span>
        <a
          href={`mailto:${item.email}`}
          className="text-sm text-brand underline-offset-2 hover:underline"
        >
          {item.email}
        </a>
        {item.track && (
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">
            {TRACKS.find((t) => t.key === item.track)?.label ?? item.track}
          </span>
        )}
        <span className="ml-auto text-xs tabular-nums text-muted-foreground">
          {fmtDate(item.created_at)}
        </span>
      </div>

      <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">
        {item.message}
      </p>

      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
          상세 정보
        </summary>
        <div className="mt-3 space-y-1.5 rounded-lg bg-secondary/60 p-4">
          <Detail label="연락처" value={item.phone} />
          <Detail label="회사/팀" value={item.company} />
          <Detail label="제작 제품" value={p.product} />
          <Detail label="예상 수량" value={p.quantity} />
          <Detail
            label="개발 서비스"
            value={Array.isArray(p.devSel) ? p.devSel.join(", ") : ""}
          />
          <Detail label="필요 기능" value={p.features} />
          <Detail label="희망 일정" value={p.schedule} />
          <Detail label="예산" value={p.budget} />
          <Detail label="참고자료" value={p.refs} />
        </div>
      </details>

      {/* 담당자 메모 */}
      <form action={saveMemo} className="mt-4">
        <input type="hidden" name="id" value={item.id} />
        <div className="flex items-end gap-2">
          <textarea
            name="memo"
            defaultValue={item.memo ?? ""}
            placeholder="담당자 메모 (예: 전화 완료 · 다음주 미팅)"
            rows={item.memo ? Math.min(4, item.memo.split("\n").length) : 1}
            className="min-h-9 flex-1 resize-y rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-brand focus:bg-white"
          />
          <button
            type="submit"
            className="rounded-lg border border-border px-3.5 py-2 text-xs font-medium text-foreground/70 transition-colors hover:border-foreground/40 hover:text-foreground"
          >
            메모 저장
          </button>
        </div>
      </form>

      <div className="mt-4 flex gap-2 border-t border-border pt-4">
        {STATUS.map((s) => (
          <form key={s.key} action={setStatus}>
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="status" value={s.key} />
            <button
              type="submit"
              disabled={s.key === item.status}
              className={cn(
                chipCls(s.key === item.status),
                s.key === item.status && "cursor-default"
              )}
            >
              {s.label}
            </button>
          </form>
        ))}
      </div>
    </article>
  );
}

/* ── AI 상담 세션 카드 ── */
function ChatSessionCard({ logs }: { logs: ChatLog[] }) {
  const first = logs[0];
  return (
    <article className="rounded-2xl border border-border bg-white p-6">
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
          상담 {logs.length}턴
        </span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {fmtDate(first.created_at)}
        </span>
        <span className="ml-auto font-mono text-[0.65rem] text-muted-foreground/60">
          {first.session_id.slice(0, 8)}
        </span>
      </div>
      <div className="mt-4 space-y-4">
        {logs.map((l) => (
          <div key={l.id} className="space-y-2">
            <p className="text-sm font-semibold">
              <span className="mr-2 text-brand">Q</span>
              {l.question}
            </p>
            <p className="whitespace-pre-wrap rounded-lg bg-secondary/60 p-3 text-sm leading-relaxed text-foreground/80">
              {l.answer}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

/* ── DB 설정 가이드 ── */
function SetupGuide() {
  return (
    <div className="rounded-2xl border border-border bg-white p-8">
      <h2 className="text-lg font-bold">데이터베이스 연결이 필요합니다</h2>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
        <li>
          <a
            href="https://supabase.com"
            className="text-brand underline-offset-2 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            supabase.com
          </a>
          에서 무료 프로젝트를 만듭니다.
        </li>
        <li>
          SQL Editor에서 프로젝트의{" "}
          <code className="rounded bg-secondary px-1.5 py-0.5">supabase/schema.sql</code>{" "}
          내용을 실행합니다.
        </li>
        <li>
          Settings → API의 URL과 <b>service_role</b> 키를{" "}
          <code className="rounded bg-secondary px-1.5 py-0.5">SUPABASE_URL</code> ·{" "}
          <code className="rounded bg-secondary px-1.5 py-0.5">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
          환경변수로 설정합니다.
        </li>
        <li>배포 환경(Vercel 등)에도 같은 환경변수를 추가하고 재배포합니다.</li>
      </ol>
    </div>
  );
}

/* ── 페이지 ── */
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : (v ?? "");
  const tab = one(sp.tab) === "chat" ? "chat" : "inquiries";
  const fStatus = one(sp.status);
  const fTrack = one(sp.track);
  const q = one(sp.q).trim().toLowerCase();

  const configured = inquiryDbConfigured();
  const inquiries = configured && tab === "inquiries" ? await listInquiries() : null;
  const chatLogs = configured && tab === "chat" ? await listChatLogs() : null;

  // 문의 카운트(필터 전 기준) + 필터 적용
  const counts = { new: 0, checked: 0, done: 0 } as Record<InquiryStatus, number>;
  for (const it of inquiries ?? []) counts[it.status] = (counts[it.status] ?? 0) + 1;

  const filtered = (inquiries ?? []).filter((it) => {
    if (fStatus && it.status !== fStatus) return false;
    if (fTrack && it.track !== fTrack) return false;
    if (q) {
      const hay = `${it.name} ${it.email} ${it.company ?? ""} ${it.message} ${
        it.memo ?? ""
      }`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  // 상담 로그 → 세션 그룹 (세션 내 시간순, 세션은 최신순)
  const sessions: ChatLog[][] = [];
  if (chatLogs) {
    const map = new Map<string, ChatLog[]>();
    for (const l of chatLogs) {
      if (!map.has(l.session_id)) map.set(l.session_id, []);
      map.get(l.session_id)!.push(l);
    }
    for (const logs of map.values()) {
      logs.sort((a, b) => a.created_at.localeCompare(b.created_at));
      sessions.push(logs);
    }
    sessions.sort((a, b) =>
      b[b.length - 1].created_at.localeCompare(a[a.length - 1].created_at)
    );
  }

  const tabCls = (active: boolean) =>
    cn(
      "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
      active
        ? "bg-foreground text-background"
        : "text-foreground/60 hover:text-foreground"
    );

  // 필터 링크 생성 (현재 검색어 유지)
  const inquiryHref = (patch: Record<string, string>) => {
    const params = new URLSearchParams();
    const next = { status: fStatus, track: fTrack, q: one(sp.q), ...patch };
    for (const [k, v] of Object.entries(next)) if (v) params.set(k, v);
    const s = params.toString();
    return s ? `/admin?${s}` : "/admin";
  };

  return (
    <main className="min-h-svh bg-secondary px-6 py-10 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="kicker text-foreground/45">Admin</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              {tab === "chat" ? "AI 상담 로그" : "문의 내역"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <nav className="flex rounded-full border border-border bg-white p-1">
              <Link href="/admin" className={tabCls(tab === "inquiries")}>
                문의
              </Link>
              <Link href="/admin?tab=chat" className={tabCls(tab === "chat")}>
                AI 상담
              </Link>
            </nav>
            <LogoutButton />
          </div>
        </header>

        {!configured ? (
          <div className="mt-6">
            <SetupGuide />
          </div>
        ) : tab === "chat" ? (
          /* ── AI 상담 탭 ── */
          <div className="mt-6 space-y-4">
            {chatLogs === null ? (
              <div className="rounded-2xl border border-destructive/30 bg-white p-8 text-sm">
                상담 로그를 불러오지 못했습니다. <code>chat_logs</code> 테이블이
                생성됐는지 확인해 주세요 (supabase/schema.sql).
              </div>
            ) : sessions.length === 0 ? (
              <div className="rounded-2xl border border-border bg-white p-8 text-sm text-muted-foreground">
                아직 기록된 상담이 없습니다. 방문자가 AI 상담을 사용하면 세션별로
                이곳에 쌓입니다.
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  총 {sessions.length}개 세션 · {chatLogs.length}턴
                </p>
                {sessions.map((logs) => (
                  <ChatSessionCard key={logs[0].session_id} logs={logs} />
                ))}
              </>
            )}
          </div>
        ) : (
          /* ── 문의 탭 ── */
          <>
            {inquiries && (
              <div className="mt-6 flex gap-3">
                {STATUS.map((s) => (
                  <div
                    key={s.key}
                    className="flex-1 rounded-xl border border-border bg-white px-5 py-4"
                  >
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums">
                      {counts[s.key]}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {inquiries && (
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <Link href={inquiryHref({ status: "" })} className={chipCls(!fStatus)}>
                  전체
                </Link>
                {STATUS.map((s) => (
                  <Link
                    key={s.key}
                    href={inquiryHref({ status: s.key })}
                    className={chipCls(fStatus === s.key)}
                  >
                    {s.label}
                  </Link>
                ))}
                <span aria-hidden className="mx-1 h-4 w-px bg-border" />
                <Link href={inquiryHref({ track: "" })} className={chipCls(!fTrack)}>
                  전 트랙
                </Link>
                {TRACKS.map((t) => (
                  <Link
                    key={t.key}
                    href={inquiryHref({ track: t.key })}
                    className={chipCls(fTrack === t.key)}
                  >
                    {t.label}
                  </Link>
                ))}

                <form action="/admin" className="ml-auto flex items-center gap-2">
                  {fStatus && <input type="hidden" name="status" value={fStatus} />}
                  {fTrack && <input type="hidden" name="track" value={fTrack} />}
                  <input
                    type="search"
                    name="q"
                    defaultValue={one(sp.q)}
                    placeholder="이름·이메일·내용 검색"
                    className="w-48 rounded-full border border-border bg-white px-4 py-1.5 text-xs outline-none transition-colors focus:border-brand"
                  />
                  <a
                    href="/api/admin/export"
                    className="rounded-full border border-border bg-white px-3.5 py-1.5 text-xs font-medium text-foreground/70 transition-colors hover:border-foreground/40 hover:text-foreground"
                  >
                    CSV 내보내기
                  </a>
                </form>
              </div>
            )}

            <div className="mt-4 space-y-4">
              {inquiries === null ? (
                <div className="rounded-2xl border border-destructive/30 bg-white p-8 text-sm">
                  문의 목록을 불러오지 못했습니다. Supabase 설정(URL·키·테이블)을
                  확인해 주세요.
                </div>
              ) : filtered.length === 0 ? (
                <div className="rounded-2xl border border-border bg-white p-8 text-sm text-muted-foreground">
                  {inquiries.length === 0
                    ? "아직 접수된 문의가 없습니다. 문의 폼으로 접수되면 이곳에 표시됩니다."
                    : "조건에 맞는 문의가 없습니다. 필터를 조정해 보세요."}
                </div>
              ) : (
                filtered.map((it) => <InquiryCard key={it.id} item={it} />)
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
