/**
 * remove-gif-bg.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Hapus background putih/terang dari setiap frame GIF animasi.
 * Usage: node scripts/remove-gif-bg.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require  = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const { GifReader, GifWriter } = require('omggif');

// ── Konfigurasi ──────────────────────────────────────────────────────────────
const INPUT_PATH  = path.resolve(__dirname, '../public/logo-besmindo-animated.gif');
const OUTPUT_PATH = path.resolve(__dirname, '../public/logo-besmindo-animated.gif');
const BACKUP_PATH = path.resolve(__dirname, '../public/logo-besmindo-animated.BACKUP.gif');
const COLOR_THRESHOLD = 40; // toleransi warna (0-255)

// ── Utilitas ──────────────────────────────────────────────────────────────────
function colorDist(r1,g1,b1,r2,g2,b2){
  return Math.sqrt((r1-r2)**2+(g1-g2)**2+(b1-b2)**2);
}
function luminance(r,g,b){ return 0.299*r+0.587*g+0.114*b; }
function isLight(r,g,b){ return luminance(r,g,b)>200; }

// ── Main ──────────────────────────────────────────────────────────────────────
console.log('═══════════════════════════════════════════════════');
console.log('  GIF Background Remover — BMS HSE Inspection App  ');
console.log('═══════════════════════════════════════════════════\n');

if (!fs.existsSync(INPUT_PATH)){
  console.error('❌ File tidak ditemukan:', INPUT_PATH); process.exit(1);
}

// Backup
if (!fs.existsSync(BACKUP_PATH)){
  fs.copyFileSync(INPUT_PATH, BACKUP_PATH);
  console.log('✅ Backup disimpan:', path.basename(BACKUP_PATH));
}

const gifBuffer = fs.readFileSync(INPUT_PATH);
const gifData   = new Uint8Array(gifBuffer);

let reader;
try { reader = new GifReader(gifData); }
catch(err){ console.error('❌ Gagal membaca GIF:', err.message); process.exit(1); }

const { width, height } = reader;
const numFrames = reader.numFrames();

console.log(`📄 File     : ${path.basename(INPUT_PATH)}`);
console.log(`📐 Ukuran   : ${width} × ${height} px`);
console.log(`🎞️  Frames   : ${numFrames}`);
console.log(`🎯 Threshold: ±${COLOR_THRESHOLD}\n`);

// ── Deteksi warna background dari pojok frame pertama ─────────────────────────
const f0 = new Uint8ClampedArray(width * height * 4);
reader.decodeAndBlitFrameRGBA(0, f0);

const corners = [[0,0],[width-1,0],[0,height-1],[width-1,height-1],[Math.floor(width/2),0]];
let bgR=255, bgG=255, bgB=255, bestLum=-1;
for(const [px,py] of corners){
  const idx=(py*width+px)*4;
  const r=f0[idx],g=f0[idx+1],b=f0[idx+2];
  const lum=luminance(r,g,b);
  if(lum>bestLum){ bestLum=lum; bgR=r; bgG=g; bgB=b; }
}
console.log(`🎨 BG terdeteksi: rgb(${bgR},${bgG},${bgB}) — luminance: ${bestLum.toFixed(1)}`);
if(bestLum < 150){ bgR=255; bgG=255; bgB=255; console.log('⚠️  Fallback ke putih murni'); }

// ── Proses setiap frame ───────────────────────────────────────────────────────
const framesRGBA=[], frameMeta=[];
for(let f=0;f<numFrames;f++){
  const info=reader.frameInfo(f);
  const px=new Uint8ClampedArray(width*height*4);
  reader.decodeAndBlitFrameRGBA(f, px);
  let removed=0;
  for(let i=0;i<px.length;i+=4){
    if(px[i+3]===0) continue;
    const r=px[i],g=px[i+1],b=px[i+2];
    const d=colorDist(r,g,b,bgR,bgG,bgB);
    if(d<=COLOR_THRESHOLD || (isLight(r,g,b) && d<=COLOR_THRESHOLD*1.8)){
      px[i+3]=0; removed++;
    }
  }
  framesRGBA.push(px); frameMeta.push(info);
  const pct=((removed/(width*height))*100).toFixed(1);
  process.stdout.write(`  Frame ${String(f+1).padStart(3)}/${numFrames}: ${removed.toLocaleString()} px transparan (${pct}%)\n`);
}

// ── Encode ulang sebagai GIF transparan ──────────────────────────────────────
console.log('\n📦 Encoding GIF baru...');
const outBuf = Buffer.alloc(Math.max(gifBuffer.length * 3, 4 * 1024 * 1024));
const writer = new GifWriter(outBuf, width, height, { loop: 0 });

for(let f=0;f<numFrames;f++){
  const pixels=framesRGBA[f];
  const info=frameMeta[f];
  const delay=info.delay||10;

  const palette=[];
  const indexed=new Uint8Array(width*height);
  const colorMap=new Map();

  // index 0 = transparan (warna dummy hitam)
  palette.push(0x000000);

  let ci=1;
  for(let i=0;i<width*height;i++){
    const pi=i*4;
    const r=pixels[pi],g=pixels[pi+1],b=pixels[pi+2],a=pixels[pi+3];
    if(a===0){ indexed[i]=0; continue; }

    // Quantize ke 6-bit per channel
    const qr=Math.round(r/4)*4, qg=Math.round(g/4)*4, qb=Math.round(b/4)*4;
    const key=`${qr},${qg},${qb}`;
    if(colorMap.has(key)){
      indexed[i]=colorMap.get(key);
    } else if(ci<255){
      colorMap.set(key,ci);
      palette.push((qr<<16)|(qg<<8)|qb);
      indexed[i]=ci++;
    } else {
      // Palette penuh — cari warna terdekat
      let minD=Infinity, minI=1;
      for(const [k,v] of colorMap){
        const [kr,kg,kb]=k.split(',').map(Number);
        const d=colorDist(r,g,b,kr,kg,kb);
        if(d<minD){ minD=d; minI=v; }
      }
      indexed[i]=minI;
    }
  }

  // Pad palette ke power-of-2
  let palSize=2;
  while(palSize<palette.length) palSize*=2;
  while(palette.length<palSize) palette.push(0x000000);
  if(palSize>256) palSize=256;

  try {
    writer.addFrame(0, 0, width, height, indexed, {
      palette: palette.slice(0, palSize),
      delay,
      transparent: 0,
      disposal: 2,
    });
  } catch(err) {
    console.warn(`  ⚠️  Frame ${f+1} dilewati: ${err.message}`);
  }
}

const endOffset = writer.end();
const finalBuf  = Buffer.from(outBuf.buffer, 0, endOffset);
fs.writeFileSync(OUTPUT_PATH, finalBuf);

const origKB=(gifBuffer.length/1024).toFixed(1);
const newKB=(finalBuf.length/1024).toFixed(1);

console.log('\n═══════════════════════════════════════════════════');
console.log(`✅ Berhasil! → ${path.basename(OUTPUT_PATH)}`);
console.log(`   Ukuran asli : ${origKB} KB`);
console.log(`   Ukuran baru : ${newKB} KB`);
console.log(`   Backup asli : ${path.basename(BACKUP_PATH)}`);
console.log('═══════════════════════════════════════════════════');
console.log('\n💡 Jika masih ada sisa abu-abu, edit COLOR_THRESHOLD (sekarang: '+COLOR_THRESHOLD+')');
console.log('   lalu jalankan ulang: node scripts/remove-gif-bg.mjs\n');
