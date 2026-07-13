/**
 * 문의(inquiries) 저장소 — Supabase PostgREST를 fetch로 직접 호출.
 * 추가 패키지 없이 서버에서만 사용한다 (SERVICE_ROLE 키 — 클라이언트 노출 금지).
 * 환경변수(SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY)가 없으면 모든 함수가
 * 조용히 실패를 반환해 사이트 동작(메일 발송)에는 영향을 주지 않는다.
 * 테이블 스키마: supabase/schema.sql
 */

import { sbConfigured, sbRest } from "./supabase-rest";

export type InquiryStatus = "new" | "checked" | "done";

export type Inquiry = {
  id: string;
  created_at: string;
  track: string | null;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  message: string;
  payload: Record<string, unknown> | null;
  status: InquiryStatus;
  memo: string | null;
};

export const inquiryDbConfigured = sbConfigured;

export async function saveInquiry(row: {
  track: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
  payload: Record<string, unknown>;
}): Promise<boolean> {
  if (!sbConfigured()) return false;
  try {
    const res = await sbRest("inquiries", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        track: row.track || null,
        name: row.name,
        email: row.email,
        phone: row.phone || null,
        company: row.company || null,
        message: row.message,
        payload: row.payload,
      }),
    });
    if (!res.ok) console.error("[inquiries] insert failed", res.status);
    return res.ok;
  } catch (e) {
    console.error("[inquiries] insert error", e);
    return false;
  }
}

export async function listInquiries(): Promise<Inquiry[] | null> {
  if (!sbConfigured()) return null;
  try {
    const res = await sbRest(
      "inquiries?select=*&order=created_at.desc&limit=300"
    );
    if (!res.ok) {
      console.error("[inquiries] list failed", res.status);
      return null;
    }
    return (await res.json()) as Inquiry[];
  } catch (e) {
    console.error("[inquiries] list error", e);
    return null;
  }
}

async function patchInquiry(
  id: string,
  fields: Record<string, unknown>
): Promise<boolean> {
  if (!sbConfigured()) return false;
  try {
    const res = await sbRest(`inquiries?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(fields),
    });
    return res.ok;
  } catch (e) {
    console.error("[inquiries] update error", e);
    return false;
  }
}

export const updateInquiryStatus = (id: string, status: InquiryStatus) =>
  patchInquiry(id, { status });

export const updateInquiryMemo = (id: string, memo: string) =>
  patchInquiry(id, { memo: memo.trim() || null });
