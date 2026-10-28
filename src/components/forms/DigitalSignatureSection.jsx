import React, { useState, useRef, useEffect } from 'react';
import { 
  PenTool, 
  RotateCcw, 
  Check, 
  X, 
  CheckCircle2, 
  User, 
  ShieldCheck, 
  HardHat, 
  Calendar, 
  Edit3, 
  Trash2,
  AlertCircle,
  Sparkles
} from 'lucide-react';

/**
 * DigitalSignatureSection
 * ─────────────────────────────────────────────────────────────────────────────
 * Komponen tanda tangan digital 2 pihak:
 *  1. HFO (HES Field Officer / Safety Officer)
 *  2. TOOLPUSHER (Tool Pusher / Rig Supervisor) atau DERICKMAN (Khusus Harness)
 *
 * Fitur:
 *  - Interactive Canvas Drawing Pad yang modern & user-friendly
 *  - Full Touch Support untuk Web HP (touchstart, touchmove, touchend)
 *  - Prevent scroll/zoom saat menggambar tanda tangan di HP (touch-action: none)
 *  - Retina / HiDPI canvas rendering tajam & mulus
 *  - Dukungan sentuhan titik tunggal (dot click / tap)
 *  - Pemilih warna tinta (Biru Dokumen Resmi & Hitam Standar) tanpa reset canvas
 *  - Watermark panduan goresan dinamis (menghilang otomatis saat mulai digores)
 *  - Simpan format PNG Transparan (Base64)
 *  - Responsif: 1 kolom di HP, 2 kolom di tablet & desktop
 *  - Mode Read-Only saat form terkunci (bisa diedit jika Admin)
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const DEFAULT_SIGNATURE_ROLES = [
  {
    key: 'hfo',
    fallbackKey: 'wfo',
    label: 'HFO (HES Field Officer)',
    sublabel: 'Safety Officer / Pengawas HSE',
    icon: ShieldCheck,
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    defaultRoleTitle: 'HES Field Officer (HFO)'
  },
  {
    key: 'toolpush',
    label: 'TOOLPUSHER (Tool Pusher)',
    sublabel: 'Pimpinan Rig / Supervisor',
    icon: HardHat,
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    defaultRoleTitle: 'Tool Pusher'
  }
];

export const HARNESS_SIGNATURE_ROLES = [
  {
    key: 'hfo',
    fallbackKey: 'wfo',
    label: 'HFO (HES Field Officer)',
    sublabel: 'Safety Officer / Pengawas HSE',
    icon: ShieldCheck,
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    defaultRoleTitle: 'HES Field Officer (HFO)'
  },
  {
    key: 'derickman',
    fallbackKey: 'toolpush',
    label: 'DERICKMAN',
    sublabel: 'Pekerja Ketinggian / Derickman',
    icon: HardHat,
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    defaultRoleTitle: 'Derickman'
  }
];

/**
 * Helper Validasi Wajib Tanda Tangan Digital HFO & Toolpusher (atau Derickman)
 * Digunakan sebelum proses submit / penguncian formulir inspeksi.
 */
export const validateInspectionSignatures = (signatures, targetRef = null) => {
  const sigs = signatures || {};
  const getSigImage = (sig) => {
    if (!sig) return '';
    if (typeof sig === 'string') return sig.trim();
    if (typeof sig === 'object' && sig.image) return String(sig.image).trim();
    return '';
  };

  const hfoSig = getSigImage(sigs.hfo) || getSigImage(sigs.wfo);
  const toolpushSig = getSigImage(sigs.toolpush) || getSigImage(sigs.derickman);

  if (!hfoSig || !toolpushSig) {
    const errorMsg = 'Gagal menyimpan! Tanda tangan HFO dan Toolpusher wajib diisi sebagai bukti validasi inspeksi.';
    
    // Auto-scroll ke bagian tanda tangan jika gagal
    if (targetRef?.current) {
      targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetRef.current.classList.add('ring-4', 'ring-rose-500/50', 'rounded-2xl', 'transition-all', 'duration-500');
      setTimeout(() => {
        targetRef.current?.classList.remove('ring-4', 'ring-rose-500/50', 'rounded-2xl');
      }, 2500);
    } else if (typeof document !== 'undefined') {
      const allSections = document.querySelectorAll('#digital-signature-section, [data-signature-section]');
      let visibleEl = null;
      for (const el of allSections) {
        if (el.offsetParent !== null || el.getClientRects().length > 0) {
          visibleEl = el;
          break;
        }
      }
      const elToScroll = visibleEl || allSections[0];
      if (elToScroll) {
        elToScroll.scrollIntoView({ behavior: 'smooth', block: 'center' });
        elToScroll.classList.add('ring-4', 'ring-rose-500/50', 'rounded-2xl', 'transition-all', 'duration-500');
        setTimeout(() => {
          elToScroll.classList.remove('ring-4', 'ring-rose-500/50', 'rounded-2xl');
        }, 2500);
      }
    }

    return {
      isValid: false,
      message: errorMsg,
      missingHfo: !hfoSig,
      missingToolpusher: !toolpushSig
    };
  }

  return { isValid: true };
};

const DigitalSignatureSection = React.forwardRef(function DigitalSignatureSection({
  signatures = {},
  onSignatureChange,
  isLocked = false,
  isAdmin = false,
  adminEditMode = false,
  defaultSignerNames = {},
  roles = DEFAULT_SIGNATURE_ROLES,
  instructionText = null
}, ref) {
  // Modal State
  const [activeModalRole, setActiveModalRole] = useState(null);
  const [signerName, setSignerName] = useState('');
  const [inkColor, setInkColor] = useState('#1d4ed8'); // #1d4ed8 (Biru Dokumen Resmi) atau #0f172a (Hitam Standar)
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [modalError, setModalError] = useState('');

  const canvasRef = useRef(null);
  const drawingStateRef = useRef(false);
  const inkColorRef = useRef(inkColor);

  // Selalu update inkColorRef tanpa perlu me-reset canvas
  useEffect(() => {
    inkColorRef.current = inkColor;
  }, [inkColor]);

  // Status apakah input tanda tangan bisa diedit
  const canEdit = !isLocked || (isAdmin && adminEditMode) || isAdmin;

  // ─── Setup Canvas saat Modal Dibuka & Registrasi Non-Passive Touch di HP ─────
  useEffect(() => {
    if (!activeModalRole) return;

    const currentSig = signatures[activeModalRole.key] || (activeModalRole.fallbackKey ? signatures[activeModalRole.fallbackKey] : null) || {};
    const initialName = currentSig.name || defaultSignerNames[activeModalRole.key] || (activeModalRole.fallbackKey ? defaultSignerNames[activeModalRole.fallbackKey] : '') || '';
    setSignerName(initialName);
    setHasDrawn(false);
    drawingStateRef.current = false;
    setModalError('');

    let cleanupTouchListeners = null;

    // Tunggu DOM modal ter-render, lalu atur ukuran & resolusi canvas HiDPI
    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = inkColorRef.current;
      ctx.lineWidth = 2.6;

      // Jika sudah ada tanda tangan tersimpan, render kembali ke canvas
      if (currentSig.image) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, rect.width, rect.height);
          setHasDrawn(true);
        };
        img.src = currentSig.image;
      }

      // Koordinat helper relatif terhadap canvas
      const getPos = (touchOrMouse) => {
        const r = canvas.getBoundingClientRect();
        return {
          x: touchOrMouse.clientX - r.left,
          y: touchOrMouse.clientY - r.top
        };
      };

      // Native handlers dengan { passive: false } untuk Web HP (Android / iOS)
      const onTouchStart = (e) => {
        if (e.cancelable) e.preventDefault();
        if (!e.touches || e.touches.length === 0) return;
        drawingStateRef.current = true;
        setIsDrawing(true);
        setHasDrawn(true);
        setModalError('');

        const pos = getPos(e.touches[0]);
        // Gambar titik langsung jika pengguna hanya menyentuh layar (misal titik huruf)
        ctx.beginPath();
        ctx.fillStyle = inkColorRef.current;
        ctx.arc(pos.x, pos.y, ctx.lineWidth / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.strokeStyle = inkColorRef.current;
        ctx.moveTo(pos.x, pos.y);
      };

      const onTouchMove = (e) => {
        if (e.cancelable) e.preventDefault();
        if (!drawingStateRef.current || !e.touches || e.touches.length === 0) return;

        const pos = getPos(e.touches[0]);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      };

      const onTouchEnd = (e) => {
        if (e.cancelable) e.preventDefault();
        if (drawingStateRef.current) {
          drawingStateRef.current = false;
          setIsDrawing(false);
        }
      };

      canvas.addEventListener('touchstart', onTouchStart, { passive: false });
      canvas.addEventListener('touchmove', onTouchMove, { passive: false });
      canvas.addEventListener('touchend', onTouchEnd, { passive: false });
      canvas.addEventListener('touchcancel', onTouchEnd, { passive: false });

      cleanupTouchListeners = () => {
        canvas.removeEventListener('touchstart', onTouchStart);
        canvas.removeEventListener('touchmove', onTouchMove);
        canvas.removeEventListener('touchend', onTouchEnd);
        canvas.removeEventListener('touchcancel', onTouchEnd);
      };
    }, 120);

    return () => {
      clearTimeout(timer);
      if (cleanupTouchListeners) cleanupTouchListeners();
    };
  }, [activeModalRole]);

  // ─── Event Handlers Menggambar (Mouse PC/Laptop) ───────────────────────────
  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pos = getMousePos(e);

    drawingStateRef.current = true;
    setIsDrawing(true);
    setHasDrawn(true);
    setModalError('');

    // Gambar titik langsung jika diklik satu kali
    ctx.beginPath();
    ctx.fillStyle = inkColorRef.current;
    ctx.arc(pos.x, pos.y, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = inkColorRef.current;
    ctx.moveTo(pos.x, pos.y);
  };

  const handleMouseMove = (e) => {
    if (!drawingStateRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pos = getMousePos(e);

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const handleMouseUp = () => {
    if (drawingStateRef.current) {
      drawingStateRef.current = false;
      setIsDrawing(false);
    }
  };

  // ─── Hapus / Clear Canvas ──────────────────────────────────────────────────
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // ─── Simpan Tanda Tangan ───────────────────────────────────────────────────
  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !activeModalRole) return;

    if (!signerName.trim()) {
      setModalError('Silakan ketikkan Nama Lengkap Penanda Tangan terlebih dahulu.');
      return;
    }

    if (!hasDrawn) {
      setModalError('Silakan goreskan tanda tangan Anda pada kotak area tanda tangan.');
      return;
    }

    setModalError('');

    const dataUrl = canvas.toDataURL('image/png');
    const now = new Date();
    const formattedDate = now.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    if (onSignatureChange) {
      onSignatureChange(activeModalRole.key, {
        name: signerName.trim(),
        role: activeModalRole.defaultRoleTitle,
        date: formattedDate,
        image: dataUrl
      });
    }

    setActiveModalRole(null);
  };

  // ─── Reset / Hapus Tanda Tangan Tertentu ───────────────────────────────────
  const handleRemoveSignature = (roleKey, e) => {
    e.stopPropagation();
    if (!canEdit) return;
    if (window.confirm('Hapus tanda tangan ini? Dokumen inspeksi akan memerlukan tanda tangan ulang.')) {
      if (onSignatureChange) {
        onSignatureChange(roleKey, null);
      }
    }
  };

  return (
    <div 
      ref={ref}
      id="digital-signature-section"
      data-signature-section="true"
      className="space-y-3.5 pt-3 scroll-mt-24"
    >
      {/* Header Bagian Tanda Tangan */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2.5 border-b border-slate-300">
        <div>
          <h3 className="font-black text-xs sm:text-sm text-slate-900 flex items-center space-x-2">
            <PenTool className="w-4 h-4 text-blue-600" />
            <span>Tanda Tangan Digital Pemeriksaan (Digital Signatures)</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {instructionText || 'Wajib ditandatangani oleh HFO (HES Field Officer) dan Toolpusher. Sentuh tombol untuk menandatangani langsung di HP atau Laptop.'}
          </p>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs whitespace-nowrap">
          📱 Touch &amp; Stylus Ready
        </span>
      </div>

      {/* Grid 2 Kartu Slot Tanda Tangan: HFO & TOOLPUSHER / DERICKMAN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {roles.map((role) => {
          const sig = signatures[role.key] || (role.fallbackKey ? signatures[role.fallbackKey] : null);
          const hasSig = !!sig?.image;
          const RoleIcon = role.icon;

          return (
            <div
              key={role.key}
              className={`rounded-2xl border p-4 flex flex-col justify-between transition-all duration-200 shadow-xs ${
                hasSig
                  ? 'bg-emerald-50/30 border-emerald-300'
                  : 'bg-white border-slate-300 hover:border-blue-400 hover:shadow-sm'
              }`}
            >
              {/* Header Kartu Slot */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center space-x-2 truncate">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-2xs ${
                      hasSig ? 'bg-emerald-600 text-white' : 'bg-blue-100 text-blue-700'
                    }`}>
                      <RoleIcon className="w-4 h-4" />
                    </div>
                    <span className="font-extrabold text-xs text-slate-900 truncate">
                      {role.label}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex-shrink-0 ${
                    hasSig ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {hasSig ? '✓ Sah / Selesai' : 'Belum Ditandatangani'}
                  </span>
                </div>

                <div className="text-[10.5px] text-slate-500 mb-2.5 pl-10">
                  {role.sublabel}
                </div>

                {/* Box Display Tanda Tangan */}
                <div 
                  className={`w-full h-32 rounded-xl border flex flex-col items-center justify-center relative overflow-hidden transition-all duration-200 ${
                    hasSig
                      ? 'bg-white border-slate-200 shadow-inner'
                      : canEdit 
                        ? 'bg-slate-50/80 border-dashed border-slate-300 hover:bg-blue-50/50 hover:border-blue-400 cursor-pointer group'
                        : 'bg-slate-100 border-dashed border-slate-300'
                  }`}
                  onClick={() => {
                    if (canEdit) setActiveModalRole(role);
                  }}
                  title={canEdit ? 'Klik untuk membuka Pad Tanda Tangan' : 'Form terkunci'}
                >
                  {hasSig ? (
                    <div className="w-full h-full p-2.5 flex flex-col items-center justify-between">
                      <img
                        src={sig.image}
                        alt={`TTD ${role.label}`}
                        className="max-h-20 w-auto object-contain my-auto pointer-events-none"
                      />
                      {/* Garis tanda tangan */}
                      <div className="w-4/5 h-px bg-slate-300 my-0.5" />
                      <div className="text-xs font-black text-slate-900 truncate max-w-full">
                        {sig.name}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 text-center flex flex-col items-center justify-center space-y-1.5">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xs">
                        <PenTool className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 group-hover:text-blue-700 transition-colors">
                        {canEdit ? 'Klik untuk Bubuhkan TTD' : 'Belum Ditandatangani'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {canEdit ? 'Sentuh layar HP atau gunakan mouse' : 'Dokumen Terkunci'}
                      </span>
                    </div>
                  )}

                  {/* Tombol Hapus jika sudah ada TTD */}
                  {hasSig && canEdit && (
                    <button
                      type="button"
                      onClick={(e) => handleRemoveSignature(role.key, e)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/95 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition shadow-xs cursor-pointer"
                      title="Hapus tanda tangan ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Footer Kartu Slot */}
              <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-xs">
                {hasSig ? (
                  <div className="flex items-center space-x-1.5 text-emerald-700 font-semibold text-[11px] truncate">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{sig.date || 'Telah diverifikasi digital'}</span>
                  </div>
                ) : (
                  <span className="text-slate-400 italic text-[11px]">Menunggu tanda tangan...</span>
                )}

                {canEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModalRole(role);
                      setModalError('');
                    }}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-700 font-bold text-xs transition border border-blue-200 cursor-pointer shadow-2xs"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{hasSig ? 'Ubah TTD' : 'Tanda Tangani'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── MODAL POP-UP CANVAS PAD TANDA TANGAN (RESPONSIF HP & DESKTOP) ── */}
      {activeModalRole && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setActiveModalRole(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-blue-50/30">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20 flex-shrink-0">
                  <PenTool className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight">
                      Bubuhkan Tanda Tangan
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-100 text-blue-800 border border-blue-200">
                      {activeModalRole.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    Goreskan tanda tangan resmi menggunakan layar sentuh HP atau mouse
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalRole(null)}
                className="w-9 h-9 rounded-xl hover:bg-slate-100 active:bg-slate-200 text-slate-400 hover:text-slate-700 transition flex items-center justify-center flex-shrink-0 cursor-pointer"
                title="Tutup dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inline Alert Error Validasi Modal */}
            {modalError && (
              <div className="mx-4 sm:mx-5 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
                <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <span>{modalError}</span>
              </div>
            )}

            {/* Body Modal: Input Nama + Drawing Pad */}
            <div className="p-4 sm:p-5 space-y-4 text-xs">
              {/* Form Input Nama Penanda Tangan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>Nama Lengkap Penanda Tangan</span>
                    <span className="text-rose-500 font-bold">*</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Wajib diisi</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="Ketikkan nama lengkap penanda tangan..."
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-xl font-bold text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm transition-all outline-none"
                    required
                  />
                  {signerName && (
                    <button
                      type="button"
                      onClick={() => setSignerName('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                      title="Hapus teks nama"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Area Toolbar Kontrol Canvas (Pilihan Warna Tinta & Bersihkan) */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  {/* Left: Ink Color Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">
                      Warna Tinta:
                    </span>
                    <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
                      {/* Biru Option */}
                      <button
                        type="button"
                        onClick={() => setInkColor('#1d4ed8')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          inkColor === '#1d4ed8'
                            ? 'bg-blue-600 !text-white shadow-xs ring-2 ring-blue-300'
                            : 'text-slate-700 hover:text-blue-700 hover:bg-slate-200/70'
                        }`}
                        title="Tinta Biru Resmi Dokumen"
                      >
                        <span className={`w-2.5 h-2.5 rounded-full bg-blue-500 border ${inkColor === '#1d4ed8' ? 'border-white' : 'border-blue-600'}`} />
                        <span className={inkColor === '#1d4ed8' ? 'text-white' : 'text-slate-700'}>Biru</span>
                      </button>

                      {/* Hitam Option */}
                      <button
                        type="button"
                        onClick={() => setInkColor('#0f172a')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          inkColor === '#0f172a'
                            ? 'bg-slate-900 !text-white shadow-xs ring-2 ring-slate-400'
                            : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/70'
                        }`}
                        title="Tinta Hitam Standar"
                      >
                        <span className={`w-2.5 h-2.5 rounded-full bg-slate-800 border ${inkColor === '#0f172a' ? 'border-white' : 'border-slate-800'}`} />
                        <span className={inkColor === '#0f172a' ? 'text-white' : 'text-slate-700'}>Hitam</span>
                      </button>
                    </div>
                  </div>

                  {/* Right: Reset / Ulangi Button */}
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 px-3 py-1.5 rounded-xl border border-rose-200 transition-all cursor-pointer shadow-2xs"
                    title="Bersihkan coretan tanda tangan dan buat ulang"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                    <span>Hapus / Ulangi</span>
                  </button>
                </div>

                {/* Box Canvas dengan touch-action: none untuk mencegah scroll di HP */}
                <div className="relative w-full h-56 sm:h-64 rounded-2xl border-2 border-slate-300 hover:border-blue-400 focus-within:border-blue-500 bg-slate-50/40 overflow-hidden shadow-inner flex flex-col justify-between transition-colors group">
                  {/* Watermark / Placeholder saat belum ada goresan */}
                  {!hasDrawn && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 select-none p-4 text-center z-0">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 mb-2 shadow-2xs group-hover:scale-105 transition-transform">
                        <PenTool className="w-6 h-6 stroke-[1.5]" />
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-slate-600">
                        Goreskan tanda tangan Anda di area ini
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Gunakan jari di layar sentuh HP atau mouse di laptop/PC
                      </p>
                    </div>
                  )}

                  {/* Status Badge di Pojok Kanan Atas Pad */}
                  <div className="absolute top-2.5 right-2.5 pointer-events-none z-20">
                    {hasDrawn ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Tanda Tangan Terbaca</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white text-slate-600 border border-slate-300 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        <span>Pad Siap</span>
                      </span>
                    )}
                  </div>

                  {/* Canvas Elemen */}
                  <canvas
                    ref={canvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    style={{ touchAction: 'none' }}
                    className="w-full h-full cursor-crosshair relative z-10"
                  />

                  {/* Garis Dasar / Panduan Tanda Tangan di Bagian Bawah */}
                  <div className="absolute inset-x-8 bottom-7 pointer-events-none flex flex-col items-center z-0">
                    <div className="w-full border-b border-dashed border-slate-300 relative">
                      <span className="absolute -left-1 -top-2.5 text-xs font-bold text-slate-400">✕</span>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 mt-1 tracking-wide">
                      ( Goreskan tanda tangan di atas garis panduan ini )
                    </span>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 px-0.5">
                  <span className="flex items-center gap-1 text-slate-600 font-medium">
                    <span>✨ Sentuh &amp; tarik langsung pada layar HP.</span>
                  </span>
                  <span className="hidden sm:inline italic text-slate-400">
                    Tips: Putar ponsel ke posisi horizontal (landscape) untuk ruang gores lebih luas
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Modal Aksi */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 text-xs">
              <button
                type="button"
                onClick={() => setActiveModalRole(null)}
                className="px-5 py-2.5 rounded-xl text-slate-700 bg-white border border-slate-300 font-bold hover:bg-slate-100 active:bg-slate-200 transition text-xs shadow-2xs cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={saveSignature}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold text-xs sm:text-sm shadow-md hover:shadow-blue-500/25 transform hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer flex-shrink-0"
              >
                <Check className="w-4 h-4 text-white stroke-[2.5]" />
                <span className="text-white">Simpan Tanda Tangan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default DigitalSignatureSection;
