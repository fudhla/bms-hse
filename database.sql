-- =======================================================
-- Skrip Pembuatan Database & Tabel Sistem Inspeksi HSE
-- PT. Besmindo Materi Sewatama
-- =======================================================

-- 1. Buat Database jika belum ada
CREATE DATABASE IF NOT EXISTS bms_hse_db;
USE bms_hse_db;

-- 2. Buat Tabel users (Autentikasi Admin & Karyawan Rig)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NULL,
  role ENUM('admin', 'karyawan') NOT NULL DEFAULT 'karyawan',
  rig_name VARCHAR(50) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Seeder Akun Pengguna (Admin Pak Edo & 20 Akun Karyawan Rig)
INSERT INTO users (username, password, name, role, rig_name) VALUES
('admin_besmindo', 'adminbesmindo', 'Admin Besmindo', 'admin', NULL),
('bms_01', '11111111', 'Rig BMS 01', 'karyawan', 'BMS 01'),
('bms_02', '22222222', 'Rig BMS 02', 'karyawan', 'BMS 02'),
('bms_03', '33333333', 'Rig BMS 03', 'karyawan', 'BMS 03'),
('bms_03a', '03030303a', 'Rig BMS 03A', 'karyawan', 'BMS 03A'),
('bms_05', '55555555', 'Rig BMS 05', 'karyawan', 'BMS 05'),
('bms_06', '66666666', 'Rig BMS 06', 'karyawan', 'BMS 06'),
('bms_07', '77777777', 'Rig BMS 07', 'karyawan', 'BMS 07'),
('bms_08', '88888888', 'Rig BMS 08', 'karyawan', 'BMS 08'),
('bms_09', '99999999', 'Rig BMS 09', 'karyawan', 'BMS 09'),
('bms_10', '10101010', 'Rig BMS 10', 'karyawan', 'BMS 10'),
('bms_11', '11111111', 'Rig BMS 11', 'karyawan', 'BMS 11'),
('bms_15', '15151515', 'Rig BMS 15', 'karyawan', 'BMS 15'),
('bms_16', '16161616', 'Rig BMS 16', 'karyawan', 'BMS 16'),
('bms_17', '17171717', 'Rig BMS 17', 'karyawan', 'BMS 17'),
('bms_18', '18181818', 'Rig BMS 18', 'karyawan', 'BMS 18'),
('bms_19', '19191919', 'Rig BMS 19', 'karyawan', 'BMS 19'),
('bms_20', '20202020', 'Rig BMS 20', 'karyawan', 'BMS 20'),
('bms_21', '21212121', 'Rig BMS 21', 'karyawan', 'BMS 21'),
('bms_22', '22222222', 'Rig BMS 22', 'karyawan', 'BMS 22'),
('bms_23', '23232323', 'Rig BMS 23', 'karyawan', 'BMS 23')
ON DUPLICATE KEY UPDATE 
  password = VALUES(password),
  name = VALUES(name),
  role = VALUES(role),
  rig_name = VALUES(rig_name);

-- 4. Buat Tabel inspections
CREATE TABLE IF NOT EXISTS inspections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  form_type VARCHAR(100) NOT NULL,
  form_code VARCHAR(100) NULL,
  rig_no VARCHAR(100) NULL,
  tanggal VARCHAR(50) NULL,
  lokasi VARCHAR(255) NULL,
  status_rig VARCHAR(100) NULL,
  rekomendasi TEXT NULL,
  hfo_name VARCHAR(150) NULL,
  tool_pusher_name VARCHAR(150) NULL,
  status ENUM('draft', 'submitted') NOT NULL DEFAULT 'draft',
  form_data JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indeks pencarian
CREATE INDEX idx_form_type ON inspections(form_type);
CREATE INDEX idx_rig_no ON inspections(rig_no);
CREATE INDEX idx_tanggal ON inspections(tanggal);
CREATE INDEX idx_status ON inspections(status);

-- 5. Buat Tabel inspection_alerts (Closed-Loop Corrective Action)
CREATE TABLE IF NOT EXISTS inspection_alerts (
  id VARCHAR(100) PRIMARY KEY,
  inspection_id INT NULL,
  rig_no VARCHAR(100) NOT NULL,
  form_type VARCHAR(100) NOT NULL,
  tanggal VARCHAR(50) NOT NULL,
  komponen_alat VARCHAR(255) NOT NULL,
  kondisi VARCHAR(100) NOT NULL,
  catatan_temuan TEXT NULL,
  lokasi_area VARCHAR(255) NULL,
  tindakan_rekomendasi VARCHAR(255) NULL,
  prioritas VARCHAR(50) DEFAULT 'Sedang',
  hfo_name VARCHAR(150) NULL,
  icon VARCHAR(50) DEFAULT 'AlertTriangle',
  bukti_foto LONGTEXT NULL,
  tanggal_perbaikan DATE NULL,
  catatan_perbaikan TEXT NULL,
  diperbaiki_oleh VARCHAR(150) NULL,
  status_alert ENUM('OPEN', 'PENDING_REVIEW', 'CLOSED', 'REJECTED') NOT NULL DEFAULT 'OPEN',
  alasan_reject TEXT NULL,
  diverifikasi_oleh VARCHAR(150) NULL,
  tanggal_verifikasi DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_rig_status (rig_no, status_alert)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
