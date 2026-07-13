/**
 * AI 상담 로그 — 대화 한 턴(질문→답변)당 한 행. 세션 ID로 묶어서 열람한다.
 * 테이블 스키마: supabase/schema.sql (chat_logs)
 */

import { sbConfigured, sbRest } from "./supabase-rest";

export type ChatLog = {
  id: string;
  created_at: string;
  session_id: string;
  question: string;
  answer: string;
};

export async function saveChatLog(row: {
  session_id: string;
  question: string;
  answer: string;
}): Promise<boolean> {
  if (!sbConfigured()) return false;
  try {
    const res = await sbRest("chat_logs", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(row),
    });
    if (!res.ok) console.error("[chat-logs] insert failed", res.status);
    return res.ok;
  } catch (e) {
    console.error("[chat-logs] insert error", e);
    return false;
  }
}

export async function listChatLogs(): Promise<ChatLog[] | null> {
  if (!sbConfigured()) return null;
  try {
    const res = await sbRest(
      "chat_logs?select=*&order=created_at.desc&limit=500"
    );
    if (!res.ok) {
      console.error("[chat-logs] list failed", res.status);
      return null;
    }
    return (await res.json()) as ChatLog[];
  } catch (e) {
    console.error("[chat-logs] list error", e);
    return null;
  }
}
