import React, { useState } from 'react';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  Lock, 
  ShieldCheck, 
  BookOpen, 
  HelpCircle, 
  X, 
  Check, 
  Camera, 
  Info 
} from 'lucide-react';

// Panduan Khusus per Form
const FORM_GUIDES = {
  'apar': {
    title: 'Panduan Inspeksi APAR (Alat Pemadam Api Ringan)',
    docNo: 'BMSD/13/FO/HSE/12/25',
    points: [
      'Pastikan jarum manometer tekanan berada pada zona HIJAU (14-17 bar).',
      'Periksa segel pengaman dan pin penarik masih utuh dan tidak patah.',
      'Periksa kondisi selang (hose) tidak getas, retak, atau tersumbat serangga/debu.',
      'Cek tabung dari tanda korosi, penyok, atau karat berat pada bagian dasar tabung.',
      'Balikkan tabung APAR powder 2-3 kali untuk mencegah penggumpalan serbuk kimia di dasar.'
    ]
  },
  'harness': {
    title: 'Panduan Inspeksi Full Body Harness & Lanyard',
    docNo: 'BMSD/17/FO/HSE/08/26',
    points: [
      'Periksa ke-9 komponen utama: Webbing, Karabiner, D-Ring, Buckle, Jahitan, Tali, Absorber, Trauma Strap, Label.',
      'Wajib unggah FOTO bukti kondisi fisik pada ke-9 komponen yang tersedia di tabel.',
      'Pastikan safety lock karabiner mengunci otomatis dan per tidak melemah.',
      'Cek jahitan (sewing) dari benang putus, lapuk karena panas/oli, atau jamur.',
      'Klik tombol "Upload" pada kolom Gambar untuk melampirkan foto komponen dan gunakan fitur Zoom untuk preview.'
    ]
  },
  'apd': {
    title: 'Panduan Inspeksi APD / PPE Karyawan',
    docNo: 'BMSD/22/FO/HSE/01/26',
    points: [
      'Periksa kelengkapan APD standar per kru rig: Helm (Hardhat), Kacamata (Safety Glasses), Sepatu Boot, Sarung Tangan, Coverall.',
      'Pastikan suspensi dalam helm keselamatan tidak retak atau longgar.',
      'Cek sol sepatu safety dan pelindung baja (steel toe) dari aus atau sol terkelupas.',
      'Jika ditemukan APD rusak atau tidak layak, catat di kolom catatan dan ajukan penggantian segera.'
    ]
  },
  'eyewash': {
    title: 'Panduan Inspeksi Eyewash Station & Safety Shower',
    docNo: 'BMSD/44/FO/HSE/12/25',
    points: [
      'Buka kran shower dan pastikan semprotan air mengalir lancar dan jernih.',
      'Periksa kedua nozel pembersih mata (eyewash) menyembur seimbang dan tidak menyakitkan mata.',
      'Pastikan penutup debu (dust cap) terpasang dan otomatis terbuka saat tuas ditekan.',
      'Jalur akses menuju Eyewash Station wajib bebas dari barang/hambatan (clear access).'
    ]
  },
  'firstaid': {
    title: 'Panduan Inspeksi Kotak P3K (First Aid Box)',
    docNo: 'BMSD/46/FO/HSE/04/25',
    points: [
      'Cocokkan jumlah isi obat, plester, kassa steril, dan antiseptik dengan standar minimal.',
      'Periksa tanggal kedaluwarsa (expired date) seluruh cairan antiseptik dan salep.',
      'Pastikan kotak P3K dalam keadaan bersih, kering, dan mudah dijangkau saat darurat.',
      'Segera catat item yang habis untuk dilakukan restock oleh personil HSE.'
    ]
  },
  'oxigent': {
    title: 'Panduan Inspeksi Tabung Oksigen Medis',
    docNo: 'BMSD/47/FO/HSE/08/21',
    points: [
      'Cek tekanan tabung pada regulator (minimal tekanan siap pakai > 1000 psi).',
      'Periksa selang masker oksigen (nasal cannula / mask) dalam keadaan higienis & terbungkus.',
      'Pastikan tabung terikat kuat di rak/dinding dan tidak berisiko terjatuh saat guncangan.',
      'Jauhkan tabung oksigen dari sumber api, percikan las, minyak, dan oli.'
    ]
  },
  'scba': {
    title: 'Panduan Inspeksi SCBA (Self-Contained Breathing Apparatus)',
    docNo: 'BMSD/43/FO/HSE/06/25',
    points: [
      'Tekanan tabung SCBA wajib berada di atas 270 - 300 bar (zona aman pemakaian).',
      'Uji peluit peringatan tekanan rendah (low pressure whistle) apakah berbunyi saat tekanan turun.',
      'Periksa masker wajah (facepiece) dari kebocoran udara dan kelenturan tali harness kepala.',
      'Pastikan tabung dalam keadaan siap pakai untuk respon darurat gas beracun (H2S).'
    ]
  },
  'spillkit': {
    title: 'Panduan Inspeksi Spill Kit (Tanggap Darurat Tumpahan)',
    docNo: 'BMSD/48/FO/HSE/09/21',
    points: [
      'Periksa kelengkapan bantalan penyerap oli (absorbent pads, boom/sock, pillow).',
      'Pastikan kantong limbah B3, sarung tangan nitril, dan sekop non-sparking tersedia lengkap.',
      'Cek drum/wadah spill kit tertutup rapat agar tidak kemasukan air hujan.',
      'Segera laporkan jika bahan penyerap telah terpakai untuk segera diisi ulang.'
    ]
  },
  'stretcher': {
    title: 'Panduan Inspeksi Tandu Evakuasi (Stretcher)',
    docNo: 'BMSD/45/FO/HSE/06/20',
    points: [
      'Periksa kondisi rangka tandu basket / lipat dari retak, bengkok, atau korosi.',
      'Pastikan seluruh sabuk pengaman tubuh korban (straps & buckles) berfungsi mengunci sempurna.',
      'Cek selimut darurat dan pelindung kepala korban dalam kondisi bersih & kering.',
      'Pastikan tandu digantung pada posisi yang tidak terhalang dan siap digunakan seketika.'
    ]
  }
};

export default function FormActionHeader({
  onBack,
  docNo,
  status,
  saveState,
  isLocked,
  isAdmin = false,
  adminEditMode = false,
  onExportPdf,
  onExportExcel,
  title
}) {
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Ambil info guide berdasarkan docNo atau form type
  const matchedKey = Object.keys(FORM_GUIDES).find(key => {
    return docNo && docNo.toLowerCase().includes(key) || 
      (FORM_GUIDES[key].docNo && docNo && FORM_GUIDES[key].docNo.replace(/\s+/g, '') === docNo.replace(/\s+/g, ''));
  }) || 'apar';

  const guide = FORM_GUIDES[matchedKey] || FORM_GUIDES['apar'];

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 mb-4 border-b border-slate-300">
        {/* Tombol Kembali & Status Draft/Submitted/Admin Edit */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* ── Tombol Kembali — selalu teks gelap ── */}
          <button
            type="button"
            onClick={onBack}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg transition text-xs shadow-sm border border-slate-300 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-700" />
            <span className="text-slate-800">Kembali</span>
          </button>

          {/* ── Tombol Quick Guide Modal ── */}
          <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition border border-blue-200 shadow-2xs cursor-pointer"
            title="Buka panduan & tips pengisian formulir ini"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            <span>Panduan Form</span>
          </button>

          {/* ── Indikator Status Role-Based ── */}
          {status === 'submitted' && isAdmin ? (
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                <span>✓ Terkirim untuk User &bull; Mode Edit Admin Aktif</span>
              </span>

              {/* Indikator Auto-Save Realtime saat Admin Mengedit */}
              {saveState === 'saving' && (
                <span className="flex items-center space-x-1 text-[11px] text-blue-700 font-semibold">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Menyimpan pembaruan...</span>
                </span>
              )}
              {saveState === 'saved' && (
                <span className="flex items-center space-x-1 text-[11px] text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Pembaruan tersimpan</span>
                </span>
              )}
            </div>
          ) : isLocked ? (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <Lock className="w-3 h-3 text-emerald-700" />
              <span>✓ Terkirim &amp; Terkunci (Submitted)</span>
            </span>
          ) : (
            <div className="flex items-center space-x-2">
              {/* Badge Draft */}
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                <Clock className="w-3 h-3 text-amber-700" />
                <span>Draft (Sedang Diisi)</span>
              </span>

              {/* Auto-Save Realtime Indicator */}
              {saveState === 'saving' && (
                <span className="flex items-center space-x-1 text-[11px] text-blue-700 font-semibold">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Menyimpan otomatis...</span>
                </span>
              )}
              {saveState === 'saved' && (
                <span className="flex items-center space-x-1 text-[11px] text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Auto-save aktif</span>
                </span>
              )}
              {saveState === 'error' && (
                <span className="flex items-center space-x-1 text-[11px] text-rose-600 font-semibold">
                  <AlertCircle className="w-3 h-3" />
                  <span>Gagal auto-save</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Nomor Dokumen Resmi */}
        {docNo && (
          <div className="flex items-center">
            <span className="hidden sm:inline font-mono text-[11px] text-slate-500 font-bold ml-auto px-2.5 py-1 bg-slate-100 rounded-md border border-slate-200">
              {docNo}
            </span>
          </div>
        )}
      </div>

      {/* ── MODAL QUICK GUIDE FORM ── */}
      {showGuideModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => setShowGuideModal(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-lg w-full border border-slate-300 shadow-2xl overflow-hidden flex flex-col text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    {guide.title}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500 font-bold">
                    No. Dokumen: {docNo || guide.docNo}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body Checklist & Tips */}
            <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto text-xs">
              <div className="flex items-start space-x-2 p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600" />
                <p className="leading-relaxed">
                  Lakukan inspeksi fisik dengan teliti sebelum mengisi checklist. Perubahan otomatis tersimpan sebagai <strong>Draft</strong>.
                </p>
              </div>

              <div>
                <h4 className="font-extrabold text-xs text-slate-900 mb-2 uppercase tracking-wider">
                  Checklist &amp; Poin Kritis Pemeriksaan:
                </h4>
                <ul className="space-y-2">
                  {guide.points.map((pt, idx) => (
                    <li key={idx} className="flex items-start space-x-2.5 text-slate-700 leading-relaxed">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                        ✓
                      </span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 space-y-1">
                <div className="font-bold text-slate-800">Petunjuk Pengiriman:</div>
                <p className="text-[11px]">
                  Setelah semua unit selesai diperiksa, klik <strong>"Simpan Inspeksi"</strong> di footer bawah untuk mengunci formulir dan mengirim laporan sah ke Admin HSE Pusat.
                </p>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-xs">
              <span className="text-[11px] text-slate-500">
                Butuh bantuan? Hubungi HSE Hotline 24 Jam
              </span>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer"
              >
                Tutup &amp; Mulai Mengisi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
