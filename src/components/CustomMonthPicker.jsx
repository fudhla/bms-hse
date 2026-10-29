import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, RefreshCw } from 'lucide-react';
import { usePeriod } from '../context/PeriodContext';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

export default function CustomMonthPicker({
  selectedPeriod: propPeriod,
  onPeriodChange,
  selectedMonth: propMonth,
  onMonthChange,
  selectedYear: propYear,
  onYearChange,
  onRefresh,
  loading = false,
  className = ''
}) {
  const periodContext = usePeriod();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Dapatkan periode saat ini (format 'YYYY-MM')
  const getCurrentPeriod = () => {
    if (propPeriod && /^\d{4}-\d{2}$/.test(propPeriod)) {
      return propPeriod;
    }
    if (propYear && propMonth) {
      return `${propYear}-${String(propMonth).padStart(2, '0')}`;
    }
    if (periodContext?.selectedPeriod) {
      return periodContext.selectedPeriod;
    }
    try {
      const saved = localStorage.getItem('bms_selected_period');
      if (saved && /^\d{4}-\d{2}$/.test(saved)) return saved;
    } catch (e) {}
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const currentPeriod = getCurrentPeriod();
  const [selectedYearNum, selectedMonthNum] = currentPeriod.split('-').map(Number);

  // State untuk navigasi tahun di dalam Card Popover
  const [viewYear, setViewYear] = useState(selectedYearNum || new Date().getFullYear());

  // Sinkronkan viewYear saat periode berubah atau saat popover dibuka
  useEffect(() => {
    if (selectedYearNum) {
      setViewYear(selectedYearNum);
    }
  }, [selectedYearNum, isOpen]);

  // Click outside listener untuk menutup popover
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Tanggal saat ini untuk penanda live/today
  const today = new Date();
  const realCurrentYear = today.getFullYear();
  const realCurrentMonth = today.getMonth() + 1;

  // Format label teks tombol trigger: misal "Oktober 2026"
  const displayMonthName = MONTH_NAMES[(selectedMonthNum || 1) - 1] || 'Pilih Bulan';
  const triggerLabel = `${displayMonthName} ${selectedYearNum}`;

  // Handler pemilihan bulan
  const handleSelectMonth = (monthIndex) => {
    const monthNum = monthIndex + 1;
    const monthStr = String(monthNum).padStart(2, '0');
    const newPeriod = `${viewYear}-${monthStr}`;

    // 1. Simpan langsung ke localStorage agar tidak membebani database
    try {
      localStorage.setItem('bms_selected_period', newPeriod);
      localStorage.setItem('bms_selected_year', String(viewYear));
      localStorage.setItem('bms_selected_month', String(monthNum));
    } catch (err) {
      console.warn('Gagal menyimpan bms_selected_period ke localStorage:', err);
    }

    // 2. Update context global jika tersedia
    if (periodContext?.setSelectedPeriod) {
      periodContext.setSelectedPeriod(newPeriod);
    }

    // 3. Callback props untuk kompatibilitas parent component
    if (onPeriodChange) {
      onPeriodChange(newPeriod);
    }
    if (onYearChange) {
      onYearChange(viewYear);
    }
    if (onMonthChange) {
      onMonthChange(monthNum);
    }

    // 4. Tutup popup kalender
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative inline-flex items-center gap-2 ${className}`}>
      {/* ── 1. TOMBOL TRIGGER UTAMA (PREMIUM SAAS BLUE BUTTON) ── */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3.5 sm:px-4 rounded-xl cursor-pointer transition-all shadow-md shadow-blue-600/20 active:scale-95 flex items-center gap-2 text-xs sm:text-sm focus:ring-4 focus:ring-blue-500/40 outline-none select-none"
        title="Klik untuk memilih Bulan & Tahun"
        aria-label="Pilih Periode Inspeksi"
        aria-expanded={isOpen}
      >
        <Calendar className="w-4 h-4 text-blue-100 flex-shrink-0" />
        <span className="font-bold tracking-tight">{triggerLabel}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-blue-200 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-white' : ''
          }`}
        />
      </button>

      {/* Tombol Refresh Periode (Opsional) */}
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition shadow-2xs flex items-center justify-center cursor-pointer disabled:opacity-50 active:scale-95 flex-shrink-0"
          title="Muat ulang data periode ini"
          aria-label="Muat ulang data periode"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600 dark:text-cyan-400' : ''}`} />
        </button>
      )}

      {/* ── 2. CARD POPOVER: CUSTOM MONTH PICKER ── */}
      {isOpen && (
        <div
          className="absolute right-0 top-full z-50 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 dark:border-slate-800 p-4 w-72 animate-in fade-in zoom-in-95 duration-150"
          style={{ willChange: 'transform, opacity' }}
        >
          {/* Header: Navigasi Tahun Sederhana */}
          <div className="flex justify-between items-center mb-4">
            <button
              type="button"
              onClick={() => setViewYear((prev) => prev - 1)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-colors cursor-pointer"
              title="Tahun Sebelumnya"
              aria-label="Tahun Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-lg font-bold text-slate-700 dark:text-slate-200 select-none">
              {viewYear}
            </span>

            <button
              type="button"
              onClick={() => setViewYear((prev) => prev + 1)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-colors cursor-pointer"
              title="Tahun Berikutnya"
              aria-label="Tahun Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Body: Grid 4 Kolom untuk 12 Bulan */}
          <div className="grid grid-cols-4 gap-2">
            {MONTH_SHORT.map((monthName, index) => {
              const monthNum = index + 1;
              const isSelected = selectedYearNum === viewYear && selectedMonthNum === monthNum;
              const isRealThisMonth = realCurrentYear === viewYear && realCurrentMonth === monthNum;

              return (
                <button
                  key={monthName}
                  type="button"
                  onClick={() => handleSelectMonth(index)}
                  className={`py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 font-bold scale-[1.02]'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-800 dark:hover:text-blue-400'
                  }`}
                  title={`${MONTH_NAMES[index]} ${viewYear}`}
                >
                  <span>{monthName}</span>
                  {/* Subtle dot penanda bulan saat ini jika tidak dipilih */}
                  {isRealThisMonth && !isSelected && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
