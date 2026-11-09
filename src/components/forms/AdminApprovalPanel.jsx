import React, { useState } from 'react';
import { 
  CheckCircle2, 
  RotateCcw, 
  XCircle, 
  ShieldAlert, 
  Send, 
  AlertTriangle, 
  X, 
  RefreshCw,
  MessageSquare
} from 'lucide-react';

export default function AdminApprovalPanel({
  isAdmin = false,
  statusLaporan = 'Draft',
  catatanAdmin = '',
  onReviewReport,
  submitting = false,
  className = ''
}) {
  const [modalMode, setModalMode] = useState(null); // 'Revision' | 'Rejected' | null
  const [noteInput, setNoteInput] = useState('');
  const [modalError, setModalError] = useState('');

  // Hanya tampilkan jika pengguna adalah Admin
  if (!isAdmin) return null;

  const currentStatus = statusLaporan || 'Draft';

  const handleOpenModal = (mode) => {
    setModalMode(mode);
    setNoteInput(mode === 'Revision' ? (catatanAdmin || '') : '');
    setModalError('');
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setNoteInput('');
    setModalError('');
  };

  const handleConfirmAction = async () => {
    if (modalMode === 'Revision' && !noteInput.trim()) {
      setModalError('Wajib menuliskan catatan revisi agar pekerja Rig mengetahui bagian mana yang perlu diperbaiki!');
      return;
    }

    if (onReviewReport) {
      const success = await onReviewReport(modalMode, noteInput.trim());
      if (success) {
        handleCloseModal();
      }
    }
  };

  const handleQuickApprove = async () => {
    if (window.confirm('Apakah Anda yakin ingin MENYETUJUI (Approve) laporan inspeksi ini? Dokumen akan ditandai sah.')) {
      if (onReviewReport) {
        await onReviewReport('Approved', '');
      }
    }
  };

  return (
    <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
      currentStatus === 'Approved'
        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
        : currentStatus === 'Revision'
        ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
        : currentStatus === 'Rejected'
        ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800'
        : 'bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-slate-50 border-blue-200 dark:border-slate-700 dark:from-slate-900 dark:to-slate-800'
    } shadow-xs ${className}`}>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Deskripsi Status & Info */}
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-xs ${
            currentStatus === 'Approved'
              ? 'bg-emerald-600'
              : currentStatus === 'Revision'
              ? 'bg-amber-500'
              : currentStatus === 'Rejected'
              ? 'bg-rose-600'
              : 'bg-blue-600'
          }`}>
            {currentStatus === 'Approved' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : currentStatus === 'Revision' ? (
              <RotateCcw className="w-5 h-5" />
            ) : currentStatus === 'Rejected' ? (
              <XCircle className="w-5 h-5" />
            ) : (
              <ShieldAlert className="w-5 h-5" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Panel Keputusan Administrator
              </h4>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                currentStatus === 'Approved'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300'
                  : currentStatus === 'Revision'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-300'
                  : currentStatus === 'Rejected'
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300 border border-rose-300'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 border border-blue-300'
              }`}>
                {currentStatus === 'Submitted' ? 'Submitted (Menunggu Pengecekan)' : currentStatus}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              {currentStatus === 'Approved'
                ? 'Laporan ini telah disetujui resmi. Anda tetap dapat mengubah status jika diperlukan.'
                : currentStatus === 'Revision'
                ? 'Laporan sedang dalam perbaikan oleh pihak Rig di lapangan.'
                : currentStatus === 'Rejected'
                ? 'Laporan ini telah ditolak oleh Admin.'
                : 'Periksa kelengkapan checklist dan bukti fisik sebelum memutuskan persetujuan dokumen ini.'}
            </p>

            {/* Jika ada catatan admin sebelumnya */}
            {catatanAdmin && (
              <div className="mt-2 text-xs p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold text-amber-700 dark:text-amber-400">Catatan Admin Aktif:</span>
                  <span className="italic ml-1 text-slate-800 dark:text-slate-200 font-medium">"{catatanAdmin}"</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3 Tombol Aksi: Setujui, Kembalikan / Revisi, Tolak */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full md:w-auto justify-end">
          {/* Tombol 1: Setujui (Approve) */}
          <button
            type="button"
            onClick={handleQuickApprove}
            disabled={submitting || currentStatus === 'Approved'}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            title="Setujui laporan ini secara resmi"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Setujui (Approve)</span>
          </button>

          {/* Tombol 2: Kembalikan / Revisi (Return) */}
          <button
            type="button"
            onClick={() => handleOpenModal('Revision')}
            disabled={submitting}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
            title="Kembalikan laporan ke User Rig untuk direvisi"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Kembalikan / Revisi</span>
          </button>

          {/* Tombol 3: Tolak (Reject) */}
          <button
            type="button"
            onClick={() => handleOpenModal('Rejected')}
            disabled={submitting || currentStatus === 'Rejected'}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            title="Tolak laporan inspeksi ini"
          >
            <XCircle className="w-4 h-4" />
            <span>Tolak (Reject)</span>
          </button>
        </div>
      </div>

      {/* ── MODAL INPUT TEXTAREA UNTUK REVISI / TOLAK ── */}
      {modalMode && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={handleCloseModal}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-300 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col text-slate-800 dark:text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className={`p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between ${
              modalMode === 'Revision' ? 'bg-amber-50 dark:bg-amber-950/40' : 'bg-rose-50 dark:bg-rose-950/40'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md ${
                  modalMode === 'Revision' ? 'bg-amber-500' : 'bg-rose-600'
                }`}>
                  {modalMode === 'Revision' ? <RotateCcw className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                    {modalMode === 'Revision' ? 'Kembalikan Laporan untuk Revisi' : 'Konfirmasi Penolakan Laporan'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {modalMode === 'Revision' 
                      ? 'Pekerja Rig akan menerima catatan ini dan form akan terbuka untuk diedit kembali.' 
                      : 'Tandai laporan ini sebagai ditolak secara resmi.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body Modal */}
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {modalMode === 'Revision' ? 'Catatan Perbaikan / Alasan Revisi (Wajib Diisi):' : 'Alasan Penolakan (Opsional):'}
                </label>
                <textarea
                  rows={4}
                  value={noteInput}
                  onChange={(e) => {
                    setNoteInput(e.target.value);
                    if (modalError) setModalError('');
                  }}
                  placeholder={
                    modalMode === 'Revision'
                      ? 'Contoh: Foto APAR buram, tolong foto ulang. Periksa juga segel pengaman pada unit nomor 03.'
                      : 'Contoh: Laporan tidak sesuai dengan standar operasional prosedur BMS...'
                  }
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all resize-none font-sans"
                  autoFocus
                />
                {modalError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{modalError}</span>
                  </p>
                )}
              </div>

              {modalMode === 'Revision' && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>
                    Setelah catatan dikirim, status laporan akan berubah menjadi <strong>"Revision"</strong> dan kunci formulir di sisi Rig akan otomatis terbuka agar mereka dapat memperbaiki data dan mengirim ulang.
                  </span>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 font-bold text-xs transition cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={submitting}
                className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-white font-bold text-xs transition shadow-sm cursor-pointer disabled:opacity-50 ${
                  modalMode === 'Revision'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {submitting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>
                  {modalMode === 'Revision' ? 'Kirim Catatan & Kembalikan' : 'Konfirmasi Tolak Laporan'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
