import React from 'react';
import { RefreshCw } from 'lucide-react';
import { usePeriod } from '../context/PeriodContext';

export default function PeriodFilter({
  selectedMonth: propMonth,
  onMonthChange,
  selectedYear: propYear,
  onYearChange,
  selectedPeriod: propPeriod,
  onPeriodChange,
  onRefresh,
  loading = false,
  className = ''
}) {
  const periodContext = usePeriod();

  // Dapatkan nilai periode YYYY-MM saat ini
  const getCurrentPeriodValue = () => {
    if (propPeriod && /^\d{4}-\d{2}$/.test(propPeriod)) {
      return propPeriod;
    }
    if (propYear && propMonth) {
      return `${propYear}-${String(propMonth).padStart(2, '0')}`;
    }
    if (periodContext?.selectedPeriod) {
      return periodContext.selectedPeriod;
    }
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const currentPeriod = getCurrentPeriodValue();

  const handlePeriodChange = (e) => {
    const val = e.target.value; // Format: 'YYYY-MM'
    if (!val || !/^\d{4}-\d{2}$/.test(val)) return;

    // 1. Simpan langsung ke localStorage agar tidak membebani database
    try {
      localStorage.setItem('bms_selected_period', val);
    } catch (err) {
      console.warn('Gagal menyimpan bms_selected_period ke localStorage:', err);
    }

    // 2. Update global PeriodContext jika tersedia
    if (periodContext?.setSelectedPeriod) {
      periodContext.setSelectedPeriod(val);
    }

    // 3. Callback props jika disediakan oleh parent component
    if (onPeriodChange) {
      onPeriodChange(val);
    }

    const [yearNum, monthNum] = val.split('-').map(Number);
    if (onYearChange && !isNaN(yearNum)) {
      onYearChange(yearNum);
    }
    if (onMonthChange && !isNaN(monthNum)) {
      onMonthChange(monthNum);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative inline-flex items-center">
        <input
          type="month"
          value={currentPeriod}
          onChange={handlePeriodChange}
          onClick={(e) => {
            try {
              if (typeof e.target.showPicker === 'function') {
                e.target.showPicker();
              }
            } catch (err) {}
          }}
          className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors focus:ring-4 focus:ring-blue-500/50 outline-none shadow-sm text-xs sm:text-sm font-sans [color-scheme:dark]"
          title="Pilih Periode Bulan & Tahun"
          aria-label="Pilih Periode Bulan & Tahun"
        />
      </div>

      {/* Tombol Segarkan Data (Jika disediakan) */}
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition shadow-2xs flex items-center justify-center cursor-pointer disabled:opacity-50 active:scale-95 flex-shrink-0"
          title="Muat ulang data periode ini"
          aria-label="Muat ulang data periode"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600 dark:text-cyan-400' : ''}`} />
        </button>
      )}
    </div>
  );
}
