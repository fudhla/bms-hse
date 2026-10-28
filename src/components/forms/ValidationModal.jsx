import React, { useEffect } from 'react';
import { AlertTriangle, AlertCircle } from 'lucide-react';

/**
 * ValidationModal
 * ─────────────────────────────────────────────────────────────────────────────
 * Modal pop-up kustom (tengah layar) untuk notifikasi validasi formulir K3 belum lengkap.
 * Menggantikan window.alert() dan toast kecil agar UX lebih profesional & mobile-friendly.
 * ─────────────────────────────────────────────────────────────────────────────
 */
/**
 * Helper Validasi Ketat Form Inspeksi K3
 * Memeriksa:
 * 1. inspectionDate (tanggal inspeksi)
 * 2. hfoName & toolpusherName (nama penanggung jawab)
 * 3. Tanda tangan digital canvas (HFO & Toolpusher)
 */
export const validateInspectionFormStrict = (meta) => {
  const m = meta || {};

  // 1. Cek Tanggal Inspeksi
  const tgl = m.tanggal || m.inspectionDate || m.period;
  const isTanggalValid = Boolean(tgl && String(tgl).trim().length >= 4);

  // 2. Cek Nama HFO
  const hfo = 
    m.hfoName ||
    m.hfo_name ||
    m.inspectedBy ||
    m.inspectedByName ||
    m.hesOfficerName ||
    m.hesFieldOfficer ||
    m.wsrName ||
    m.signatures?.hfo?.name ||
    m.signatures?.wfo?.name ||
    m.signatures?.user?.name;
  const isHfoValid = Boolean(hfo && String(hfo).trim().length > 0);

  // 3. Cek Nama Toolpusher / Derickman
  const tp = 
    m.toolPusherName ||
    m.tool_pusher_name ||
    m.toolPusher ||
    m.acknowledgedBy ||
    m.acknowledgedByName ||
    m.hesCoordinatorName ||
    m.derrickmanName ||
    m.signatures?.toolpush?.name ||
    m.signatures?.derickman?.name;
  const isTpValid = Boolean(tp && String(tp).trim().length > 0);

  // 4. Cek State Tanda Tangan Canvas
  const sigs = m.signatures || {};
  const getSig = (sig) => {
    if (!sig) return '';
    if (typeof sig === 'string') return sig.trim();
    if (typeof sig === 'object' && sig.image) return String(sig.image).trim();
    return '';
  };
  const hfoSig = getSig(sigs.hfo) || getSig(sigs.wfo);
  const tpSig = getSig(sigs.toolpush) || getSig(sigs.derickman);
  const isHfoSigValid = Boolean(hfoSig);
  const isTpSigValid = Boolean(tpSig);

  // Kasus Semua / Sebagian Besar Kosong
  if (!isTanggalValid && (!isHfoValid || !isTpValid) && (!isHfoSigValid || !isTpSigValid)) {
    return {
      isValid: false,
      message: 'Harap isi Tanggal Inspeksi, Nama Penanggung Jawab, dan lengkapi Tanda Tangan HFO & Toolpusher sebelum mengunci dokumen.',
      missing: { tanggal: true, hfo: !isHfoValid, tp: !isTpValid, hfoSig: !isHfoSigValid, tpSig: !isTpSigValid }
    };
  }

  // Kasus Tanggal dan Tanda Tangan Kosong
  if (!isTanggalValid && (!isHfoSigValid || !isTpSigValid)) {
    return {
      isValid: false,
      message: 'Harap isi Tanggal Inspeksi dan lengkapi Tanda Tangan HFO & Toolpusher sebelum mengunci dokumen.',
      missing: { tanggal: true, hfoSig: !isHfoSigValid, tpSig: !isTpSigValid }
    };
  }

  // Kasus Hanya Tanggal Kosong
  if (!isTanggalValid) {
    return {
      isValid: false,
      message: 'Harap isi Tanggal Inspeksi sebelum mengunci dokumen formulir.',
      missing: { tanggal: true }
    };
  }

  // Kasus Nama Penanggung Jawab Kosong
  if (!isHfoValid && !isTpValid) {
    return {
      isValid: false,
      message: 'Harap lengkapi Nama HFO dan Toolpusher sebelum mengunci dokumen.',
      missing: { hfo: true, tp: true }
    };
  }
  if (!isHfoValid) {
    return {
      isValid: false,
      message: 'Harap lengkapi Nama HFO (HES Field Officer / Safety Officer) sebelum mengunci dokumen.',
      missing: { hfo: true }
    };
  }
  if (!isTpValid) {
    return {
      isValid: false,
      message: 'Harap lengkapi Nama Toolpusher / Pengawas Rig sebelum mengunci dokumen.',
      missing: { tp: true }
    };
  }

  // Kasus Tanda Tangan Kosong
  if (!isHfoSigValid && !isTpSigValid) {
    return {
      isValid: false,
      message: 'Tanda tangan digital HFO dan Toolpusher wajib diisi sebagai bukti validasi inspeksi.',
      missing: { hfoSig: true, tpSig: true }
    };
  }
  if (!isHfoSigValid) {
    return {
      isValid: false,
      message: 'Tanda tangan digital HFO (HES Field Officer) wajib diisi sebelum mengunci dokumen.',
      missing: { hfoSig: true }
    };
  }
  if (!isTpSigValid) {
    return {
      isValid: false,
      message: 'Tanda tangan digital Toolpusher wajib diisi sebelum mengunci dokumen.',
      missing: { tpSig: true }
    };
  }

  return { isValid: true };
};

export default function ValidationModal({
  isOpen,
  title = "Validasi Gagal!",
  message,
  onClose
}) {
  // Listener tombol Escape untuk menutup modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="validation-modal-title"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 w-[90%] max-w-md transform transition-all text-center relative overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative glow */}
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Ikon Peringatan Besar di Tengah Atas */}
        <div className="text-rose-500 w-16 h-16 mx-auto mb-4 bg-rose-50 rounded-full p-3 flex items-center justify-center shadow-inner">
          <AlertTriangle className="w-10 h-10 stroke-[2.2]" />
        </div>

        {/* Tipografi Judul */}
        <h3
          id="validation-modal-title"
          className="text-xl font-bold text-slate-800 text-center mb-2 tracking-tight"
        >
          {title}
        </h3>

        {/* Tipografi Pesan Dinamis */}
        <p className="text-sm text-slate-600 text-center mb-6 leading-relaxed px-1">
          {message || 'Harap isi Tanggal Inspeksi dan lengkapi Tanda Tangan HFO & Toolpusher sebelum mengunci dokumen.'}
        </p>

        {/* Tombol Aksi (Call to Action) */}
        <button
          type="button"
          onClick={onClose}
          autoFocus
          className="w-full bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white font-semibold py-3 rounded-xl transition-colors cursor-pointer shadow-md shadow-rose-500/20 active:scale-[0.98]"
        >
          Mengerti, Lengkapi Form
        </button>
      </div>
    </div>
  );
}
