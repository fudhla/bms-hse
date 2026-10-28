import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';

// ── 1. DEFINISI STANDAR 9 FORMULIR RESMI PT BESMINDO MATERI SEWATAMA ──
export const FORM_META_MAP = {
  apar_standar: {
    title: 'INSPEKSI/V&V ALAT PEMADAM API RINGAN (STANDAR)',
    subtitle: 'PORTABLE FIRE EXTINGUISHER MONTHLY INSPECTION FORM (STANDAR)',
    docNo: 'BMSD/ 13/ FO/ HSE/ 12/ 25',
    rev: '06',
    effectiveDate: '29 Desember 2025'
  },
  apar_hybrid: {
    title: 'INSPEKSI/V&V ALAT PEMADAM API RINGAN (HYBRID)',
    subtitle: 'PORTABLE FIRE EXTINGUISHER MONTHLY INSPECTION FORM (HYBRID)',
    docNo: 'BMSD/ 13/ FO/ HSE/ 12/ 25',
    rev: '06',
    effectiveDate: '29 Desember 2025'
  },
  apar: {
    title: 'INSPEKSI/V&V ALAT PEMADAM API RINGAN (APAR)',
    subtitle: 'PORTABLE FIRE EXTINGUISHER MONTHLY INSPECTION FORM',
    docNo: 'BMSD/ 13/ FO/ HSE/ 12/ 25',
    rev: '06',
    effectiveDate: '29 Desember 2025'
  },
  apd: {
    title: 'INSPEKSI/V&V ALAT PELINDUNG DIRI',
    subtitle: 'PERSONAL PROTECTIVE EQUIPMENT (PPE) MONTHLY INSPECTION FORM',
    docNo: 'BMSD / 22/ FO/HSE/01/26',
    rev: '#05',
    effectiveDate: '16 Januari 2026'
  },
  eyewash_standar: {
    title: 'INSPEKSI/V&V SAFETY SHOWER & EYEWASH STATION (STANDAR)',
    subtitle: 'EYE WASH & SHOWER INSPECTION FORM (STANDAR)',
    docNo: 'BMSD/44/FO/HSE/12/25',
    rev: '04',
    effectiveDate: '29 Desember 2025'
  },
  eyewash_hybrid: {
    title: 'INSPEKSI/V&V SAFETY SHOWER & EYEWASH STATION (HYBRID)',
    subtitle: 'EYE WASH & SHOWER INSPECTION FORM (HYBRID)',
    docNo: 'BMSD/44/FO/HSE/12/25',
    rev: '04',
    effectiveDate: '29 Desember 2025'
  },
  eyewash: {
    title: 'INSPEKSI/V&V SAFETY SHOWER & EYEWASH STATION',
    subtitle: 'EYE WASH & SHOWER INSPECTION FORM',
    docNo: 'BMSD/44/FO/HSE/12/25',
    rev: '04',
    effectiveDate: '29 Desember 2025'
  },
  firstaid: {
    title: 'INSPEKSI/V&V KOTAK PERTOLONGAN PERTAMA (P3K)',
    subtitle: 'FIRST AID BOX MONTHLY INSPECTION FORM',
    docNo: 'BMSD/46/FO/HSE/04/25',
    rev: '05',
    effectiveDate: '15 April 2025'
  },
  harness: {
    title: 'FORM INSPEKSI ALAT UNTUK BEKERJA DIKETINGGIAN',
    subtitle: 'SAFETY HARNESS & LANYARD MONTHLY INSPECTION FORM',
    docNo: 'BMSD/17/FO/HSE/08/26',
    rev: '05',
    effectiveDate: '18 Agustus 2026'
  },
  oxigent: {
    title: 'INSPEKSI/V&V TABUNG & REGULATOR OKSIGEN MEDIS',
    subtitle: 'OXYGEN CYLINDER & REGULATOR MONTHLY INSPECTION FORM',
    docNo: 'BMSD/47/FO/HSE/08/21',
    rev: '03',
    effectiveDate: '20 Agustus 2021'
  },
  scba: {
    title: 'INSPEKSI/V&V SCBA (SELF-CONTAINED BREATHING APPARATUS)',
    subtitle: 'SELF-CONTAINED BREATHING APPARATUS (SCBA) MONTHLY INSPECTION',
    docNo: 'BMSD/43/FO/HSE/06/25',
    rev: '04',
    effectiveDate: '12 Juni 2025'
  },
  spillkit: {
    title: 'INSPEKSI/V&V PERLENGKAPAN SPILL KIT',
    subtitle: 'OIL SPILL KIT EQUIPMENT MONTHLY INSPECTION FORM',
    docNo: 'BMSD/48/FO/HSE/09/21',
    rev: '03',
    effectiveDate: '05 September 2021'
  },
  stretcher: {
    title: 'INSPEKSI/V&V TANDU EVAKUASI DARURAT (STRETCHER)',
    subtitle: 'EMERGENCY STRETCHER MONTHLY INSPECTION FORM',
    docNo: 'BMSD/45/FO/HSE/06/20',
    rev: '04',
    effectiveDate: '22 Juni 2020'
  }
};

export const APD_COLUMN_KEYS = [
  'topi_topguard', 'topi_vguard', 'tali_dagu',
  'kacamata_standar', 'kacamata_google', 'kacamata_resep',
  'sumbat_telinga', 'rompi',
  'sepatu_rubber', 'sepatu_standar',
  'coverall',
  'sarung_cotton', 'sarung_hdhg', 'sarung_rubber', 'sarung_highvoltage',
  'masker_hepa', 'masker_organik',
  'jas_hujan'
];

export const DEFAULT_HARNESS_IMAGES = {
  1: '/images/harness/webbing.png',
  2: '/images/harness/snap-hooks.png',
  3: '/images/harness/d-rings.png',
  4: '/images/harness/buckles.png',
  5: '/images/harness/sewing.png',
  6: '/images/harness/rope.png',
  7: '/images/harness/energy-absorber.png',
  8: '/images/harness/trauma-strap.png',
  9: '/images/harness/labelling.png'
};

export const HARNESS_CHECKLIST_SECTIONS = [
  {
    id: 1,
    komponen: 'WEBBING',
    image: '/images/harness/webbing.png',
    items: [
      'Ada yang terpotong / sobek / terurai',
      'Terkena panas / percikan api las',
      'Ada bekas bahan kimia / asam / pelarut',
      'Terdapat modifikasi yang tidak standar'
    ]
  },
  {
    id: 2,
    komponen: 'SNAP HOOKS & KARABINER',
    image: '/images/harness/snap-hooks.png',
    items: [
      'Ada bengkok / retak / korosi',
      'Penguncian tidak bekerja dengan baik',
      'Kait pengaman (keeper) longgar / rusak',
      'Karat berlebih'
    ]
  },
  {
    id: 3,
    komponen: 'D - RINGS',
    image: '/images/harness/d-rings.png',
    items: [
      'Bengkok / retak / aus',
      'Berkarat berlebihan',
      'Posisi bergeser tidak normal'
    ]
  },
  {
    id: 4,
    komponen: 'BUCKLETS & ADJUSTERS\n(Kancing Sabuk Pengaman)',
    image: '/images/harness/buckles.png',
    items: [
      'Bengkok / retak / aus',
      'Mekanisme penguncian aus / longgar',
      'Bagian kancing hilang'
    ]
  },
  {
    id: 5,
    komponen: 'SEWING\n(Jahitan)',
    image: '/images/harness/sewing.png',
    items: [
      'Jahitan putus / robek / terlepas',
      'Benang lapuk / aus'
    ]
  },
  {
    id: 6,
    komponen: 'ROPE\n(Tali)',
    image: '/images/harness/rope.png',
    items: [
      'Serat putus / terkikis',
      'Diameter tali mengecil / gepeng',
      'Kaku karena zat kimia / panas'
    ]
  },
  {
    id: 7,
    komponen: 'ENERGY ABSORBER\n(Peredam Kejut)',
    image: '/images/harness/energy-absorber.png',
    items: [
      'Telah terbuka / pernah menahan jatuh',
      'Sobek / basah / lapuk',
      'Cover pelindung hilang / rusak'
    ]
  },
  {
    id: 8,
    komponen: 'BLOOD SUSPENSION TRAUMA',
    image: '/images/harness/trauma-strap.png',
    items: [
      'Putus atau robek',
      'Kantong tidak ada',
      'Strap atau restleting rusak'
    ]
  },
  {
    id: 9,
    komponen: 'LABELLING\n(Sertifikasi)',
    image: '/images/harness/labelling.png',
    items: [
      'Tercantum nomor seri dan mudah dibaca',
      'Label produksi',
      'Keterangan alat dan petunjuk pemakaian',
      'Tanggal produksi'
    ]
  }
];

// ── 2. LOGIKA DATA KETAT: PEMBERSIH BUG CENTANG HANTU & FILTER BARIS KOSONG ──
/**
 * Memeriksa apakah baris item kosong (tidak ada tipe, nama barang, atau no seri yang valid)
 * Mengembalikan TRUE jika baris tidak memiliki data nyata yang diisi.
 */
export function isRowEmpty(item, formKey = '') {
  if (!item || typeof item !== 'object') return true;

  if (formKey.startsWith('apar')) {
    const typeStr = String(item.type || '').trim();
    const snStr = String(item.sn || '').trim();
    const isTypeBlank = !typeStr || typeStr === '-' || typeStr.toLowerCase() === 'null' || typeStr.toLowerCase() === 'undefined';
    const isSnBlank = !snStr || snStr === '-' || snStr.toLowerCase() === 'null' || snStr.toLowerCase() === 'undefined';
    return isTypeBlank && isSnBlank;
  }

  if (formKey === 'apd') {
    const namaStr = String(item.nama || '').trim();
    const jabatanStr = String(item.jabatan || '').trim();
    const isNamaBlank = !namaStr || namaStr === '-' || namaStr.toLowerCase() === 'null' || namaStr.toLowerCase() === 'undefined';
    const isJabatanBlank = !jabatanStr || jabatanStr === '-' || jabatanStr.toLowerCase() === 'null' || jabatanStr.toLowerCase() === 'undefined';
    return isNamaBlank && isJabatanBlank;
  }

  if (formKey.startsWith('eyewash')) {
    const dateStr = String(item.date || '').trim();
    const hasCond = item.waterTank || item.shower || item.waterSupply || item.adhesive || item.waterLine || item.cleanness || item.closed || item.pump || item.cover;
    const isDateBlank = !dateStr || dateStr === '-' || dateStr.toLowerCase() === 'null' || dateStr.toLowerCase() === 'undefined';
    return isDateBlank && !hasCond;
  }

  if (formKey === 'oxigent') {
    const merkStr = String(item.merkTypeSerial || '').trim();
    const snStr = String(item.sn || '').trim();
    const penempatanStr = String(item.penempatan || '').trim();
    const isMerkBlank = !merkStr || merkStr === '-' || merkStr.toLowerCase() === 'null' || merkStr.toLowerCase() === 'undefined';
    const isSnBlank = !snStr || snStr === '-' || snStr.toLowerCase() === 'null' || snStr.toLowerCase() === 'undefined';
    const isPenempatanBlank = !penempatanStr || penempatanStr === '-' || penempatanStr.toLowerCase() === 'null' || penempatanStr.toLowerCase() === 'undefined';
    return isMerkBlank && isSnBlank && isPenempatanBlank;
  }

  if (formKey === 'scba') {
    const snStr = String(item.sn || '').trim();
    const penempatanStr = String(item.penempatan || '').trim();
    const certVal = item.certExpireDate || item.certValidDate || item.certDate || item.cert;
    const hasRealCond = (item.pressure && item.pressure !== 'N/A') ||
                        (item.hose && item.hose !== 'N/A') ||
                        (item.rubber && item.rubber !== 'N/A') ||
                        (item.valve && item.valve !== 'N/A') ||
                        (item.tabung && item.tabung !== 'N/A') ||
                        (certVal && certVal !== '-' && certVal !== '');
    const isSnBlank = !snStr || snStr === '-' || snStr.toLowerCase() === 'null' || snStr.toLowerCase() === 'undefined';
    const isPenempatanBlank = !penempatanStr || penempatanStr === '-' || penempatanStr.toLowerCase() === 'null' || penempatanStr.toLowerCase() === 'undefined';
    return isSnBlank && isPenempatanBlank && !hasRealCond;
  }

  if (formKey === 'harness') {
    const snStr = String(item.sn || '').trim();
    const desc = String(item.kriteria || item.item || item.komponen || item.name || '').trim();
    const hasChecks = item.checks && typeof item.checks === 'object' && Object.keys(item.checks).length > 0;
    const isSnBlank = !snStr || snStr === '-' || snStr.toLowerCase() === 'null' || snStr.toLowerCase() === 'undefined';
    const isDescBlank = !desc || desc === '-' || desc.toLowerCase() === 'null' || desc.toLowerCase() === 'undefined';
    return isSnBlank && isDescBlank && !hasChecks;
  }

  if (formKey === 'firstaid') {
    const obat = String(item.jenisObat || item.item || item.name || '').trim();
    return !obat || obat === '-' || obat.toLowerCase() === 'null' || obat.toLowerCase() === 'undefined';
  }

  if (formKey === 'spillkit') {
    const isi = String(item.daftarIsi || item.item || item.name || '').trim();
    return !isi || isi === '-' || isi.toLowerCase() === 'null' || isi.toLowerCase() === 'undefined';
  }

  if (formKey === 'stretcher') {
    const txt = String(item.text || item.item || item.name || '').trim();
    return !txt || txt === '-' || txt.toLowerCase() === 'null' || txt.toLowerCase() === 'undefined';
  }

  const general = String(item.item || item.name || item.komponen || item.desc || '').trim();
  return !general || general === '-' || general.toLowerCase() === 'null' || general.toLowerCase() === 'undefined';
}

/**
 * Filter dinamis: HANYA menyertakan baris yang memiliki nilai valid ke tabel ekspor.
 * Baris kosong otomatis dibuang dan penomoran (re-indexing) akan berurutan rapi.
 */
export function filterActiveInspectionRows(items, formKey = '') {
  if (!Array.isArray(items)) return [];
  return items.filter(item => !isRowEmpty(item, formKey));
}

/**
 * Normalisasi nilai kondisi: Mengembalikan 'V', 'X', 'N/A', atau '-'
 * Khusus baris kosong (isEmpty = true) selalu mengembalikan string kosong ''
 */
export function sanitizeCondition(val, isEmpty = false) {
  if (isEmpty) return '';
  if (val === 'Good' || val === 'OK' || val === 'ok' || val === 'V' || val === 'v' || val === '✓' || val === true) return 'V';
  if (val === 'Bad' || val === 'bad' || val === 'X' || val === 'x' || val === '✕' || val === '✗' || val === false) return 'X';
  if (val === 'N/A' || val === 'na' || val === 'NA') return 'N/A';
  if (!val || val === '-') return '-';
  return String(val);
}

// ── 3. VEKTOR GRAFIS PRESISI UNTUK PDF ────────────────────────────────
function drawVectorCheckmark(doc, x, y, size = 2.4, color = [5, 150, 105]) {
  doc.saveGraphicsState && doc.saveGraphicsState();
  doc.setDrawColor(...color);
  doc.setLineWidth(size * 0.16);
  doc.line(x, y + (size * 0.55), x + (size * 0.38), y + (size * 0.95));
  doc.line(x + (size * 0.38), y + (size * 0.95), x + size, y + (size * 0.1));
  doc.restoreGraphicsState && doc.restoreGraphicsState();
}

function drawVectorCross(doc, x, y, size = 2.2, color = [225, 29, 72]) {
  doc.saveGraphicsState && doc.saveGraphicsState();
  doc.setDrawColor(...color);
  doc.setLineWidth(size * 0.16);
  doc.line(x, y, x + size, y + size);
  doc.line(x + size, y, x, y + size);
  doc.restoreGraphicsState && doc.restoreGraphicsState();
}

export function getLogoDataUrl() {
  return new Promise((resolve) => {
    try {
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        return resolve(null);
      }
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = '/logo-baru.png';
    } catch {
      resolve(null);
    }
  });
}

/**
 * Memastikan gambar tersedia dalam format Base64 Data URL valid untuk jsPDF
 */
export async function ensureBase64Image(src) {
  if (!src || typeof src !== 'string') return null;
  if (src.startsWith('data:image/jpeg') || src.startsWith('data:image/png') || src.startsWith('data:image/jpg') || src.startsWith('data:image/')) {
    return src;
  }

  // 1. Coba konversi via fetch Blob -> Data URL (Metode tercepat & terandal untuk aset /public)
  if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
    try {
      const response = await fetch(src);
      if (response.ok) {
        const blob = await response.blob();
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });
        if (base64) return base64;
      }
    } catch {
      // Lanjut ke fallback Image canvas jika fetch gagal
    }
  }

  // 2. Fallback via Image & Canvas
  return new Promise((resolve) => {
    try {
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        return resolve(null);
      }
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = src;
    } catch {
      resolve(null);
    }
  });
}

/**
 * Resolusi gambar beserta rasio aspek untuk injeksi presisi ke dalam sel PDF
 */
export async function resolveHarnessImage(src) {
  const b64 = await ensureBase64Image(src);
  if (!b64) return null;
  return new Promise((resolve) => {
    try {
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        return resolve({ dataUrl: b64, aspectRatio: 1.33 });
      }
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const nw = img.naturalWidth || img.width || 4;
        const nh = img.naturalHeight || img.height || 3;
        resolve({
          dataUrl: b64,
          aspectRatio: nw / nh
        });
      };
      img.onerror = () => resolve({ dataUrl: b64, aspectRatio: 1.33 });
      img.src = b64;
    } catch {
      resolve({ dataUrl: b64, aspectRatio: 1.33 });
    }
  });
}

export function formatDateDisplay(d) {
  if (!d) return '-';
  if (typeof d === 'string' && d.includes('-') && d.split('-').length === 3) {
    const [y, m, day] = d.split('-');
    if (y.length === 4) return `${day.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  return String(d);
}

export function detectFormKey(payload) {
  if (!payload) return 'apar';
  const data = payload.form_data || payload;

  const rawKey = String(
    payload.form_id ||
    payload.formId ||
    data.form_id ||
    data.formId ||
    payload.form_type ||
    data.form_type ||
    payload.form_code ||
    data.form_code ||
    ''
  ).toLowerCase().trim();

  // APD: Cek exact & keywords & data format
  if (
    rawKey === 'apd' ||
    rawKey.includes('alat pelindung diri') ||
    rawKey.includes('pelindung diri') ||
    rawKey.includes('ppe') ||
    rawKey.includes('fo/hse/01/26') ||
    rawKey.includes('22/fo/hse') ||
    rawKey.includes('22/ fo/hse') ||
    data.karyawan_data ||
    payload.karyawan_data
  ) {
    return 'apd';
  }

  // Eyewash: Cek exact & keywords
  if (rawKey.includes('eyewash_hybrid') || (rawKey.includes('hybrid') && (rawKey.includes('eyewash') || rawKey.includes('shower')))) {
    return 'eyewash_hybrid';
  }
  if (rawKey.includes('eyewash_standar') || (rawKey.includes('standar') && (rawKey.includes('eyewash') || rawKey.includes('shower')))) {
    return 'eyewash_standar';
  }
  if (rawKey.includes('eyewash') || rawKey.includes('shower') || rawKey.includes('cuci mata') || rawKey.includes('44/fo/hse')) {
    return 'eyewash';
  }

  // APAR: Cek exact & keywords
  if (rawKey.includes('apar_hybrid') || (rawKey.includes('hybrid') && rawKey.includes('apar'))) {
    return 'apar_hybrid';
  }
  if (rawKey.includes('apar_standar') || (rawKey.includes('standar') && rawKey.includes('apar'))) {
    return 'apar_standar';
  }
  if (rawKey.includes('apar') || rawKey.includes('pemadam') || rawKey.includes('extinguisher') || rawKey.includes('13/fo/hse')) {
    if (rawKey.includes('hybrid')) return 'apar_hybrid';
    if (rawKey.includes('standar')) return 'apar_standar';
    return 'apar';
  }

  // First Aid:
  if (rawKey.includes('firstaid') || rawKey.includes('first aid') || rawKey.includes('p3k') || rawKey.includes('pertolongan pertama') || rawKey.includes('46/fo/hse')) {
    return 'firstaid';
  }

  // Harness:
  if (rawKey.includes('harness') || rawKey.includes('lanyard') || rawKey.includes('ketinggian') || rawKey.includes('17/fo/hse')) {
    return 'harness';
  }

  // Oxigent:
  if (rawKey.includes('oxigent') || rawKey.includes('oksigen') || rawKey.includes('oxygen') || rawKey.includes('47/fo/hse')) {
    return 'oxigent';
  }

  // SCBA:
  if (rawKey.includes('scba') || rawKey.includes('elsa') || rawKey.includes('breathing') || rawKey.includes('43/fo/hse')) {
    return 'scba';
  }

  // Spill Kit:
  if (rawKey.includes('spillkit') || rawKey.includes('spill kit') || rawKey.includes('spill') || rawKey.includes('48/fo/hse')) {
    return 'spillkit';
  }

  // Stretcher:
  if (rawKey.includes('stretcher') || rawKey.includes('tandu') || rawKey.includes('evakuasi') || rawKey.includes('45/fo/hse')) {
    return 'stretcher';
  }

  for (const k of Object.keys(FORM_META_MAP)) {
    if (rawKey.includes(k)) {
      return k;
    }
  }

  return 'apar';
}

export function normalizeInspectionForExport(payload, explicitFormKey = null) {
  if (!payload) return null;
  const data = payload.form_data || payload;

  const formKey = explicitFormKey || detectFormKey(payload);
  const formMeta = FORM_META_MAP[formKey] || FORM_META_MAP.apar;
  const rigNo = payload.rig_no || data.rig_no || data.rigNo || data.rig_no_dept || 'BMS 01';
  const tanggal = payload.tanggal || data.tanggal || data.inspectionDate || data.period || new Date().toISOString().split('T')[0];
  const lokasi = payload.lokasi || data.lokasi || data.location || data.rigLocation || 'Lokasi Rig';
  const statusRig = payload.status_rig || data.status_rig || data.statusRig || 'Operating';
  const rekomendasi = payload.rekomendasi || data.rekomendasi || data.remarks || data.catatan || '';
  const hfoName = payload.hfo_name || data.hfo_name || data.hfoName || data.hesOfficerName || data.hesFieldOfficer || data.inspected_by || data.inspectedBy || data.wsrName || '';
  const derrickmanName = payload.derrickman_name || data.derrickman_name || data.derrickmanName || data.userName || '';
  const toolPusherName = payload.tool_pusher_name || data.tool_pusher_name || data.toolPusherName || data.toolPusher || data.acknowledged_by || data.acknowledgedBy || '';
  const signatures = payload.signatures || data.signatures || (data.meta && data.meta.signatures) || {};

  let items = data.items || data.karyawan_data || data.rows || data.checklist || [];
  if (!Array.isArray(items)) items = [];

  // Khusus SCBA: Pulihkan dari inspection_details jika items tidak berisi data lengkap
  if (formKey === 'scba') {
    const rawDetails = data.inspection_details || payload.inspection_details;
    if (Array.isArray(rawDetails) && rawDetails.length > 0 && (items.length === 0 || !items[0]?.pressure)) {
      items = rawDetails.flatMap(w =>
        (w.items || []).map(it => ({
          ...it,
          week: w.minggu,
          category: `${it.category} (Minggu ${w.minggu})`,
          penempatan: it.penempatan || `Rig Unit ${it.no}`
        }))
      );
    }
  }

  const componentPhotos = payload.component_photos || payload.componentPhotos || data.component_photos || data.componentPhotos || (data.meta && data.meta.componentPhotos) || (data.meta && data.meta.component_photos) || {};

  return {
    formKey,
    formMeta,
    rigNo,
    tanggal,
    lokasi,
    statusRig,
    rekomendasi,
    hfoName,
    derrickmanName,
    toolPusherName,
    signatures,
    items,
    componentPhotos,
    rawData: data
  };
}

// ── 4. EKSPOR PDF "PIXEL-PERFECT" (STANDAR ENTERPRISE PT BESMINDO) ─────
export async function exportToPdf(inspectionData, explicitFormKey = null) {
  const norm = normalizeInspectionForExport(inspectionData, explicitFormKey);
  if (!norm) return null;

  const {
    formMeta,
    rigNo,
    tanggal,
    lokasi,
    statusRig,
    rekomendasi,
    hfoName,
    toolPusherName,
    signatures,
    items,
    componentPhotos,
    formKey
  } = norm;

  // Orientasi Landscape untuk formulir tabel lebar
  const isLandscape = formKey === 'apd' || formKey.startsWith('apar') || formKey.startsWith('eyewash') || formKey === 'harness' || formKey === 'scba' || formKey === 'oxigent';
  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 8;
  const contentWidth = pageWidth - (margin * 2);

  const logoDataUrl = await getLogoDataUrl();

  /* ─────────────────────────────────────────────────────────────────────────────
     HEADER BOX PRESISI RESMI (3-KOLOM DENGAN KOORDINAT TEPAT)
  ───────────────────────────────────────────────────────────────────────────── */
  const headerY = margin;
  const headerHeight = 20;

  // Garis luar header
  doc.setDrawColor(40, 40, 40);
  doc.setLineWidth(0.3);
  doc.rect(margin, headerY, contentWidth, headerHeight);

  // Kolom 1: Logo Perusahaan (Kiri - Lebar 56mm)
  const col1Width = 56;
  doc.line(margin + col1Width, headerY, margin + col1Width, headerY + headerHeight);

  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', margin + 3, headerY + 2.5, 50, 15);
    } catch {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(20, 20, 20);
      doc.text('PT. BESMINDO MATERI SEWATAMA', margin + 4, headerY + 11);
    }
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(20, 20, 20);
    doc.text('PT. BESMINDO MATERI SEWATAMA', margin + 4, headerY + 11);
  }

  // Kolom 2: Judul Formulir (Tengah)
  const col3Width = 65;
  const col2X = margin + col1Width;
  const col2Width = contentWidth - col1Width - col3Width;
  doc.line(margin + col1Width + col2Width, headerY, margin + col1Width + col2Width, headerY + headerHeight);

  doc.setFillColor(250, 250, 250);
  doc.rect(col2X, headerY, col2Width, headerHeight, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(20, 20, 20);
  doc.text(formMeta.title, col2X + (col2Width / 2), headerY + 8.5, { align: 'center' });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.2);
  doc.setTextColor(80, 80, 80);
  doc.text(formMeta.subtitle, col2X + (col2Width / 2), headerY + 14.5, { align: 'center' });

  // Kolom 3: Dokumen Meta (Kanan - 3 Baris Terbagi Rapi)
  const col3X = margin + col1Width + col2Width;
  const rowHeight = headerHeight / 3;

  doc.line(col3X, headerY + rowHeight, margin + contentWidth, headerY + rowHeight);
  doc.line(col3X, headerY + (rowHeight * 2), margin + contentWidth, headerY + (rowHeight * 2));

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(40, 40, 40);

  // Baris 1: No. Formulir
  doc.text('No. Formulir', col3X + 2.5, headerY + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`:  ${formMeta.docNo}`, col3X + 21, headerY + 4.5);

  // Baris 2: Revisi
  doc.setFont('helvetica', 'normal');
  doc.text('Revisi', col3X + 2.5, headerY + rowHeight + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`:  ${formMeta.rev}`, col3X + 21, headerY + rowHeight + 4.5);

  // Baris 3: Tanggal Efektif
  doc.setFont('helvetica', 'normal');
  doc.text('Tanggal Efektif', col3X + 2.5, headerY + (rowHeight * 2) + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`:  ${formMeta.effectiveDate}`, col3X + 21, headerY + (rowHeight * 2) + 4.5);

  /* ─────────────────────────────────────────────────────────────────────────────
     SUB-HEADER METADATA (Rig, Tanggal, Lokasi, Status Rig)
  ───────────────────────────────────────────────────────────────────────────── */
  const subMetaY = headerY + headerHeight;
  const subMetaHeight = 6.8;
  doc.setLineWidth(0.3);
  doc.rect(margin, subMetaY, contentWidth, subMetaHeight);
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, subMetaY, contentWidth, subMetaHeight, 'F');

  const metaCols = 4;
  const metaColWidth = contentWidth / metaCols;
  const formattedDate = formatDateDisplay(tanggal);

  doc.setFontSize(7.5);
  doc.setTextColor(20, 20, 20);

  // Rig
  doc.setFont('helvetica', 'bold');
  doc.text('Rig.', margin + 2.5, subMetaY + 4.7);
  doc.setTextColor(30, 58, 138); // Navy
  doc.text(`:  ${rigNo}`, margin + 14, subMetaY + 4.7);
  doc.setTextColor(20, 20, 20);

  // Tanggal
  doc.setFont('helvetica', 'bold');
  doc.text('Tanggal', margin + metaColWidth + 2.5, subMetaY + 4.7);
  doc.setFont('helvetica', 'normal');
  doc.text(`:  ${formattedDate}`, margin + metaColWidth + 18, subMetaY + 4.7);

  // Lokasi
  doc.setFont('helvetica', 'bold');
  doc.text('Lokasi', margin + (metaColWidth * 2) + 2.5, subMetaY + 4.7);
  doc.setFont('helvetica', 'normal');
  doc.text(`:  ${lokasi || 'Lokasi Rig'}`, margin + (metaColWidth * 2) + 16, subMetaY + 4.7);

  // Status Rig
  doc.setFont('helvetica', 'bold');
  doc.text('Status Rig', margin + (metaColWidth * 3) + 2.5, subMetaY + 4.7);
  doc.setFont('helvetica', 'normal');
  doc.text(`:  ${statusRig || 'Operating'}`, margin + (metaColWidth * 3) + 20, subMetaY + 4.7);

  /* ─────────────────────────────────────────────────────────────────────────────
     LEGEND BOX KETERANGAN KONDISI
  ───────────────────────────────────────────────────────────────────────────── */
  const legendY = subMetaY + subMetaHeight;
  const legendHeight = 6.2;
  doc.rect(margin, legendY, contentWidth, legendHeight);
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, legendY, contentWidth, legendHeight, 'F');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Keterangan :', margin + 3, legendY + 4.2);

  // Pill 1: Hijau / Kondisi Baik
  const pill1X = margin + 22;
  const pill1W = 68;
  doc.setFillColor(209, 250, 229);
  doc.setDrawColor(52, 211, 153);
  doc.roundedRect(pill1X, legendY + 1.1, pill1W, 4.0, 0.8, 0.8, 'FD');
  drawVectorCheckmark(doc, pill1X + 2.5, legendY + 1.9, 2.3, [5, 150, 105]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(6, 95, 70);
  doc.text('=  Kondisi baik dan sesuai kontrak', pill1X + 6.2, legendY + 4.0);

  // Pill 2: Merah / Kondisi Perlu Ganti
  const pill2X = pill1X + pill1W + 4;
  const pill2W = 74;
  doc.setFillColor(254, 226, 226);
  doc.setDrawColor(248, 113, 113);
  doc.roundedRect(pill2X, legendY + 1.1, pill2W, 4.0, 0.8, 0.8, 'FD');
  drawVectorCross(doc, pill2X + 2.5, legendY + 2.0, 2.0, [225, 29, 72]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(159, 18, 57);
  doc.text('=  Tidak ada / kondisi perlu penggantian', pill2X + 6.2, legendY + 4.0);

  // Pill 3: N/A
  const pill3X = pill2X + pill2W + 4;
  const pill3W = contentWidth - (pill3X - margin) - 2;
  doc.setFillColor(226, 232, 240);
  doc.setDrawColor(148, 163, 184);
  doc.roundedRect(pill3X, legendY + 1.1, pill3W, 4.0, 0.8, 0.8, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(51, 65, 85);
  doc.text('N/A  =  Tidak tersedia / tidak ada dalam kontrak', pill3X + 3, legendY + 4.0);

  /* ─────────────────────────────────────────────────────────────────────────────
     TABEL DATA INSPEKSI DENGAN VALIDASI KETAT ANTI-CENTANG HANTU
  ───────────────────────────────────────────────────────────────────────────── */
  const tableStartY = legendY + legendHeight + 2;
  let tableHead = [];
  let tableBody = [];
  let columnStyles = {};

  // Pra-resolusi foto komponen jika formulir adalah harness (kustom upload atau default)
  const resolvedHarnessPhotos = {};
  if (formKey === 'harness') {
    await Promise.all(
      HARNESS_CHECKLIST_SECTIONS.map(async (sec) => {
        const pSrc = (componentPhotos && (componentPhotos[sec.id] || componentPhotos[String(sec.id)])) || DEFAULT_HARNESS_IMAGES[sec.id] || sec.image;
        if (pSrc) {
          try {
            const imgObj = await resolveHarnessImage(pSrc);
            if (imgObj) {
              resolvedHarnessPhotos[sec.id] = imgObj;
              resolvedHarnessPhotos[String(sec.id)] = imgObj;
            }
          } catch (e) {
            console.warn('Gagal memproses foto komponen harness section', sec.id, e);
          }
        }
      })
    );
  }

  if (formKey === 'apd') {
    tableHead = [
      [
        { content: 'No.', rowSpan: 3, styles: { valign: 'middle', halign: 'center' } },
        { content: 'NAMA KARYAWAN', rowSpan: 3, styles: { valign: 'middle', halign: 'center' } },
        { content: 'JABATAN', rowSpan: 3, styles: { valign: 'middle', halign: 'center' } },
        { content: 'ALAT PELINDUNG DIRI', colSpan: 18, styles: { halign: 'center', fontStyle: 'bold' } },
        { content: 'KETERANGAN', rowSpan: 3, styles: { valign: 'middle', halign: 'center' } }
      ],
      [
        { content: 'Topi keselamatan', colSpan: 2, styles: { halign: 'center' } },
        { content: 'Tali Dagu', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'Kacamata Keselamatan', colSpan: 3, styles: { halign: 'center' } },
        { content: 'Sumbat telinga', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'Rompi', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'Sepatu keselamatan', colSpan: 2, styles: { halign: 'center' } },
        { content: 'Seragam', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'Sarung Tangan', colSpan: 4, styles: { halign: 'center' } },
        { content: 'Masker', colSpan: 2, styles: { halign: 'center' } },
        { content: 'Jas Hujan', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } }
      ],
      [
        { content: 'Topguard', styles: { halign: 'center' } },
        { content: 'V-Guard', styles: { halign: 'center' } },
        { content: 'Standar', styles: { halign: 'center' } },
        { content: 'Google', styles: { halign: 'center' } },
        { content: 'Resep', styles: { halign: 'center' } },
        { content: 'Rubber', styles: { halign: 'center' } },
        { content: 'Standar', styles: { halign: 'center' } },
        { content: 'Cotton', styles: { halign: 'center' } },
        { content: 'HDHG', styles: { halign: 'center' } },
        { content: 'Rubber', styles: { halign: 'center' } },
        { content: 'High V', styles: { halign: 'center' } },
        { content: 'HEPA', styles: { halign: 'center' } },
        { content: 'Organik', styles: { halign: 'center' } }
      ]
    ];

    const activeItems = filterActiveInspectionRows(items, 'apd');
    tableBody = activeItems.map((row, idx) => {
      const rowApd = row.apd || {};

      const apdValues = APD_COLUMN_KEYS.map((k) => {
        return sanitizeCondition(rowApd[k], false);
      });

      return [
        `${idx + 1}.`,
        row.nama || '',
        row.jabatan || '',
        ...apdValues,
        row.keterangan || ''
      ];
    });

    columnStyles = {
      0: { cellWidth: 7, halign: 'center' },
      1: { cellWidth: 32, halign: 'left' },
      2: { cellWidth: 22, halign: 'left' },
      ...Array(18).fill(null).reduce((acc, _, i) => ({ ...acc, [i + 3]: { cellWidth: 9.6, halign: 'center' } }), {}),
      21: { cellWidth: 46.6, halign: 'left' }
    };
  } else if (formKey.startsWith('apar')) {
    tableHead = [
      [
        { content: 'NO', rowSpan: 3, styles: { valign: 'middle', halign: 'center' } },
        { content: 'TYPE / SERIAL NO', rowSpan: 3, styles: { valign: 'middle', halign: 'center' } },
        { content: 'TAHUN', rowSpan: 3, styles: { valign: 'middle', halign: 'center' } },
        { content: 'PENEMPATAN', rowSpan: 3, styles: { valign: 'middle', halign: 'center' } },
        { content: 'CONDITION (Inspeksi Bulanan)', colSpan: 7, styles: { halign: 'center' } },
        { content: 'BERAT', rowSpan: 3, styles: { valign: 'middle', halign: 'center' } },
        { content: 'REMARKS', rowSpan: 3, styles: { valign: 'middle', halign: 'center' } }
      ],
      [
        { content: 'HANDLE', styles: { halign: 'center' } },
        { content: 'HOSE', styles: { halign: 'center' } },
        { content: 'NOZLE', styles: { halign: 'center' } },
        { content: 'PENGAMAN', styles: { halign: 'center' } },
        { content: 'PIN', styles: { halign: 'center' } },
        { content: 'PRESSURE', styles: { halign: 'center' } },
        { content: 'TABUNG', styles: { halign: 'center' } }
      ],
      [
        { content: 'V / X', styles: { halign: 'center' } },
        { content: 'V / X', styles: { halign: 'center' } },
        { content: 'V / X', styles: { halign: 'center' } },
        { content: 'V / X', styles: { halign: 'center' } },
        { content: 'V / X', styles: { halign: 'center' } },
        { content: 'V / X', styles: { halign: 'center' } },
        { content: 'V / X', styles: { halign: 'center' } }
      ]
    ];

    const activeItems = filterActiveInspectionRows(items, formKey);
    const hasHybrid = activeItems.some(it => it.aparCategory === 'hybrid' || (it.uid && String(it.uid).startsWith('hyb_')));
    const hasStandar = activeItems.some(it => it.aparCategory === 'standar' || (it.uid && String(it.uid).startsWith('std_')));
    const isCombo = hasHybrid && hasStandar;

    tableBody = activeItems.map((it, idx) => {
      const isCO2 = String(it.type || '').trim().toUpperCase() === 'CO' || String(it.type || '').trim().toUpperCase().includes('CO2');
      const pressureVal = isCO2 ? 'N/A' : sanitizeCondition(it.pressure, false);
      const catBadge = isCombo ? (it.aparCategory === 'hybrid' ? '[HYBRID] ' : '[STANDAR] ') : '';
      const typeDisplay = it.type ? `${catBadge}${it.type}${it.sn ? '\nSN: ' + it.sn : ''}` : (it.sn ? `SN: ${it.sn}` : '-');

      return [
        `${idx + 1}.`,
        typeDisplay,
        it.tahun || '-',
        it.penempatan || '-',
        sanitizeCondition(it.handle, false),
        sanitizeCondition(it.hose, false),
        sanitizeCondition(it.nozle, false),
        sanitizeCondition(it.pengaman, false),
        sanitizeCondition(it.pin, false),
        pressureVal,
        sanitizeCondition(it.tabung, false),
        isCO2 ? (it.berat ? `${it.berat} Kg` : '-') : '-',
        it.remarks || 'Normal'
      ];
    });

    columnStyles = {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 42, halign: 'left' },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 32, halign: 'left' },
      4: { cellWidth: 13, halign: 'center' },
      5: { cellWidth: 13, halign: 'center' },
      6: { cellWidth: 13, halign: 'center' },
      7: { cellWidth: 13, halign: 'center' },
      8: { cellWidth: 13, halign: 'center' },
      9: { cellWidth: 13, halign: 'center' },
      10: { cellWidth: 13, halign: 'center' },
      11: { cellWidth: 16, halign: 'center' },
      12: { halign: 'left' }
    };
  } else if (formKey.startsWith('eyewash')) {
    tableHead = [
      [
        { content: 'NO', styles: { valign: 'middle', halign: 'center' } },
        { content: 'BAGIAN / UNIT', styles: { valign: 'middle', halign: 'center' } },
        { content: 'MINGGU', styles: { valign: 'middle', halign: 'center' } },
        { content: 'TANGGAL', styles: { valign: 'middle', halign: 'center' } },
        { content: 'POSISI / AREA PENEMPATAN', styles: { valign: 'middle', halign: 'center' } },
        { content: 'WATER TANK', styles: { valign: 'middle', halign: 'center' } },
        { content: 'WATER SUPPLY / SHOWER', styles: { valign: 'middle', halign: 'center' } },
        { content: 'VALVE / ADHESIVE', styles: { valign: 'middle', halign: 'center' } },
        { content: 'SHOWER / WATER SUPPLY', styles: { valign: 'middle', halign: 'center' } },
        { content: 'CLEANNESS / CLOSED', styles: { valign: 'middle', halign: 'center' } },
        { content: 'MOTOR PUMP / COVER', styles: { valign: 'middle', halign: 'center' } },
        { content: 'REMARKS / KETERANGAN', styles: { valign: 'middle', halign: 'center' } }
      ]
    ];

    const activeItems = filterActiveInspectionRows(items, 'eyewash');

    tableBody = activeItems.map((it, idx) => {
      const isShower = String(it.id || '').startsWith('shower') || idx < 4;
      const typeLabel = isShower ? 'SHOWER' : 'EYE WASH';

      const c1 = sanitizeCondition(it.waterTank, false);
      const c2 = isShower ? sanitizeCondition(it.waterSupply, false) : sanitizeCondition(it.shower, false);
      const c3 = isShower ? sanitizeCondition(it.waterLine, false) : sanitizeCondition(it.adhesive, false);
      const c4 = isShower ? sanitizeCondition(it.shower, false) : sanitizeCondition(it.waterSupply, false);
      const c5 = isShower ? sanitizeCondition(it.cleanness, false) : sanitizeCondition(it.closed, false);
      const c6 = isShower ? sanitizeCondition(it.pump, false) : sanitizeCondition(it.cover, false);

      return [
        `${idx + 1}.`,
        typeLabel,
        it.week ? `Minggu ${it.week}` : '-',
        formatDateDisplay(it.date),
        it.penempatan || '-',
        c1, c2, c3, c4, c5, c6,
        it.remarks || 'Normal'
      ];
    });

    columnStyles = {
      0: { cellWidth: 9, halign: 'center' },
      1: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 38, halign: 'left' },
      5: { cellWidth: 18, halign: 'center' },
      6: { cellWidth: 22, halign: 'center' },
      7: { cellWidth: 20, halign: 'center' },
      8: { cellWidth: 22, halign: 'center' },
      9: { cellWidth: 22, halign: 'center' },
      10: { cellWidth: 22, halign: 'center' },
      11: { halign: 'left' }
    };
  } else if (formKey === 'oxigent') {
    tableHead = [
      [
        { content: 'NO', styles: { valign: 'middle', halign: 'center' } },
        { content: 'MERK / TYPE / SERIAL NO', styles: { valign: 'middle', halign: 'center' } },
        { content: 'PENEMPATAN', styles: { valign: 'middle', halign: 'center' } },
        { content: 'PRESSURE / VOLUME', styles: { valign: 'middle', halign: 'center' } },
        { content: 'REGULATOR', styles: { valign: 'middle', halign: 'center' } },
        { content: 'HYDRO TEST', styles: { valign: 'middle', halign: 'center' } },
        { content: 'TABUNG', styles: { valign: 'middle', halign: 'center' } },
        { content: 'VALVE CONNECTION', styles: { valign: 'middle', halign: 'center' } },
        { content: 'REKOMENDASI / KETERANGAN', styles: { valign: 'middle', halign: 'center' } }
      ]
    ];

    const activeItems = filterActiveInspectionRows(items, 'oxigent');

    tableBody = activeItems.map((it, idx) => {
      return [
        `${idx + 1}.`,
        it.merkTypeSerial || it.sn || '-',
        it.penempatan || '-',
        sanitizeCondition(it.pressureVolume, false),
        sanitizeCondition(it.regulator, false),
        sanitizeCondition(it.hydroTest, false),
        sanitizeCondition(it.tabung, false),
        sanitizeCondition(it.valveConnection, false),
        it.rekomendasi || 'Normal'
      ];
    });

    columnStyles = {
      0: { cellWidth: 9, halign: 'center' },
      1: { cellWidth: 50, halign: 'left' },
      2: { cellWidth: 35, halign: 'left' },
      3: { cellWidth: 24, halign: 'center' },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 22, halign: 'center' },
      6: { cellWidth: 20, halign: 'center' },
      7: { cellWidth: 24, halign: 'center' },
      8: { halign: 'left' }
    };
  } else if (formKey === 'scba') {
    tableHead = [
      [
        { content: 'NO', rowSpan: 3, styles: { valign: 'middle', halign: 'center' } },
        { content: 'MERK, TYPE / SERIAL NO', rowSpan: 3, styles: { valign: 'middle', halign: 'center' } },
        { content: 'PENEMPATAN', rowSpan: 3, styles: { valign: 'middle', halign: 'center' } },
        { content: 'C O N D I T I O N', colSpan: 14, styles: { valign: 'middle', halign: 'center', fontStyle: 'bold' } },
        { content: 'REKOMENDASI (Catatan)', rowSpan: 3, styles: { valign: 'middle', halign: 'center' } }
      ],
      [
        { content: 'PRESSURE VOLUME', colSpan: 2, styles: { halign: 'center' } },
        { content: 'HOSE', colSpan: 2, styles: { halign: 'center' } },
        { content: 'CERTIFICATE', colSpan: 2, styles: { halign: 'center' } },
        { content: 'RUBBER MASKER & TAIL', colSpan: 2, styles: { halign: 'center' } },
        { content: 'VALVE & connection', colSpan: 2, styles: { halign: 'center' } },
        { content: 'WISTLE', colSpan: 2, styles: { halign: 'center' } },
        { content: 'TABUNG', colSpan: 2, styles: { halign: 'center' } }
      ],
      [
        { content: 'V', styles: { halign: 'center', fontSize: 6.5 } }, { content: 'X', styles: { halign: 'center', fontSize: 6.5 } },
        { content: 'V', styles: { halign: 'center', fontSize: 6.5 } }, { content: 'X', styles: { halign: 'center', fontSize: 6.5 } },
        { content: 'Berlaku', styles: { halign: 'center', fontSize: 4.8, fontStyle: 'bold' } }, { content: 'Expire', styles: { halign: 'center', fontSize: 4.8, fontStyle: 'bold' } },
        { content: 'V', styles: { halign: 'center', fontSize: 6.5 } }, { content: 'X', styles: { halign: 'center', fontSize: 6.5 } },
        { content: 'V', styles: { halign: 'center', fontSize: 6.5 } }, { content: 'X', styles: { halign: 'center', fontSize: 6.5 } },
        { content: 'V', styles: { halign: 'center', fontSize: 6.5 } }, { content: 'X', styles: { halign: 'center', fontSize: 6.5 } },
        { content: 'V', styles: { halign: 'center', fontSize: 6.5 } }, { content: 'X', styles: { halign: 'center', fontSize: 6.5 } }
      ]
    ];

    const rawData = norm.rawData || {};
    let scbaList = rawData.scba_items;
    let elsaList = rawData.elsa_items;

    if (!Array.isArray(scbaList) || !Array.isArray(elsaList)) {
      scbaList = items.filter(it => !it.isElsa && !String(it.category || '').toLowerCase().includes('elsa'));
      elsaList = items.filter(it => it.isElsa || String(it.category || '').toLowerCase().includes('elsa'));
    }

    if (scbaList.length === 0) {
      scbaList = [1, 2, 3, 4, 5].map(no => ({ no, sn: '', penempatan: '', pressure: '', hose: '', cert: '', certValidDate: '', certExpireDate: '', rubber: '', valve: '', whistle: '', tabung: '', rekomendasi: '' }));
    }
    if (elsaList.length === 0) {
      elsaList = [1, 2].map(no => ({ no, sn: '', penempatan: '', pressure: '', hose: '', cert: '', certValidDate: '', certExpireDate: '', rubber: '', valve: '', whistle: 'N/A', tabung: '', rekomendasi: '', isElsa: true }));
    }

    const pairCondition = (val) => {
      const isV = val === '✓' || val === 'Good' || val === 'Berlaku' || val === 'V' || val === 'v' || val === 'OK' || val === 'ok';
      const isX = val === '✕' || val === 'X' || val === 'x' || val === '✗' || val === 'Bad' || val === 'Expire';
      return [isV ? 'V' : '', isX ? 'X' : ''];
    };

    const formatCertDate = (val) => {
      if (!val) return '-';
      if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
        const parts = val.slice(0, 10).split('-');
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return String(val);
    };

    tableBody = [];

    // ── GRUP 1: SCBA ──
    tableBody.push([
      {
        content: 'SCBA SPERIAN 30 MNT :',
        colSpan: 18,
        styles: { fontStyle: 'bold', fillColor: [226, 232, 240], textColor: [15, 23, 42], halign: 'left', cellPadding: 1.5 }
      }
    ]);

    scbaList.forEach((it, idx) => {
      const [pv_v, pv_x] = pairCondition(it.pressure);
      const [hs_v, hs_x] = pairCondition(it.hose);
      const ct_berlaku = formatCertDate(it.certValidDate || it.certStartDate);
      const ct_expire = formatCertDate(it.certExpireDate || it.certDate || (it.cert && it.cert.includes('-') ? it.cert : ''));
      const [rb_v, rb_x] = pairCondition(it.rubber);
      const [vl_v, vl_x] = pairCondition(it.valve);
      const [ws_v, ws_x] = pairCondition(it.whistle);
      const [tb_v, tb_x] = pairCondition(it.tabung);

      tableBody.push([
        `${idx + 1}.`,
        it.sn ? `S/N: ${it.sn}` : '-',
        it.penempatan || '-',
        pv_v, pv_x,
        hs_v, hs_x,
        ct_berlaku, ct_expire,
        rb_v, rb_x,
        vl_v, vl_x,
        ws_v, ws_x,
        tb_v, tb_x,
        it.rekomendasi || 'Normal'
      ]);
    });

    // ── GRUP 2: ELSA ──
    tableBody.push([
      {
        content: 'ELSA 10 Menit :',
        colSpan: 18,
        styles: { fontStyle: 'bold', fillColor: [226, 232, 240], textColor: [15, 23, 42], halign: 'left', cellPadding: 1.5 }
      }
    ]);

    elsaList.forEach((it, idx) => {
      const [pv_v, pv_x] = pairCondition(it.pressure);
      const [hs_v, hs_x] = pairCondition(it.hose);
      const ct_berlaku = formatCertDate(it.certValidDate || it.certStartDate);
      const ct_expire = formatCertDate(it.certExpireDate || it.certDate || (it.cert && it.cert.includes('-') ? it.cert : ''));
      const [rb_v, rb_x] = pairCondition(it.rubber);
      const [vl_v, vl_x] = pairCondition(it.valve);
      const [tb_v, tb_x] = pairCondition(it.tabung);

      tableBody.push([
        `${idx + 1}.`,
        it.sn ? `S/N: ${it.sn}` : '-',
        it.penempatan || '-',
        pv_v, pv_x,
        hs_v, hs_x,
        ct_berlaku, ct_expire,
        rb_v, rb_x,
        vl_v, vl_x,
        { content: '', colSpan: 2, styles: { fillColor: [0, 0, 0] } },
        tb_v, tb_x,
        it.rekomendasi || 'Normal'
      ]);
    });

    columnStyles = {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 42, halign: 'left' },
      2: { cellWidth: 28, halign: 'left' },
      3: { cellWidth: 8, halign: 'center' },
      4: { cellWidth: 8, halign: 'center' },
      5: { cellWidth: 8, halign: 'center' },
      6: { cellWidth: 8, halign: 'center' },
      7: { cellWidth: 15, halign: 'center', fontSize: 5 },
      8: { cellWidth: 15, halign: 'center', fontSize: 5 },
      9: { cellWidth: 8, halign: 'center' },
      10: { cellWidth: 8, halign: 'center' },
      11: { cellWidth: 8, halign: 'center' },
      12: { cellWidth: 8, halign: 'center' },
      13: { cellWidth: 8, halign: 'center' },
      14: { cellWidth: 8, halign: 'center' },
      15: { cellWidth: 8, halign: 'center' },
      16: { cellWidth: 8, halign: 'center' },
      17: { halign: 'left' }
    };
  } else if (formKey === 'firstaid') {
    tableHead = [
      [
        { content: 'NO', styles: { valign: 'middle', halign: 'center' } },
        { content: 'DAFTAR ISI / JENIS OBAT', styles: { valign: 'middle', halign: 'center' } },
        { content: 'UKURAN', styles: { valign: 'middle', halign: 'center' } },
        { content: 'JUMLAH', styles: { valign: 'middle', halign: 'center' } },
        { content: 'TGL KADALUARSA', styles: { valign: 'middle', halign: 'center' } },
        { content: 'KONDISI', styles: { valign: 'middle', halign: 'center' } },
        { content: 'CATATAN TEMUAN', styles: { valign: 'middle', halign: 'center' } }
      ]
    ];

    const activeItems = filterActiveInspectionRows(items, 'firstaid');
    tableBody = activeItems.map((it, idx) => {
      return [
        `${idx + 1}.`,
        it.jenisObat || it.item || '-',
        it.ukuran || '-',
        it.jumlah ? String(it.jumlah) : '-',
        formatDateDisplay(it.expDate),
        sanitizeCondition(it.kondisi, false),
        it.temuan || it.remarks || 'Normal'
      ];
    });

    columnStyles = {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 54, halign: 'left' },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 26, halign: 'center' },
      5: { cellWidth: 18, halign: 'center' },
      6: { halign: 'left' }
    };
  } else if (formKey === 'spillkit') {
    tableHead = [
      [
        { content: 'NO', styles: { valign: 'middle', halign: 'center' } },
        { content: 'DAFTAR ISI PERLENGKAPAN SPILL KIT', styles: { valign: 'middle', halign: 'center' } },
        { content: 'JUMLAH', styles: { valign: 'middle', halign: 'center' } },
        { content: 'KONDISI', styles: { valign: 'middle', halign: 'center' } },
        { content: 'CATATAN / TEMUAN', styles: { valign: 'middle', halign: 'center' } }
      ]
    ];

    const activeItems = filterActiveInspectionRows(items, 'spillkit');
    tableBody = activeItems.map((it, idx) => {
      return [
        `${idx + 1}.`,
        it.daftarIsi || it.item || '-',
        it.jumlah ? String(it.jumlah) : '-',
        sanitizeCondition(it.kondisi, false),
        it.temuan || it.remarks || 'Normal'
      ];
    });

    columnStyles = {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 74, halign: 'left' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 25, halign: 'center' },
      4: { halign: 'left' }
    };
  } else if (formKey === 'stretcher') {
    tableHead = [
      [
        { content: 'NO', styles: { valign: 'middle', halign: 'center' } },
        { content: 'ITEM PEMERIKSAAN / CHECKLIST', styles: { valign: 'middle', halign: 'center' } },
        { content: 'KONDISI', styles: { valign: 'middle', halign: 'center' } },
        { content: 'KETERANGAN / REMARKS', styles: { valign: 'middle', halign: 'center' } }
      ]
    ];

    const activeItems = filterActiveInspectionRows(items, 'stretcher');
    tableBody = activeItems.map((it, idx) => {
      return [
        `${idx + 1}.`,
        it.text || it.item || '-',
        sanitizeCondition(it.condition || it.kondisi, false),
        it.remarks || it.keterangan || 'Normal'
      ];
    });

    columnStyles = {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 110, halign: 'left' },
      2: { cellWidth: 25, halign: 'center' },
      3: { halign: 'left' }
    };
  } else if (formKey === 'harness') {
    const rawUnits = norm.rawData?.units_data || (Array.isArray(items) && items.length > 0 && items[0]?.checks ? items : []);
    let activeUnits = rawUnits.filter(u => u && (u.sn || (u.checks && Object.keys(u.checks).length > 0)));
    if (activeUnits.length === 0) {
      activeUnits = [{ sn: 'Unit 1', lokasi: lokasi || 'Rig', tanggal: tanggal, checks: {} }];
    }

    tableHead = [
      [
        { content: 'NO', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'KOMPONEN', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'JENIS KERUSAKAN / ITEM CHECKLIST', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'GAMBAR / FOTO', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        ...activeUnits.map((u, i) => ({
          content: `S/N: ${u.sn || `Unit ${i + 1}`}\nLok: ${u.lokasi || '-'}`,
          styles: { halign: 'center', fontStyle: 'bold', fontSize: 6.2 }
        }))
      ],
      activeUnits.map(() => ({
        content: 'KONDISI (V/X)',
        styles: { halign: 'center', fontSize: 5.8 }
      }))
    ];

    tableBody = [];
    HARNESS_CHECKLIST_SECTIONS.forEach((sec) => {
      const photoObj = resolvedHarnessPhotos[sec.id] || resolvedHarnessPhotos[String(sec.id)] || null;
      sec.items.forEach((itemText, itemIdx) => {
        const itemKey = `sec_${sec.id}_item_${itemIdx}`;
        const photoCell = itemIdx === 0 ? {
          content: '',
          rowSpan: sec.items.length,
          styles: { valign: 'middle', halign: 'center', minCellHeight: 18 },
          _isHarnessPhotoCell: true,
          _harnessPhoto: photoObj,
          _sectionId: sec.id
        } : null;

        const row = [
          itemIdx === 0 ? { content: `${sec.id}.`, rowSpan: sec.items.length, styles: { valign: 'middle', halign: 'center', fontStyle: 'bold' } } : null,
          itemIdx === 0 ? { content: sec.komponen, rowSpan: sec.items.length, styles: { valign: 'middle', fontStyle: 'bold' } } : null,
          itemText,
          photoCell,
          ...activeUnits.map(u => sanitizeCondition(u.checks?.[itemKey], false))
        ].filter(cell => cell !== null);
        tableBody.push(row);
      });
    });

    const fixedWidths = 7 + 32 + 62 + 30; // 131mm
    const totalRemaining = contentWidth - fixedWidths;
    const unitColWidth = Math.max(16, totalRemaining / activeUnits.length);
    columnStyles = {
      0: { cellWidth: 7, halign: 'center' },
      1: { cellWidth: 32, halign: 'left' },
      2: { cellWidth: 62, halign: 'left' },
      3: { cellWidth: 30, halign: 'center' },
      ...activeUnits.reduce((acc, _, i) => ({ ...acc, [i + 4]: { cellWidth: unitColWidth, halign: 'center' } }), {})
    };
  } else {
    // Fallback Formulir Tambahan / Kustom Lainnya
    tableHead = [
      [
        { content: 'No.', styles: { halign: 'center' } },
        { content: 'Komponen / Item Pemeriksaan', styles: { halign: 'center' } },
        { content: 'Lokasi / Penempatan / Jumlah', styles: { halign: 'center' } },
        { content: 'Kondisi Fisik / Status', styles: { halign: 'center' } },
        { content: 'Keterangan / Tindakan Perbaikan', styles: { halign: 'center' } }
      ]
    ];

    const activeItems = filterActiveInspectionRows(items, formKey);

    tableBody = activeItems.map((it, idx) => {
      const name = it.item || it.name || it.komponen || it.daftarIsi || it.jenisObat || it.text || (it.sn ? `S/N: ${it.sn}` : `Item ${idx + 1}`);
      const loc = it.lokasi || it.penempatan || (it.jumlah ? `Qty: ${it.jumlah} ${it.ukuran || ''}` : '-');
      const cond = sanitizeCondition(it.kondisi || it.condition || it.status || (it.good ? 'V' : 'V'), false);
      const rem = it.keterangan || it.remarks || it.temuan || 'Normal';

      return [`${idx + 1}.`, name, loc, cond, rem];
    });

    columnStyles = {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 80, halign: 'left' },
      2: { cellWidth: 45, halign: 'left' },
      3: { cellWidth: 28, halign: 'center' },
      4: { halign: 'left' }
    };
  }

  // ── Eksekusi autoTable dengan perenderan vektor murni ──
  autoTable(doc, {
    startY: tableStartY,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [240, 240, 240], // Abu-abu terang elegan
      textColor: [20, 20, 20],      // Hitam tebal
      fontSize: formKey === 'apd' ? 5.8 : 7.2,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      lineColor: [40, 40, 40],     // Garis abu-abu gelap/hitam tipis
      lineWidth: 0.1,
      cellPadding: 0.8
    },
    bodyStyles: {
      fontSize: formKey === 'apd' ? 5.8 : 7.0,
      textColor: [30, 41, 59],
      lineColor: [40, 40, 40],
      lineWidth: 0.1,
      cellPadding: 0.8,
      valign: 'middle'
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255]
    },
    columnStyles: columnStyles,
    margin: { left: margin, right: margin, bottom: 12 },

    // Bersihkan teks pada sel centang/silang & foto komponen agar tidak bertabrakan dengan perenderan grafis
    didParseCell: (data) => {
      if (data.section === 'body') {
        const rawCell = data.cell.raw;
        if (rawCell && typeof rawCell === 'object' && rawCell._isHarnessPhotoCell) {
          data.cell.text = []; // kosongkan teks untuk digambar foto oleh didDrawCell
          return;
        }

        if (rawCell && typeof rawCell === 'object' && rawCell.styles?.fillColor) {
          data.cell.text = [];
          return;
        }

        const raw = String(data.cell.raw || '').trim();
        if (raw === 'V' || raw === 'v' || raw === '✓') {
          data.cell.text = []; // kosongkan teks untuk digambar vektor
        } else if (raw === 'X' || raw === 'x' || raw === '✕' || raw === '✗') {
          data.cell.text = []; // kosongkan teks untuk digambar vektor
        } else if (raw === 'N/A' || raw === 'na') {
          data.cell.text = ['N/A'];
          data.cell.styles.textColor = [100, 116, 139];
          data.cell.styles.fontSize = 5.2;
          data.cell.styles.fontStyle = 'bold';
        } else if (!raw || raw === '') {
          data.cell.text = []; // benar-benar kosong untuk baris kosong
        } else if (raw === '-') {
          data.cell.text = ['-'];
          data.cell.styles.textColor = [148, 163, 184];
        }
      }
    },

    // Gambar simbol centang & silang vektor, serta injeksi foto komponen Harness via didDrawCell
    didDrawCell: (data) => {
      if (data.section === 'body') {
        const rawCell = data.cell.raw;
        if (rawCell && typeof rawCell === 'object' && rawCell._isHarnessPhotoCell) {
          const photoObj = rawCell._harnessPhoto;
          if (photoObj && photoObj.dataUrl && data.cell.height > 4) {
            try {
              const pad = 1.2;
              const maxW = Math.max(1, data.cell.width - (pad * 2));
              const maxH = Math.max(1, data.cell.height - (pad * 2));
              let imgW = maxW;
              let imgH = imgW / (photoObj.aspectRatio || 1.33);
              if (imgH > maxH) {
                imgH = maxH;
                imgW = imgH * (photoObj.aspectRatio || 1.33);
              }
              const imgX = data.cell.x + (data.cell.width - imgW) / 2;
              const imgY = data.cell.y + (data.cell.height - imgH) / 2;
              const fmt = photoObj.dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
              doc.addImage(photoObj.dataUrl, fmt, imgX, imgY, imgW, imgH);

              doc.saveGraphicsState && doc.saveGraphicsState();
              doc.setDrawColor(203, 213, 225);
              doc.setLineWidth(0.1);
              doc.rect(imgX, imgY, imgW, imgH);
              doc.restoreGraphicsState && doc.restoreGraphicsState();
            } catch (err) {
              console.warn('Gagal merender foto komponen harness pada sel PDF:', err);
            }
          } else if (data.cell.height > 4) {
            doc.saveGraphicsState && doc.saveGraphicsState();
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(5.5);
            doc.setTextColor(148, 163, 184);
            doc.text('(Belum ada foto)', data.cell.x + (data.cell.width / 2), data.cell.y + (data.cell.height / 2), { align: 'center' });
            doc.restoreGraphicsState && doc.restoreGraphicsState();
          }
          return;
        }

        if (rawCell && typeof rawCell === 'object' && rawCell.styles?.fillColor) {
          return;
        }

        const raw = String(data.cell.raw || '').trim();
        if (raw === 'V' || raw === 'v' || raw === '✓') {
          const cx = data.cell.x + (data.cell.width / 2) - 1.2;
          const cy = data.cell.y + (data.cell.height / 2) - 1.3;
          drawVectorCheckmark(doc, cx, cy, 2.4, [5, 150, 105]);
        } else if (raw === 'X' || raw === 'x' || raw === '✕' || raw === '✗') {
          const cx = data.cell.x + (data.cell.width / 2) - 1.1;
          const cy = data.cell.y + (data.cell.height / 2) - 1.1;
          drawVectorCross(doc, cx, cy, 2.2, [225, 29, 72]);
        }
      }
    }
  });

  /* ─────────────────────────────────────────────────────────────────────────────
     REKOMENDASI & TANDA TANGAN DIGITAL
  ───────────────────────────────────────────────────────────────────────────── */
  let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 3 : tableStartY + 50;

  // Cek apakah muat di halaman yang sama, jika tidak buat halaman baru
  if (finalY + 46 > pageHeight - margin) {
    doc.addPage();
    finalY = margin + 4;
  }

  // Box Rekomendasi
  const recY = finalY;
  const recHeaderHeight = 4.5;
  const recBodyHeight = 10;
  const recTotalHeight = recHeaderHeight + recBodyHeight;

  doc.setDrawColor(40, 40, 40);
  doc.setLineWidth(0.2);
  doc.rect(margin, recY, contentWidth, recTotalHeight);

  doc.setFillColor(240, 240, 240);
  doc.rect(margin, recY, contentWidth, recHeaderHeight, 'F');
  doc.line(margin, recY + recHeaderHeight, margin + contentWidth, recY + recHeaderHeight);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(20, 20, 20);
  doc.text('REKOMENDASI = (TULISKAN JIKA EXPIRE / PERLU TINDAKAN PERBAIKAN)', margin + 3, recY + 3.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(51, 65, 85);
  const recText = rekomendasi || 'Seluruh peralatan keselamatan kerja yang diperiksa dalam kondisi baik dan memenuhi standar keselamatan kerja.';
  doc.text(recText, margin + 3, recY + recHeaderHeight + 4, { maxWidth: contentWidth - 6 });

  // Section Tanda Tangan Digital
  const isHarness = formKey === 'harness';
  const sigSectionY = recY + recTotalHeight + 3;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(20, 20, 20);
  doc.text('Tanda Tangan Digital Pemeriksaan (Digital Signatures)', margin, sigSectionY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  const sigSubtitle = isHarness
    ? 'Wajib ditandatangani oleh HFO (HES Field Officer) dan Derickman.'
    : 'Wajib ditandatangani oleh HFO (HES Field Officer) dan Toolpusher.';
  doc.text(sigSubtitle, margin, sigSectionY + 3.5);

  const sigCardsY = sigSectionY + 5;
  const cardGap = 8;
  const cardWidth = (contentWidth - cardGap) / 2;
  const cardHeight = 26;

  const hfoSig = signatures.hfo || signatures.wfo || {};
  const toolpushSig = signatures.toolpush || {};
  const derickmanSig = signatures.derickman || signatures.toolpush || signatures.user || {};

  // Card 1: HFO (Kiri)
  doc.setDrawColor(16, 185, 129); // emerald
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, sigCardsY, cardWidth, cardHeight, 1.2, 1.2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(20, 20, 20);
  doc.text('HFO (HES Field Officer)', margin + 3, sigCardsY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Safety Officer / Pengawas HSE', margin + 3, sigCardsY + 7);

  doc.setFillColor(209, 250, 229);
  doc.roundedRect(margin + cardWidth - 25, sigCardsY + 2, 22, 3.8, 0.8, 0.8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.2);
  doc.setTextColor(6, 95, 70);
  doc.text(hfoSig.image ? 'Terverifikasi Digital' : 'Menunggu TTD', margin + cardWidth - 24, sigCardsY + 4.7);

  if (hfoSig.image) {
    try {
      doc.addImage(hfoSig.image, 'PNG', margin + (cardWidth / 2) - 15, sigCardsY + 7.5, 30, 10.5);
    } catch {
      doc.text('[ Signature Image ]', margin + (cardWidth / 2), sigCardsY + 13, { align: 'center' });
    }
  }

  doc.setDrawColor(203, 213, 225);
  doc.line(margin + 18, sigCardsY + 19, margin + cardWidth - 18, sigCardsY + 19);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(20, 20, 20);
  const hfoNameText = hfoSig.name || hfoName || 'HES Field Officer';
  doc.text(hfoNameText, margin + (cardWidth / 2), sigCardsY + 22.2, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  doc.setTextColor(100, 116, 139);
  doc.text(hfoSig.date ? `Tanggal: ${hfoSig.date}` : `Tanggal: ${formattedDate}`, margin + (cardWidth / 2), sigCardsY + 24.8, { align: 'center' });

  // Card 2: DERICKMAN (Khusus Harness) / TOOLPUSHER (Kanan)
  const rightCardX = margin + cardWidth + cardGap;
  doc.setDrawColor(245, 158, 11); // amber
  doc.roundedRect(rightCardX, sigCardsY, cardWidth, cardHeight, 1.2, 1.2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(20, 20, 20);
  const rightCardTitle = isHarness ? 'DERICKMAN' : 'TOOLPUSHER (Tool Pusher)';
  doc.text(rightCardTitle, rightCardX + 3, sigCardsY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  const rightCardSub = isHarness ? 'Pekerja Ketinggian / Derickman' : 'Pimpinan Rig / Supervisor';
  doc.text(rightCardSub, rightCardX + 3, sigCardsY + 7);

  const rightSig = isHarness ? derickmanSig : toolpushSig;

  doc.setFillColor(254, 243, 199);
  doc.roundedRect(rightCardX + cardWidth - 25, sigCardsY + 2, 22, 3.8, 0.8, 0.8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.2);
  doc.setTextColor(146, 64, 14);
  doc.text(rightSig.image ? 'Disetujui Digital' : 'Menunggu TTD', rightCardX + cardWidth - 24, sigCardsY + 4.7);

  if (rightSig.image) {
    try {
      doc.addImage(rightSig.image, 'PNG', rightCardX + (cardWidth / 2) - 15, sigCardsY + 7.5, 30, 10.5);
    } catch {
      doc.text('[ Signature Image ]', rightCardX + (cardWidth / 2), sigCardsY + 13, { align: 'center' });
    }
  }

  doc.setDrawColor(203, 213, 225);
  doc.line(rightCardX + 18, sigCardsY + 19, rightCardX + cardWidth - 18, sigCardsY + 19);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(20, 20, 20);
  const defaultRightName = isHarness ? 'Derickman' : 'Tool Pusher';
  const rightNameText = rightSig.name || (isHarness ? (norm.derrickmanName || defaultRightName) : (toolPusherName || defaultRightName)) || defaultRightName;
  doc.text(rightNameText, rightCardX + (cardWidth / 2), sigCardsY + 22.2, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  doc.setTextColor(100, 116, 139);
  doc.text(rightSig.date ? `Tanggal: ${rightSig.date}` : `Tanggal: ${formattedDate}`, rightCardX + (cardWidth / 2), sigCardsY + 24.8, { align: 'center' });

  /* ─────────────────────────────────────────────────────────────────────────────
     FOOTER RUNNING PADA SEMUA HALAMAN
  ───────────────────────────────────────────────────────────────────────────── */
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(148, 163, 184);

    doc.line(margin, pageHeight - 5.5, pageWidth - margin, pageHeight - 5.5);
    doc.text(
      `PT. Besmindo Materi Sewatama - Sistem Pelaporan Inspeksi HSE - ${formMeta.docNo}`,
      margin,
      pageHeight - 3.2
    );
    doc.text(
      `Halaman ${i} dari ${totalPages}  |  Dicetak: ${new Date().toLocaleString('id-ID')}`,
      pageWidth - margin,
      pageHeight - 3.2,
      { align: 'right' }
    );
  }

  const cleanRig = rigNo.replace(/\s+/g, '_');
  const filename = formKey.startsWith('eyewash')
    ? `HSE_${formKey.toUpperCase()}_${cleanRig}_${tanggal}.pdf`
    : `${cleanRig}_${formKey.toUpperCase()}_${tanggal}.pdf`;
  doc.save(filename);
  return filename;
}

// ── 5. EKSPOR EXCEL PREMIUM DENGAN EXCELJS (BERGARIS, BERWARNA & AUTO-FIT) ──
export async function exportToExcel(inspectionData, explicitFormKey = null) {
  const norm = normalizeInspectionForExport(inspectionData, explicitFormKey);
  if (!norm) return null;

  const {
    formMeta,
    rigNo,
    tanggal,
    lokasi,
    statusRig,
    rekomendasi,
    hfoName,
    toolPusherName,
    signatures,
    items,
    componentPhotos,
    formKey
  } = norm;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PT. Besmindo Materi Sewatama';
  workbook.created = new Date();

  const sheetName = formKey.slice(0, 30).toUpperCase();
  const ws = workbook.addWorksheet(sheetName, {
    views: [{ showGridLines: true }]
  });

  const thinBorder = {
    top: { style: 'thin', color: { argb: 'FF282828' } },
    left: { style: 'thin', color: { argb: 'FF282828' } },
    bottom: { style: 'thin', color: { argb: 'FF282828' } },
    right: { style: 'thin', color: { argb: 'FF282828' } }
  };

  const headerFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF0F0F0' } // Abu-abu terang elegan
  };

  // ── Header Dokumen Formal ──
  ws.addRow(['PT. BESMINDO MATERI SEWATAMA']);
  ws.addRow([formMeta.title]);
  ws.addRow([formMeta.subtitle]);
  ws.addRow(['No. Dokumen:', formMeta.docNo, 'Revisi:', formMeta.rev, 'Tanggal Efektif:', formMeta.effectiveDate]);
  ws.addRow([]);

  // Styling Header Perusahaan
  ws.getCell('A1').font = { bold: true, size: 13, color: { argb: 'FF1E3A8A' } };
  ws.getCell('A2').font = { bold: true, size: 11, color: { argb: 'FF0F172A' } };
  ws.getCell('A3').font = { italic: true, size: 9, color: { argb: 'FF475569' } };
  ws.getRow(4).font = { bold: true, size: 9, color: { argb: 'FF334155' } };

  // ── Metadata Inspeksi ──
  ws.addRow(['INFORMASI INSPEKSI']);
  ws.addRow(['Rig No:', rigNo, 'Tanggal:', formatDateDisplay(tanggal)]);
  ws.addRow(['Lokasi:', lokasi || 'Lokasi Rig', 'Status Rig:', statusRig || 'Operating']);
  const hfoLabel = 'HFO (HES Officer):';
  const hfoVal = signatures?.hfo?.name || signatures?.wfo?.name || hfoName || '-';
  const rightLabel = formKey === 'harness' ? 'Derickman:' : 'Tool Pusher:';
  const rightVal = formKey === 'harness'
    ? (signatures?.derickman?.name || signatures?.toolpush?.name || derrickmanName || '-')
    : (signatures?.toolpush?.name || toolPusherName || '-');
  ws.addRow([hfoLabel, hfoVal, rightLabel, rightVal]);
  ws.addRow([]);

  ws.getCell('A6').font = { bold: true, size: 10, color: { argb: 'FF1E293B' } };

  // ── Keterangan Simbol ──
  ws.addRow(['KETERANGAN SIMBOL: [V] = Kondisi Baik  |  [X] = Perlu Penggantian  |  [N/A] = Tidak Ada dalam Kontrak']);
  ws.getCell(`A11`).font = { italic: true, size: 8.5, color: { argb: 'FF64748B' } };
  ws.addRow([]);

  // ── Tabel Data Detail ──
  const tableStartRow = 13;
  let headers = [];
  let dataRows = [];

  if (formKey === 'apd') {
    headers = [
      'No', 'Nama Karyawan', 'Jabatan',
      'Top Guard', 'V-Guard', 'Tali Dagu',
      'Kacamata Standar', 'Safety Google', 'Kacamata Resep',
      'Sumbat Telinga', 'Rompi',
      'Sepatu Rubber', 'Sepatu Standar',
      'Coverall',
      'Sarung Tangan Cotton', 'Sarung Tangan HDHG', 'Rubber Hand Glove', 'High Voltage Glove',
      'HEPA Mask', 'Masker Organik',
      'Jas Hujan',
      'Keterangan'
    ];

    const activeItems = filterActiveInspectionRows(items, 'apd');
    dataRows = activeItems.map((row, idx) => {
      const rowApd = row.apd || {};
      const apdVals = APD_COLUMN_KEYS.map(k => sanitizeCondition(rowApd[k], false));
      return [
        idx + 1,
        row.nama || '',
        row.jabatan || '',
        ...apdVals,
        row.keterangan || ''
      ];
    });
  } else if (formKey.startsWith('apar')) {
    headers = [
      'No', 'Tipe APAR / No Seri', 'Kategori', 'Tahun', 'Penempatan',
      'Handle', 'Hose', 'Nozle', 'Pengaman', 'Pin', 'Pressure', 'Tabung',
      'Berat (CO2)', 'Keterangan / Remarks'
    ];

    const activeItems = filterActiveInspectionRows(items, formKey);
    dataRows = activeItems.map((it, idx) => {
      const isCO2 = String(it.type || '').trim().toUpperCase() === 'CO' || String(it.type || '').trim().toUpperCase().includes('CO2');
      const pressureVal = isCO2 ? 'N/A' : sanitizeCondition(it.pressure, false);
      const catLabel = it.aparCategory === 'hybrid' ? 'Hybrid' : (it.aparCategory === 'standar' ? 'Standar' : '-');
      const typeDisplay = it.sn ? `${it.type || ''} (SN: ${it.sn})` : (it.type || '');

      return [
        idx + 1,
        typeDisplay,
        catLabel,
        it.tahun || '-',
        it.penempatan || '-',
        sanitizeCondition(it.handle, false),
        sanitizeCondition(it.hose, false),
        sanitizeCondition(it.nozle, false),
        sanitizeCondition(it.pengaman, false),
        sanitizeCondition(it.pin, false),
        pressureVal,
        sanitizeCondition(it.tabung, false),
        isCO2 ? (it.berat ? `${it.berat} Kg` : '-') : '-',
        it.remarks || 'Normal'
      ];
    });
  } else if (formKey.startsWith('eyewash')) {
    headers = [
      'No', 'Bagian / Unit', 'Minggu', 'Tanggal', 'Posisi / Penempatan',
      'Water Tank', 'Water Supply', 'Valve / Adhesive', 'Shower Supply',
      'Cleanness / Closed', 'Motor Pump / Cover', 'Keterangan'
    ];

    const activeItems = filterActiveInspectionRows(items, 'eyewash');
    dataRows = activeItems.map((it, idx) => {
      const isShower = String(it.id || '').startsWith('shower') || idx < 4;
      const typeLabel = isShower ? 'SHOWER' : 'EYE WASH';

      const c1 = sanitizeCondition(it.waterTank, false);
      const c2 = isShower ? sanitizeCondition(it.waterSupply, false) : sanitizeCondition(it.shower, false);
      const c3 = isShower ? sanitizeCondition(it.waterLine, false) : sanitizeCondition(it.adhesive, false);
      const c4 = isShower ? sanitizeCondition(it.shower, false) : sanitizeCondition(it.waterSupply, false);
      const c5 = isShower ? sanitizeCondition(it.cleanness, false) : sanitizeCondition(it.closed, false);
      const c6 = isShower ? sanitizeCondition(it.pump, false) : sanitizeCondition(it.cover, false);

      return [
        idx + 1,
        typeLabel,
        it.week ? `Minggu ${it.week}` : '-',
        formatDateDisplay(it.date),
        it.penempatan || '-',
        c1, c2, c3, c4, c5, c6,
        it.remarks || 'Normal'
      ];
    });
  } else if (formKey === 'oxigent') {
    headers = [
      'No', 'Merk / Tipe / Serial No', 'Penempatan',
      'Pressure / Volume', 'Regulator', 'Hydro Test', 'Tabung', 'Valve Connection',
      'Rekomendasi / Keterangan'
    ];

    const activeItems = filterActiveInspectionRows(items, 'oxigent');
    dataRows = activeItems.map((it, idx) => {
      return [
        idx + 1,
        it.merkTypeSerial || it.sn || '-',
        it.penempatan || '-',
        sanitizeCondition(it.pressureVolume, false),
        sanitizeCondition(it.regulator, false),
        sanitizeCondition(it.hydroTest, false),
        sanitizeCondition(it.tabung, false),
        sanitizeCondition(it.valveConnection, false),
        it.rekomendasi || 'Normal'
      ];
    });
  } else if (formKey === 'scba') {
    headers = [
      'No', 'Kategori Alat', 'Serial No (SN)', 'Penempatan',
      'Pressure Volume', 'Hose', 'Certificate (Berlaku)', 'Certificate (Expire)', 'Rubber Masker & Tail', 'Valve & Connection', 'Whistle', 'Tabung',
      'Rekomendasi'
    ];

    const rawData = norm.rawData || {};
    let scbaList = rawData.scba_items;
    let elsaList = rawData.elsa_items;

    if (!Array.isArray(scbaList) || !Array.isArray(elsaList)) {
      scbaList = items.filter(it => !it.isElsa && !String(it.category || '').toLowerCase().includes('elsa'));
      elsaList = items.filter(it => it.isElsa || String(it.category || '').toLowerCase().includes('elsa'));
    }

    if (scbaList.length === 0) {
      scbaList = [1, 2, 3, 4, 5].map(no => ({ no, sn: '', penempatan: '', pressure: '', hose: '', cert: '', certValidDate: '', certExpireDate: '', rubber: '', valve: '', whistle: '', tabung: '', rekomendasi: '' }));
    }
    if (elsaList.length === 0) {
      elsaList = [1, 2].map(no => ({ no, sn: '', penempatan: '', pressure: '', hose: '', cert: '', certValidDate: '', certExpireDate: '', rubber: '', valve: '', whistle: 'N/A', tabung: '', rekomendasi: '', isElsa: true }));
    }

    const formatCertDate = (val) => {
      if (!val) return '-';
      if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
        const parts = val.slice(0, 10).split('-');
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return String(val);
    };

    const getCertValid = (it) => {
      return formatCertDate(it.certValidDate || it.certStartDate);
    };

    const getCertExpire = (it) => {
      const exp = it.certExpireDate || it.certDate || (it.cert && it.cert.includes('-') ? it.cert : '');
      if (exp) return formatCertDate(exp);
      if (it.cert === 'Berlaku' || it.cert === '✓') return 'Berlaku';
      if (it.cert === 'Expire' || it.cert === '✕') return 'Expire';
      return it.cert || '-';
    };

    dataRows = [];
    let rowNum = 1;
    (scbaList || []).forEach((it) => {
      dataRows.push([
        rowNum++,
        'SCBA SPERIAN 30 MNT',
        it.sn || '-',
        it.penempatan || '-',
        sanitizeCondition(it.pressure, false),
        sanitizeCondition(it.hose, false),
        getCertValid(it),
        getCertExpire(it),
        sanitizeCondition(it.rubber, false),
        sanitizeCondition(it.valve, false),
        sanitizeCondition(it.whistle, false),
        sanitizeCondition(it.tabung, false),
        it.rekomendasi || 'Normal'
      ]);
    });

    (elsaList || []).forEach((it) => {
      dataRows.push([
        rowNum++,
        'ELSA 10 Menit',
        it.sn || '-',
        it.penempatan || '-',
        sanitizeCondition(it.pressure, false),
        sanitizeCondition(it.hose, false),
        getCertValid(it),
        getCertExpire(it),
        sanitizeCondition(it.rubber, false),
        sanitizeCondition(it.valve, false),
        'N/A',
        sanitizeCondition(it.tabung, false),
        it.rekomendasi || 'Normal'
      ]);
    });
  } else if (formKey === 'firstaid') {
    headers = ['No', 'Daftar Isi / Jenis Obat', 'Ukuran', 'Jumlah', 'Tanggal Kadaluarsa', 'Kondisi', 'Catatan Temuan'];
    const activeItems = filterActiveInspectionRows(items, 'firstaid');
    dataRows = activeItems.map((it, idx) => [
      idx + 1,
      it.jenisObat || it.item || '-',
      it.ukuran || '-',
      it.jumlah ? String(it.jumlah) : '-',
      formatDateDisplay(it.expDate),
      sanitizeCondition(it.kondisi, false),
      it.temuan || it.remarks || 'Normal'
    ]);
  } else if (formKey === 'spillkit') {
    headers = ['No', 'Daftar Isi Perlengkapan Spill Kit', 'Jumlah', 'Kondisi', 'Catatan / Temuan'];
    const activeItems = filterActiveInspectionRows(items, 'spillkit');
    dataRows = activeItems.map((it, idx) => [
      idx + 1,
      it.daftarIsi || it.item || '-',
      it.jumlah ? String(it.jumlah) : '-',
      sanitizeCondition(it.kondisi, false),
      it.temuan || it.remarks || 'Normal'
    ]);
  } else if (formKey === 'stretcher') {
    headers = ['No', 'Item Pemeriksaan / Checklist', 'Kondisi', 'Keterangan / Remarks'];
    const activeItems = filterActiveInspectionRows(items, 'stretcher');
    dataRows = activeItems.map((it, idx) => [
      idx + 1,
      it.text || it.item || '-',
      sanitizeCondition(it.condition || it.kondisi, false),
      it.remarks || it.keterangan || 'Normal'
    ]);
  } else if (formKey === 'harness') {
    const rawUnits = norm.rawData?.units_data || (Array.isArray(items) && items.length > 0 && items[0]?.checks ? items : []);
    let activeUnits = rawUnits.filter(u => u && (u.sn || (u.checks && Object.keys(u.checks).length > 0)));
    if (activeUnits.length === 0) {
      activeUnits = [{ sn: 'Unit 1', lokasi: lokasi || 'Rig', tanggal: tanggal, checks: {} }];
    }

    headers = [
      'No', 'Komponen', 'Jenis Kerusakan / Item Checklist', 'Gambar / Foto',
      ...activeUnits.map((u, i) => `S/N: ${u.sn || `Unit ${i + 1}`} (Lokasi: ${u.lokasi || '-'})`)
    ];

    dataRows = [];
    HARNESS_CHECKLIST_SECTIONS.forEach((sec) => {
      const hasPhoto = !!(componentPhotos && (componentPhotos[sec.id] || componentPhotos[String(sec.id)]));
      sec.items.forEach((itemText, itemIdx) => {
        const itemKey = `sec_${sec.id}_item_${itemIdx}`;
        dataRows.push([
          itemIdx === 0 ? sec.id : '',
          itemIdx === 0 ? sec.komponen : '',
          itemText,
          itemIdx === 0 ? (hasPhoto ? 'Foto Terlampir' : '-') : '',
          ...activeUnits.map(u => sanitizeCondition(u.checks?.[itemKey], false))
        ]);
      });
    });
  } else {
    headers = ['No', 'Komponen / Item Pemeriksaan', 'Lokasi / Penempatan / Qty', 'Kondisi / Status', 'Keterangan / Tindakan Perbaikan'];
    const activeItems = filterActiveInspectionRows(items, formKey);
    dataRows = activeItems.map((it, idx) => {
      const name = it.item || it.name || it.komponen || it.daftarIsi || it.jenisObat || it.text || (it.sn ? `S/N: ${it.sn}` : `Item ${idx + 1}`);
      const loc = it.lokasi || it.penempatan || (it.jumlah ? `Qty: ${it.jumlah} ${it.ukuran || ''}` : '-');
      const cond = sanitizeCondition(it.kondisi || it.condition || it.status || (it.good ? 'V' : 'V'), false);
      const rem = it.keterangan || it.remarks || it.temuan || 'Normal';
      return [idx + 1, name, loc, cond, rem];
    });
  }

  // Tambahkan Header Tabel
  const headerRow = ws.addRow(headers);
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.fill = headerFill;
    cell.border = thinBorder;
    cell.font = { bold: true, size: 9.5, color: { argb: 'FF1E293B' }, name: 'Arial' };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });

  // Tambahkan Baris Data Tabel
  dataRows.forEach((rowVals) => {
    const row = ws.addRow(rowVals);
    row.height = 20;

    row.eachCell((cell, colNum) => {
      cell.border = thinBorder;
      cell.font = { size: 9, name: 'Arial', color: { argb: 'FF334155' } };

      const strVal = String(cell.value || '').trim();
      const isStatusCol = strVal === 'V' || strVal === 'X' || strVal === 'N/A' || colNum === 1;

      if (strVal === 'V') {
        cell.font = { bold: true, size: 9.5, color: { argb: 'FF059669' } }; // Emerald
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (strVal === 'X') {
        cell.font = { bold: true, size: 9.5, color: { argb: 'FFE11D48' } }; // Rose Red
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (strVal === 'N/A') {
        cell.font = { bold: true, size: 8.5, color: { argb: 'FF64748B' } }; // Slate
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (isStatusCol) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      }
    });
  });

  // ── Footer Rekomendasi & Tanda Tangan ──
  ws.addRow([]);
  const recHeaderRow = ws.addRow(['REKOMENDASI & TINDAKAN PERBAIKAN']);
  recHeaderRow.getCell(1).font = { bold: true, size: 9.5, color: { argb: 'FF1E293B' } };

  const recRow = ws.addRow([rekomendasi || 'Peralatan keselamatan kerja dalam kondisi baik dan memenuhi standar operasional.']);
  recRow.getCell(1).font = { size: 9, italic: true, color: { argb: 'FF475569' } };

  ws.addRow([]);
  const sigHeaderRow = ws.addRow(['VERIFIKASI & TANDA TANGAN DIGITAL']);
  sigHeaderRow.getCell(1).font = { bold: true, size: 9.5, color: { argb: 'FF1E293B' } };

  const hfoSigObj = signatures?.hfo || signatures?.wfo || {};
  const rightSigObj = formKey === 'harness' ? (signatures?.derickman || signatures?.toolpush || {}) : (signatures?.toolpush || {});
  const rightTitle = formKey === 'harness' ? 'DERICKMAN:' : 'TOOLPUSHER:';
  const rightNameStr = formKey === 'harness'
    ? (rightSigObj.name || derrickmanName || 'Derickman')
    : (rightSigObj.name || toolPusherName || 'Tool Pusher');

  ws.addRow([
    'HFO (HES Field Officer):',
    hfoSigObj.name || hfoName || 'HES Officer',
    'Status Verifikasi:',
    hfoSigObj.image ? 'Terverifikasi Digital' : 'Belum Ditandatangani',
    'Tanggal:',
    hfoSigObj.date || formatDateDisplay(tanggal)
  ]);

  ws.addRow([
    rightTitle,
    rightNameStr,
    'Status Verifikasi:',
    rightSigObj.image ? 'Disetujui Digital' : 'Belum Ditandatangani',
    'Tanggal:',
    rightSigObj.date || formatDateDisplay(tanggal)
  ]);

  ws.addRow(['Waktu Ekspor Dokumen:', new Date().toLocaleString('id-ID')]);

  // ── Auto-fit Column Widths Presisi ──
  ws.columns.forEach((column) => {
    let maxLen = 0;
    column.eachCell({ includeEmpty: false }, (cell) => {
      const valStr = cell.value ? String(cell.value) : '';
      if (valStr.length > maxLen) {
        maxLen = valStr.length;
      }
    });
    // Berikan padding lebar minimum dan maksimum proporsional
    column.width = Math.min(Math.max(maxLen + 4, 10), 45);
  });

  // Kolom No diperkecil
  if (ws.getColumn(1)) ws.getColumn(1).width = 6;

  // ── Download File Excel (.xlsx) ──
  const cleanRig = rigNo.replace(/\s+/g, '_');
  const filename = formKey.startsWith('eyewash')
    ? `HSE_${formKey.toUpperCase()}_${cleanRig}_${tanggal}.xlsx`
    : `${cleanRig}_${formKey.toUpperCase()}_${tanggal}.xlsx`;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);

  return filename;
}

// ── 6. EKSPOR REKAPITULASI BULANAN KE EXCEL DENGAN EXCELJS ─────────────
export async function exportMonthlyRecapExcel(inspections = [], filterLabel = 'Semua') {
  if (!Array.isArray(inspections) || inspections.length === 0) {
    alert('Tidak ada data inspeksi yang dapat diekspor.');
    return;
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PT. Besmindo Materi Sewatama';
  workbook.created = new Date();

  const ws = workbook.addWorksheet('Rekapitulasi_HSE', {
    views: [{ showGridLines: true }]
  });

  const thinBorder = {
    top: { style: 'thin', color: { argb: 'FF282828' } },
    left: { style: 'thin', color: { argb: 'FF282828' } },
    bottom: { style: 'thin', color: { argb: 'FF282828' } },
    right: { style: 'thin', color: { argb: 'FF282828' } }
  };

  const headerFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF0F0F0' }
  };

  // Header formal
  ws.addRow(['PT. BESMINDO MATERI SEWATAMA']);
  ws.addRow(['REKAPITULASI LAPORAN INSPEKSI BULANAN HSE RIG SITE']);
  ws.addRow([`Kategori Filter: ${filterLabel}`, `Total Laporan: ${inspections.length}`, `Waktu Ekspor: ${new Date().toLocaleString('id-ID')}`]);
  ws.addRow([]);

  ws.getCell('A1').font = { bold: true, size: 13, color: { argb: 'FF1E3A8A' } };
  ws.getCell('A2').font = { bold: true, size: 11, color: { argb: 'FF0F172A' } };
  ws.getRow(3).font = { italic: true, size: 9, color: { argb: 'FF475569' } };

  const tableHeaders = [
    'No', 'ID Laporan', 'Rig No', 'Formulir HSE', 'Tanggal Inspeksi',
    'Status Laporan', 'HFO (HES Officer)', 'Status TTD HFO',
    'Tool Pusher', 'Status TTD Toolpusher', 'Rekomendasi / Catatan'
  ];

  const headerRow = ws.addRow(tableHeaders);
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.fill = headerFill;
    cell.border = thinBorder;
    cell.font = { bold: true, size: 9.5, color: { argb: 'FF1E293B' }, name: 'Arial' };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  inspections.forEach((insp, idx) => {
    const norm = normalizeInspectionForExport(insp);
    const hfoSigned = !!(norm.signatures?.hfo?.image || norm.signatures?.wfo?.image);
    const toolpushSigned = !!(norm.signatures?.toolpush?.image || norm.signatures?.derickman?.image);

    const row = ws.addRow([
      idx + 1,
      insp.id || '-',
      norm.rigNo,
      norm.formMeta?.title || insp.form_type,
      formatDateDisplay(norm.tanggal),
      insp.status === 'submitted' ? 'Submitted (Sah)' : 'Draft (Sedang Diisi)',
      norm.signatures?.hfo?.name || norm.signatures?.wfo?.name || norm.hfoName || '-',
      hfoSigned ? 'Sudah TTD' : 'Belum',
      norm.signatures?.toolpush?.name || norm.signatures?.derickman?.name || norm.toolPusherName || norm.derrickmanName || '-',
      toolpushSigned ? 'Sudah TTD' : 'Belum',
      norm.rekomendasi || '-'
    ]);

    row.height = 19;
    row.eachCell((cell, colNum) => {
      cell.border = thinBorder;
      cell.font = { size: 9, name: 'Arial' };
      if (colNum === 1 || colNum === 2 || colNum === 3 || colNum === 5 || colNum === 6 || colNum === 8 || colNum === 10) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      }
    });
  });

  ws.columns.forEach((column, i) => {
    let maxLen = 0;
    column.eachCell({ includeEmpty: false }, (cell) => {
      const valStr = cell.value ? String(cell.value) : '';
      if (valStr.length > maxLen) maxLen = valStr.length;
    });
    column.width = Math.min(Math.max(maxLen + 4, 10), 45);
  });
  if (ws.getColumn(1)) ws.getColumn(1).width = 6;

  const filename = `REKAP_INSPEKSI_HSE_${new Date().toISOString().split('T')[0]}.xlsx`;
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);

  return filename;
}

// ── 7. FUNGSI GENERATE KHUSUS PER FORMULIR (STANDALONE EXPORT HANDLERS) ──
/**
 * GENERATE PDF KHUSUS APD (Alat Pelindung Diri)
 * Menjamin 100% menggunakan template APD, kop resmi BMSD / 22/ FO/HSE/01/26,
 * dan memfilter baris kosong berdasarkan nama karyawan.
 */
export async function generateApdPDF(inspectionData) {
  return exportToPdf(inspectionData, 'apd');
}

/**
 * GENERATE EXCEL KHUSUS APD (Alat Pelindung Diri)
 */
export async function generateApdExcel(inspectionData) {
  return exportToExcel(inspectionData, 'apd');
}

/**
 * GENERATE PDF KHUSUS APAR (Alat Pemadam Api Ringan)
 */
export async function generateAparPDF(inspectionData, variant = null) {
  const v = variant || (String(inspectionData?.form_id || inspectionData?.form_type || '').includes('hybrid') ? 'apar_hybrid' : 'apar_standar');
  return exportToPdf(inspectionData, v);
}

/**
 * GENERATE EXCEL KHUSUS APAR (Alat Pemadam Api Ringan)
 */
export async function generateAparExcel(inspectionData, variant = null) {
  const v = variant || (String(inspectionData?.form_id || inspectionData?.form_type || '').includes('hybrid') ? 'apar_hybrid' : 'apar_standar');
  return exportToExcel(inspectionData, v);
}

/**
 * GENERATE PDF KHUSUS EYEWASH & SAFETY SHOWER
 */
export async function generateEyewashPDF(inspectionData, variant = null) {
  const v = variant || (String(inspectionData?.form_id || inspectionData?.form_type || '').includes('hybrid') ? 'eyewash_hybrid' : 'eyewash_standar');
  return exportToPdf(inspectionData, v);
}

/**
 * GENERATE EXCEL KHUSUS EYEWASH & SAFETY SHOWER
 */
export async function generateEyewashExcel(inspectionData, variant = null) {
  const v = variant || (String(inspectionData?.form_id || inspectionData?.form_type || '').includes('hybrid') ? 'eyewash_hybrid' : 'eyewash_standar');
  return exportToExcel(inspectionData, v);
}

/**
 * GENERATE PDF KHUSUS KOTAK P3K (FIRST AID)
 */
export async function generateFirstAidPDF(inspectionData) {
  return exportToPdf(inspectionData, 'firstaid');
}

/**
 * GENERATE EXCEL KHUSUS KOTAK P3K (FIRST AID)
 */
export async function generateFirstAidExcel(inspectionData) {
  return exportToExcel(inspectionData, 'firstaid');
}

/**
 * GENERATE PDF KHUSUS HARNESS & LANYARD
 */
export async function generateHarnessPDF(inspectionData) {
  return exportToPdf(inspectionData, 'harness');
}

/**
 * GENERATE EXCEL KHUSUS HARNESS & LANYARD
 */
export async function generateHarnessExcel(inspectionData) {
  return exportToExcel(inspectionData, 'harness');
}

/**
 * GENERATE PDF KHUSUS TABUNG OKSIGEN MEDIS
 */
export async function generateOxigentPDF(inspectionData) {
  return exportToPdf(inspectionData, 'oxigent');
}

/**
 * GENERATE EXCEL KHUSUS TABUNG OKSIGEN MEDIS
 */
export async function generateOxigentExcel(inspectionData) {
  return exportToExcel(inspectionData, 'oxigent');
}

/**
 * GENERATE PDF KHUSUS SCBA / ELSA
 */
export async function generateScbaPDF(inspectionData) {
  return exportToPdf(inspectionData, 'scba');
}

/**
 * GENERATE EXCEL KHUSUS SCBA / ELSA
 */
export async function generateScbaExcel(inspectionData) {
  return exportToExcel(inspectionData, 'scba');
}

/**
 * GENERATE PDF KHUSUS SPILL KIT
 */
export async function generateSpillKitPDF(inspectionData) {
  return exportToPdf(inspectionData, 'spillkit');
}

/**
 * GENERATE EXCEL KHUSUS SPILL KIT
 */
export async function generateSpillKitExcel(inspectionData) {
  return exportToExcel(inspectionData, 'spillkit');
}

/**
 * GENERATE PDF KHUSUS STRETCHER / TANDU EVAKUASI
 */
export async function generateStretcherPDF(inspectionData) {
  return exportToPdf(inspectionData, 'stretcher');
}

/**
 * GENERATE EXCEL KHUSUS STRETCHER / TANDU EVAKUASI
 */
export async function generateStretcherExcel(inspectionData) {
  return exportToExcel(inspectionData, 'stretcher');
}
