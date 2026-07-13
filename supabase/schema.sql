-- 관리자 페이지 스키마 — Supabase SQL Editor에서 실행 (재실행 안전)
-- 서버(service_role 키)로만 접근하므로 RLS는 켜두고 정책은 만들지 않는다.

-- 1) 문의 내역
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  track text,
  name text not null,
  email text not null,
  phone text,
  company text,
  message text not null,
  payload jsonb,
  status text not null default 'new' check (status in ('new', 'checked', 'done'))
);

create index if not exists inquiries_created_at_idx
  on public.inquiries (created_at desc);

alter table public.inquiries enable row level security;

-- 1-1) 담당자 메모 (기존 테이블에 추가)
alter table public.inquiries add column if not exists memo text;

-- 2) AI 상담 로그 — 대화 한 턴(질문→답변)당 한 행
create table if not exists public.chat_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id text not null,
  question text not null,
  answer text not null
);

create index if not exists chat_logs_created_at_idx
  on public.chat_logs (created_at desc);

alter table public.chat_logs enable row level security;
