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
  Trash2 
} from 'lucide-react';

/**
 * DigitalSignatureSection
 * ─────────────────────────────────────────────────────────────────────────────
 * Komponen tanda tangan digital 2 pihak:
 *  1. HFO (HES Field Officer / Safety Officer)
 *  2. TOOLPUSHER (Tool Pusher / Rig Supervisor) atau DERICKMAN (Khusus Harness)
 *
 * Fitur:
 *  - Interactive Canvas Drawing Pad
 *  - Full Touch Support untuk Web HP (touchstart, touchmove, touchend)
 *  - Prevent scroll/zoom saat menggambar tanda tangan di HP (touch-action: none)
 *  - Retina / HiDPI canvas rendering halus
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
  const [inkColor, setInkColor] = useState('#1e3a8a'); // #1e3a8a (Navy resmi) atau #0f172a (Hitam)
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [modalError, setModalError] = useState('');

  const canvasRef = useRef(null);
  const drawingStateRef = useRef(false);

  // Status apakah input terkunci
  const canEdit = !isLocked || (isAdmin && adminEditMode) || isAdmin;

  // ─── Setup Canvas saat Modal Dibuka & Registrasi Non-Passive Touch di HP ─────
  useEffect(() => {
    if (!activeModalRole) return;

    const currentSig = signatures[activeModalRole.key] || (activeModalRole.fallbackKey ? signatures[activeModalRole.fallbackKey] : null) || {};
    const initialName = currentSig.name || defaultSignerNames[activeModalRole.key] || (activeModalRole.fallbackKey ? defaultSignerNames[activeModalRole.fallbackKey] : '') || '';
    setSignerName(initialName);
    setHasDrawn(false);
    drawingStateRef.current = false;

    let cleanupTouchListeners = null;

    // Tunggu DOM modal ter-render, lalu atur ukuran & resolusi canvas
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
      ctx.strokeStyle = inkColor;
      ctx.lineWidth = 2.8;

      // Jika sudah ada tanda tangan tersimpan, render ke canvas
      if (currentSig.image) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, rect.width, rect.height);
          setHasDrawn(true);
        };
        img.src = currentSig.image;
      }

      // Koordinat helper
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

        const pos = getPos(e.touches[0]);
        ctx.beginPath();
        ctx.strokeStyle = inkColor;
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
  }, [activeModalRole, inkColor]);

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

    ctx.beginPath();
    ctx.strokeStyle = inkColor;
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
      setModalError('Silakan ketikkan Nama Penanda Tangan terlebih dahulu.');
      return;
    }

    if (!hasDrawn) {
      setModalError('Silakan bubuhkan goresan tanda tangan pada kotak pad.');
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
    if (window.confirm('Hapus tanda tangan ini?')) {
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
      className="space-y-3 pt-3 scroll-mt-24"
    >
      {/* Header Bagian Tanda Tangan */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 pb-2 border-b border-slate-300">
        <div>
          <h3 className="font-black text-xs sm:text-sm text-slate-900 flex items-center space-x-2">
            <PenTool className="w-4 h-4 text-blue-600" />
            <span>Tanda Tangan Digital Pemeriksaan (Digital Signatures)</span>
          </h3>
          <p className="text-[10px] text-slate-500">
            {instructionText || 'Wajib ditandatangani oleh HFO (HES Field Officer) dan Toolpusher. Sentuh tombol untuk menandatangani langsung di HP atau Laptop.'}
          </p>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
          Mobile &amp; Stylus Ready
        </span>
      </div>

      {/* Grid 2 Kartu Slot Tanda Tangan: HFO & TOOLPUSHER / DERICKMAN (1 Kolom di HP, 2 Kolom di Tablet/Desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {roles.map((role) => {
          const sig = signatures[role.key] || (role.fallbackKey ? signatures[role.fallbackKey] : null);
          const hasSig = !!sig?.image;
          const RoleIcon = role.icon;

          return (
            <div
              key={role.key}
              className={`rounded-xl border p-3 flex flex-col justify-between transition-all shadow-xs ${
                hasSig
                  ? 'bg-slate-50 border-emerald-300'
                  : 'bg-white border-slate-300 hover:border-blue-400'
              }`}
            >
              {/* Header Kartu Slot */}
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <div className="flex items-center space-x-1.5 truncate">
                    <RoleIcon className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                    <span className="font-extrabold text-[11px] text-slate-900 truncate">
                      {role.label}
                    </span>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${role.badgeColor}`}>
                    {hasSig ? '✓ Selesai' : 'Belum'}
                  </span>
                </div>

                <div className="text-[9.5px] text-slate-500 mb-2">
                  {role.sublabel}
                </div>

                {/* Box Display Tanda Tangan */}
                <div 
                  className={`w-full h-28 rounded-lg border flex flex-col items-center justify-center relative overflow-hidden transition ${
                    hasSig
                      ? 'bg-white border-slate-300'
                      : canEdit 
                        ? 'bg-slate-50/70 border-dashed border-slate-300 hover:bg-blue-50/40 cursor-pointer'
                        : 'bg-slate-100 border-dashed border-slate-300'
                  }`}
                  onClick={() => {
                    if (canEdit) setActiveModalRole(role);
                  }}
                  title={canEdit ? 'Klik untuk membuka Pad Tanda Tangan' : 'Form terkunci'}
                >
                  {hasSig ? (
                    <div className="w-full h-full p-2 flex flex-col items-center justify-between">
                      <img
                        src={sig.image}
                        alt={`TTD ${role.label}`}
                        className="max-h-16 w-auto object-contain my-auto pointer-events-none"
                      />
                      {/* Garis tanda tangan */}
                      <div className="w-4/5 h-px bg-slate-300 my-0.5" />
                      <div className="text-[10px] font-black text-slate-800 truncate max-w-full">
                        {sig.name}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 text-center flex flex-col items-center justify-center space-y-1">
                      <PenTool className="w-5 h-5 text-slate-400 mb-0.5" />
                      <span className="text-[10px] font-bold text-slate-600">
                        {canEdit ? 'Sentuh / Klik Disini' : 'Belum Ditandatangani'}
                      </span>
                      <span className="text-[8.5px] text-slate-400">
                        {canEdit ? 'Buka Canvas Tanda Tangan' : 'Form Terkunci'}
                      </span>
                    </div>
                  )}

                  {/* Tombol Hapus jika sudah ada TTD */}
                  {hasSig && canEdit && (
                    <button
                      type="button"
                      onClick={(e) => handleRemoveSignature(role.key, e)}
                      className="absolute top-1 right-1 p-1 rounded-md bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 transition shadow-2xs cursor-pointer"
                      title="Hapus tanda tangan ini"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Footer Kartu Slot */}
              <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px]">
                {hasSig ? (
                  <div className="flex items-center space-x-1 text-emerald-700 font-semibold truncate">
                    <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{sig.date || 'Telah diverifikasi'}</span>
                  </div>
                ) : (
                  <span className="text-slate-400 italic">Menunggu TTD...</span>
                )}

                {canEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModalRole(role);
                      setModalError('');
                    }}
                    className="inline-flex items-center space-x-1 px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[10px] transition border border-blue-200 cursor-pointer"
                  >
                    <Edit3 className="w-2.5 h-2.5" />
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setActiveModalRole(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-lg w-full border border-slate-300 shadow-2xl overflow-hidden flex flex-col text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white flex-shrink-0">
                  <PenTool className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">
                    Bubuhkan Tanda Tangan: {activeModalRole.label}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Gunakan jari di layar HP atau mouse di PC/laptop
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalRole(null)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Inline Alert Error Validasi Modal */}
            {modalError && (
              <div className="mx-3.5 sm:mx-4 mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Form Input Nama Penanda Tangan */}
            <div className="p-3.5 sm:p-4 space-y-3 text-xs border-b border-slate-100">
              <div>
                <label className="font-bold text-slate-800 block mb-1 text-[11px]">
                  Nama Lengkap Penanda Tangan <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Ketikkan nama lengkap..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  required
                />
              </div>

              {/* Area Canvas Drawing Pad */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center space-x-2">
                    <label className="font-bold text-slate-800 text-[11px]">
                      Goreskan Tanda Tangan:
                    </label>
                    {/* Pilihan Warna Tinta */}
                    <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setInkColor('#1e3a8a')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition flex items-center space-x-1 ${
                          inkColor === '#1e3a8a'
                            ? 'bg-blue-900 text-white shadow-xs'
                            : 'text-slate-600 hover:text-blue-900'
                        }`}
                        title="Tinta Biru Resmi"
                      >
                        <span className="w-2 h-2 rounded-full bg-blue-700 inline-block border border-white" />
                        <span>Biru</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setInkColor('#0f172a')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition flex items-center space-x-1 ${
                          inkColor === '#0f172a'
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                        title="Tinta Hitam"
                      >
                        <span className="w-2 h-2 rounded-full bg-slate-900 inline-block border border-white" />
                        <span>Hitam</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="inline-flex items-center space-x-1 text-[10px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Hapus / Ulangi</span>
                  </button>
                </div>

                {/* Box Canvas dengan touch-action: none untuk mencegah scroll di HP */}
                <div className="relative w-full h-52 sm:h-60 rounded-xl border-2 border-slate-300 bg-white overflow-hidden shadow-inner flex flex-col justify-between">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    style={{ touchAction: 'none' }}
                    className="w-full h-full cursor-crosshair relative z-10"
                  />

                  {/* Garis Panduan Tanda Tangan */}
                  <div className="absolute inset-x-8 bottom-8 pointer-events-none flex flex-col items-center z-0">
                    <div className="w-full border-b border-dashed border-slate-300" />
                    <span className="text-[9px] font-medium text-slate-400 mt-1">
                      ( Goreskan tanda tangan di atas garis ini )
                    </span>
                  </div>
                </div>

                <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500">
                  <span>✨ Sentuh &amp; tarik langsung pada layar HP.</span>
                  <span className="hidden sm:inline italic">Tips: Putar ponsel horizontal untuk pad lebih luas</span>
                </div>
              </div>
            </div>

            {/* Footer Modal Aksi */}
            <div className="p-3 sm:p-4 bg-slate-50 flex items-center justify-between text-xs border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActiveModalRole(null)}
                className="px-4 py-2 rounded-xl text-slate-700 bg-white border border-slate-300 font-bold hover:bg-slate-100 transition cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={saveSignature}
                className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-md hover:shadow-blue-500/30 transition cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Simpan Tanda Tangan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default DigitalSignatureSection;
