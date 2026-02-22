-- ═══════════════════════════════════════════════════════════
-- SCM Pro — Phase 2 & 3 Missing Tables
-- Supabase SQL Editor에서 실행하세요
-- ═══════════════════════════════════════════════════════════

-- ─────────────────────────────────────────
-- 1. SALES ORDERS
-- ─────────────────────────────────────────
create table if not exists public.salesorders (
  id               text primary key,
  so_number        text unique not null,
  customer_po      text,
  customer         text,
  part_no          text,
  qty              integer default 0,
  shipped_qty      integer default 0,
  unit_price       numeric(14,4) default 0,
  currency         text default 'USD',
  due_date         date,
  status           text default 'open',   -- open | shipped | invoiced | closed
  tracking_no      text,
  remarks          text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ─────────────────────────────────────────
-- 2. SALES INVOICES
-- ─────────────────────────────────────────
create table if not exists public.salesinvoices (
  id               text primary key,
  invoice_no       text unique not null,
  so_numbers       text,          -- comma-separated SO numbers
  customer         text,
  total_amount     numeric(14,4) default 0,
  currency         text default 'USD',
  issued_date      date,
  status           text default 'issued',  -- issued | paid | void
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ─────────────────────────────────────────
-- 3. WORK ORDERS (Phase 3)
-- ─────────────────────────────────────────
create table if not exists public.workorders (
  id               text primary key,
  wo_number        text unique not null,
  part_no          text,
  qty              integer default 0,
  due_date         date,
  priority         text default 'medium',   -- high | medium | low
  status           text default 'planned',  -- planned | released | in_progress | completed | cancelled
  progress         integer default 0,       -- 0~100
  mrp_ref          text,
  remarks          text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ─────────────────────────────────────────
-- 4. OUTBOUND SHIPMENTS (Phase 3)
-- ─────────────────────────────────────────
create table if not exists public.outbound_shipments (
  id               text primary key,
  shipment_no      text unique not null,
  so_number        text,
  customer         text,
  part_no          text,
  shipped_qty      integer default 0,
  tracking_no      text,
  ship_date        date,
  status           text default 'shipped',
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ─────────────────────────────────────────
-- RLS: Row Level Security (선택사항)
-- 필요한 경우 아래 주석 해제
-- ─────────────────────────────────────────
-- alter table public.salesorders       enable row level security;
-- alter table public.salesinvoices     enable row level security;
-- alter table public.workorders        enable row level security;
-- alter table public.outbound_shipments enable row level security;

-- ─────────────────────────────────────────
-- PostgREST 스키마 캐시 리프레시
-- (테이블 생성 후 반드시 실행)
-- ─────────────────────────────────────────
notify pgrst, 'reload schema';
