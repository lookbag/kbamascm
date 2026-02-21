// ════════════════════════════════════════════════════════
//  SCM Pro — Configuration
//  이 파일을 .gitignore에 추가하세요 (보안)
//  GitHub에 올리지 마세요 — Anon Key는 공개돼도 되지만
//  RLS(Row Level Security)가 설정된 경우에만 안전합니다.
// ════════════════════════════════════════════════════════

const CONFIG = {
  // Supabase 프로젝트 설정
  SUPABASE_URL: 'https://inhyqhtrpsjpiyywtfhw.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImluaHlxaHRycHNqcGl5eXd0Zmh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MjY5NTksImV4cCI6MjA4NzEwMjk1OX0.fL98cBPGk0itA3x8gWGTXt-5UIpYDXIMvplriZaTwKg',   // ← 여기에 Anon Key 입력 (Supabase Dashboard > Settings > API)

  // 앱 설정
  APP_NAME: 'KBAMA SCM',
  APP_VERSION: 'STEP-5',

  // DB 모드: 'supabase' | 'local' | 'auto'
  //   'supabase' = Supabase만 사용 (key 없으면 에러)
  //   'local'    = LocalStorage만 사용 (오프라인 전용)
  //   'auto'     = Supabase 우선, 실패시 Local로 fallback
  DB_MODE: 'auto',

  // Supabase 테이블 이름 매핑
  TABLES: {
    vendors:        'scm_vendors',
    parts:          'scm_parts',
    products:       'scm_products',
    bom:            'scm_bom',
    inventory:      'scm_inventory',
    forecast:       'scm_forecast',
    polist:         'scm_po',
    import_history: 'scm_import_history',
  },

  // 각 테이블의 primary key (upsert 충돌 해소용)
  PRIMARY_KEYS: {
    vendors:        'vendor_code',
    parts:          'part_no',
    products:       'part_no',
    bom:            'id',
    inventory:      'id',
    forecast:       'id',
    polist:         'po_number',
    import_history: 'id',
  },
};
