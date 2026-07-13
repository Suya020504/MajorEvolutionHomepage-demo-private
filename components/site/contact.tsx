"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { contactPage } from "@/lib/content";
import { cn } from "@/lib/utils";
import { Magnetic } from "./magnetic";
import { AiAssistant } from "./ai-assistant";
import { LocationMap } from "./location-map";
import { PaintWord } from "./paint-word";

const EASE = [0.16, 1, 0.3, 1] as const;
const { hero, tracks, budgets, devServices, aside, recipients } = contactPage;

/** 트랙별 담당 이메일(제조/개발) — 표시용. 콤마 다중 수신 시 첫 주소만. */
function recipientFor(track: string): string {
  const to = recipients[track] ?? recipients.develop ?? "";
  return to.split(",")[0].trim();
}

type SendStatus = "idle" | "sending" | "sent" | "error";

export function Contact() {
  const reduce = useReducedMotion();
  const router = useRouter();

  const [track, setTrack] = useState<string>(tracks[0].id);
  const [budget, setBudget] = useState<string>("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<SendStatus>("idle");
  const [errMsg, setErrMsg] = useState("");
  // track-specific
  const [product, setProduct] = useState(""); // 제조: 제작 제품
  const [quantity, setQuantity] = useState(""); // 제조: 예상 수량
  const [devSel, setDevSel] = useState<string[]>([]); // 개발: 개발 서비스
  const [features, setFeatures] = useState(""); // 개발: 필요 기능
  // common extras
  const [schedule, setSchedule] = useState("");
  const [refs, setRefs] = useState("");

  const toggleDev = (s: string) =>
    setDevSel((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );

  const nameOk = name.trim().length > 0;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const messageOk = message.trim().length > 0;
  const valid = nameOk && emailOk && messageOk;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!valid || status === "sending") return;

    setStatus("sending");
    setErrMsg("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          track,
          name,
          email,
          phone,
          company,
          message,
          product,
          quantity,
          devSel,
          features,
          schedule,
          budget,
          refs,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setStatus("error");
        setErrMsg(data?.error || "전송에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      setStatus("sent");
    } catch {
      setStatus("error");
      setErrMsg("네트워크 오류로 전송하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  const fieldBase =
    "w-full rounded-lg border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-foreground";

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-background text-foreground">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_85%_10%,rgba(37,99,235,0.13),transparent_60%)]"
        />
        <div className="relative mx-auto max-w-[100rem] px-6 pb-20 pt-36 lg:px-10 lg:pb-24 lg:pt-44">
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="kicker inline-flex items-center gap-2.5 text-foreground/55"
          >
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brand" />
            {hero.kicker}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.06, ease: EASE }}
            className="display mt-6 max-w-3xl text-[clamp(2.4rem,5.5vw,5rem)]"
            style={{ lineHeight: 1.06 }}
          >
            {hero.title.split("\n").map((line, i) => (
              <span key={i} className="block">
                {/* "아이디어"에 마커 페인트 — 홈의 "창업"과 같은 모션 시그니처 */}
                {line.includes("아이디어") ? (
                  <>
                    {line.slice(0, line.indexOf("아이디어"))}
                    <PaintWord delay={1.2} tone="brand">아이디어</PaintWord>
                    {line.slice(line.indexOf("아이디어") + "아이디어".length)}
                  </>
                ) : (
                  line
                )}
              </span>
            ))}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.16, ease: EASE }}
            className="mt-5 text-xl italic text-foreground/65 sm:text-2xl"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {hero.accent}
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.24, ease: EASE }}
            className="mt-6 max-w-xl text-base leading-relaxed text-foreground/70 sm:text-lg"
          >
            {hero.body}
          </motion.p>
        </div>
      </section>

      {/* ── AI 상담 (이메일 폼보다 먼저) ─────────────────────── */}
      <AiAssistant />

      {/* ── FORM ─────────────────────────────────────────────── */}
      <section id="contact-form" className="scroll-mt-20 bg-background py-20 lg:py-28">
        <div className="mx-auto grid max-w-[88rem] gap-14 px-6 lg:grid-cols-[1.6fr_1fr] lg:gap-20 lg:px-10">
          {/* form */}
          <motion.form
            onSubmit={handleSubmit}
            noValidate
            initial={reduce ? false : { opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            {/* track selector */}
            <fieldset>
              <legend className="text-sm font-semibold text-foreground">
                어떤 제작이 필요하신가요?
              </legend>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {tracks.map((t) => {
                  const on = track === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTrack(t.id)}
                      aria-pressed={on}
                      className={cn(
                        "rounded-xl border p-4 text-left transition-all",
                        on
                          ? "border-foreground bg-foreground text-background shadow-lg"
                          : "border-border bg-secondary/40 hover:border-foreground/40"
                      )}
                    >
                      <div className="text-sm font-semibold">{t.label}</div>
                      <div
                        className={cn(
                          "mt-1 text-xs",
                          on ? "text-background/70" : "text-muted-foreground"
                        )}
                      >
                        {t.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* name + email */}
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <Field label="이름" required error={touched && !nameOk}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="홍길동"
                  className={cn(
                    fieldBase,
                    touched && !nameOk ? "border-red-500" : "border-border"
                  )}
                />
              </Field>
              <Field
                label="이메일"
                required
                error={touched && !emailOk}
                hint={touched && !emailOk ? "올바른 이메일을 입력해 주세요" : undefined}
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={cn(
                    fieldBase,
                    touched && !emailOk ? "border-red-500" : "border-border"
                  )}
                />
              </Field>
            </div>

            {/* phone + company */}
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label="연락처" optional>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010-0000-0000"
                  className={cn(fieldBase, "border-border")}
                />
              </Field>
              <Field label="회사 / 팀" optional>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="(선택)"
                  className={cn(fieldBase, "border-border")}
                />
              </Field>
            </div>

            {/* track-specific — 제조 */}
            {track === "manufacture" && (
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <Field label="제작 제품" optional>
                  <input
                    type="text"
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                    placeholder="예: 친환경 텀블러"
                    className={cn(fieldBase, "border-border")}
                  />
                </Field>
                <Field label="예상 수량" optional>
                  <input
                    type="text"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="예: 50개 / 미정"
                    className={cn(fieldBase, "border-border")}
                  />
                </Field>
              </div>
            )}

            {/* track-specific — 개발 */}
            {track === "develop" && (
              <>
                <Field label="개발 서비스" optional className="mt-5">
                  <div className="flex flex-wrap gap-2">
                    {devServices.map((s) => {
                      const on = devSel.includes(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleDev(s)}
                          aria-pressed={on}
                          className={cn(
                            "rounded-full border px-4 py-2 text-sm transition-colors",
                            on
                              ? "border-foreground bg-foreground text-background"
                              : "border-border text-foreground/80 hover:border-foreground/40"
                          )}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </Field>
                <Field label="필요 기능" optional className="mt-5">
                  <input
                    type="text"
                    value={features}
                    onChange={(e) => setFeatures(e.target.value)}
                    placeholder="예: 로그인 · 결제 · 관리자 · 문의폼"
                    className={cn(fieldBase, "border-border")}
                  />
                </Field>
              </>
            )}

            {/* 희망 일정 */}
            <Field label="희망 일정" optional className="mt-5">
              <input
                type="text"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                placeholder="예: 2개월 내 / 협의"
                className={cn(fieldBase, "border-border")}
              />
            </Field>

            {/* budget */}
            <Field label="예산" optional className="mt-5">
              <div className="flex flex-wrap gap-2">
                {budgets.map((b) => {
                  const on = budget === b;
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBudget(on ? "" : b)}
                      aria-pressed={on}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm transition-colors",
                        on
                          ? "border-foreground bg-foreground text-background"
                          : "border-border text-foreground/80 hover:border-foreground/40"
                      )}
                    >
                      {b}
                    </button>
                  );
                })}
              </div>
            </Field>

            {/* 참고자료 */}
            <Field label="참고자료" optional className="mt-5">
              <input
                type="text"
                value={refs}
                onChange={(e) => setRefs(e.target.value)}
                placeholder="참고 링크(URL) 또는 자료 설명"
                className={cn(fieldBase, "border-border")}
              />
            </Field>

            {/* message */}
            <Field
              label="문의 내용"
              required
              error={touched && !messageOk}
              className="mt-5"
            >
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                placeholder="만들고 싶은 것, 현재 단계(아이디어/시제품/기획서 등), 원하는 일정 등을 자유롭게 적어주세요."
                className={cn(
                  fieldBase,
                  "resize-y",
                  touched && !messageOk ? "border-red-500" : "border-border"
                )}
              />
            </Field>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Magnetic className="inline-block">
                <button
                  type="submit"
                  disabled={status === "sending" || status === "sent"}
                  className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-brand to-[#3b82f6] px-7 py-3.5 text-sm font-semibold text-white transition-[transform,box-shadow] duration-300 hover:scale-[1.03] hover:shadow-[0_14px_36px_-12px_rgba(37,99,235,0.55)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                >
                  {status === "sending"
                    ? "보내는 중…"
                    : status === "sent"
                      ? "접수 완료"
                      : "문의 보내기"}
                  {status !== "sent" && (
                    <span className="transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  )}
                </button>
              </Magnetic>
              {status === "sent" ? (
                <p className="text-sm font-medium text-brand">
                  문의가 정상 접수됐습니다. 영업일 1~2일 내 회신드릴게요.
                </p>
              ) : status === "error" ? (
                <p className="text-sm font-medium text-red-500">{errMsg}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  제출하면 담당자에게 바로 메일로 전달됩니다. 영업일 1~2일 내 회신드려요.
                </p>
              )}
            </div>
          </motion.form>

          {/* aside */}
          <motion.aside
            initial={reduce ? false : { opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
            className="lg:pt-2"
          >
            <div className="rounded-2xl border border-border bg-secondary/40 p-7">
              <dl className="flex flex-col gap-6">
                {aside.items.map((it) => {
                  // 이메일은 선택한 트랙의 담당 메일로 표시 (제조/개발)
                  const email =
                    it.label === "이메일" ? recipientFor(track) : it.value;
                  return (
                    <div key={it.label}>
                      <dt className="kicker text-muted-foreground">{it.label}</dt>
                      <dd className="mt-1.5 text-base font-medium text-foreground">
                        {it.label === "이메일" ? (
                          <a
                            href={`mailto:${email}`}
                            className="underline-offset-4 hover:underline"
                          >
                            {email}
                          </a>
                        ) : (
                          it.value
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>

              <div className="mt-8 border-t border-border pt-6">
                <p className="text-sm text-muted-foreground">{aside.note}</p>
                <button
                  type="button"
                  onClick={() => router.push(aside.noteLink.href)}
                  className="group mt-2 inline-flex items-center gap-2 text-sm font-semibold text-foreground"
                >
                  {aside.noteLink.label}
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </button>
              </div>
            </div>

            {/* 오시는 길 — 폼의 트랙 선택과 연동 (제조→원더플라스틱 · 그 외→진주) */}
            <LocationMap track={track} />
          </motion.aside>
        </div>
      </section>
    </>
  );
}

function Field({
  label,
  required,
  optional,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  error?: boolean;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
        {label}
        {required && <span className="text-brand">*</span>}
        {optional && (
          <span className="text-xs font-normal text-muted-foreground">
            (선택)
          </span>
        )}
      </span>
      <div className="mt-2">{children}</div>
      {hint && <span className="mt-1.5 block text-xs text-red-500">{hint}</span>}
    </label>
  );
}
