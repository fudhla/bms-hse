import React, { useState, useRef, useEffect } from 'react';
import { 
  Save, 
  CheckCircle, 
  RefreshCw, 
  Lock, 
  FileDown, 
  FileSpreadsheet, 
  FileText,
  Table,
  ShieldCheck, 
  Check, 
  X, 
  ChevronRight, 
  Sparkles, 
  CheckCheck, 
  ArrowRight,
  ArrowLeft,
  LayoutDashboard,
  Shield,
  FileCheck,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';

export default function FormSubmitFooter({
  onBack,
  onSubmitFinal,
  onValidate,
  meta,
  submitting,
  isLocked,
  isAdmin = false,
  adminEditMode = false,
  status = 'draft',
  onExportPdf,
  onExportExcel,
  saveState
}) {
  // Modal States
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [approvalProgressStep, setApprovalProgressStep] = useState(1);
  const [toast, setToast] = useState({
    show: false,
    type: 'success', // 'success' | 'error'
    title: '',
    message: ''
  });

  // Slider State (Slide to Approve)
  const [sliderPosition, setSliderPosition] = useState(0); // 0 to 100%
  const isDraggingRef = useRef(false);
  const sliderTrackRef = useRef(null);

  // Handle Drag / Slide to Approve
  const handleTouchStart = () => { isDraggingRef.current = true; };
  const handleMouseDown = () => { isDraggingRef.current = true; };

  const handleMove = (clientX) => {
    if (!isDraggingRef.current || !sliderTrackRef.current) return;
    const track = sliderTrackRef.current.getBoundingClientRect();
    const handleWidth = 48;
    const maxDrag = track.width - handleWidth;
    let newX = clientX - track.left - (handleWidth / 2);
    if (newX < 0) newX = 0;
    if (newX > maxDrag) newX = maxDrag;

    const percentage = Math.round((newX / maxDrag) * 100);
    setSliderPosition(percentage);

    if (percentage >= 92) {
      isDraggingRef.current = false;
      setSliderPosition(100);
      executeApproval();
    }
  };

  const handleEnd = () => {
    if (sliderPosition < 92) {
      setSliderPosition(0);
    }
    isDraggingRef.current = false;
  };

  useEffect(() => {
    const onTouchMove = (e) => {
      if (isDraggingRef.current && e.touches[0]) {
        handleMove(e.touches[0].clientX);
      }
    };
    const onMouseMove = (e) => {
      if (isDraggingRef.current) {
        handleMove(e.clientX);
      }
    };
    const onEnd = () => handleEnd();

    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onEnd);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onEnd);

    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onEnd);
    };
  }, [sliderPosition]);

  const triggerErrorToast = (errorMsg) => {
    setToast({
      show: true,
      type: 'error',
      title: 'Validasi Formulir Gagal',
      message: errorMsg
    });
  };

  // Intersepsi Tombol Pemicu Modal Konfirmasi
  const handleOpenConfirmModal = () => {
    // 1. Eksekusi callback onValidate (dari useInspectionForm) jika tersedia
    if (typeof onValidate === 'function') {
      const result = onValidate();
      if (result === false || (result && result.isValid === false)) {
        const msg = (result && result.message) || 'Gagal: Harap lengkapi Tanggal Inspeksi dan Nama Penanggung Jawab (HSE/Tool Pusher) sebelum mengunci laporan.';
        triggerErrorToast(msg);
        return;
      }
    }

    // 2. Fallback validasi mandiri jika prop meta diberikan
    if (meta) {
      const tgl = meta.tanggal || meta.inspectionDate || meta.period;
      const isTanggalValid = tgl && String(tgl).trim().length >= 4;

      const safetyOfficer = 
        meta.hfo_name ||
        meta.hfoName ||
        meta.inspectedBy ||
        meta.inspectedByName ||
        meta.hesOfficerName ||
        meta.hesFieldOfficer ||
        meta.wsrName ||
        meta.derrickmanName ||
        meta.signatures?.hfo?.name ||
        meta.signatures?.wfo?.name ||
        meta.signatures?.user?.name;
      const isSafetyOfficerValid = safetyOfficer && String(safetyOfficer).trim().length > 0;

      const toolPusher = 
        meta.tool_pusher_name ||
        meta.toolPusherName ||
        meta.toolPusher ||
        meta.acknowledgedBy ||
        meta.acknowledgedByName ||
        meta.hesCoordinatorName ||
        meta.signatures?.toolpush?.name;
      const isToolPusherValid = toolPusher && String(toolPusher).trim().length > 0;

      if (!isTanggalValid || !isSafetyOfficerValid || !isToolPusherValid) {
        triggerErrorToast('Gagal: Harap lengkapi Tanggal Inspeksi dan Nama Penanggung Jawab (HSE/Tool Pusher) sebelum mengunci laporan.');
        return;
      }
    }

    // Lolos validasi: Buka pop-up persetujuan dokumen
    setShowConfirmModal(true);
  };

  // Eksekusi Persetujuan & Animasi
  const executeApproval = async () => {
    if (isApproving || submitting) return;
    setIsApproving(true);
    setApprovalProgressStep(1);

    // Langkah animasi bertahap (Micro-Steps Verification)
    setTimeout(() => setApprovalProgressStep(2), 350);
    setTimeout(() => setApprovalProgressStep(3), 700);

    try {
      const success = await onSubmitFinal();
      if (success === false) {
        setIsApproving(false);
        setSliderPosition(0);
        setShowConfirmModal(false);
        triggerErrorToast('Gagal: Harap lengkapi Tanggal Inspeksi dan Nama Penanggung Jawab (HSE/Tool Pusher) sebelum mengunci laporan.');
        return;
      }

      setTimeout(() => {
        setIsApproving(false);
        setShowConfirmModal(false);
        setSliderPosition(0);
        setShowSuccessModal(true);
        setToast({
          show: true,
          type: 'success',
          title: 'Inspeksi Berhasil Disetujui & Disimpan!',
          message: 'Dokumen telah dikunci secara sah & tercatat ke Admin HSE.'
        });
      }, 950);
    } catch (err) {
      setIsApproving(false);
      setSliderPosition(0);
      triggerErrorToast('Gagal menyetujui dokumen: ' + err.message);
    }
  };

  // Tutup Toast secara otomatis
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  return (
    <>
      <style>{`
        @keyframes strokeCircle {
          0% { stroke-dashoffset: 166; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes strokeCheck {
          0% { stroke-dashoffset: 48; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes haloPulse {
          0% { transform: scale(0.9); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 0.25; }
          100% { transform: scale(1.3); opacity: 0; }
        }
        .animate-dash-circle {
          stroke-dasharray: 166;
          stroke-dashoffset: 166;
          animation: strokeCircle 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-dash-check {
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          animation: strokeCheck 0.45s 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-halo {
          animation: haloPulse 1.8s infinite ease-out;
        }
      `}</style>

      {/* ── FLOATING TOAST NOTIFICATION ATAS (SUCCESS / ERROR) ── */}
      {toast.show && (
        <div className="fixed top-5 inset-x-0 z-50 flex justify-center px-4 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`pointer-events-auto text-white px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center space-x-3 max-w-lg w-full border ${
            toast.type === 'error'
              ? 'bg-rose-950/95 border-rose-500/80 shadow-rose-950/60'
              : 'bg-slate-900/95 border-slate-700/80'
          }`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${
              toast.type === 'error'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}>
              {toast.type === 'error' ? (
                <AlertCircle className="w-5 h-5 stroke-[2.5]" />
              ) : (
                <Check className="w-4 h-4 stroke-[3]" />
              )}
            </div>
            <div className="flex-1 min-w-0 text-xs">
              <p className="font-extrabold text-white">
                {toast.title}
              </p>
              <p className={`text-[11px] mt-0.5 leading-snug ${
                toast.type === 'error' ? 'text-rose-200' : 'text-slate-300'
              }`}>
                {toast.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setToast(prev => ({ ...prev, show: false }))}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── FOOTER BAR FORMULIR ── */}
      <div className="pt-6 border-t border-slate-300">
        {/* KASUS 1: ADMIN EDIT PADA FORM YANG SUDAH SUBMITTED */}
        {isAdmin && status === 'submitted' ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-blue-50/70 border border-blue-300">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 shadow-xs">
                <ShieldCheck className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                  <span>Mode Pembaruan Data (Hak Akses Administrator)</span>
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Formulir berstatus Submitted. Anda dapat memperbarui checklist, catatan, dan foto lalu klik tombol di kanan untuk menyimpan revisi.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-shrink-0 flex-wrap sm:flex-nowrap w-full sm:w-auto justify-end">
              {onExportPdf && (
                <button
                  type="button"
                  onClick={onExportPdf}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-xs hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer whitespace-nowrap flex-shrink-0"
                  title="Download Format PDF Resmi"
                >
                  <FileText className="w-4 h-4 text-white" />
                  <span>Export PDF</span>
                </button>
              )}
              {onExportExcel && (
                <button
                  type="button"
                  onClick={onExportExcel}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-xs hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer whitespace-nowrap flex-shrink-0"
                  title="Download Data Excel (.xlsx)"
                >
                  <Table className="w-4 h-4 text-white" />
                  <span>Export Excel</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleOpenConfirmModal}
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-xs hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer disabled:opacity-50 whitespace-nowrap flex-shrink-0"
              >
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{submitting ? 'Menyimpan...' : 'Simpan Perubahan (Admin)'}</span>
              </button>
            </div>
          </div>
        ) : isLocked ? (
          /* KASUS 2: TERKUNCI / SUBMITTED UNTUK USER BIASA (RIG) */
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50/90 to-emerald-100/40 border border-emerald-300 shadow-xs">
            <div className="flex items-center space-x-3.5 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-emerald-600/30">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
                  Formulir Inspeksi Telah Selesai &amp; Terkunci
                </h4>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  Data telah resmi tersimpan di database (read-only). Anda dapat mengunduh laporan dalam format PDF atau Excel.
                </p>
              </div>
            </div>

            {/* Tombol Aksi Berdampingan Rapi: Export PDF, Export Excel, & Kembali ke Dashboard */}
            <div className="flex items-center gap-2.5 flex-shrink-0 flex-wrap sm:flex-nowrap w-full sm:w-auto justify-end">
              {onExportPdf && (
                <button
                  type="button"
                  onClick={onExportPdf}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-xs hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer whitespace-nowrap flex-shrink-0"
                  title="Download Format PDF Resmi"
                >
                  <FileText className="w-4 h-4 text-white" />
                  <span>Export PDF</span>
                </button>
              )}
              {onExportExcel && (
                <button
                  type="button"
                  onClick={onExportExcel}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-xs hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer whitespace-nowrap flex-shrink-0"
                  title="Download Data Excel (.xlsx)"
                >
                  <Table className="w-4 h-4 text-white" />
                  <span>Export Excel</span>
                </button>
              )}
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-2 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-bold text-xs py-2 px-4 rounded-xl border border-slate-300 shadow-xs hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer whitespace-nowrap flex-shrink-0"
                title="Kembali ke Dashboard Utama"
              >
                <LayoutDashboard className="w-4 h-4 text-slate-600" />
                <span>Kembali ke Dashboard</span>
              </button>
            </div>
          </div>
        ) : (
          /* KASUS 3: DRAFT / SEDANG DIISI */
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Auto-save indicator */}
            <div className="text-xs text-slate-600 font-medium flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0"></span>
              <span>Inputan otomatis tersimpan sebagai draft. Tekan <strong>Kunci &amp; Submit Final</strong> untuk mengunci dokumen secara sah.</span>
            </div>

            <div className="flex items-center gap-2.5 flex-shrink-0 flex-wrap sm:flex-nowrap w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-bold text-xs shadow-xs hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer whitespace-nowrap flex-shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali</span>
              </button>

              {onExportPdf && (
                <button
                  type="button"
                  onClick={onExportPdf}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-xs hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer whitespace-nowrap flex-shrink-0"
                  title="Download Format PDF Resmi"
                >
                  <FileText className="w-4 h-4 text-white" />
                  <span>Export PDF</span>
                </button>
              )}

              {onExportExcel && (
                <button
                  type="button"
                  onClick={onExportExcel}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-xs hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer whitespace-nowrap flex-shrink-0"
                  title="Download Data Excel (.xlsx)"
                >
                  <Table className="w-4 h-4 text-white" />
                  <span>Export Excel</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleOpenConfirmModal}
                disabled={submitting}
                className="group relative inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-xs hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer disabled:opacity-50 overflow-hidden whitespace-nowrap flex-shrink-0"
              >
                {/* Micro shimmer highlight on button */}
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                <Lock className="w-4 h-4" />
                <span>Kunci &amp; Submit Final</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 1. MODAL KONFIRMASI DENGAN ANIMASI PERSETUJUAN (SLIDE OR CLICK) ── */}
      {showConfirmModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => !isApproving && setShowConfirmModal(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-md w-full border border-slate-300 shadow-2xl overflow-hidden flex flex-col text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Dialog */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="absolute inset-0 rounded-2xl bg-blue-500 animate-ping opacity-25 pointer-events-none" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    {isAdmin && status === 'submitted' ? 'Simpan Pembaruan Data Admin' : 'Persetujuan Dokumen Inspeksi'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    PT. Besmindo Materi Sewatama &bull; QHSE
                  </p>
                </div>
              </div>

              {!isApproving && (
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Body Checklist & Konfirmasi */}
            <div className="p-6 space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950 space-y-1">
                <p className="font-extrabold text-xs">
                  {isAdmin && status === 'submitted'
                    ? 'Perhatian Pembaruan Administrator:'
                    : 'Pernyataan Keabsahan Pemeriksaan:'}
                </p>
                <p className="text-[11px] leading-relaxed text-blue-900">
                  {isAdmin && status === 'submitted'
                    ? 'Seluruh revisi pada checklist fisik dan catatan inspeksi akan langsung diperbarui ke database pusat.'
                    : 'Dengan menyetujui, formulir ini akan resmi terkunci (Submitted / Read-Only), tervalidasi dengan tanda tangan digital, dan tidak dapat diubah kembali oleh personil Rig.'}
                </p>
              </div>

              {/* Status Validasi List */}
              <div className="space-y-2 border border-slate-200 rounded-2xl p-3.5 bg-slate-50/50">
                <div className="flex items-center space-x-2 text-[11.5px] text-slate-700 font-semibold">
                  <CheckCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Checklist kondisi fisik peralatan terisi</span>
                </div>
                <div className="flex items-center space-x-2 text-[11.5px] text-slate-700 font-semibold">
                  <CheckCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Tanda tangan digital HFO &amp; Toolpusher tersemat</span>
                </div>
                <div className="flex items-center space-x-2 text-[11.5px] text-slate-700 font-semibold">
                  <Lock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>Format PDF resmi dapat langsung diunduh</span>
                </div>
              </div>

              {/* ── KONTROL ANIMASI PERSETUJUAN ── */}
              {isApproving ? (
                <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200 flex flex-col items-center justify-center space-y-2.5 text-center">
                  <RefreshCw className="w-7 h-7 text-blue-600 animate-spin" />
                  <div className="font-extrabold text-xs text-blue-950">
                    {approvalProgressStep === 1 && 'Memvalidasi Integritas Tanda Tangan Digital...'}
                    {approvalProgressStep === 2 && 'Mengesahkan Status Dokumen (Submitted)...'}
                    {approvalProgressStep === 3 && 'Mengunci Berkas & Sinkronisasi ke MySQL...'}
                  </div>
                  <div className="w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${(approvalProgressStep / 3) * 100}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  {/* Slider: Slide to Approve (Geser untuk Menyetujui) */}
                  <div>
                    <div 
                      ref={sliderTrackRef}
                      className="relative h-13 bg-slate-100 rounded-full border border-slate-300 overflow-hidden select-none cursor-pointer flex items-center shadow-inner"
                    >
                      {/* Active green drag track */}
                      <div 
                        className="absolute left-0 top-0 bottom-0 bg-emerald-500/20 transition-all duration-75"
                        style={{ width: `${sliderPosition}%` }}
                      />

                      {/* Animated Label */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-500 font-bold text-[11px] tracking-wide">
                        <span className="flex items-center space-x-1">
                          <span>Geser ke kanan untuk menyetujui</span>
                          <span className="text-emerald-600 font-black animate-pulse">❯❯❯</span>
                        </span>
                      </div>

                      {/* Draggable Knob */}
                      <div
                        onMouseDown={handleMouseDown}
                        onTouchStart={handleTouchStart}
                        style={{ transform: `translateX(${(sliderPosition / 100) * (380 - 48)}px)` }}
                        className="absolute left-1 w-11 h-11 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-md active:scale-95 transition-transform duration-75 cursor-grab active:cursor-grabbing z-10"
                      >
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                    </div>
                    <p className="text-[10px] text-center text-slate-400 mt-1 italic">
                      Geser tombol untuk mencegah klik yang tidak disengaja di layar sentuh
                    </p>
                  </div>

                  <div className="text-center font-bold text-[10px] text-slate-400 uppercase tracking-widest">
                    — ATAU —
                  </div>

                  {/* Tombol Langsung Setujui */}
                  <button
                    type="button"
                    onClick={executeApproval}
                    className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition shadow-md hover:shadow-blue-500/30 flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Setujui &amp; Kunci Laporan Sekarang</span>
                  </button>
                </div>
              )}
            </div>

            {/* Footer Modal Batal */}
            {!isApproving && (
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-200 transition text-xs cursor-pointer"
                >
                  Batal / Periksa Kembali
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 2. MODAL SUKSES & CELEBRATION ANIMATION (ANIMASI MENYETUJUI) ── */}
      {showSuccessModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-300"
          onClick={() => setShowSuccessModal(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 sm:p-7 text-center relative overflow-hidden text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Background Glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* ── ANIMASI CHECKMARK BESAR ── */}
            <div className="relative flex items-center justify-center my-4">
              {/* Expanding Halo Ring */}
              <div className="absolute w-24 h-24 rounded-full bg-emerald-500/20 animate-halo pointer-events-none" />
              <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-500/40 flex items-center justify-center shadow-lg relative z-10">
                <svg className="w-12 h-12 text-emerald-600" viewBox="0 0 52 52">
                  <circle
                    cx="26"
                    cy="26"
                    r="23"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    className="animate-dash-circle text-emerald-500"
                  />
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14 27l8 8 16-16"
                    className="animate-dash-check text-emerald-600"
                  />
                </svg>
              </div>
            </div>

            {/* Title & Feedback */}
            <h3 className="text-lg font-black text-slate-900 tracking-tight mt-3">
              {isAdmin && status === 'submitted'
                ? 'Pembaruan Data Berhasil Disimpan!'
                : 'Inspeksi Berhasil Disetujui & Disimpan!'}
            </h3>

            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Dokumen telah resmi disahkan ke dalam sistem HSE PT. Besmindo Materi Sewatama. Formulir kini berstatus <strong>Terkunci (Submitted)</strong> dan aman di database.
            </p>

            {/* Status Pills */}
            <div className="my-4 inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded-full text-[11px] font-bold text-emerald-800">
              <Check className="w-3.5 h-3.5" />
              <span>Status: Submitted &amp; Terverifikasi Digital</span>
            </div>

            {/* Quick Action Buttons */}
            <div className="space-y-2 mt-2 pt-2 border-t border-slate-100">
              {onExportPdf && (
                <button
                  type="button"
                  onClick={() => {
                    onExportPdf();
                  }}
                  className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-extrabold text-xs transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Unduh Dokumen PDF Resmi Sekarang</span>
                </button>
              )}

              {onExportExcel && (
                <button
                  type="button"
                  onClick={() => {
                    onExportExcel();
                  }}
                  className="w-full py-2.5 rounded-xl bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-extrabold text-xs transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Table className="w-4 h-4" />
                  <span>Unduh Berkas Excel (.xlsx)</span>
                </button>
              )}

              <button
                type="button"
                onClick={onBack}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer"
              >
                Kembali ke Dashboard Utama
              </button>

              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="text-[11px] text-slate-400 hover:text-slate-600 pt-1 font-semibold block w-full cursor-pointer"
              >
                Tutup &amp; Tinjau Formulir Terkunci
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
