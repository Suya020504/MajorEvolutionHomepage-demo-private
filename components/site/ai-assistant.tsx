"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowUp, Sparkles } from "lucide-react";
import { aiAssistant } from "@/lib/content";

const EASE = [0.16, 1, 0.3, 1] as const;

type Msg = { role: "user" | "assistant"; content: string };

export function AiAssistant() {
  const reduce = useReducedMotion() ?? false;
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  // 상담 로그를 세션 단위로 묶기 위한 ID (관리자 페이지 열람용)
  const sessionRef = useRef<string>("");
  const started = messages.length > 0;

  // keep the transcript pinned to the latest line
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;

    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setBusy(true);
    // placeholder assistant bubble we stream into
    setMessages((m) => [...m, { role: "assistant", content: "" }]);

    try {
      if (!sessionRef.current) {
        sessionRef.current =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      }
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, sessionId: sessionRef.current }),
      });

      if (!res.ok || !res.body) {
        throw new Error(String(res.status));
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          const last = copy[copy.length - 1];
          if (last?.role === "assistant") {
            copy[copy.length - 1] = { ...last, content: last.content + chunk };
          }
          return copy;
        });
      }
    } catch {
      setMessages((m) => {
        const copy = [...m];
        const last = copy[copy.length - 1];
        if (last?.role === "assistant") {
          copy[copy.length - 1] = { ...last, content: aiAssistant.errorMessage };
        }
        return copy;
      });
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    send(input);
  }

  function scrollToForm() {
    document
      .getElementById("contact-form")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const titleLines = aiAssistant.title.split("\n");

  return (
    <section className="relative overflow-hidden bg-secondary text-foreground">
      {/* backdrop — blueprint grid + brand glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.5] [background-image:linear-gradient(to_right,rgba(11,11,12,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(11,11,12,0.05)_1px,transparent_1px)] [background-size:60px_60px] [mask-image:radial-gradient(90%_70%_at_50%_0%,#000_30%,transparent_85%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full blur-3xl [background:radial-gradient(circle,rgba(37,99,235,0.1),transparent_64%)]"
      />

      <div className="relative mx-auto max-w-[72rem] px-6 py-20 lg:px-10 lg:py-28">
        {/* header */}
        <div className="text-center">
          <span className="kicker font-latin inline-flex items-center gap-2 text-foreground/55">
            <Sparkles className="h-3.5 w-3.5 text-brand" strokeWidth={2} />
            {aiAssistant.kicker}
          </span>
          <h2 className="font-accent mt-5 text-[clamp(2.2rem,5vw,4rem)] font-bold leading-[1.05]">
            {titleLines.map((l, i) => (
              <span key={i} className="block">
                {l}
              </span>
            ))}
          </h2>
          <p
            className="mt-4 text-lg italic text-foreground/55 sm:text-xl"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {aiAssistant.accent}
          </p>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {aiAssistant.description}
          </p>
        </div>

        {/* chat panel */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, ease: EASE }}
          className="mx-auto mt-12 max-w-3xl overflow-hidden rounded-[1.75rem] border border-border bg-white shadow-[0_50px_120px_-60px_rgba(11,11,12,0.35)]"
        >
          {/* transcript */}
          <div
            ref={scrollRef}
            className="max-h-[26rem] min-h-[18rem] overflow-y-auto px-5 py-6 sm:px-7"
          >
            {!started ? (
              <div className="flex flex-col gap-6">
                {/* greeting bubble */}
                <AssistantBubble content={aiAssistant.greeting} />
                {/* suggestion chips */}
                <div className="flex flex-wrap gap-2">
                  {aiAssistant.suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-full border border-border px-4 py-2 text-left text-[0.82rem] text-foreground/75 transition-colors duration-300 hover:border-brand/50 hover:bg-brand/10 hover:text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {messages.map((m, i) =>
                  m.role === "assistant" ? (
                    <AssistantBubble
                      key={i}
                      content={m.content}
                      pending={
                        busy && i === messages.length - 1 && m.content === ""
                      }
                    />
                  ) : (
                    <div key={i} className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-brand px-4 py-2.5 text-sm leading-relaxed text-white">
                        {m.content}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* input */}
          <form
            onSubmit={onSubmit}
            className="flex items-center gap-2 border-t border-border p-3 sm:p-4"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={aiAssistant.placeholder}
              aria-label="AI 상담 메시지"
              className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-foreground/35"
            />
            <button
              type="submit"
              disabled={busy || input.trim().length === 0}
              aria-label="보내기"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-[transform,background-color,opacity] duration-300 hover:scale-105 hover:bg-brand hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowUp className="h-4 w-4" strokeWidth={2.4} />
            </button>
          </form>
        </motion.div>

        {/* disclaimer + cue down to the email form */}
        <div className="mx-auto mt-8 flex max-w-3xl flex-col items-center gap-5 text-center">
          <p className="max-w-xl text-xs leading-relaxed text-foreground/45">
            {aiAssistant.disclaimer}
          </p>
          <button
            type="button"
            onClick={scrollToForm}
            className="group inline-flex items-center gap-2 text-sm font-semibold text-foreground/80 transition-colors hover:text-foreground"
          >
            {aiAssistant.formCue}
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border transition-[transform,border-color] duration-300 group-hover:translate-y-0.5 group-hover:border-foreground/60">
              <ArrowDown className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}

function AssistantBubble({
  content,
  pending,
}: {
  content: string;
  pending?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand/40 bg-brand/10 text-brand">
        <Sparkles className="h-4 w-4" strokeWidth={2} />
      </span>
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-secondary px-4 py-2.5 text-sm leading-relaxed text-foreground/90">
        {pending ? (
          <span className="inline-flex gap-1 py-1">
            {[0, 1, 2].map((d) => (
              <motion.span
                key={d}
                className="h-1.5 w-1.5 rounded-full bg-foreground/50"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: d * 0.18,
                  ease: "easeInOut",
                }}
              />
            ))}
          </span>
        ) : (
          <span className="whitespace-pre-wrap">{content}</span>
        )}
      </div>
    </div>
  );
}
