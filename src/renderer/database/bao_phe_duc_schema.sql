-- =============================================================================
-- Schema lưu trữ dữ liệu "Báo Phế Đúc" — chống mất dữ liệu khi reload
-- (Viết theo cú pháp Postgres; nếu dùng SQLite: SERIAL -> INTEGER PRIMARY KEY
--  AUTOINCREMENT, TIMESTAMP DEFAULT now() -> DATETIME DEFAULT CURRENT_TIMESTAMP,
--  và câu UPSERT dùng INSERT ... ON CONFLICT(...) DO UPDATE SET ... vẫn hoạt
--  động tương tự vì SQLite >= 3.24 hỗ trợ cú pháp này.)
-- =============================================================================

-- 1. Phiếu báo phế theo ngày (1 phiếu / 1 ngày / 1 công đoạn)
CREATE TABLE IF NOT EXISTS bao_phe_duc (
  id              SERIAL PRIMARY KEY,
  ngay            DATE NOT NULL,
  trang_thai      VARCHAR(20) NOT NULL DEFAULT 'nhap', -- 'nhap' | 'da_in'
  file_full_path  TEXT,
  file_qc_path    TEXT,
  created_at      TIMESTAMP NOT NULL DEFAULT now(),
  updated_at      TIMESTAMP NOT NULL DEFAULT now(),
  exported_at     TIMESTAMP,
  UNIQUE (ngay)
);

-- 2. Chi tiết từng dòng phế — liên kết bắt buộc qua mai_id (KHÔNG dùng
--    mã công đơn/quy cách làm khóa vì có thể trùng lặp giữa nhiều dòng thật)
CREATE TABLE IF NOT EXISTS bao_phe_duc_dong (
  id              SERIAL PRIMARY KEY,
  bao_phe_duc_id  INTEGER NOT NULL REFERENCES bao_phe_duc(id) ON DELETE CASCADE,
  mai_id          INTEGER NOT NULL REFERENCES mai(id),

  cat_pham        INTEGER NOT NULL DEFAULT 0,
  mai_pham        INTEGER NOT NULL DEFAULT 0,
  xi_ho           INTEGER NOT NULL DEFAULT 0,
  duc_thieu       INTEGER NOT NULL DEFAULT 0,
  lo_cat          INTEGER NOT NULL DEFAULT 0,
  lo_khi          INTEGER NOT NULL DEFAULT 0,
  lung_lo         INTEGER NOT NULL DEFAULT 0,
  bien_dang       INTEGER NOT NULL DEFAULT 0,
  mat_net         INTEGER NOT NULL DEFAULT 0,
  kep_cat         INTEGER NOT NULL DEFAULT 0,
  vet_nut         INTEGER NOT NULL DEFAULT 0,
  sai_kich_thuoc  INTEGER NOT NULL DEFAULT 0,
  kep_sat         INTEGER NOT NULL DEFAULT 0,
  lanh_ngat       INTEGER NOT NULL DEFAULT 0,
  lo_xi           INTEGER NOT NULL DEFAULT 0,
  khac            INTEGER NOT NULL DEFAULT 0,

  updated_at      TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (bao_phe_duc_id, mai_id)  -- cho phép upsert an toàn, không tạo dòng trùng
);

CREATE INDEX IF NOT EXISTS idx_bpd_dong_mai_id ON bao_phe_duc_dong(mai_id);
CREATE INDEX IF NOT EXISTS idx_bpd_dong_header ON bao_phe_duc_dong(bao_phe_duc_id);
