import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'bms_hse_jwt_secret_key_2026';

// ── 1. KONFIGURASI CORS ──────────────────────────────────────────
// Mengizinkan frontend Vite (http://localhost:5173, 5174, dll.)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ── 2. KONEKSI KE DATABASE MYSQL (XAMPP) ─────────────────────────
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bms_hse_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ── DAFTAR 20 RIG RESMI PT. BESMINDO MATERI SEWATAMA ─────────────
const ALL_RIGS = [
  'BMS 01', 'BMS 02', 'BMS 03', 'BMS 03A', 'BMS 05',
  'BMS 06', 'BMS 07', 'BMS 08', 'BMS 09', 'BMS 10',
  'BMS 11', 'BMS 15', 'BMS 16', 'BMS 17', 'BMS 18',
  'BMS 19', 'BMS 20', 'BMS 21', 'BMS 22', 'BMS 23'
];

// ── DEFINISI 9 FORMULIR INSPEKSI HSE STANDAR ─────────────────────
const FORM_DEFINITIONS = [
  { id: 'apar', title: 'APAR Inspection Form', docNo: 'BMSD/13/FO/HSE/12/25', icon: 'Flame', matchers: ['apar'] },
  { id: 'apd', title: 'APD / PPE Inspection Form', docNo: 'BMSD/22/FO/HSE/01/26', icon: 'ShieldAlert', matchers: ['apd', 'pelindung diri', 'v&v'] },
  { id: 'eyewash', title: 'Eye Wash & Shower Inspection Form', docNo: 'BMSD/44/FO/HSE/12/25', icon: 'Eye', matchers: ['shower', 'eyewash', 'eye wash'] },
  { id: 'firstaid', title: 'First Aid Box Form', docNo: 'BMSD/46/FO/HSE/04/25', icon: 'HeartPulse', matchers: ['first aid', 'p3k'] },
  { id: 'harness', title: 'Harness Inspection Form', docNo: 'BMSD/17/FO/HSE/08/26', icon: 'Shield', matchers: ['harness', 'lanyard'] },
  { id: 'oxigent', title: 'Oxigent Monthly Form', docNo: 'BMSD/47/FO/HSE/08/21', icon: 'Cylinder', matchers: ['oxigent', 'oksigen'] },
  { id: 'scba', title: 'SCBA Monthly Form', docNo: 'BMSD/43/FO/HSE/06/25', icon: 'Wind', matchers: ['scba'] },
  { id: 'spillkit', title: 'Spill Kit Inspection Form', docNo: 'BMSD/48/FO/HSE/09/21', icon: 'Box', matchers: ['spill kit', 'spillkit'] },
  { id: 'stretcher', title: 'Stretcher Inspection Form', docNo: 'BMSD/45/FO/HSE/06/20', icon: 'Activity', matchers: ['stretcher', 'tandu'] }
];

// Helper normalisasi nama Rig
function normalizeRig(str) {
  if (!str) return '';
  return str.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// Helper pemetaan form_type ke ID form
function matchForm(formType) {
  if (!formType) return null;
  const lower = formType.toLowerCase().trim();
  if (lower === 'apar_hybrid' || lower.includes('apar_hybrid') || lower.includes('apar hybrid') || (lower.includes('hybrid') && lower.includes('apar'))) {
    return 'apar_hybrid';
  }
  if (lower === 'apar_standar' || lower.includes('apar_standar') || lower.includes('apar standar') || (lower.includes('standar') && lower.includes('apar'))) {
    return 'apar_standar';
  }
  if (lower === 'eyewash_hybrid' || lower.includes('eyewash_hybrid') || lower.includes('eyewash hybrid') || (lower.includes('hybrid') && (lower.includes('eyewash') || lower.includes('shower')))) {
    return 'eyewash_hybrid';
  }
  if (lower === 'eyewash_standar' || lower.includes('eyewash_standar') || lower.includes('eyewash standar') || (lower.includes('standar') && (lower.includes('eyewash') || lower.includes('shower')))) {
    return 'eyewash_standar';
  }
  for (const def of FORM_DEFINITIONS) {
    if (def.matchers.some(m => lower.includes(m))) {
      return def.id;
    }
  }
  return lower;
}

// ── 3. INISIALISASI TABEL & SEEDER DATABASE ──────────────────────
(async function initDatabase() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('✓ Terhubung ke database MySQL:', process.env.DB_NAME || 'bms_hse_db');

    // 1. Buat tabel users jika belum ada
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'karyawan',
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        rig_name VARCHAR(50) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Pastikan kolom status dan tipe role sudah mendukung nilai fleksibel
    try {
      const [colCheck] = await connection.query("SHOW COLUMNS FROM users LIKE 'status'");
      if (!colCheck || colCheck.length === 0) {
        await connection.query("ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active' AFTER role");
      }
    } catch (e) {}
    try {
      await connection.query("ALTER TABLE users MODIFY COLUMN role VARCHAR(50) NOT NULL DEFAULT 'karyawan'");
    } catch (e) {}
    try {
      await connection.query("UPDATE users SET status = 'active' WHERE status IS NULL OR status = ''");
    } catch (e) {}

    // 2. Seeder Akun Admin (admin_besmindo) & 20 Akun Rig
    await connection.query(`
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
        name = VALUES(name),
        role = VALUES(role),
        rig_name = VALUES(rig_name);
    `);
    console.log('✓ Seeder akun pengguna (admin_besmindo & 20 Rig) berhasil dipastikan.');

    // 3. Buat tabel inspections jika belum ada
    await connection.query(`
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
    `);

    // Pastikan kolom status dan updated_at ada jika tabel sudah ada sebelumnya
    try {
      const [colStatus] = await connection.query(`SHOW COLUMNS FROM inspections LIKE 'status'`);
      if (colStatus.length === 0) {
        await connection.query(`ALTER TABLE inspections ADD COLUMN status ENUM('draft', 'submitted') NOT NULL DEFAULT 'draft'`);
      }
      const [colUpdated] = await connection.query(`SHOW COLUMNS FROM inspections LIKE 'updated_at'`);
      if (colUpdated.length === 0) {
        await connection.query(`ALTER TABLE inspections ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
      }
      await connection.query(`UPDATE inspections SET status = 'submitted' WHERE status IS NULL OR status = ''`);

      // Pastikan kolom period ada untuk isolasi data bulanan (Closed-Loop Monthly Inspections)
      const [colPeriod] = await connection.query(`SHOW COLUMNS FROM inspections LIKE 'period'`);
      if (colPeriod.length === 0) {
        await connection.query(`ALTER TABLE inspections ADD COLUMN period VARCHAR(20) NULL AFTER rig_no`);
        try {
          await connection.query(`ALTER TABLE inspections ADD INDEX idx_insp_rig_type_period (rig_no, form_type, period)`);
        } catch (idxErr) {}
      }
      // Backfill nilai period dari tanggal lama
      await connection.query(`
        UPDATE inspections 
        SET period = DATE_FORMAT(tanggal, '%Y-%m') 
        WHERE (period IS NULL OR period = '') AND tanggal REGEXP '^[0-9]{4}-[0-9]{2}'
      `);
    } catch (colErr) {
      console.log('Pemeriksaan kolom status & period:', colErr.message);
    }

    // 4. Buat tabel harness_inspections & harness_items
    await connection.query(`
      CREATE TABLE IF NOT EXISTS harness_inspections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        inspection_id INT NULL,
        rig_no VARCHAR(100) NOT NULL,
        tanggal VARCHAR(50) NULL,
        derrickman_name VARCHAR(150) NULL,
        tool_pusher_name VARCHAR(150) NULL,
        wsr_name VARCHAR(150) NULL,
        remark TEXT NULL,
        status ENUM('draft', 'submitted') NOT NULL DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_harness_rig_tgl (rig_no, tanggal)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS harness_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        harness_inspection_id INT NULL,
        rig_no VARCHAR(100) NOT NULL,
        component_id INT NOT NULL,
        component_name VARCHAR(150) NOT NULL,
        image_data LONGTEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_harness_item_comp (rig_no, component_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. Buat tabel available_years untuk sinkronisasi periode tahun global
    await connection.query(`
      CREATE TABLE IF NOT EXISTS available_years (
        year INT PRIMARY KEY,
        created_by VARCHAR(100) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      INSERT IGNORE INTO available_years (year, created_by) VALUES
      (2024, 'system'),
      (2025, 'system'),
      (2026, 'system'),
      (2027, 'system');
    `);

    try {
      await connection.query(`
        INSERT IGNORE INTO available_years (year, created_by)
        SELECT DISTINCT CAST(SUBSTRING(tanggal, 1, 4) AS UNSIGNED) AS year, 'legacy'
        FROM inspections 
        WHERE tanggal IS NOT NULL 
          AND LENGTH(tanggal) >= 4 
          AND SUBSTRING(tanggal, 1, 4) REGEXP '^[0-9]{4}$'
          AND CAST(SUBSTRING(tanggal, 1, 4) AS UNSIGNED) BETWEEN 2020 AND 2099;
      `);
    } catch (yrSeedErr) {
      console.log('Pemeriksaan seed available_years:', yrSeedErr.message);
    }

    // 6. Buat tabel inspection_alerts untuk Closed-Loop Corrective Action
    await connection.query(`
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
    `);

    try {
      await syncAlertsToDatabase(connection);
      console.log('✓ inspection_alerts disinkronisasi.');
    } catch (sErr) {
      console.log('Sinkronisasi inspection_alerts startup:', sErr.message);
    }

    console.log('✓ Database dan tabel berhasil diinisialisasi.');
  } catch (err) {
    console.error('⚠️ Peringatan koneksi MySQL:', err.message);
    console.log('Pastikan MySQL (XAMPP) sudah berjalan dan database "bms_hse_db" telah dibuat.');
  } finally {
    if (connection) connection.release();
  }
})();

// ── 4. ENDPOINT HEALTH CHECK ─────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', timestamp: new Date() });
  } catch (err) {
    res.status(500).json({ status: 'error', database: 'disconnected', error: err.message });
  }
});

// ── 5. ENDPOINT AUTENTIKASI (LOGIN & SESSION) ────────────────────
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username dan password wajib diisi!'
      });
    }

    const trimmedUser = String(username).trim();
    const trimmedPass = String(password).trim();

    const query = `
      SELECT id, username, password, name, role, rig_name 
      FROM users 
      WHERE LOWER(username) = LOWER(?) 
         OR LOWER(REPLACE(username, '_', '')) = LOWER(REPLACE(?, '_', ''))
         OR LOWER(REPLACE(username, '_', ' ')) = LOWER(?)
         OR LOWER(rig_name) = LOWER(?)
      LIMIT 1
    `;

    const [rows] = await pool.query(query, [trimmedUser, trimmedUser, trimmedUser, trimmedUser]);

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Akun dengan username tersebut tidak ditemukan!'
      });
    }

    const user = rows[0];
    let isPasswordValid = false;

    // Cek apakah password tersimpan dalam format hash bcrypt ($2a$ atau $2b$)
    const isBcryptHash = user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'));

    if (isBcryptHash) {
      isPasswordValid = await bcrypt.compare(trimmedPass, user.password);
    } else {
      // Legacy plaintext password check
      isPasswordValid = (user.password === trimmedPass);

      // Auto-upgrade password ke hash bcrypt secara transparan
      if (isPasswordValid) {
        try {
          const hashedPassword = await bcrypt.hash(trimmedPass, 10);
          await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);
          console.log(`[Security] Password akun ${user.username} berhasil di-upgrade ke bcrypt hash.`);
        } catch (upgradeErr) {
          console.warn('[Security] Gagal auto-upgrade password:', upgradeErr.message);
        }
      }
    }

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Password yang Anda masukkan salah!'
      });
    }

    const tokenPayload = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      rig_name: user.rig_name
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    return res.json({
      success: true,
      message: 'Login berhasil!',
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        rig_name: user.rig_name
      }
    });
  } catch (err) {
    console.error('Error saat login:', err);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat login: ' + err.message
    });
  }
});

// Cek sesi user aktif
app.get('/api/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Token tidak disediakan' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    return res.json({ success: true, user: decoded });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Sesi login telah kedaluwarsa atau tidak valid' });
  }
});

app.post('/api/logout', (req, res) => {
  res.json({ success: true, message: 'Logout berhasil' });
});

// Middleware autentikasi umum (JWT Bearer Token)
function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Akses ditolak: Token autentikasi JWT diperlukan.' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.currentUser = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Sesi login tidak valid atau telah kedaluwarsa.' });
  }
}

// Middleware autentikasi Admin
function requireAdmin(req, res, next) {
  authenticateToken(req, res, () => {
    if (req.currentUser.role !== 'admin' && req.currentUser.username !== 'admin_besmindo') {
      return res.status(403).json({ success: false, message: 'Akses ditolak: Hanya Administrator yang diizinkan.' });
    }
    next();
  });
}

// Daftar user untuk Admin
app.get('/api/users', requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, username, password, name, role, rig_name, created_at, updated_at 
      FROM users 
      WHERE role = 'karyawan'
      ORDER BY id ASC
    `);

    // Mask bcrypt hash untuk kenyamanan tampilan tabel Admin
    const safeRows = rows.map(u => ({
      ...u,
      password: (u.password && (u.password.startsWith('$2a$') || u.password.startsWith('$2b$')))
        ? '•••••••• (Bcrypt)'
        : u.password
    }));

    res.json({ success: true, data: safeRows });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data akun: ' + err.message });
  }
});

// ── CRUD MANAJEMEN AKUN RIG DARI DATABASE MYSQL ─────────────────
// 1. GET /api/rigs - Ambil seluruh akun Rig dari database
app.get('/api/rigs', async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT id, username, name, role, status, rig_name, password, created_at, updated_at 
      FROM users 
      WHERE (role = 'karyawan' OR role = 'rig')
    `;
    const params = [];

    if (status === 'active') {
      query += ` AND (status IS NULL OR status = 'active' OR status != 'inactive')`;
    } else if (status === 'inactive') {
      query += ` AND status = 'inactive'`;
    }

    query += ` ORDER BY id ASC`;
    const [rows] = await pool.query(query, params);

    // Masking hash password bcrypt untuk keamanan UI
    const safeRows = rows.map(u => ({
      ...u,
      status: u.status || 'active',
      password: (u.password && (u.password.startsWith('$2a$') || u.password.startsWith('$2b$')))
        ? '•••••••• (Bcrypt)'
        : u.password
    }));

    res.json({ success: true, data: safeRows });
  } catch (err) {
    console.error('Error fetching rigs from db:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data rig: ' + err.message });
  }
});

// 2. POST /api/rigs - Tambah akun Rig baru ke database MySQL
app.post('/api/rigs', async (req, res) => {
  try {
    const { rig_name, username, password } = req.body;

    if (!rig_name || !String(rig_name).trim()) {
      return res.status(400).json({ success: false, message: 'Nama Rig wajib diisi!' });
    }
    if (!username || !String(username).trim()) {
      return res.status(400).json({ success: false, message: 'Username login wajib diisi!' });
    }
    if (!password || String(password).trim().length < 8) {
      return res.status(400).json({ success: false, message: 'Password minimal 8 karakter' });
    }

    const cleanRigName = String(rig_name).trim().toUpperCase();
    const cleanUsername = String(username).trim().toLowerCase();
    const cleanPassword = String(password).trim();

    // Periksa apakah username atau rig_name sudah ada di database
    const [existing] = await pool.query(
      'SELECT id, username, rig_name FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(rig_name) = LOWER(?) LIMIT 1',
      [cleanUsername, cleanRigName]
    );

    if (existing.length > 0) {
      if (existing[0].username.toLowerCase() === cleanUsername) {
        return res.status(400).json({ success: false, message: `Username "${cleanUsername}" sudah digunakan oleh akun lain!` });
      }
      return res.status(400).json({ success: false, message: `Rig "${cleanRigName}" sudah terdaftar di sistem!` });
    }

    const hashedPassword = await bcrypt.hash(cleanPassword, 10);
    const displayName = cleanRigName.startsWith('RIG ') ? cleanRigName : `Rig ${cleanRigName}`;

    const [result] = await pool.query(
      'INSERT INTO users (username, password, name, role, status, rig_name) VALUES (?, ?, ?, ?, ?, ?)',
      [cleanUsername, hashedPassword, displayName, 'karyawan', 'active', cleanRigName]
    );

    return res.status(201).json({
      success: true,
      message: `Akun Rig ${cleanRigName} berhasil didaftarkan ke sistem!`,
      data: {
        id: result.insertId,
        rig_name: cleanRigName,
        username: cleanUsername,
        name: displayName,
        role: 'karyawan',
        status: 'active'
      }
    });
  } catch (err) {
    console.error('Error creating rig account:', err);
    return res.status(500).json({ success: false, message: 'Gagal menambahkan akun rig: ' + err.message });
  }
});

// 3. PUT /api/rigs/:id/password - Ubah password akun Rig
app.put('/api/rigs/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || String(newPassword).trim().length < 8) {
      return res.status(400).json({ success: false, message: 'Password minimal 8 karakter' });
    }

    const trimmed = String(newPassword).trim();
    const hashedPassword = await bcrypt.hash(trimmed, 10);

    const [result] = await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Akun rig tidak ditemukan di database.' });
    }

    return res.json({ success: true, message: 'Password akun rig berhasil diperbarui!' });
  } catch (err) {
    console.error('Error updating rig password:', err);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui password: ' + err.message });
  }
});

// 4. PUT /api/rigs/:id/status - Ubah status aktif/nonaktif akun Rig
app.put('/api/rigs/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const newStatus = status === 'inactive' ? 'inactive' : 'active';
    const [result] = await pool.query('UPDATE users SET status = ? WHERE id = ?', [newStatus, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Akun rig tidak ditemukan di database.' });
    }

    return res.json({
      success: true,
      message: `Status akun rig berhasil diubah menjadi ${newStatus === 'active' ? 'Aktif' : 'Nonaktif'}!`,
      status: newStatus
    });
  } catch (err) {
    console.error('Error updating rig status:', err);
    return res.status(500).json({ success: false, message: 'Gagal mengubah status rig: ' + err.message });
  }
});

// 5. DELETE /api/rigs/:id - Hapus atau Nonaktifkan akun Rig
app.delete('/api/rigs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;

    const [rows] = await pool.query('SELECT id, username, rig_name, role FROM users WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Akun rig tidak ditemukan.' });
    }

    if (rows[0].role === 'admin') {
      return res.status(403).json({ success: false, message: 'Akun Administrator master tidak boleh dihapus!' });
    }

    if (permanent === 'true') {
      await pool.query('DELETE FROM users WHERE id = ?', [id]);
      return res.json({
        success: true,
        message: `Akun ${rows[0].rig_name || rows[0].username} berhasil dihapus permanen dari sistem.`
      });
    } else {
      await pool.query('UPDATE users SET status = "inactive" WHERE id = ?', [id]);
      return res.json({
        success: true,
        message: `Akun ${rows[0].rig_name || rows[0].username} berhasil dinonaktifkan.`
      });
    }
  } catch (err) {
    console.error('Error deleting/deactivating rig:', err);
    return res.status(500).json({ success: false, message: 'Gagal memproses akun rig: ' + err.message });
  }
});

// Reset Password oleh Admin
app.put('/api/admin/reset-password', requireAdmin, async (req, res) => {
  try {
    const { userId, username, newPassword } = req.body;

    if (!newPassword || String(newPassword).trim().length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password baru minimal harus 8 karakter!'
      });
    }

    const trimmedPass = String(newPassword).trim();
    let targetUser = null;

    if (userId) {
      const [rows] = await pool.query('SELECT id, username, rig_name, role FROM users WHERE id = ?', [userId]);
      if (rows.length > 0) targetUser = rows[0];
    } else if (username) {
      const [rows] = await pool.query('SELECT id, username, rig_name, role FROM users WHERE LOWER(username) = LOWER(?)', [username.trim()]);
      if (rows.length > 0) targetUser = rows[0];
    }

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Akun pengguna tidak ditemukan di database.'
      });
    }

    const hashedPassword = await bcrypt.hash(trimmedPass, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, targetUser.id]);

    return res.json({
      success: true,
      message: `Password akun ${targetUser.rig_name || targetUser.username} berhasil diperbarui dan diamankan dengan bcrypt!`,
      userId: targetUser.id,
      username: targetUser.username
    });
  } catch (err) {
    console.error('Error updating password:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui password di server: ' + err.message
    });
  }
});

app.put('/api/users/:id/password', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || String(newPassword).trim().length < 8) {
      return res.status(400).json({ success: false, message: 'Password baru minimal harus 8 karakter!' });
    }

    const trimmedPass = String(newPassword).trim();
    const [rows] = await pool.query('SELECT id, username, rig_name FROM users WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Akun tidak ditemukan.' });
    }

    const hashedPassword = await bcrypt.hash(trimmedPass, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);

    return res.json({
      success: true,
      message: `Password akun ${rows[0].rig_name || rows[0].username} berhasil diperbarui dan diamankan dengan bcrypt!`,
      userId: rows[0].id,
      username: rows[0].username
    });
  } catch (err) {
    console.error('Error updating password by ID:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui password: ' + err.message });
  }
});

// ── 5.1 ENDPOINT UPDATE PROFIL ADMIN (NAMA & PASSWORD) ───────────
app.put('/api/admin/profile', async (req, res) => {
  try {
    const { name, oldPassword, newPassword } = req.body;
    let authUser = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        authUser = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
      } catch (e) {}
    }

    const adminUsername = authUser?.username || 'admin_besmindo';
    const [rows] = await pool.query('SELECT * FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1', [adminUsername]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Akun admin tidak ditemukan di database.' });
    }

    const admin = rows[0];

    // Jika user mengisi password baru, verifikasi password lama
    if (newPassword && String(newPassword).trim().length > 0) {
      const trimmedNew = String(newPassword).trim();
      if (trimmedNew.length < 6) {
        return res.status(400).json({ success: false, message: 'Password baru minimal harus 6 karakter!' });
      }
      if (!oldPassword || String(oldPassword).trim().length === 0) {
        return res.status(400).json({ success: false, message: 'Kata sandi lama wajib diisi untuk verifikasi keamanan!' });
      }

      const trimmedOld = String(oldPassword).trim();
      const isBcrypt = admin.password && (admin.password.startsWith('$2a$') || admin.password.startsWith('$2b$'));
      const isOldValid = isBcrypt
        ? await bcrypt.compare(trimmedOld, admin.password)
        : (admin.password === trimmedOld);

      if (!isOldValid) {
        return res.status(401).json({ success: false, message: 'Kata sandi lama yang Anda masukkan salah!' });
      }

      const hashedNew = await bcrypt.hash(trimmedNew, 10);
      await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedNew, admin.id]);
    }

    // Perbarui nama tampilan jika diisi
    const updatedName = name && String(name).trim().length > 0 ? String(name).trim() : admin.name;
    if (name && String(name).trim().length > 0) {
      await pool.query('UPDATE users SET name = ? WHERE id = ?', [updatedName, admin.id]);
    }

    return res.json({
      success: true,
      message: 'Profil Administrator berhasil diperbarui!',
      user: {
        id: admin.id,
        username: admin.username,
        name: updatedName,
        role: admin.role
      }
    });
  } catch (err) {
    console.error('Error updating admin profile:', err);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui profil admin: ' + err.message });
  }
});

// ── 6. ENDPOINT FILTER TAHUN PERIODE (AVAILABLE YEARS) ────────────
app.get('/api/available-years', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT year FROM available_years ORDER BY year ASC');
    let years = rows.map(r => Number(r.year)).filter(y => !isNaN(y) && y >= 2020 && y <= 2099);
    
    if (years.length === 0) {
      years = [2024, 2025, 2026, 2027];
    }
    
    years = Array.from(new Set(years)).sort((a, b) => a - b);
    return res.json({ success: true, data: years });
  } catch (err) {
    console.error('Error fetching available years:', err);
    return res.json({ success: true, data: [2024, 2025, 2026, 2027], fallback: true });
  }
});

app.post('/api/available-years', requireAdmin, async (req, res) => {
  try {
    const { year } = req.body;
    const yr = parseInt(year, 10);

    if (isNaN(yr) || yr < 2020 || yr > 2099) {
      return res.status(400).json({
        success: false,
        message: 'Tahun harus berupa 4 digit angka dalam rentang 2020 s/d 2099.'
      });
    }

    const adminUsername = req.currentUser?.username || 'admin';

    await pool.query(
      'INSERT INTO available_years (year, created_by) VALUES (?, ?) ON DUPLICATE KEY UPDATE year = year',
      [yr, adminUsername]
    );

    const [rows] = await pool.query('SELECT year FROM available_years ORDER BY year ASC');
    const updatedYears = Array.from(new Set(rows.map(r => Number(r.year)).filter(y => !isNaN(y) && y >= 2020 && y <= 2099))).sort((a, b) => a - b);

    return res.json({
      success: true,
      message: `Tahun ${yr} berhasil ditambahkan oleh Admin dan kini otomatis tersedia untuk semua akun Rig.`,
      data: updatedYears
    });
  } catch (err) {
    console.error('Error adding available year:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal menambahkan tahun ke database: ' + err.message
    });
  }
});

app.delete('/api/available-years/:year', requireAdmin, async (req, res) => {
  try {
    const yr = parseInt(req.params.year, 10);
    if (isNaN(yr)) {
      return res.status(400).json({ success: false, message: 'Format tahun tidak valid.' });
    }

    // Pastikan tidak menghapus jika hanya tersisa 1 tahun di sistem
    const [countRows] = await pool.query('SELECT COUNT(*) as total FROM available_years');
    if (countRows[0]?.total <= 1) {
      return res.status(400).json({
        success: false,
        message: 'Minimal harus tersisa 1 tahun dalam kalender operasional.'
      });
    }

    await pool.query('DELETE FROM available_years WHERE year = ?', [yr]);

    const [rows] = await pool.query('SELECT year FROM available_years ORDER BY year ASC');
    const updatedYears = Array.from(new Set(rows.map(r => Number(r.year)).filter(y => !isNaN(y) && y >= 2020 && y <= 2099))).sort((a, b) => a - b);

    return res.json({
      success: true,
      message: `Tahun ${yr} berhasil dihapus dari daftar periode.`,
      data: updatedYears
    });
  } catch (err) {
    console.error('Error deleting available year:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus tahun dari database: ' + err.message
    });
  }
});

// ── 6.5 ENDPOINT ANALYTICS & EXECUTIVE INTELLIGENCE PER PERIODE ──
app.get('/api/analytics', async (req, res) => {
  try {
    const now = new Date();
    let selectedMonth = parseInt(req.query.month, 10);
    let selectedYear = parseInt(req.query.year, 10);
    const periodQuery = req.query.period;

    if (periodQuery && periodQuery.includes('-')) {
      const parts = periodQuery.split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(y) && y >= 2000) selectedYear = y;
      if (!isNaN(m) && m >= 1 && m <= 12) selectedMonth = m;
    }

    if (!selectedMonth || isNaN(selectedMonth)) selectedMonth = now.getMonth() + 1;
    if (!selectedYear || isNaN(selectedYear)) selectedYear = now.getFullYear();

    const monthStr = String(selectedMonth).padStart(2, '0');
    const periodStr = `${selectedYear}-${monthStr}`;
    const monthPattern = `${periodStr}%`;

    // 1. Ambil jumlah Rig terdaftar aktif
    const [rigUsers] = await pool.query(`
      SELECT DISTINCT rig_name 
      FROM users 
      WHERE (role = 'karyawan' OR role = 'rig') 
        AND rig_name IS NOT NULL 
        AND rig_name != ''
        AND (status IS NULL OR status = 'active' OR status != 'inactive')
    `);
    const totalRigs = rigUsers.length > 0 ? rigUsers.length : ALL_RIGS.length;
    const totalWajib = totalRigs * 9; // 9 formulir HSE per Rig per bulan

    // 2. Ambil data inspeksi untuk periode yang dipilih
    const [inspections] = await pool.query(`
      SELECT id, form_type, rig_no, tanggal, status, hfo_name, tool_pusher_name, form_data, created_at, updated_at
      FROM inspections
      WHERE period = ? 
         OR tanggal LIKE ? 
         OR ((period IS NULL OR period = '') AND (YEAR(created_at) = ? AND MONTH(created_at) = ?))
      ORDER BY updated_at DESC, created_at DESC
    `, [periodStr, monthPattern, selectedYear, selectedMonth]);

    // 3. Klasifikasi status penyelesaian
    const submittedList = inspections.filter(i => i.status === 'submitted');
    const submittedCount = submittedList.length;
    const pendingCount = Math.max(0, totalWajib - submittedCount);
    const percentageCompleted = totalWajib > 0 ? Math.round((submittedCount / totalWajib) * 100) : 0;

    const completionData = [
      { name: 'Selesai (Submitted)', value: submittedCount, color: '#10B981' },
      { name: 'Belum Selesai (Pending/Draft)', value: pendingCount, color: '#94A3B8' }
    ];

    // 4. Ambil temuan alat rusak (inspection_alerts) pada periode ini
    const [alerts] = await pool.query(`
      SELECT id, rig_no, form_type, komponen_alat, kondisi, catatan_temuan, tanggal, status_alert, created_at
      FROM inspection_alerts
      WHERE tanggal LIKE ? 
         OR (YEAR(created_at) = ? AND MONTH(created_at) = ?)
    `, [monthPattern, selectedYear, selectedMonth]);

    const temuanRusakCount = alerts.length;

    // Hitung temuan rusak per Rig (Top 5 Defect Rigs)
    const rigDefectsMap = {};
    alerts.forEach(a => {
      const r = a.rig_no || 'Rig';
      if (!rigDefectsMap[r]) {
        rigDefectsMap[r] = {
          rig: r,
          temuanRusak: 0,
          kategori: a.komponen_alat || a.form_type || 'Peralatan'
        };
      }
      rigDefectsMap[r].temuanRusak += 1;
    });

    const topDefectRigs = Object.values(rigDefectsMap)
      .sort((a, b) => b.temuanRusak - a.temuanRusak)
      .slice(0, 5);

    // 5. Agregasi Top 3 HFO Teraktif
    const hfoMap = {};
    submittedList.forEach(insp => {
      const rawName = (
        insp.hfo_name ||
        insp.form_data?.hfo_name ||
        insp.form_data?.signatures?.hfo?.name ||
        insp.form_data?.signatures?.wfo?.name ||
        insp.form_data?.meta?.hfoName ||
        insp.form_data?.meta?.userName ||
        insp.form_data?.submitted_by ||
        ''
      ).trim();

      if (!rawName || rawName === '-' || rawName.toLowerCase() === 'null') return;

      const cleanName = rawName
        .replace(/\s*\(HSE\)/i, '')
        .replace(/\s*\(Medic\)/i, '')
        .replace(/\s*\(Safety\)/i, '')
        .trim();

      const rig = insp.rig_no || 'BMS Rig';

      if (!hfoMap[cleanName]) {
        hfoMap[cleanName] = { name: cleanName, rig, submittedCount: 0 };
      }
      hfoMap[cleanName].submittedCount += 1;
    });

    const topPerformers = Object.values(hfoMap)
      .sort((a, b) => b.submittedCount - a.submittedCount)
      .slice(0, 3);

    // 6. Tentukan Rig Terdisiplin (jumlah form submitted terbanyak)
    const rigSubmitMap = {};
    submittedList.forEach(insp => {
      if (insp.rig_no) {
        rigSubmitMap[insp.rig_no] = (rigSubmitMap[insp.rig_no] || 0) + 1;
      }
    });

    let bestRig = 'BMS 01';
    let maxSub = 0;
    for (const [r, count] of Object.entries(rigSubmitMap)) {
      if (count > maxSub) {
        maxSub = count;
        bestRig = r;
      }
    }

    const disciplinedRig = {
      rig: bestRig,
      count: maxSub,
      description: maxSub > 0 ? `${maxSub} Formulir Diselesaikan` : 'Belum Ada Data'
    };

    // 7. Tren Pengisian Formulir Mingguan (Minggu 1 - 4)
    const weekCounts = [0, 0, 0, 0];
    submittedList.forEach(insp => {
      let day = 1;
      if (insp.tanggal && insp.tanggal.includes('-')) {
        const parts = insp.tanggal.split('-');
        if (parts.length >= 3) day = parseInt(parts[2], 10) || 1;
      } else if (insp.created_at) {
        day = new Date(insp.created_at).getDate();
      }

      if (day <= 7) weekCounts[0]++;
      else if (day <= 14) weekCounts[1]++;
      else if (day <= 21) weekCounts[2]++;
      else weekCounts[3]++;
    });

    const targetPerWeek = Math.round(totalWajib / 4);
    const weeklyTrends = [
      { minggu: 'Minggu I', realisasi: weekCounts[0], target: targetPerWeek, onTimeRate: targetPerWeek > 0 ? Math.min(100, Math.round((weekCounts[0] / targetPerWeek) * 100)) : 0 },
      { minggu: 'Minggu II', realisasi: weekCounts[1], target: targetPerWeek, onTimeRate: targetPerWeek > 0 ? Math.min(100, Math.round((weekCounts[1] / targetPerWeek) * 100)) : 0 },
      { minggu: 'Minggu III', realisasi: weekCounts[2], target: targetPerWeek, onTimeRate: targetPerWeek > 0 ? Math.min(100, Math.round((weekCounts[2] / targetPerWeek) * 100)) : 0 },
      { minggu: 'Minggu IV', realisasi: weekCounts[3], target: targetPerWeek, onTimeRate: targetPerWeek > 0 ? Math.min(100, Math.round((weekCounts[3] / targetPerWeek) * 100)) : 0 }
    ];

    // Format nama bulan Indonesia
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const periodLabel = `${monthNames[selectedMonth - 1]} ${selectedYear}`;

    return res.json({
      success: true,
      data: {
        period: periodStr,
        periodLabel,
        selectedYear,
        selectedMonth,
        totalRigs,
        totalWajib,
        submittedCount,
        pendingCount,
        percentageCompleted,
        temuanRusakCount,
        disciplinedRig,
        completionData,
        topDefectRigs,
        topPerformers,
        weeklyTrends
      }
    });
  } catch (err) {
    console.error('Error in /api/analytics:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat analitik: ' + err.message
    });
  }
});

// ── 7. ENDPOINT OVERVIEW STATUS INSPEKSI (DASHBOARD & REKAP) ──────
app.get('/api/inspections/overview', async (req, res) => {
  try {
    const now = new Date();
    let selectedMonth = parseInt(req.query.month, 10);
    let selectedYear = parseInt(req.query.year, 10);
    if (req.query.period && req.query.period.includes('-')) {
      const parts = req.query.period.split('-');
      selectedYear = parseInt(parts[0], 10) || selectedYear;
      selectedMonth = parseInt(parts[1], 10) || selectedMonth;
    }
    if (!selectedMonth || isNaN(selectedMonth)) selectedMonth = now.getMonth() + 1;
    if (!selectedYear || isNaN(selectedYear)) selectedYear = now.getFullYear();
    const monthStr = String(selectedMonth).padStart(2, '0');
    const periodStr = `${selectedYear}-${monthStr}`;

    const monthPattern = `${periodStr}%`;
    const [rows] = await pool.query(`
      SELECT id, form_type, form_code, rig_no, period, tanggal, lokasi, status_rig, rekomendasi, hfo_name, tool_pusher_name, status, created_at, updated_at
      FROM inspections
      WHERE period = ? 
         OR tanggal LIKE ? 
         OR ((period IS NULL OR period = '') AND (YEAR(created_at) = ? AND MONTH(created_at) = ?))
      ORDER BY updated_at DESC, created_at DESC
    `, [periodStr, monthPattern, selectedYear, selectedMonth]);

    // Ambil seluruh daftar Rig aktif langsung dari database MySQL
    const [rigUsers] = await pool.query(`
      SELECT DISTINCT rig_name 
      FROM users 
      WHERE (role = 'karyawan' OR role = 'rig') 
        AND rig_name IS NOT NULL 
        AND rig_name != ''
        AND (status IS NULL OR status = 'active' OR status != 'inactive')
      ORDER BY id ASC
    `);

    const activeRigList = rigUsers.length > 0
      ? Array.from(new Set(rigUsers.map(u => u.rig_name.trim())))
      : ALL_RIGS;

    const rigMatrix = activeRigList.map(rigName => {
      const normRig = normalizeRig(rigName);
      const rigInspections = rows.filter(row => {
        const rowRig = normalizeRig(row.rig_no);
        return rowRig === normRig || rowRig.endsWith(normRig) || normRig.endsWith(rowRig);
      });

      const formsStatus = FORM_DEFINITIONS.map(fDef => {
        let match;
        if (fDef.id === 'apar') {
          const aparRows = rigInspections.filter(insp => {
            const ft = (insp.form_type || '').toLowerCase();
            return ft.includes('apar') || ft === 'apar_standar' || ft === 'apar_hybrid';
          });
          match = aparRows.find(r => r.status === 'submitted') || aparRows.find(r => r.status === 'draft') || aparRows[0];
        } else if (fDef.id === 'eyewash') {
          const ewRows = rigInspections.filter(insp => {
            const ft = (insp.form_type || '').toLowerCase();
            return ft.includes('eyewash') || ft.includes('shower') || ft === 'eyewash_standar' || ft === 'eyewash_hybrid';
          });
          match = ewRows.find(r => r.status === 'submitted') || ewRows.find(r => r.status === 'draft') || ewRows[0];
        } else {
          match = rigInspections.find(insp => matchForm(insp.form_type) === fDef.id);
        }
        
        let status = 'not_started';
        if (match) {
          status = match.status === 'draft' ? 'draft' : 'submitted';
        }

        return {
          form_id: fDef.id,
          title: fDef.title,
          doc_no: fDef.docNo,
          icon: fDef.icon,
          status: status,
          is_filled: status === 'submitted',
          is_draft: status === 'draft',
          last_submitted: match ? (match.updated_at || match.tanggal || match.created_at) : null,
          submission_id: match ? match.id : null,
          hfo_name: match ? match.hfo_name : null,
          tool_pusher_name: match ? match.tool_pusher_name : null
        };
      });

      const submittedCount = formsStatus.filter(f => f.status === 'submitted').length;
      const draftCount = formsStatus.filter(f => f.status === 'draft').length;
      const notStartedCount = formsStatus.filter(f => f.status === 'not_started').length;
      const totalForms = FORM_DEFINITIONS.length;

      return {
        rig_name: rigName,
        filled_count: submittedCount,
        submitted_count: submittedCount,
        draft_count: draftCount,
        not_started_count: notStartedCount,
        total_forms: totalForms,
        is_complete: submittedCount === totalForms,
        has_draft: draftCount > 0,
        percentage: Math.round((submittedCount / totalForms) * 100),
        forms: formsStatus
      };
    });

    const totalRigs = activeRigList.length;
    const completedRigs = rigMatrix.filter(r => r.is_complete).length;
    const inProgressRigs = rigMatrix.filter(r => !r.is_complete && (r.submitted_count > 0 || r.draft_count > 0)).length;
    const pendingRigs = totalRigs - completedRigs;
    const totalFormsSubmitted = rigMatrix.reduce((acc, r) => acc + r.submitted_count, 0);
    const totalFormsDraft = rigMatrix.reduce((acc, r) => acc + r.draft_count, 0);
    const totalFormsExpected = totalRigs * FORM_DEFINITIONS.length;

    res.json({
      success: true,
      filter: {
        month: selectedMonth,
        year: selectedYear,
        month_str: monthStr,
        period_label: `${selectedYear}-${monthStr}`
      },
      summary: {
        total_rigs: totalRigs,
        completed_rigs: completedRigs,
        in_progress_rigs: inProgressRigs,
        pending_rigs: pendingRigs,
        total_forms_expected: totalFormsExpected,
        total_forms_filled: totalFormsSubmitted,
        total_forms_submitted: totalFormsSubmitted,
        total_forms_draft: totalFormsDraft,
        overall_percentage: Math.round((totalFormsSubmitted / totalFormsExpected) * 100)
      },
      form_definitions: FORM_DEFINITIONS,
      rigs: rigMatrix
    });
  } catch (err) {
    console.error('Error in /api/inspections/overview:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil overview status inspeksi: ' + err.message
    });
  }
});

// Overview untuk 1 Rig spesifik
app.get('/api/inspections/overview/:rig_name', async (req, res) => {
  try {
    const { rig_name } = req.params;
    const now = new Date();
    let selectedMonth = parseInt(req.query.month, 10);
    let selectedYear = parseInt(req.query.year, 10);
    if (req.query.period && req.query.period.includes('-')) {
      const parts = req.query.period.split('-');
      selectedYear = parseInt(parts[0], 10) || selectedYear;
      selectedMonth = parseInt(parts[1], 10) || selectedMonth;
    }
    if (!selectedMonth || isNaN(selectedMonth)) selectedMonth = now.getMonth() + 1;
    if (!selectedYear || isNaN(selectedYear)) selectedYear = now.getFullYear();
    const monthStr = String(selectedMonth).padStart(2, '0');
    const periodStr = `${selectedYear}-${monthStr}`;

    const normRig = normalizeRig(rig_name);
    const monthPattern = `${periodStr}%`;

    const [rows] = await pool.query(`
      SELECT id, form_type, form_code, rig_no, period, tanggal, lokasi, status_rig, rekomendasi, hfo_name, tool_pusher_name, status, created_at, updated_at
      FROM inspections
      WHERE period = ?
         OR tanggal LIKE ?
         OR ((period IS NULL OR period = '') AND (YEAR(created_at) = ? AND MONTH(created_at) = ?))
      ORDER BY updated_at DESC, created_at DESC
    `, [periodStr, monthPattern, selectedYear, selectedMonth]);

    const rigInspections = rows.filter(row => {
      const rowRig = normalizeRig(row.rig_no);
      return rowRig === normRig || rowRig.endsWith(normRig) || normRig.endsWith(rowRig);
    });

    const formsStatus = FORM_DEFINITIONS.map(fDef => {
      let match;
      if (fDef.id === 'apar') {
        const aparRows = rigInspections.filter(insp => {
          const ft = (insp.form_type || '').toLowerCase();
          return ft.includes('apar') || ft === 'apar_standar' || ft === 'apar_hybrid';
        });
        match = aparRows.find(r => r.status === 'submitted') || aparRows.find(r => r.status === 'draft') || aparRows[0];
      } else if (fDef.id === 'eyewash') {
        const ewRows = rigInspections.filter(insp => {
          const ft = (insp.form_type || '').toLowerCase();
          return ft.includes('eyewash') || ft.includes('shower') || ft === 'eyewash_standar' || ft === 'eyewash_hybrid';
        });
        match = ewRows.find(r => r.status === 'submitted') || ewRows.find(r => r.status === 'draft') || ewRows[0];
      } else {
        match = rigInspections.find(insp => matchForm(insp.form_type) === fDef.id);
      }
      
      let status = 'not_started';
      if (match) {
        status = match.status === 'draft' ? 'draft' : 'submitted';
      }

      return {
        form_id: fDef.id,
        title: fDef.title,
        doc_no: fDef.docNo,
        icon: fDef.icon,
        status: status,
        is_filled: status === 'submitted',
        is_draft: status === 'draft',
        last_submitted: match ? (match.updated_at || match.tanggal || match.created_at) : null,
        submission_id: match ? match.id : null,
        hfo_name: match ? match.hfo_name : null,
        tool_pusher_name: match ? match.tool_pusher_name : null
      };
    });

    const submittedCount = formsStatus.filter(f => f.status === 'submitted').length;
    const draftCount = formsStatus.filter(f => f.status === 'draft').length;
    const notStartedCount = formsStatus.filter(f => f.status === 'not_started').length;
    const totalForms = FORM_DEFINITIONS.length;

    res.json({
      success: true,
      filter: {
        month: selectedMonth,
        year: selectedYear,
        month_str: monthStr,
        period_label: `${selectedYear}-${monthStr}`
      },
      rig_overview: {
        rig_name: rig_name,
        filled_count: submittedCount,
        submitted_count: submittedCount,
        draft_count: draftCount,
        not_started_count: notStartedCount,
        total_forms: totalForms,
        is_complete: submittedCount === totalForms,
        has_draft: draftCount > 0,
        percentage: Math.round((submittedCount / totalForms) * 100),
        forms: formsStatus
      }
    });
  } catch (err) {
    console.error('Error in /api/inspections/overview/:rig_name:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil overview Rig: ' + err.message
    });
  }
});

// ── 8. ENDPOINT INSPECTIONS CRUD & DATA SUBMIT ────────────────────
app.get('/api/inspections/latest', async (req, res) => {
  try {
    const { rig_no, form_id, form_type, month, year, period } = req.query;
    if (!rig_no) {
      return res.status(400).json({ success: false, message: 'Parameter rig_no wajib disertakan' });
    }

    const now = new Date();
    let selectedMonth, selectedYear, periodStr;

    if (period && typeof period === 'string' && period.includes('-')) {
      const parts = period.split('-');
      selectedYear = parseInt(parts[0], 10) || now.getFullYear();
      selectedMonth = parseInt(parts[1], 10) || (now.getMonth() + 1);
      periodStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
    } else {
      selectedMonth = parseInt(month, 10) || (now.getMonth() + 1);
      selectedYear = parseInt(year, 10) || now.getFullYear();
      periodStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
    }

    const monthPattern = `${periodStr}%`;
    const normRig = normalizeRig(rig_no);

    const [rows] = await pool.query(`
      SELECT * FROM inspections
      WHERE period = ?
         OR tanggal LIKE ?
         OR ((period IS NULL OR period = '') AND (YEAR(created_at) = ? AND MONTH(created_at) = ?))
      ORDER BY updated_at DESC, created_at DESC
    `, [periodStr, monthPattern, selectedYear, selectedMonth]);

    const matchingRows = rows.filter(row => {
      const rowRig = normalizeRig(row.rig_no);
      const rigMatch = rowRig === normRig || rowRig.endsWith(normRig) || normRig.endsWith(rowRig);
      if (!rigMatch) return false;

      if (form_id) {
        if (form_id === 'apar_standar') {
          return row.form_type === 'apar_standar' || row.form_type === 'apar' || row.form_type === 'APAR Inspection';
        }
        if (form_id === 'apar_hybrid') {
          return row.form_type === 'apar_hybrid';
        }
        if (form_id === 'eyewash_standar') {
          return row.form_type === 'eyewash_standar' || row.form_type === 'eyewash' || row.form_type === 'Shower & Eye Wash Inspection Form';
        }
        if (form_id === 'eyewash_hybrid') {
          return row.form_type === 'eyewash_hybrid';
        }
        return matchForm(row.form_type) === form_id;
      }
      if (form_type) {
        if (form_type === 'apar_standar') {
          return row.form_type === 'apar_standar' || row.form_type === 'apar' || row.form_type === 'APAR Inspection';
        }
        if (form_type === 'apar_hybrid') {
          return row.form_type === 'apar_hybrid';
        }
        if (form_type === 'eyewash_standar') {
          return row.form_type === 'eyewash_standar' || row.form_type === 'eyewash' || row.form_type === 'Shower & Eye Wash Inspection Form';
        }
        if (form_type === 'eyewash_hybrid') {
          return row.form_type === 'eyewash_hybrid';
        }
        return matchForm(row.form_type) === matchForm(form_type) || row.form_type.toLowerCase() === form_type.toLowerCase();
      }
      return true;
    });

    if (matchingRows.length === 0) {
      return res.json({ success: true, data: null });
    }

    const latest = matchingRows[0];
    let formData = latest.form_data;
    if (typeof formData === 'string') {
      try {
        formData = JSON.parse(formData);
      } catch (e) {}
    }

    return res.json({
      success: true,
      data: {
        ...latest,
        form_data: formData
      }
    });
  } catch (err) {
    console.error('Error in /api/inspections/latest:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil inspeksi terbaru: ' + err.message });
  }
});

// ── 8.1 FUNGSI EKSTRAKSI & SINKRONISASI ALERT TEMUAN KE DATABASE ──
function extractAlertsFromInspections(rows) {
  const alerts = [];

  for (const r of rows) {
    let fd = r.form_data;
    if (typeof fd === 'string') {
      try {
        fd = JSON.parse(fd);
      } catch (e) {
        fd = null;
      }
    }
    if (!fd) continue;

    const ft = (r.form_type || '').toLowerCase();
    const items = fd.items || fd.items_data || [];
    const formDate = r.tanggal || fd.tanggal || fd.inspection_date || (r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const rigName = r.rig_no || fd.rig_no || 'Rig BMS';
    const defaultLokasi = r.lokasi || fd.lokasi || 'Area Rig Operasional';

    // 1. APAR (Standar, Hybrid, Legacy)
    if (ft.includes('apar')) {
      if (Array.isArray(items)) {
        items.forEach((item, idx) => {
          const badKeys = ['handle', 'hose', 'nozle', 'pengaman', 'pin', 'pressure', 'tabung'];
          const brokenParts = [];
          badKeys.forEach(k => {
            const val = String(item[k] || '').trim().toLowerCase();
            if (val === 'bad' || val === 'rusak' || val === 'x' || val === 'rusak berat' || val === 'kurang baik') {
              brokenParts.push(k.toUpperCase());
            }
          });

          const remarks = String(item.remarks || '').trim();
          const hasBadParts = brokenParts.length > 0;
          const hasRemarks = remarks.length > 0 && !['good', 'ok', 'baik', 'aman', '-', 'nihil', 'n/a'].includes(remarks.toLowerCase());

          if (hasBadParts || hasRemarks) {
            const isRusak = hasBadParts || remarks.toLowerCase().includes('rusak') || remarks.toLowerCase().includes('patah') || remarks.toLowerCase().includes('bocor');
            alerts.push({
              id: `ALT-APAR-${r.id}-${idx + 1}`,
              inspectionId: r.id,
              tanggal: formDate,
              rigNo: rigName,
              jenisInspeksi: ft.includes('hybrid') ? 'APAR Hybrid' : 'APAR Inspection',
              icon: 'Flame',
              komponenAlat: `${item.type || 'APAR'} #${item.no || (idx + 1)}${brokenParts.length ? ' (' + brokenParts.join(', ') + ')' : ''}`,
              status: isRusak ? 'Rusak' : 'Perlu Perawatan',
              catatanTeknisi: remarks || `Komponen ${brokenParts.join(', ')} dalam kondisi rusak / tidak layak pakai.`,
              lokasiArea: item.penempatan || defaultLokasi,
              tindakan: isRusak ? 'Penggantian Tabung / Komponen APAR' : 'Perawatan & Servis Berkala',
              prioritas: isRusak ? 'Tinggi' : 'Sedang',
              hfoName: r.hfo_name,
              toolPusherName: r.tool_pusher_name
            });
          }
        });
      }
    }

    // 2. Eye Wash & Shower
    else if (ft.includes('eyewash') || ft.includes('shower')) {
      if (Array.isArray(items)) {
        items.forEach((item, idx) => {
          const checkKeys = ['waterTank', 'waterSupply', 'waterLine', 'shower', 'cleanness', 'pump', 'eyewash'];
          const brokenKeys = [];
          checkKeys.forEach(k => {
            const val = String(item[k] || '').trim().toLowerCase();
            if (val === 'bad' || val === 'rusak' || val === 'x' || val === 'no' || val === '✕' || val === '✗') {
              brokenKeys.push(k);
            }
          });
          const remarks = String(item.remarks || '').trim();
          const hasBroken = brokenKeys.length > 0;
          const hasRemarks = remarks.length > 0 && !['good', 'ok', 'baik', 'aman', '-', 'nihil'].includes(remarks.toLowerCase());

          if (hasBroken || hasRemarks) {
            const isRusak = hasBroken || remarks.toLowerCase().includes('rusak') || remarks.toLowerCase().includes('mampet') || remarks.toLowerCase().includes('bocor');
            alerts.push({
              id: `ALT-EW-${r.id}-${idx + 1}`,
              inspectionId: r.id,
              tanggal: item.date || formDate,
              rigNo: rigName,
              jenisInspeksi: 'Eye Wash & Shower',
              icon: 'Eye',
              komponenAlat: `Eye Wash & Shower Station${item.week ? ' - Minggu ' + item.week : ''}${brokenKeys.length ? ' (' + brokenKeys.join(', ') + ')' : ''}`,
              status: isRusak ? 'Rusak' : 'Perlu Perawatan',
              catatanTeknisi: remarks || `Komponen ${brokenKeys.join(', ')} bermasalah pada stasiun eye wash.`,
              lokasiArea: item.penempatan || defaultLokasi,
              tindakan: isRusak ? 'Flushing & Ganti Nozzle/Pipa Head' : 'Pembersihan & Pengurasan Air',
              prioritas: isRusak ? 'Tinggi' : 'Sedang',
              hfoName: r.hfo_name,
              toolPusherName: r.tool_pusher_name
            });
          }
        });
      }
    }

    // 3. Full Body Harness & Lanyard
    else if (ft.includes('harness') || ft.includes('lanyard')) {
      if (Array.isArray(items)) {
        items.forEach((item, idx) => {
          let hasDefect = false;
          if (item.checks && typeof item.checks === 'object') {
            for (const key of Object.keys(item.checks)) {
              const val = String(item.checks[key] || '').trim().toLowerCase();
              if (val === 'x' || val === 'bad' || val === 'rusak') hasDefect = true;
            }
          }
          const remarks = String(item.remarks || '').trim();
          const hasRemarks = remarks.length > 0 && !['good', 'ok', 'baik', 'aman', '-', 'nihil'].includes(remarks.toLowerCase());

          if (hasDefect || hasRemarks) {
            const isPerawatan = remarks.toLowerCase().includes('karat ringan') || remarks.toLowerCase().includes('karantina') || remarks.toLowerCase().includes('perawatan') || remarks.toLowerCase().includes('evaluasi');
            const isRusak = !isPerawatan && (hasDefect || remarks.toLowerCase().includes('rusak') || remarks.toLowerCase().includes('patah') || remarks.toLowerCase().includes('robek berat'));
            alerts.push({
              id: `ALT-HARNESS-${r.id}-${idx + 1}`,
              inspectionId: r.id,
              tanggal: item.tanggal || formDate,
              rigNo: rigName,
              jenisInspeksi: 'Harness Inspection',
              icon: 'Shield',
              komponenAlat: `Full Body Harness & Lanyard${item.sn ? ' (SN: ' + item.sn + ')' : ''}`,
              status: isRusak ? 'Rusak' : 'Perlu Perawatan',
              catatanTeknisi: remarks || 'Webbing atau hardware pengaman ditemukan cacat/rusak.',
              lokasiArea: item.lokasi || defaultLokasi,
              tindakan: isRusak ? 'Karantina & Penggantian Unit Baru' : 'Pembersihan Anti-Karat & Evaluasi Afkir',
              prioritas: isRusak ? 'Tinggi' : 'Sedang',
              hfoName: r.hfo_name,
              toolPusherName: r.tool_pusher_name
            });
          }
        });
      }
    }

    // 4. First Aid Kits (P3K)
    else if (ft.includes('first aid') || ft.includes('p3k')) {
      if (Array.isArray(items)) {
        items.forEach((item, idx) => {
          const kondisi = String(item.kondisi || '').trim().toLowerCase();
          const temuan = String(item.temuan || '').trim();
          const isX = kondisi === 'x' || kondisi === 'bad' || kondisi === 'rusak';
          const hasTemuan = temuan.length > 0 && !['good', 'ok', 'baik', 'lengkap', '-', 'nihil'].includes(temuan.toLowerCase());

          if (isX || hasTemuan) {
            const isPerawatan = temuan.toLowerCase().includes('expired') || temuan.toLowerCase().includes('kedaluwarsa') || temuan.toLowerCase().includes('habis') || temuan.toLowerCase().includes('restock');
            const isRusak = !isPerawatan && (isX || temuan.toLowerCase().includes('rusak') || temuan.toLowerCase().includes('pecah') || temuan.toLowerCase().includes('patah'));
            alerts.push({
              id: `ALT-P3K-${r.id}-${idx + 1}`,
              inspectionId: r.id,
              tanggal: formDate,
              rigNo: rigName,
              jenisInspeksi: 'First Aid Box (P3K)',
              icon: 'HeartPulse',
              komponenAlat: `Kotak P3K - ${item.jenisObat || 'Item #' + (item.no || idx + 1)}`,
              status: isRusak ? 'Rusak' : 'Perlu Perawatan',
              catatanTeknisi: temuan || `Kondisi ${item.jenisObat || 'obat'} tidak memenuhi standar kelengkapan atau kedaluwarsa.`,
              lokasiArea: defaultLokasi,
              tindakan: isRusak ? 'Penggantian Kotak / Fasilitas P3K' : 'Restock Paket Obat Standar B',
              prioritas: isRusak ? 'Tinggi' : 'Sedang',
              hfoName: r.hfo_name,
              toolPusherName: r.tool_pusher_name
            });
          }
        });
      }
    }

    // 5. SCBA
    else if (ft.includes('scba')) {
      if (Array.isArray(items)) {
        items.forEach((item, idx) => {
          const remarks = String(item.remarks || '').trim();
          const condition = String(item.condition || item.status || '').trim().toLowerCase();
          const scbaChecks = ['pressure', 'hose', 'cert', 'rubber', 'valve', 'whistle', 'tabung'];
          const hasBadCheck = scbaChecks.some(k => {
            const v = String(item[k] || '').trim().toLowerCase();
            return v === 'x' || v === '✕' || v === '✗' || v === 'bad' || v === 'expire' || v === 'rusak';
          });
          const isX = condition === 'x' || condition === '✕' || condition === '✗' || condition === 'bad' || condition === 'rusak' || hasBadCheck;
          const hasRemarks = remarks.length > 0 && !['good', 'ok', 'baik', 'aman', '-', 'nihil'].includes(remarks.toLowerCase());

          if (isX || hasRemarks) {
            const isRusak = isX || remarks.toLowerCase().includes('rusak') || remarks.toLowerCase().includes('bocor') || remarks.toLowerCase().includes('turun');
            alerts.push({
              id: `ALT-SCBA-${r.id}-${idx + 1}`,
              inspectionId: r.id,
              tanggal: formDate,
              rigNo: rigName,
              jenisInspeksi: 'SCBA Monthly Form',
              icon: 'Wind',
              komponenAlat: `Unit SCBA Silinder #${item.no || (idx + 1)}${item.penempatan ? ' (' + item.penempatan + ')' : ''}`,
              status: isRusak ? 'Rusak' : 'Perlu Perawatan',
              catatanTeknisi: remarks || 'Indikator atau komponen pernapasan SCBA tidak normal.',
              lokasiArea: item.penempatan || defaultLokasi,
              tindakan: isRusak ? 'Ganti Seal O-Ring & Hydrotest Silinder' : 'Pengisian Tekanan & Servis Berkala',
              prioritas: isRusak ? 'Tinggi' : 'Sedang',
              hfoName: r.hfo_name,
              toolPusherName: r.tool_pusher_name
            });
          }
        });
      }
    }

    // 6. Spill Kit
    else if (ft.includes('spill') || ft.includes('spillkit')) {
      if (Array.isArray(items)) {
        items.forEach((item, idx) => {
          const kondisi = String(item.kondisi || '').trim().toLowerCase();
          const temuan = String(item.temuan || '').trim();
          const isX = kondisi === 'x' || kondisi === 'bad' || kondisi === 'rusak';
          const hasTemuan = temuan.length > 0 && !['good', 'ok', 'baik', 'lengkap', '-', 'nihil'].includes(temuan.toLowerCase());

          if (isX || hasTemuan) {
            const isPerawatan = temuan.toLowerCase().includes('sobek') || temuan.toLowerCase().includes('tersisa') || temuan.toLowerCase().includes('kurang') || temuan.toLowerCase().includes('penambahan');
            const isRusak = !isPerawatan && (isX || temuan.toLowerCase().includes('rusak') || temuan.toLowerCase().includes('patah'));
            alerts.push({
              id: `ALT-SPILL-${r.id}-${idx + 1}`,
              inspectionId: r.id,
              tanggal: formDate,
              rigNo: rigName,
              jenisInspeksi: 'Spill Kit Inspection',
              icon: 'Box',
              komponenAlat: `Spill Kit - ${item.daftarIsi || 'Item #' + (item.id || idx + 1)}`,
              status: isRusak ? 'Rusak' : 'Perlu Perawatan',
              catatanTeknisi: temuan || `Item wadah/isi ${item.daftarIsi} tidak lengkap atau rusak.`,
              lokasiArea: defaultLokasi,
              tindakan: isRusak ? 'Penggantian Box Spill Kit' : 'Penambahan Absorbent Boom 3m',
              prioritas: isRusak ? 'Tinggi' : 'Sedang',
              hfoName: r.hfo_name,
              toolPusherName: r.tool_pusher_name
            });
          }
        });
      }
    }

    // 7. Stretcher
    else if (ft.includes('stretcher') || ft.includes('tandu')) {
      if (Array.isArray(items)) {
        items.forEach((item, idx) => {
          const cond = String(item.condition || '').trim().toLowerCase();
          const remarks = String(item.remarks || '').trim();
          const isNo = cond === 'no' || cond === 'bad' || cond === 'x' || cond === 'rusak';
          const hasRemarks = remarks.length > 0 && !['good', 'ok', 'baik', 'aman', '-', 'nihil'].includes(remarks.toLowerCase());

          if (isNo || hasRemarks) {
            const isRusak = isNo || remarks.toLowerCase().includes('rusak') || remarks.toLowerCase().includes('patah') || remarks.toLowerCase().includes('macet');
            alerts.push({
              id: `ALT-STRETCHER-${r.id}-${idx + 1}`,
              inspectionId: r.id,
              tanggal: formDate,
              rigNo: rigName,
              jenisInspeksi: 'Stretcher Emergency',
              icon: 'Activity',
              komponenAlat: `Tandu Stretcher - ${item.text ? (item.text.length > 40 ? item.text.slice(0, 40) + '...' : item.text) : 'Item #' + (idx + 1)}`,
              status: isRusak ? 'Rusak' : 'Perlu Perawatan',
              catatanTeknisi: remarks || 'Kondisi tandu atau perlengkapan sabuk pengaman bermasalah.',
              lokasiArea: defaultLokasi,
              tindakan: isRusak ? 'Ganti Harness Strap Tandu' : 'Pembersihan & Penataan Akses Tandu',
              prioritas: isRusak ? 'Tinggi' : 'Sedang',
              hfoName: r.hfo_name,
              toolPusherName: r.tool_pusher_name
            });
          }
        });
      }
    }

    // 8. APD / PPE
    else if (ft.includes('apd') || ft.includes('pelindung diri')) {
      if (Array.isArray(items)) {
        items.forEach((item, idx) => {
          let hasDefect = false;
          if (item.apd && typeof item.apd === 'object') {
            for (const k of Object.keys(item.apd)) {
              const val = String(item.apd[k] || '').trim().toLowerCase();
              if (val === 'x' || val === 'bad' || val === 'rusak') hasDefect = true;
            }
          }
          const ket = String(item.keterangan || '').trim();
          const hasKet = ket.length > 0 && !['good', 'ok', 'lengkap', 'baik', '-', 'nihil'].includes(ket.toLowerCase());

          if (hasDefect || hasKet) {
            const isRusak = hasDefect || ket.toLowerCase().includes('rusak') || ket.toLowerCase().includes('hilang');
            alerts.push({
              id: `ALT-APD-${r.id}-${idx + 1}`,
              inspectionId: r.id,
              tanggal: formDate,
              rigNo: rigName,
              jenisInspeksi: 'APD / PPE Inspection',
              icon: 'ShieldAlert',
              komponenAlat: `APD Personil - ${item.nama || 'Pekerja'} (${item.jabatan || 'Crew'})`,
              status: isRusak ? 'Rusak' : 'Perlu Perawatan',
              catatanTeknisi: ket || 'Alat pelindung diri tidak lengkap atau mengalami kerusakan saat inspeksi.',
              lokasiArea: defaultLokasi,
              tindakan: 'Penerbitan APD Baru & Edukasi Keselamatan',
              prioritas: isRusak ? 'Tinggi' : 'Sedang',
              hfoName: r.hfo_name,
              toolPusherName: r.tool_pusher_name
            });
          }
        });
      }
    }

    // 9. Oxigent
    else if (ft.includes('oxigent') || ft.includes('oksigen')) {
      if (Array.isArray(items)) {
        items.forEach((item, idx) => {
          const checkKeys = ['pressureVolume', 'regulator', 'hydroTest', 'tabung', 'valveConnection'];
          const brokenKeys = [];
          checkKeys.forEach(k => {
            const val = String(item[k] || '').trim().toLowerCase();
            if (val === 'x' || val === '✕' || val === '✗' || val === 'bad' || val === 'rusak') brokenKeys.push(k);
          });
          const rek = String(item.rekomendasi || '').trim();
          const hasBroken = brokenKeys.length > 0;
          const hasRek = rek.length > 0 && !['good', 'ok', 'baik', 'aman', '-', 'nihil'].includes(rek.toLowerCase());

          if (hasBroken || hasRek) {
            const isRusak = hasBroken || rek.toLowerCase().includes('rusak') || rek.toLowerCase().includes('bocor');
            alerts.push({
              id: `ALT-OXI-${r.id}-${idx + 1}`,
              inspectionId: r.id,
              tanggal: formDate,
              rigNo: rigName,
              jenisInspeksi: 'Oxigent Monthly Form',
              icon: 'Cylinder',
              komponenAlat: `Silinder Oksigen Medical - ${item.merkTypeSerial || 'Silinder #' + (idx + 1)}`,
              status: isRusak ? 'Rusak' : 'Perlu Perawatan',
              catatanTeknisi: rek || `Kondisi komponen ${brokenKeys.join(', ')} silinder oksigen tidak normal.`,
              lokasiArea: item.penempatan || defaultLokasi,
              tindakan: isRusak ? 'Hydrotest Silinder & Ganti Regulator' : 'Refill Oksigen & Pengecekan Katup',
              prioritas: isRusak ? 'Tinggi' : 'Sedang',
              hfoName: r.hfo_name,
              toolPusherName: r.tool_pusher_name
            });
          }
        });
      }
    }
  }

  return alerts;
}

async function syncAlertsToDatabase(dbOrPool) {
  try {
    const [rows] = await dbOrPool.query(`
      SELECT id, form_type, form_code, rig_no, tanggal, lokasi, status_rig, 
             rekomendasi, hfo_name, tool_pusher_name, status, form_data, created_at, updated_at
      FROM inspections
      ORDER BY updated_at DESC, created_at DESC
    `);
    const alerts = extractAlertsFromInspections(rows);

    for (const a of alerts) {
      await dbOrPool.query(`
        INSERT INTO inspection_alerts (
          id, inspection_id, rig_no, form_type, tanggal, komponen_alat, 
          kondisi, catatan_temuan, lokasi_area, tindakan_rekomendasi, 
          prioritas, hfo_name, icon, status_alert
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN')
        ON DUPLICATE KEY UPDATE
          tanggal = VALUES(tanggal),
          komponen_alat = VALUES(komponen_alat),
          kondisi = VALUES(kondisi),
          catatan_temuan = VALUES(catatan_temuan),
          lokasi_area = VALUES(lokasi_area),
          tindakan_rekomendasi = VALUES(tindakan_rekomendasi),
          prioritas = VALUES(prioritas),
          hfo_name = VALUES(hfo_name),
          icon = VALUES(icon)
      `, [
        a.id,
        a.inspectionId,
        a.rigNo,
        a.jenisInspeksi,
        a.tanggal,
        a.komponenAlat,
        a.status,
        a.catatanTeknisi,
        a.lokasiArea,
        a.tindakan,
        a.prioritas,
        a.hfoName,
        a.icon
      ]);
    }
  } catch (err) {
    console.error('Error syncing alerts to database:', err.message);
  }
}

// ── 8.2 ENDPOINT ALERT TEMUAN RUSAK DENGAN CLOSED-LOOP VERIFICATION ──
app.get('/api/inspections/alerts', async (req, res) => {
  try {
    const { rig_no, status, status_alert, search } = req.query;

    // Sinkronkan temuan terbaru dari inspeksi
    await syncAlertsToDatabase(pool);

    let sql = `
      SELECT id, inspection_id, rig_no, form_type, tanggal, komponen_alat,
             kondisi, catatan_temuan, lokasi_area, tindakan_rekomendasi,
             prioritas, hfo_name, icon, bukti_foto, tanggal_perbaikan,
             catatan_perbaikan, diperbaiki_oleh, status_alert, alasan_reject,
             diverifikasi_oleh, tanggal_verifikasi, created_at, updated_at
      FROM inspection_alerts
      WHERE 1=1
    `;
    const params = [];

    // Filter Rig
    if (rig_no && rig_no !== 'ALL') {
      sql += ' AND UPPER(rig_no) = UPPER(?)';
      params.push(rig_no);
    }

    // Filter Kondisi Alat ('Rusak' / 'Perlu Perawatan')
    if (status && status !== 'ALL') {
      sql += ' AND LOWER(kondisi) = LOWER(?)';
      params.push(status);
    }

    // Filter Status Tindak Lanjut ('OPEN', 'PENDING_REVIEW', 'CLOSED', 'REJECTED', 'ACTIVE')
    if (status_alert && status_alert !== 'ALL') {
      if (status_alert === 'ACTIVE') {
        sql += " AND status_alert IN ('OPEN', 'REJECTED', 'PENDING_REVIEW')";
      } else if (status_alert === 'ACTION_REQUIRED' || status_alert === 'OPEN_OR_REJECTED') {
        sql += " AND status_alert IN ('OPEN', 'REJECTED')";
      } else {
        sql += ' AND status_alert = ?';
        params.push(status_alert);
      }
    }

    // Filter Search
    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      sql += ' AND (rig_no LIKE ? OR form_type LIKE ? OR komponen_alat LIKE ? OR catatan_temuan LIKE ? OR lokasi_area LIKE ?)';
      params.push(q, q, q, q, q);
    }

    sql += ' ORDER BY CASE WHEN status_alert = "PENDING_REVIEW" THEN 1 WHEN status_alert = "OPEN" THEN 2 WHEN status_alert = "REJECTED" THEN 3 ELSE 4 END, updated_at DESC, created_at DESC';

    const [rows] = await pool.query(sql, params);

    // Hitung statistik dinamis (scoped ke rig_no jika ada, atau global)
    let countSql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status_alert IN ('OPEN', 'REJECTED') THEN 1 ELSE 0 END) as open_count,
        SUM(CASE WHEN status_alert = 'PENDING_REVIEW' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status_alert = 'CLOSED' THEN 1 ELSE 0 END) as closed_count,
        SUM(CASE WHEN LOWER(kondisi) = 'rusak' AND status_alert != 'CLOSED' THEN 1 ELSE 0 END) as critical_count,
        SUM(CASE WHEN LOWER(kondisi) = 'perlu perawatan' AND status_alert != 'CLOSED' THEN 1 ELSE 0 END) as maintenance_count,
        COUNT(DISTINCT CASE WHEN status_alert != 'CLOSED' THEN rig_no END) as rigs_impacted
      FROM inspection_alerts
      WHERE 1=1
    `;
    const countParams = [];
    if (rig_no && rig_no !== 'ALL') {
      countSql += ' AND UPPER(rig_no) = UPPER(?)';
      countParams.push(rig_no);
    }
    const [countRows] = await pool.query(countSql, countParams);
    const counts = countRows[0] || {};

    const openCount = Number(counts.open_count || 0);
    const pendingCount = Number(counts.pending_count || 0);
    const closedCount = Number(counts.closed_count || 0);
    const activeCount = openCount + pendingCount;

    const formattedData = rows.map(r => ({
      id: r.id,
      inspectionId: r.inspection_id,
      inspection_id: r.inspection_id,
      tanggal: r.tanggal,
      rigNo: r.rig_no,
      rig_no: r.rig_no,
      jenisInspeksi: r.form_type,
      form_type: r.form_type,
      icon: r.icon,
      komponenAlat: r.komponen_alat,
      komponen_alat: r.komponen_alat,
      status: r.kondisi,
      kondisi: r.kondisi,
      catatanTeknisi: r.catatan_temuan,
      catatan_temuan: r.catatan_temuan,
      lokasiArea: r.lokasi_area,
      lokasi_area: r.lokasi_area,
      tindakan: r.tindakan_rekomendasi,
      tindakan_rekomendasi: r.tindakan_rekomendasi,
      prioritas: r.prioritas,
      hfoName: r.hfo_name,
      hfo_name: r.hfo_name,
      // Closed-loop fields
      buktiFoto: r.bukti_foto,
      bukti_foto: r.bukti_foto,
      tanggalPerbaikan: r.tanggal_perbaikan ? new Date(r.tanggal_perbaikan).toISOString().split('T')[0] : null,
      tanggal_perbaikan: r.tanggal_perbaikan ? new Date(r.tanggal_perbaikan).toISOString().split('T')[0] : null,
      catatanPerbaikan: r.catatan_perbaikan,
      catatan_perbaikan: r.catatan_perbaikan,
      diperbaikiOleh: r.diperbaiki_oleh,
      diperbaiki_oleh: r.diperbaiki_oleh,
      statusAlert: r.status_alert,
      status_alert: r.status_alert,
      alasanReject: r.alasan_reject,
      alasan_reject: r.alasan_reject,
      diverifikasiOleh: r.diverifikasi_oleh,
      diverifikasi_oleh: r.diverifikasi_oleh,
      tanggalVerifikasi: r.tanggal_verifikasi,
      tanggal_verifikasi: r.tanggal_verifikasi,
      created_at: r.created_at,
      updated_at: r.updated_at
    }));

    return res.json({
      success: true,
      total: Number(counts.total || 0),
      open_count: openCount,
      pending_count: pendingCount,
      closed_count: closedCount,
      active_count: activeCount,
      critical_count: Number(counts.critical_count || 0),
      maintenance_count: Number(counts.maintenance_count || 0),
      rigs_impacted: Number(counts.rigs_impacted || 0),
      data: formattedData
    });
  } catch (err) {
    console.error('Error in /api/inspections/alerts:', err);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data alert inspeksi: ' + err.message });
  }
});

// ── 8.3 ENDPOINT SUBMIT LAPORAN PERBAIKAN OLEH HSO RIG ──
const handleRepairSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { bukti_foto, buktiFoto, tanggal_perbaikan, tanggalPerbaikan, catatan_perbaikan, catatanPerbaikan, diperbaiki_oleh, diperbaikiOleh } = req.body;

    const photo = bukti_foto || buktiFoto;
    const date = tanggal_perbaikan || tanggalPerbaikan || new Date().toISOString().split('T')[0];
    const notes = catatan_perbaikan || catatanPerbaikan;
    const reporter = diperbaiki_oleh || diperbaikiOleh || 'HSO Rig';

    if (!photo) {
      return res.status(400).json({ success: false, message: 'Foto bukti perbaikan wajib dilampirkan.' });
    }
    if (!notes || !notes.trim()) {
      return res.status(400).json({ success: false, message: 'Catatan tindakan perbaikan wajib diisi.' });
    }

    const [check] = await pool.query('SELECT id, rig_no, komponen_alat FROM inspection_alerts WHERE id = ?', [id]);
    if (check.length === 0) {
      return res.status(404).json({ success: false, message: `Temuan alert dengan ID ${id} tidak ditemukan.` });
    }

    await pool.query(`
      UPDATE inspection_alerts
      SET 
        bukti_foto = ?,
        tanggal_perbaikan = ?,
        catatan_perbaikan = ?,
        diperbaiki_oleh = ?,
        status_alert = 'PENDING_REVIEW',
        alasan_reject = NULL,
        updated_at = NOW()
      WHERE id = ?
    `, [photo, date, notes.trim(), reporter, id]);

    const [updated] = await pool.query('SELECT * FROM inspection_alerts WHERE id = ?', [id]);

    return res.json({
      success: true,
      message: 'Bukti perbaikan berhasil dikirim dan menunggu verifikasi Admin.',
      data: updated[0]
    });
  } catch (err) {
    console.error('Error in /api/inspections/alerts/:id/repair:', err);
    return res.status(500).json({ success: false, message: 'Gagal mengirim laporan perbaikan: ' + err.message });
  }
};

app.put('/api/inspections/alerts/:id/repair', handleRepairSubmission);
app.post('/api/inspections/alerts/:id/repair', handleRepairSubmission);

// ── 8.4 ENDPOINT VERIFIKASI PERBAIKAN OLEH ADMIN (APPROVE / REJECT) ──
const handleAlertVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, alasan_reject, alasanReject, diverifikasi_oleh, diverifikasiOleh } = req.body;

    const verifier = diverifikasi_oleh || diverifikasiOleh || 'Administrator Besmindo';
    const rejectReason = alasan_reject || alasanReject;

    const [check] = await pool.query('SELECT id, rig_no, komponen_alat, status_alert FROM inspection_alerts WHERE id = ?', [id]);
    if (check.length === 0) {
      return res.status(404).json({ success: false, message: `Temuan alert dengan ID ${id} tidak ditemukan.` });
    }

    if (action === 'approve') {
      await pool.query(`
        UPDATE inspection_alerts
        SET 
          status_alert = 'CLOSED',
          diverifikasi_oleh = ?,
          tanggal_verifikasi = NOW(),
          alasan_reject = NULL,
          updated_at = NOW()
        WHERE id = ?
      `, [verifier, id]);

      return res.json({
        success: true,
        message: 'Laporan perbaikan berhasil disetujui (Status CLOSED).',
        id,
        status_alert: 'CLOSED'
      });
    } else if (action === 'reject') {
      if (!rejectReason || !rejectReason.trim()) {
        return res.status(400).json({ success: false, message: 'Alasan penolakan / catatan revisi wajib diisi.' });
      }

      await pool.query(`
        UPDATE inspection_alerts
        SET 
          status_alert = 'REJECTED',
          alasan_reject = ?,
          diverifikasi_oleh = ?,
          tanggal_verifikasi = NOW(),
          updated_at = NOW()
        WHERE id = ?
      `, [rejectReason.trim(), verifier, id]);

      return res.json({
        success: true,
        message: 'Laporan perbaikan ditolak dan dikembalikan ke Rig untuk revisi.',
        id,
        status_alert: 'REJECTED',
        alasan_reject: rejectReason.trim()
      });
    } else {
      return res.status(400).json({ success: false, message: 'Aksi verifikasi tidak valid. Gunakan "approve" atau "reject".' });
    }
  } catch (err) {
    console.error('Error in /api/inspections/alerts/:id/verify:', err);
    return res.status(500).json({ success: false, message: 'Gagal memproses verifikasi alert: ' + err.message });
  }
};

app.put('/api/inspections/alerts/:id/verify', handleAlertVerification);
app.post('/api/inspections/alerts/:id/verify', handleAlertVerification);

// Ambil daftar riwayat inspeksi
app.get('/api/inspections', async (req, res) => {
  try {
    const { rig_no, form_type, month, year, period, status } = req.query;
    let query = 'SELECT * FROM inspections WHERE 1=1';
    const params = [];

    if (rig_no && rig_no !== 'all') {
      query += ' AND rig_no = ?';
      params.push(rig_no);
    }

    if (form_type && form_type !== 'all') {
      query += ' AND form_type = ?';
      params.push(form_type);
    }

    if (period && period !== 'all' && period.includes('-')) {
      const parts = period.split('-');
      const pYear = parseInt(parts[0], 10);
      const pMonth = parseInt(parts[1], 10);
      const periodStr = `${pYear}-${String(pMonth).padStart(2, '0')}`;
      query += " AND (period = ? OR tanggal LIKE ? OR ((period IS NULL OR period = '') AND (YEAR(created_at) = ? AND MONTH(created_at) = ?)))";
      params.push(periodStr, `${periodStr}%`, pYear, pMonth);
    } else if (month && month !== 'all' && year && year !== 'all') {
      const monthStr = String(month).padStart(2, '0');
      const periodStr = `${year}-${monthStr}`;
      const monthPattern = `${periodStr}%`;
      query += " AND (period = ? OR tanggal LIKE ? OR ((period IS NULL OR period = '') AND (YEAR(created_at) = ? AND MONTH(created_at) = ?)))";
      params.push(periodStr, monthPattern, Number(year), Number(month));
    } else {
      if (month && month !== 'all') {
        const monthStr = String(month).padStart(2, '0');
        query += ' AND (period LIKE ? OR tanggal LIKE ? OR MONTH(created_at) = ?)';
        params.push(`%-${monthStr}`, `%-${monthStr}-%`, Number(month));
      }
      if (year && year !== 'all') {
        query += ' AND (period LIKE ? OR tanggal LIKE ? OR YEAR(created_at) = ?)';
        params.push(`${year}-%`, `${year}-%`, Number(year));
      }
    }

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY updated_at DESC, created_at DESC LIMIT 300';
    const [rows] = await pool.query(query, params);

    const parsedRows = rows.map(r => {
      let fd = r.form_data;
      if (typeof fd === 'string') {
        try {
          fd = JSON.parse(fd);
        } catch (e) {}
      }
      return { ...r, form_data: fd };
    });

    res.json({ success: true, data: parsedRows });
  } catch (err) {
    console.error('Error fetching inspections:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data inspeksi', error: err.message });
  }
});

// Detail 1 inspeksi
app.get('/api/inspections/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM inspections WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Data inspeksi tidak ditemukan' });
    }

    const row = rows[0];
    let formData = row.form_data;
    if (typeof formData === 'string') {
      try {
        formData = JSON.parse(formData);
      } catch (e) {}
    }

    res.json({ success: true, data: { ...row, form_data: formData } });
  } catch (err) {
    console.error('Error fetching inspection by ID:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data inspeksi', error: err.message });
  }
});

// SIMPAN ATAU UPDATE INSPEKSI (SUBMIT FORM / AUTO-SAVE DRAFT)
app.post('/api/inspections', async (req, res) => {
  try {
    const payload = req.body;

    if (!payload || Object.keys(payload).length === 0) {
      return res.status(400).json({ success: false, message: 'Payload data inspeksi tidak boleh kosong' });
    }

    // Autentikasi token jika tersedia di header
    let authenticatedUser = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        authenticatedUser = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
      } catch (tokenErr) {
        return res.status(401).json({ success: false, message: 'Sesi login tidak valid atau telah kedaluwarsa. Silakan login kembali.' });
      }
    }

    const form_type = payload.form_type || 'Unknown Form';
    const form_code = payload.form_code || null;
    const rig_no = payload.rig_no || payload.rig_no_dept || null;
    const tanggal = payload.tanggal || payload.inspection_date || payload.period || new Date().toISOString().split('T')[0];
    const lokasi = payload.lokasi || payload.rig_location || null;
    const status_rig = payload.status_rig || null;
    const rekomendasi = payload.rekomendasi || payload.remark || null;
    const status = payload.status === 'submitted' ? 'submitted' : 'draft';

    // Validasi Data Esensial
    if (!rig_no) {
      return res.status(400).json({ success: false, message: 'Nomor Rig (rig_no) wajib disertakan dalam pengisian inspeksi!' });
    }

    // Role-Based Access Control (RBAC): Cegah manipulasi rig lain oleh user karyawan
    if (authenticatedUser && authenticatedUser.role !== 'admin' && authenticatedUser.username !== 'admin_besmindo') {
      const userRigNorm = normalizeRig(authenticatedUser.rig_name);
      const targetRigNorm = normalizeRig(rig_no);
      if (userRigNorm && targetRigNorm && userRigNorm !== targetRigNorm) {
        return res.status(403).json({
          success: false,
          message: `Akses ditolak: Akun ${authenticatedUser.rig_name} tidak berhak mengisi inspeksi untuk Rig ${rig_no}!`
        });
      }
    }

    const hfo_name = payload.hfo_name 
      || payload.hes_officer_name 
      || payload.hes_field_officer 
      || payload.inspected_by 
      || payload.inspected_by_name 
      || payload.derrickman_name 
      || payload.meta?.signatures?.hfo?.name
      || payload.meta?.signatures?.wfo?.name
      || payload.meta?.signatures?.user?.name
      || null;

    const tool_pusher_name = payload.tool_pusher_name 
      || payload.tool_pusher 
      || payload.hes_coordinator_name 
      || payload.acknowledged_by 
      || payload.acknowledged_by_name 
      || payload.wsr_name 
      || payload.meta?.signatures?.derickman?.name
      || payload.meta?.signatures?.toolpush?.name
      || null;

    // Validasi Submit Final: Tidak boleh kosong field esensial
    if (status === 'submitted') {
      if (!tanggal || String(tanggal).trim().length < 4) {
        return res.status(400).json({ success: false, message: 'Validasi Gagal: Tanggal inspeksi wajib diisi sebelum submit final!' });
      }
      if (!hfo_name && !tool_pusher_name) {
        return res.status(400).json({ success: false, message: 'Validasi Gagal: Nama penanggung jawab (Pemeriksa atau Tool Pusher) wajib diisi sebelum submit final!' });
      }

      // Validasi Wajib Tanda Tangan Digital HFO & Toolpusher
      const sigs = payload.meta?.signatures || payload.signatures || {};
      const getSig = (sig) => {
        if (!sig) return '';
        if (typeof sig === 'string') return sig.trim();
        if (typeof sig === 'object' && sig.image) return String(sig.image).trim();
        return '';
      };
      const hfoSig = getSig(sigs.hfo) || getSig(sigs.wfo);
      const tpSig = getSig(sigs.toolpush) || getSig(sigs.derickman);

      const isAdmin = authenticatedUser 
        ? (authenticatedUser.role === 'admin' || authenticatedUser.username === 'admin_besmindo') 
        : (payload.user_role === 'admin' || payload.role === 'admin' || payload.is_admin === true);

      if (!isAdmin && (!hfoSig || !tpSig)) {
        return res.status(400).json({
          success: false,
          message: 'Gagal menyimpan! Tanda tangan HFO dan Toolpusher wajib diisi sebagai bukti validasi inspeksi.'
        });
      }
    }

    const formDataJson = JSON.stringify(payload);

    let existingId = payload.id || null;

    if (!existingId && rig_no && tanggal) {
      const dateParts = String(tanggal).split('-');
      if (dateParts.length >= 2) {
        const yearMonth = `${dateParts[0]}-${dateParts[1]}`;
        const normTargetRig = normalizeRig(rig_no);
        const [existing] = await pool.query(`
          SELECT id, status, rig_no, form_type FROM inspections 
          WHERE (tanggal LIKE ? OR DATE_FORMAT(created_at, '%Y-%m') = ?)
          ORDER BY updated_at DESC, id DESC
        `, [`${yearMonth}%`, yearMonth]);

        const found = existing.find(r => {
          const rRig = normalizeRig(r.rig_no);
          if (rRig !== normTargetRig && !rRig.endsWith(normTargetRig)) return false;

          if (form_type === 'apar_standar') {
            return r.form_type === 'apar_standar' || r.form_type === 'apar' || r.form_type === 'APAR Inspection';
          }
          if (form_type === 'apar_hybrid') {
            return r.form_type === 'apar_hybrid';
          }
          if (form_type === 'eyewash_standar') {
            return r.form_type === 'eyewash_standar' || r.form_type === 'eyewash' || r.form_type === 'Shower & Eye Wash Inspection Form';
          }
          if (form_type === 'eyewash_hybrid') {
            return r.form_type === 'eyewash_hybrid';
          }
          return matchForm(r.form_type) === matchForm(form_type);
        });

        if (found) {
          existingId = found.id;
        }
      }
    }

    if (existingId) {
      const isAdminUser = authenticatedUser 
        ? (authenticatedUser.role === 'admin' || authenticatedUser.username === 'admin_besmindo') 
        : (payload.user_role === 'admin' || payload.role === 'admin' || payload.is_admin === true);

      const [check] = await pool.query('SELECT status FROM inspections WHERE id = ?', [existingId]);
      
      if (check.length > 0 && check[0].status === 'submitted' && !isAdminUser) {
        return res.json({
          success: true,
          message: 'Inspeksi telah disubmit final dan terkunci untuk User (Read-Only)',
          id: existingId,
          status: 'submitted',
          locked: true
        });
      }

      const finalStatusToSave = (check.length > 0 && check[0].status === 'submitted') ? 'submitted' : status;

      const updateQuery = `
        UPDATE inspections SET
          form_type = ?,
          form_code = ?,
          rig_no = ?,
          tanggal = ?,
          lokasi = ?,
          status_rig = ?,
          rekomendasi = ?,
          hfo_name = ?,
          tool_pusher_name = ?,
          status = ?,
          form_data = ?
        WHERE id = ?
      `;

      await pool.query(updateQuery, [
        form_type,
        form_code,
        rig_no,
        tanggal,
        lokasi,
        status_rig,
        rekomendasi,
        hfo_name,
        tool_pusher_name,
        finalStatusToSave,
        formDataJson,
        existingId
      ]);

      if (matchForm(form_type) === 'harness' && rig_no) {
        try {
          const [hExisting] = await pool.query(
            `SELECT id FROM harness_inspections WHERE inspection_id = ? OR (rig_no = ? AND tanggal = ?) LIMIT 1`,
            [existingId, rig_no, tanggal]
          );
          let hId = hExisting.length > 0 ? hExisting[0].id : null;
          if (hId) {
            await pool.query(`
              UPDATE harness_inspections SET
                inspection_id = ?,
                derrickman_name = ?,
                tool_pusher_name = ?,
                wsr_name = ?,
                remark = ?,
                status = ?
              WHERE id = ?
            `, [existingId, hfo_name, tool_pusher_name, payload.wsr_name || null, rekomendasi, status, hId]);
          } else {
            const [hInsert] = await pool.query(`
              INSERT INTO harness_inspections (inspection_id, rig_no, tanggal, derrickman_name, tool_pusher_name, wsr_name, remark, status)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [existingId, rig_no, tanggal, hfo_name, tool_pusher_name, payload.wsr_name || null, rekomendasi, status]);
            hId = hInsert.insertId;
          }

          const componentPhotos = payload.component_photos || payload.componentPhotos;
          if (componentPhotos && typeof componentPhotos === 'object') {
            for (const [compId, imgVal] of Object.entries(componentPhotos)) {
              if (imgVal) {
                const compNum = parseInt(compId, 10);
                const [itemCheck] = await pool.query(
                  `SELECT id FROM harness_items WHERE (harness_inspection_id = ? OR rig_no = ?) AND component_id = ? LIMIT 1`,
                  [hId, rig_no, compNum]
                );
                if (itemCheck.length > 0) {
                  await pool.query(
                    `UPDATE harness_items SET harness_inspection_id = ?, image_data = ? WHERE id = ?`,
                    [hId, imgVal, itemCheck[0].id]
                  );
                } else {
                  await pool.query(
                    `INSERT INTO harness_items (harness_inspection_id, rig_no, component_id, component_name, image_data)
                     VALUES (?, ?, ?, ?, ?)`,
                    [hId, rig_no, compNum, `Komponen #${compNum}`, imgVal]
                  );
                }
              }
            }
          }
        } catch (hErr) {
          console.error('Error syncing harness tables:', hErr.message);
        }
      }

      return res.json({
        success: true,
        message: status === 'submitted' 
          ? 'Inspeksi berhasil disimpan final dan resmi terkirim!' 
          : 'Perubahan otomatis tersimpan sebagai draft.',
        id: existingId,
        status: status,
        locked: status === 'submitted'
      });
    }

    const insertQuery = `
      INSERT INTO inspections (
        form_type,
        form_code,
        rig_no,
        tanggal,
        lokasi,
        status_rig,
        rekomendasi,
        hfo_name,
        tool_pusher_name,
        status,
        form_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      form_type,
      form_code,
      rig_no,
      tanggal,
      lokasi,
      status_rig,
      rekomendasi,
      hfo_name,
      tool_pusher_name,
      status,
      formDataJson
    ];

    const [result] = await pool.query(insertQuery, values);
    const newInspectionId = result.insertId;

    if (matchForm(form_type) === 'harness' && rig_no) {
      try {
        const [hInsert] = await pool.query(`
          INSERT INTO harness_inspections (inspection_id, rig_no, tanggal, derrickman_name, tool_pusher_name, wsr_name, remark, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [newInspectionId, rig_no, tanggal, hfo_name, tool_pusher_name, payload.wsr_name || null, rekomendasi, status]);
        const hId = hInsert.insertId;

        const componentPhotos = payload.component_photos || payload.componentPhotos;
        if (componentPhotos && typeof componentPhotos === 'object') {
          for (const [compId, imgVal] of Object.entries(componentPhotos)) {
            if (imgVal) {
              const compNum = parseInt(compId, 10);
              await pool.query(
                `INSERT INTO harness_items (harness_inspection_id, rig_no, component_id, component_name, image_data)
                 VALUES (?, ?, ?, ?, ?)`,
                [hId, rig_no, compNum, `Komponen #${compNum}`, imgVal]
              );
            }
          }
        }
      } catch (hErr) {
        console.error('Error inserting harness tables:', hErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: status === 'submitted' 
        ? 'Inspeksi berhasil disimpan final dan resmi terkirim!' 
        : 'Draft inspeksi berhasil dibuat dan tersimpan otomatis.',
      id: newInspectionId,
      status: status,
      locked: status === 'submitted'
    });
  } catch (err) {
    console.error('Error saat INSERT/UPDATE ke tabel inspections:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal menyimpan data ke database: ' + err.message,
      error: err.message
    });
  }
});

// Update inspeksi berdasarkan ID
app.put('/api/inspections/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;

    const [check] = await pool.query('SELECT * FROM inspections WHERE id = ?', [id]);
    if (check.length === 0) {
      return res.status(404).json({ success: false, message: 'Inspeksi tidak ditemukan' });
    }

    const inspection = check[0];
    const isAdminUser = req.currentUser.role === 'admin' || req.currentUser.username === 'admin_besmindo';
    if (!isAdminUser) {
      const userRigNorm = normalizeRig(req.currentUser.rig_name);
      const targetRigNorm = normalizeRig(inspection.rig_no);
      if (userRigNorm !== targetRigNorm) {
        return res.status(403).json({ success: false, message: 'Akses ditolak: Anda tidak memiliki hak untuk mengubah data rig ini.' });
      }
      if (inspection.status === 'submitted') {
        return res.status(403).json({ success: false, message: 'Akses ditolak: Formulir yang telah berstatus submitted tidak dapat diubah oleh Karyawan.' });
      }
    }

    const formDataJson = JSON.stringify(payload);
    await pool.query('UPDATE inspections SET form_data = ?, updated_at = NOW() WHERE id = ?', [formDataJson, id]);

    return res.json({ success: true, message: 'Inspeksi berhasil diperbarui' });
  } catch (err) {
    console.error('Error updating inspection:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui inspeksi: ' + err.message });
  }
});

// Hapus inspeksi (Admin only)
app.delete('/api/inspections/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM inspections WHERE id = ?', [id]);
    await pool.query('DELETE FROM harness_inspections WHERE inspection_id = ?', [id]);
    res.json({ success: true, message: 'Inspeksi berhasil dihapus' });
  } catch (err) {
    console.error('Error deleting inspection:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus inspeksi: ' + err.message });
  }
});

// ── 9. ENDPOINT ITEM & FOTO HARNESS TERSTRUKTUR ──────────────────
app.get('/api/harness-items/:rigNo/:month/:year', async (req, res) => {
  try {
    const { rigNo, month, year } = req.params;
    const monthStr = String(month).padStart(2, '0');
    const monthPattern = `${year}-${monthStr}%`;

    const [rows] = await pool.query(`
      SELECT hi.* 
      FROM harness_items hi
      JOIN harness_inspections h ON hi.harness_inspection_id = h.id
      WHERE h.rig_no = ? AND h.tanggal LIKE ?
      ORDER BY hi.component_id ASC
    `, [rigNo, monthPattern]);

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Error fetching harness items:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data harness items: ' + err.message });
  }
});

// ── 10. JALANKAN SERVER ──────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Server Backend BMS HSE aktif di port: ${PORT}`);
  console.log(`📡 URL API Inspections: http://localhost:${PORT}/api/inspections`);
  console.log(`📊 URL API Overview: http://localhost:${PORT}/api/inspections/overview`);
  console.log(`🔐 URL Login: http://localhost:${PORT}/api/login`);
  console.log(`====================================================`);
});
