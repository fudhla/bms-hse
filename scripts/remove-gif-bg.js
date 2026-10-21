/**
 * remove-gif-bg.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Hapus background putih/terang dari setiap frame GIF animasi.
 * Cara kerja:
 *   1. Decode GIF menggunakan omggif (mendapat raw RGBA per frame)
 *   2. Deteksi warna background dari pojok kiri-atas frame pertama
 *   3. Setiap piksel yang warnanya "dekat" dengan background → alpha = 0
 *   4. Encode ulang sebagai GIF dengan transparent color index
 *   5. Simpan file output (menimpa aslinya atau sebagai file baru)
 *
 * Usage: node scripts/remove-gif-bg.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

const fs   = require('fs');
const path = require('path');
const GifReader  = require('omggif').GifReader;
const GifWriter  = require('omggif').GifWriter;

// ── Konfigurasi ──────────────────────────────────────────────────────────────
const INPUT_PATH  = path.resolve(__dirname, '../public/logo-besmindo-animated.gif');
const OUTPUT_PATH = path.resolve(__dirname, '../public/logo-besmindo-animated.gif'); // timpa langsung
const BACKUP_PATH = path.resolve(__dirname, '../public/logo-besmindo-animated.BACKUP.gif');

// Threshold toleransi warna (0-255). Makin besar = makin banyak warna yang dihapus.
// 30 bagus untuk abu terang nyaris putih, naikkan ke 50-60 jika masih ada sisa.
const COLOR_THRESHOLD = 40;

// ── Fungsi Utilitas ──────────────────────────────────────────────────────────

function colorDistance(r1, g1, b1, r2, g2, b2) {
  return Math.sqrt(
    Math.pow(r1 - r2, 2) +
    Math.pow(g1 - g2, 2) +
    Math.pow(b1 - b2, 2)
  );
}

function isLightColor(r, g, b) {
  // Cek apakah warna terang (putih/abu terang) secara umum
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
  return luminance > 200;
}

// ── Main Process ─────────────────────────────────────────────────────────────

console.log('═══════════════════════════════════════════════════');
console.log('  GIF Background Remover — BMS HSE Inspection App');
console.log('═══════════════════════════════════════════════════\n');

// 1. Baca file GIF input
if (!fs.existsSync(INPUT_PATH)) {
  console.error('❌ File tidak ditemukan:', INPUT_PATH);
  process.exit(1);
}

// Buat backup dulu sebelum menimpa
if (!fs.existsSync(BACKUP_PATH)) {
  fs.copyFileSync(INPUT_PATH, BACKUP_PATH);
  console.log('✅ Backup disimpan:', path.basename(BACKUP_PATH));
}

const gifBuffer = fs.readFileSync(INPUT_PATH);
const gifData   = new Uint8Array(gifBuffer);

// 2. Decode GIF
let reader;
try {
  reader = new GifReader(gifData);
} catch (err) {
  console.error('❌ Gagal membaca GIF:', err.message);
  process.exit(1);
}

const width    = reader.width;
const height   = reader.height;
const numFrames = reader.numFrames();

console.log(`📄 File     : ${path.basename(INPUT_PATH)}`);
console.log(`📐 Ukuran   : ${width} × ${height} px`);
console.log(`🎞️  Frames   : ${numFrames}`);
console.log(`🎯 Threshold: ±${COLOR_THRESHOLD} (warna dekat background → transparan)\n`);

// 3. Decode frame pertama untuk deteksi warna background
const firstFramePixels = new Uint8ClampedArray(width * height * 4);
reader.decodeAndBlitFrameRGBA(0, firstFramePixels);

// Ambil warna dari 4 pojok + tengah sebagai kandidat background
const samplePoints = [
  [0, 0],                           // pojok kiri-atas
  [width - 1, 0],                   // pojok kanan-atas
  [0, height - 1],                  // pojok kiri-bawah
  [width - 1, height - 1],          // pojok kanan-bawah
  [Math.floor(width / 2), 0],       // atas tengah
];

// Hitung rata-rata warna pojok-pojok (ambil yang paling terang)
let bgR = 255, bgG = 255, bgB = 255;
let bestLum = -1;

for (const [px, py] of samplePoints) {
  const idx = (py * width + px) * 4;
  const r = firstFramePixels[idx];
  const g = firstFramePixels[idx + 1];
  const b = firstFramePixels[idx + 2];
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  if (lum > bestLum) {
    bestLum = lum;
    bgR = r; bgG = g; bgB = b;
  }
}

console.log(`🎨 Warna background terdeteksi: rgb(${bgR}, ${bgG}, ${bgB}) [luminance: ${bestLum.toFixed(1)}]`);

if (bestLum < 150) {
  console.log('⚠️  Background tidak terlalu terang. Tetap lanjut dengan threshold umum putih/abu.');
  bgR = 255; bgG = 255; bgB = 255; // fallback ke putih murni
}

// 4. Proses setiap frame — buat versi RGBA dengan background transparan
const framesRGBA = [];
const frameMeta  = [];

for (let f = 0; f < numFrames; f++) {
  const info   = reader.frameInfo(f);
  const pixels = new Uint8ClampedArray(width * height * 4);
  reader.decodeAndBlitFrameRGBA(f, pixels);

  // Hapus piksel yang dekat dengan warna background
  let transparentCount = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];

    if (a === 0) continue; // sudah transparan

    const dist = colorDistance(r, g, b, bgR, bgG, bgB);

    // Juga hapus warna abu terang lainnya (artefak JPEG/GIF dithering)
    if (dist <= COLOR_THRESHOLD || (isLightColor(r, g, b) && dist <= COLOR_THRESHOLD * 1.8)) {
      pixels[i + 3] = 0; // alpha → transparan
      transparentCount++;
    }
  }

  framesRGBA.push(pixels);
  frameMeta.push(info);

  const pct = ((transparentCount / (width * height)) * 100).toFixed(1);
  process.stdout.write(`  Frame ${String(f + 1).padStart(3)} / ${numFrames}: ${transparentCount.toLocaleString()} piksel dihapus (${pct}%)\n`);
}

// 5. Re-encode GIF dengan transparent support
// GIF hanya support 256 warna per frame + 1 transparent index
// Kita gunakan omggif GifWriter dengan transparent color index = 0

console.log('\n📦 Meng-encode ulang GIF transparan...');

const outputBuf = Buffer.alloc(gifBuffer.length * 2); // alokasi cukup besar
const writer    = new GifWriter(outputBuf, width, height, {
  loop: 0, // 0 = loop selamanya
});

for (let f = 0; f < numFrames; f++) {
  const pixels = framesRGBA[f];
  const info   = frameMeta[f];
  const delay  = info.delay || 10; // delay dalam 1/100 detik

  // Buat indexed palette dari RGBA
  // Gunakan palette 256 warna dengan warna pertama (index 0) = transparan
  const palette    = new Uint32Array(256);
  const indexed    = new Uint8Array(width * height);
  const colorMap   = new Map();

  let colorIndex = 1; // index 0 = transparan
  palette[0] = 0x00000000; // transparan

  for (let i = 0; i < width * height; i++) {
    const pi = i * 4;
    const r  = pixels[pi];
    const g  = pixels[pi + 1];
    const b  = pixels[pi + 2];
    const a  = pixels[pi + 3];

    if (a === 0) {
      indexed[i] = 0; // gunakan index transparan
      continue;
    }

    // Quantize: gabungkan warna yang mirip (setiap 8 level)
    const qr  = Math.round(r / 8) * 8;
    const qg  = Math.round(g / 8) * 8;
    const qb  = Math.round(b / 8) * 8;
    const key = `${qr},${qg},${qb}`;

    if (colorMap.has(key)) {
      indexed[i] = colorMap.get(key);
    } else {
      if (colorIndex >= 255) {
        // Overflow palette — cari warna terdekat
        let minDist = Infinity;
        let minIdx  = 1;
        for (const [k, v] of colorMap.entries()) {
          const [kr, kg, kb] = k.split(',').map(Number);
          const d = colorDistance(r, g, b, kr, kg, kb);
          if (d < minDist) { minDist = d; minIdx = v; }
        }
        indexed[i] = minIdx;
      } else {
        colorMap.set(key, colorIndex);
        // Pack RGBA ke uint32 (ABGR format untuk omggif)
        palette[colorIndex] = (255 << 24) | (qb << 16) | (qg << 8) | qr;
        indexed[i] = colorIndex;
        colorIndex++;
      }
    }
  }

  // Pad palette ke power of 2
  let palSize = 2;
  while (palSize < colorIndex) palSize *= 2;
  if (palSize > 256) palSize = 256;

  try {
    writer.addFrame(0, 0, width, height, indexed, {
      palette:          Array.from(palette.slice(0, palSize)).map(v => {
        const r = v & 0xFF;
        const g = (v >> 8) & 0xFF;
        const b = (v >> 16) & 0xFF;
        return (r << 16) | (g << 8) | b;
      }),
      delay,
      transparent:      0, // index 0 = transparan
      disposal:         2, // restore to background
    });
  } catch (err) {
    console.warn(`  ⚠️  Frame ${f + 1} skip (${err.message})`);
  }
}

// 6. Simpan output
const outputBytes = writer.end();
const finalBuffer = Buffer.from(outputBuf.buffer, 0, outputBytes);
fs.writeFileSync(OUTPUT_PATH, finalBuffer);

const origSize = (gifBuffer.length / 1024).toFixed(1);
const newSize  = (finalBuffer.length / 1024).toFixed(1);

console.log('\n═══════════════════════════════════════════════════');
console.log(`✅ Selesai! File disimpan: ${path.basename(OUTPUT_PATH)}`);
console.log(`   Ukuran asli  : ${origSize} KB`);
console.log(`   Ukuran baru  : ${newSize} KB`);
console.log(`   Backup       : ${path.basename(BACKUP_PATH)}`);
console.log('═══════════════════════════════════════════════════\n');
console.log('💡 Jika hasilnya kurang bersih, naikkan COLOR_THRESHOLD (default: 40)');
console.log('   lalu jalankan ulang: node scripts/remove-gif-bg.js');
