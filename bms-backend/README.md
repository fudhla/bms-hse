# BMS HSE Inspection Backend (Express.js & MySQL)

Backend REST API untuk Sistem Informasi Inspeksi HSE PT. Besmindo Materi Sewatama.

## 1. Persiapan Database MySQL
1. Pastikan layanan MySQL Anda (seperti XAMPP, Laragon, atau MySQL Server standalone) sudah berjalan.
2. Impor berkas `database.sql` ke MySQL Anda:
   - Melalui **phpMyAdmin**: Buat database baru / buka tab *Import*, lalu pilih `database.sql`.
   - Melalui **Terminal / Command Prompt**:
     ```bash
     mysql -u root -p < database.sql
     ```
   Skrip ini akan otomatis membuat database `bms_hse_db` dan tabel `inspections`.

## 2. Konfigurasi Lingkungan (`.env`)
Periksa berkas `.env` di dalam folder ini:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=bms_hse_db
```
*Catatan: Sesuaikan `DB_PASSWORD` jika MySQL Anda menggunakan kata sandi.*

## 3. Menjalankan Server Backend
Jalankan salah satu perintah berikut:
```bash
# Dari dalam folder bms-backend:
npm start

# Atau mode auto-reload (Node 18+):
npm run dev

# Atau langsung dari root folder proyek:
npm run server
```
Server akan aktif di: **`http://localhost:5000`**

## 4. Endpoint API
- **`GET /api/health`** : Mengecek status aktif server dan koneksi database.
- **`POST /api/inspections`** : Menerima payload inspeksi dari frontend React dan menyimpannya ke tabel `inspections` (termasuk kolom dynamic JSON `form_data`).
- **`GET /api/inspections`** : Mengambil 100 riwayat inspeksi terbaru.
- **`GET /api/inspections/:id`** : Mengambil detail 1 data inspeksi berdasarkan ID.
