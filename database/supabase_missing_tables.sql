-- ============================================================
--  SCM Pro — 누락 테이블 보충 SQL (Step 1 스키마 실행 후 추가)
--  polist / hqtrade / alerts / vendorkpi / landedcost
--  Supabase SQL Editor에서 이 파일만 실행하세요
-- ============================================================

-- ─────────────────────────────────────────
-- 1. POLIST (발주서 flat 목록)
--    기존 po_headers + po_lines 대신 앱에서 사용하는 denormalized 테이블
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS polist (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    po_number       TEXT UNIQUE NOT NULL,        -- PO-2026-001
    date            DATE,                        -- 발주일
    vendor_code     TEXT,
    vendor_name     TEXT,
    currency        TEXT DEFAULT 'USD',
    incoterms       TEXT,
    payment_terms   TEXT,
    ship_to         TEXT,
    total_value     NUMERIC DEFAULT 0,           -- 발주 총액
    item_count      INTEGER DEFAULT 0,           -- 품목 수
    progress        INTEGER DEFAULT 0,           -- 0~100
    status          TEXT DEFAULT 'draft',        -- draft|issued|confirmed|partial|received|closed|cancelled
    items           JSONB,                       -- [{part_no, qty, unit_price, ...}]
    remarks         TEXT,
    created_by      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 2. HQTRADE (HQ 무역 / 해외 선적)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hqtrade (
    id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    shipment_no         TEXT UNIQUE NOT NULL,    -- SHP-2026-001
    po_ref              TEXT,                    -- 연결 PO 번호
    vendor_code         TEXT,
    vendor_name         TEXT,
    etd                 DATE,                    -- 출항 예정일
    eta                 DATE,                    -- 도착 예정일
    actual_arrival      DATE,                    -- 실제 도착일
    invoice_no          TEXT,
    invoice_amt         NUMERIC DEFAULT 0,
    currency            TEXT DEFAULT 'USD',
    incoterms           TEXT,
    shipping_method     TEXT,                    -- Vessel / Air / Truck
    carrier             TEXT,
    bl_no               TEXT,                    -- B/L 번호
    container_no        TEXT,
    port_of_loading     TEXT,
    port_of_discharge   TEXT,
    status              TEXT DEFAULT 'open',     -- open|in_transit|customs|delivered|closed

    -- 선적 서류 상태 (doc_*_status: pending|received|approved|issues|filed)
    doc_invoice_status  TEXT DEFAULT 'pending',
    doc_packing_status  TEXT DEFAULT 'pending',
    doc_bl_status       TEXT DEFAULT 'pending',
    doc_co_status       TEXT DEFAULT 'pending',
    doc_entry_status    TEXT DEFAULT 'pending',
    doc_pod_status      TEXT DEFAULT 'pending',

    -- 통관 / 비용
    customs_duty        NUMERIC DEFAULT 0,
    freight_cost        NUMERIC DEFAULT 0,
    insurance_cost      NUMERIC DEFAULT 0,
    other_cost          NUMERIC DEFAULT 0,

    items               JSONB,                   -- [{part_no, qty, unit_price}]
    remarks             TEXT,
    created_by          TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 3. ALERTS (시스템 알림)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alerts (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    type        TEXT,                            -- critical|warning|info
    category    TEXT,                            -- mrp|po|shipment|inventory
    title       TEXT NOT NULL,
    message     TEXT,
    action      TEXT,                            -- 액션 레이블
    action_nav  TEXT,                            -- nav 대상 ('mrp', 'polist' 등)
    is_read     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 4. VENDORKPI (협력사 KPI 성과 기록)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendorkpi (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    vendor_code     TEXT NOT NULL,
    period          TEXT,                        -- "2026-Q1" / "2026-02"
    eval_date       DATE,
    otd             NUMERIC DEFAULT 0,           -- On-Time Delivery (%)
    quality         NUMERIC DEFAULT 0,           -- Quality Score (%)
    lt_compliance   NUMERIC DEFAULT 0,           -- Lead Time Compliance (%)
    responsiveness  NUMERIC DEFAULT 0,           -- Responsiveness (%)
    overall_score   NUMERIC DEFAULT 0,           -- 종합 점수 (%)
    defect_ppm      INTEGER DEFAULT 0,
    late_deliveries INTEGER DEFAULT 0,
    total_orders    INTEGER DEFAULT 0,
    notes           TEXT,
    evaluated_by    TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 5. LANDEDCOST (관세 / 물류비 계산)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS landedcost (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    shipment_no     TEXT,                        -- hqtrade.shipment_no 참조
    po_ref          TEXT,
    vendor_code     TEXT,
    part_no         TEXT,
    qty             NUMERIC DEFAULT 0,
    invoice_amt     NUMERIC DEFAULT 0,
    freight_cost    NUMERIC DEFAULT 0,
    insurance_cost  NUMERIC DEFAULT 0,
    customs_duty    NUMERIC DEFAULT 0,
    duty_rate       NUMERIC DEFAULT 0,           -- %
    other_cost      NUMERIC DEFAULT 0,
    total_landed    NUMERIC DEFAULT 0,           -- 총 착지원가
    currency        TEXT DEFAULT 'USD',
    calc_date       DATE,
    remarks         TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_polist_vendor    ON polist(vendor_code);
CREATE INDEX IF NOT EXISTS idx_polist_status    ON polist(status);
CREATE INDEX IF NOT EXISTS idx_hqtrade_vendor   ON hqtrade(vendor_code);
CREATE INDEX IF NOT EXISTS idx_hqtrade_status   ON hqtrade(status);
CREATE INDEX IF NOT EXISTS idx_alerts_type      ON alerts(type);
CREATE INDEX IF NOT EXISTS idx_alerts_read      ON alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_vendorkpi_vendor ON vendorkpi(vendor_code);
CREATE INDEX IF NOT EXISTS idx_landedcost_ship  ON landedcost(shipment_no);

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────
ALTER TABLE polist      ENABLE ROW LEVEL SECURITY;
ALTER TABLE hqtrade     ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendorkpi   ENABLE ROW LEVEL SECURITY;
ALTER TABLE landedcost  ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY['polist','hqtrade','alerts','vendorkpi','landedcost'] LOOP
        EXECUTE format(
            'CREATE POLICY "rw_authenticated" ON %I FOR ALL USING (auth.role() = ''authenticated'')',
            tbl
        );
    END LOOP;
END $$;

-- ─────────────────────────────────────────
-- PostgREST 스키마 캐시 리프레시
-- ─────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
