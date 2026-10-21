import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  RefreshCw, 
  Plus, 
  X, 
  Check, 
  Clock, 
  CalendarDays,
  AlertTriangle,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  API_BASE_URL,
  DEFAULT_YEARS,
  STORAGE_KEY,
  MONTH_NAMES,
  MONTH_SHORT_LABELS,
  MONTH_SHORT,
  getAvailableYears,
  saveAvailableYears
} from '../constants/periodConstants';

/**
 * Helper komunikasi API ke backend port 5000 dengan fallback proxy Vite
 */
async function requestPeriodApi(endpoint, options = {}, authToken = null) {
  const token = authToken || localStorage.getItem('bms_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const primaryUrl = `${API_BASE_URL}${endpoint}`;

  try {
    const res = await fetch(primaryUrl, { ...options, headers });
    return res;
  } catch (errDirect) {
    // Jika akses langsung ke port 5000 bermasalah, gunakan endpoint relatif melalui proxy Vite
    return await fetch(endpoint, { ...options, headers });
  }
}

export default function PeriodFilter({
  selectedMonth,
  onMonthChange,
  selectedYear,
  onYearChange,
  onRefresh,
  loading = false,
  showAllMonths = false,
  className = '',
  isAdmin: propIsAdmin
}) {
  let authUser = null;
  let authToken = null;
  try {
    const auth = useAuth();
    authUser = auth?.user;
    authToken = auth?.token;
  } catch (e) {
    // Dipanggil di luar AuthProvider bila perlu
  }

  // Hak akses: Hanya Admin yang dapat menambah & mengelola tahun
  const isAdmin = propIsAdmin !== undefined
    ? propIsAdmin
    : (authUser?.role === 'admin' || authUser?.username === 'admin_besmindo');

  const [yearsList, setYearsList] = useState(() => getAvailableYears());
  const [isOpen, setIsOpen] = useState(false);
  const [isAddingYear, setIsAddingYear] = useState(false);
  const [newYearInput, setNewYearInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // State Konfirmasi Hapus Tahun (Iya / Tidak)
  const [confirmDeleteYear, setConfirmDeleteYear] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // State Notifikasi Toast In-App
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const popoverRef = useRef(null);
  const inputRef = useRef(null);

  const realToday = new Date();
  const currentRealMonth = realToday.getMonth() + 1;
  const currentRealYear = realToday.getFullYear();
  const isCurrentPeriod = Number(selectedMonth) === currentRealMonth && Number(selectedYear) === currentRealYear;

  // Auto-dismiss toast notification
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // Sinkronisasi otomatis daftar tahun dari backend
  useEffect(() => {
    let isMounted = true;
    async function syncYearsFromServer() {
      try {
        const res = await requestPeriodApi('/api/available-years', { method: 'GET' }, authToken);
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          if (isMounted) {
            const serverYears = Array.from(new Set(json.data.map(Number)))
              .filter(y => !isNaN(y) && y >= 2020 && y <= 2099)
              .sort((a, b) => a - b);
            setYearsList(serverYears);
            saveAvailableYears(serverYears);
          }
        }
      } catch (err) {
        console.warn('Gagal sinkronisasi tahun dari backend:', err);
      }
    }
    syncYearsFromServer();
    return () => { isMounted = false; };
  }, [authToken]);

  // Pastikan selectedYear selalu ada di list
  useEffect(() => {
    if (selectedYear && !isNaN(Number(selectedYear))) {
      const yr = Number(selectedYear);
      if (!yearsList.includes(yr)) {
        const updated = saveAvailableYears([...yearsList, yr]);
        setYearsList(updated);
      }
    }
  }, [selectedYear]);

  // Click outside listener & Esc key listener
  useEffect(() => {
    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
        setIsAddingYear(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setIsAddingYear(false);
        if (!isDeleting) setConfirmDeleteYear(null);
      }
    }
    if (isOpen || confirmDeleteYear) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, confirmDeleteYear, isDeleting]);

  // Fokus input tahun baru saat panel inline dibuka
  useEffect(() => {
    if (isAddingYear) {
      setNewYearInput('');
      setErrorMessage('');
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 80);
    }
  }, [isAddingYear]);

  // Stepper Cepat (Bulan Sebelumnya)
  const handlePrevMonth = (e) => {
    e?.stopPropagation();
    if (selectedMonth === 'all') {
      onMonthChange(1);
      return;
    }
    const currM = Number(selectedMonth);
    if (currM > 1) {
      onMonthChange(currM - 1);
    } else {
      const currY = Number(selectedYear);
      const prevY = currY - 1;
      if (yearsList.includes(prevY)) {
        onYearChange(prevY);
        onMonthChange(12);
      }
    }
  };

  // Stepper Cepat (Bulan Berikutnya)
  const handleNextMonth = (e) => {
    e?.stopPropagation();
    if (selectedMonth === 'all') {
      onMonthChange(1);
      return;
    }
    const currM = Number(selectedMonth);
    if (currM < 12) {
      onMonthChange(currM + 1);
    } else {
      const currY = Number(selectedYear);
      const nextY = currY + 1;
      if (yearsList.includes(nextY)) {
        onYearChange(nextY);
        onMonthChange(1);
      }
    }
  };

  // Lompat Cepat ke Bulan & Tahun Saat Ini (Hari Ini)
  const handleJumpToCurrent = (e) => {
    e?.stopPropagation();
    if (!yearsList.includes(currentRealYear) && isAdmin) {
      handleApplyNewYear(currentRealYear);
    } else if (yearsList.includes(currentRealYear)) {
      onYearChange(currentRealYear);
    }
    onMonthChange(currentRealMonth);
    setIsOpen(false);
  };

  // Handler Simpan Tahun Baru (Khusus Admin)
  const handleApplyNewYear = async (yearToApply) => {
    if (!isAdmin) {
      setToast({
        show: true,
        type: 'error',
        message: 'Hanya akun Administrator yang berhak menambah tahun baru.'
      });
      setIsAddingYear(false);
      return;
    }

    const rawVal = yearToApply !== undefined ? String(yearToApply) : newYearInput.trim();
    const parsed = parseInt(rawVal, 10);

    if (isNaN(parsed) || rawVal.length !== 4) {
      setErrorMessage('Tahun harus terdiri dari 4 digit angka.');
      return;
    }

    if (parsed < 2020 || parsed > 2099) {
      setErrorMessage('Tahun harus berada dalam rentang 2020 s/d 2099.');
      return;
    }

    const updated = saveAvailableYears([...yearsList, parsed]);
    setYearsList(updated);
    onYearChange(parsed);
    setIsAddingYear(false);

    try {
      const res = await requestPeriodApi('/api/available-years', {
        method: 'POST',
        body: JSON.stringify({ year: parsed })
      }, authToken);

      if (res.ok) {
        setToast({
          show: true,
          type: 'success',
          message: `Tahun ${parsed} berhasil ditambahkan dan disinkronkan ke seluruh Rig.`
        });
      }
    } catch (err) {
      console.warn('Gagal menyimpan tahun ke database:', err);
    }
  };

  // Buka dialog konfirmasi hapus tahun (Iya / Tidak)
  const promptDeleteYear = (yrToDelete, e) => {
    e?.stopPropagation();
    if (!isAdmin) return;
    
    // Cegah penghapusan jika hanya tersisa 1 tahun dalam daftar
    if (yearsList.length <= 1) {
      setToast({
        show: true,
        type: 'warning',
        message: 'Minimal harus tersisa 1 tahun dalam kalender operasional.'
      });
      return;
    }

    setDeleteError('');
    setConfirmDeleteYear(yrToDelete);
  };

  // Eksekusi Hapus Tahun saat pengguna klik "Iya, Hapus"
  const handleConfirmDelete = async () => {
    if (!confirmDeleteYear || !isAdmin) return;
    const yrToDelete = confirmDeleteYear;
    setIsDeleting(true);
    setDeleteError('');

    try {
      const res = await requestPeriodApi(`/api/available-years/${yrToDelete}`, {
        method: 'DELETE'
      }, authToken);

      let json = null;
      try {
        json = await res.json();
      } catch (parseErr) {
        throw new Error('Respon server tidak valid (' + res.status + ')');
      }

      if (res.ok && json?.success && Array.isArray(json.data)) {
        const clean = json.data.map(Number);
        setYearsList(clean);
        saveAvailableYears(clean);
        if (Number(selectedYear) === yrToDelete) {
          onYearChange(clean[clean.length - 1] || 2026);
        }
        setConfirmDeleteYear(null);
        setToast({
          show: true,
          type: 'success',
          message: `Tahun ${yrToDelete} berhasil dihapus dari sistem.`
        });
      } else {
        const msg = json?.message || `Gagal menghapus tahun (${res.status} ${res.statusText})`;
        setDeleteError(msg);
      }
    } catch (err) {
      console.error('Gagal menghapus tahun:', err);
      setDeleteError(err.message || 'Gagal menghubungi server backend.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Nama label bulan aktif
  const monthDisplay = selectedMonth === 'all' 
    ? 'Semua Bulan' 
    : MONTH_NAMES[(Number(selectedMonth) || 1) - 1];

  const maxYear = yearsList.length > 0 ? Math.max(...yearsList) : 2027;
  const suggestedYears = [maxYear + 1, maxYear + 2].filter(y => y <= 2099 && !yearsList.includes(y));

  return (
    <div className={`relative inline-flex items-center gap-1.5 ${className}`} ref={popoverRef}>
      
      {/* ── DOUBLE-BEZEL FLOATING CAPSULE BAR ── */}
      <div className="p-0.5 sm:p-1 rounded-full bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-xs inline-flex items-center gap-0.5">
        
        {/* Tombol Stepper Prev (◀) */}
        <button
          type="button"
          onClick={handlePrevMonth}
          className="w-7 h-7 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 transition active:scale-90 cursor-pointer shadow-2xs"
          title="Bulan Sebelumnya"
          aria-label="Bulan Sebelumnya"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Core Capsule Trigger (Membuka Period Hub) */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200 select-none cursor-pointer ${
            isOpen 
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-500/20' 
              : 'bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/80 shadow-2xs border border-slate-200/60 dark:border-slate-800'
          }`}
          aria-expanded={isOpen}
          aria-label="Pilih Periode Bulan dan Tahun"
        >
          <div className="flex items-center gap-1.5">
            <Calendar className={`w-3.5 h-3.5 ${isOpen ? 'text-white' : 'text-blue-600 dark:text-cyan-400'}`} />
            
            <div className="flex items-baseline gap-1.5 text-xs font-black tracking-tight">
              <span>{monthDisplay}</span>
              <span className={`text-[11px] font-extrabold ${isOpen ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'}`}>
                {selectedYear}
              </span>
            </div>
          </div>

          {/* Indikator "Bulan Ini" */}
          {isCurrentPeriod && (
            <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          )}

          {/* Chevron Indicator */}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-white' : 'text-slate-400'}`} />
        </button>

        {/* Tombol Stepper Next (▶) */}
        <button
          type="button"
          onClick={handleNextMonth}
          className="w-7 h-7 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 transition active:scale-90 cursor-pointer shadow-2xs"
          title="Bulan Berikutnya"
          aria-label="Bulan Berikutnya"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Tombol Refresh Periode */}
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition shadow-2xs flex items-center justify-center cursor-pointer disabled:opacity-50 active:scale-95"
          title="Muat ulang data periode ini"
          aria-label="Muat ulang data periode"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      )}

      {/* ── THE PERIOD HUB POPOVER (INTERACTIVE CALENDAR MATRIX) ── */}
      {isOpen && (
        <div 
          className="absolute top-full mt-2.5 right-0 left-auto z-50 w-[310px] sm:w-[350px] max-w-[calc(100vw-24px)] bg-white dark:bg-slate-900/98 backdrop-blur-2xl rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200 text-slate-800 dark:text-slate-100"
          style={{ willChange: 'transform, opacity' }}
        >
          {/* Header Panel */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-2xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-cyan-400 flex items-center justify-center border border-blue-500/20 shadow-2xs">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
                  Pilih Periode Inspeksi
                </h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-md ${
                    isAdmin 
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/40' 
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-cyan-300 border border-blue-300/40'
                  }`}>
                    {isAdmin ? '👑 Mode Administrator' : '🛡️ Mode Karyawan Rig'}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100/80 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center transition cursor-pointer"
              title="Tutup Menu"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ── BAGIAN 1: PILIHAN TAHUN (HORIZONTAL STRIP) ── */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                Tahun Kalender
              </span>
              
              {/* Tombol Tambah Tahun (Hanya Admin) */}
              {isAdmin && !isAddingYear && (
                <button
                  type="button"
                  onClick={() => setIsAddingYear(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-black text-blue-600 dark:text-cyan-400 hover:underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Tahun</span>
                </button>
              )}
            </div>

            {/* Form Inline Tambah Tahun (Admin) */}
            {isAdmin && isAddingYear && (
              <div className="mb-3 p-3 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 animate-in fade-in duration-150">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-blue-950 dark:text-blue-200">
                    Input Tahun Kustom Baru
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingYear(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    maxLength={4}
                    value={newYearInput}
                    onChange={(e) => {
                      setNewYearInput(e.target.value.replace(/[^0-9]/g, ''));
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="Contoh: 2028"
                    className="w-28 px-3 py-1.5 rounded-xl border border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-900 text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyNewYear()}
                    disabled={!newYearInput.trim()}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Simpan</span>
                  </button>
                </div>

                {errorMessage && (
                  <p className="text-[10px] text-rose-500 font-bold mt-1.5">{errorMessage}</p>
                )}

                {/* Quick Chips */}
                {suggestedYears.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2.5">
                    <span className="text-[9px] text-slate-400 font-bold">Saran:</span>
                    {suggestedYears.map((yr) => (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => handleApplyNewYear(yr)}
                        className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900 text-[10px] font-bold text-blue-600 dark:text-blue-300 hover:bg-blue-600 hover:text-white transition cursor-pointer"
                      >
                        +{yr}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* List Pill Tahun */}
            <div className="flex items-center gap-2 overflow-x-auto p-1 pb-2 scrollbar-thin">
              {yearsList.map((y) => {
                const isSelected = Number(selectedYear) === y;

                return (
                  <div
                    key={y}
                    className={`inline-flex items-center rounded-xl text-xs font-black transition-all flex-shrink-0 group ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-1 ring-blue-400/50'
                        : 'bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700'
                    }`}
                  >
                    {/* Tombol Pilih Tahun */}
                    <button
                      type="button"
                      onClick={() => onYearChange(y)}
                      className={`py-1.5 cursor-pointer flex items-center gap-1.5 transition-colors ${
                        isAdmin ? 'pl-3 pr-1.5' : 'px-3'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 flex-shrink-0" />}
                      <span>{y}</span>
                    </button>

                    {/* Tombol Silang Merah Hapus Tahun (Tersedia untuk semua tahun khusus Admin) */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={(e) => promptDeleteYear(y, e)}
                        className={`mr-1.5 w-4 h-4 rounded-full transition-all duration-150 hover:scale-115 active:scale-90 cursor-pointer flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-2xs ring-1 ring-white/40'
                            : 'bg-rose-100 hover:bg-rose-500 hover:text-white text-rose-600 dark:bg-rose-950/70 dark:text-rose-400 dark:hover:bg-rose-600 dark:hover:text-white border border-rose-200/80 dark:border-rose-900/60'
                        }`}
                        title={`Hapus periode tahun ${y}`}
                        aria-label={`Hapus periode tahun ${y}`}
                      >
                        <X className="w-2.5 h-2.5 stroke-[2.5]" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── BAGIAN 2: BENTO MATRIX BULAN (3 x 4) ── */}
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                Bulan Inspeksi
              </span>
              {showAllMonths && (
                <button
                  type="button"
                  onClick={() => {
                    onMonthChange('all');
                    setIsOpen(false);
                  }}
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-lg transition cursor-pointer ${
                    selectedMonth === 'all'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50'
                  }`}
                >
                  Semua Bulan
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {MONTH_SHORT_LABELS.map((shortName, idx) => {
                const monthNum = idx + 1;
                const isSelected = selectedMonth !== 'all' && Number(selectedMonth) === monthNum;
                const isRealCurrentMonth = monthNum === currentRealMonth && Number(selectedYear) === currentRealYear;

                return (
                  <button
                    key={monthNum}
                    type="button"
                    onClick={() => {
                      onMonthChange(monthNum);
                      setIsOpen(false);
                    }}
                    className={`py-2.5 px-3 rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-500/25 scale-[1.02] ring-2 ring-blue-400/50'
                        : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50/80 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/50 dark:border-slate-800 font-extrabold active:scale-95'
                    }`}
                  >
                    <span className="text-xs font-black tracking-tight">
                      {shortName}
                    </span>
                    {isRealCurrentMonth && (
                      <span 
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isSelected ? 'bg-emerald-300' : 'bg-emerald-500'} animate-pulse`} 
                        title="Bulan Sekarang" 
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── FOOTER DENGAN SHORTCUT SEKARANG ── */}
          <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleJumpToCurrent}
              className="inline-flex items-center gap-1.5 text-xs font-black text-blue-600 dark:text-cyan-400 hover:underline cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Bulan Sekarang</span>
            </button>

            <span className="text-[10px] text-slate-400 font-medium">
              Esc untuk tutup
            </span>
          </div>

        </div>
      )}

      {/* ── MODAL NOTIFIKASI KONFIRMASI HAPUS TAHUN (IYA / TIDAK) ── */}
      {confirmDeleteYear && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => !isDeleting && setConfirmDeleteYear(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-[28px] p-6 max-w-sm sm:max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 text-slate-800 dark:text-slate-100 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Background Glow Effect */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-500/15 rounded-full blur-2xl pointer-events-none" />

            {/* Eyebrow Pill */}
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/60">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                Konfirmasi Administrator
              </span>
              <button
                type="button"
                onClick={() => !isDeleting && setConfirmDeleteYear(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Icon & Title */}
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-950 dark:to-slate-900 border border-rose-200 dark:border-rose-900/80 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0 shadow-md shadow-rose-500/10">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                  Hapus Periode Tahun {confirmDeleteYear}?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Tindakan ini akan menghapus tahun dari kalender operasional.
                </p>
              </div>
            </div>

            {/* Detail Box */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-2 mb-4">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <span>Peringatan Dampak Sistem:</span>
              </div>
              <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside">
                <li>Tahun <span className="font-extrabold text-slate-900 dark:text-white">{confirmDeleteYear}</span> akan dihapus permanen dari MySQL database.</li>
                <li>Seluruh 20 akun Rig BMS tidak dapat lagi memilih periode tahun ini.</li>
              </ul>
            </div>

            {/* Error Banner jika ada kegagalan (Tanpa Browser Alert) */}
            {deleteError && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                <span className="flex-1 leading-snug">{deleteError}</span>
              </div>
            )}

            {/* Tombol Aksi Iya / Batal */}
            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteYear(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs transition cursor-pointer disabled:opacity-50 text-center"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black text-xs shadow-lg shadow-rose-600/25 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Iya, Hapus Tahun</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST NOTIFIKASI MODERN IN-APP ── */}
      {toast.show && (
        <div 
          className="fixed top-5 right-5 z-[110] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border text-xs font-black transition-all animate-in fade-in slide-in-from-top-4 duration-300 max-w-sm text-white"
          style={{
            backgroundColor: toast.type === 'success' 
              ? 'rgba(6, 78, 59, 0.96)' 
              : toast.type === 'warning'
                ? 'rgba(120, 53, 15, 0.96)'
                : 'rgba(136, 19, 55, 0.96)',
            borderColor: toast.type === 'success'
              ? 'rgba(52, 211, 153, 0.5)'
              : toast.type === 'warning'
                ? 'rgba(251, 191, 36, 0.5)'
                : 'rgba(244, 63, 94, 0.5)'
          }}
        >
          {toast.type === 'success' ? (
            <div className="w-6 h-6 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          ) : toast.type === 'warning' ? (
            <div className="w-6 h-6 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center flex-shrink-0">
              <X className="w-4 h-4" />
            </div>
          )}
          <span className="flex-1 leading-snug">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast((prev) => ({ ...prev, show: false }))}
            className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

    </div>
  );
}
