import React, { createContext, useContext, useState, useEffect } from 'react';

const PeriodContext = createContext(null);

export function PeriodProvider({ children }) {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  // Membaca nilai awal dari localStorage ('bms_selected_period' atau fallback)
  // Default saat pertama kali dimuat adalah bulan & tahun berjalan saat ini
  const getInitialValues = () => {
    try {
      const savedPeriod = localStorage.getItem('bms_selected_period');
      if (savedPeriod && /^\d{4}-\d{2}$/.test(savedPeriod)) {
        const [y, m] = savedPeriod.split('-').map(Number);
        if (!isNaN(y) && !isNaN(m) && m >= 1 && m <= 12) {
          return { month: m, year: y };
        }
      }
      const savedMonth = Number(localStorage.getItem('bms_selected_month'));
      const savedYear = Number(localStorage.getItem('bms_selected_year'));
      if (savedMonth >= 1 && savedMonth <= 12 && savedYear >= 2000 && savedYear <= 2100) {
        return { month: savedMonth, year: savedYear };
      }
    } catch (e) {
      console.warn('Gagal membaca periode dari localStorage:', e);
    }
    return { month: currentMonth, year: currentYear };
  };

  const initial = getInitialValues();
  const [selectedMonth, setSelectedMonthState] = useState(initial.month);
  const [selectedYear, setSelectedYearState] = useState(initial.year);

  // Update Period YYYY-MM dan simpan ke localStorage
  const setSelectedPeriod = (val) => {
    if (!val || !/^\d{4}-\d{2}$/.test(val)) return;
    const [y, m] = val.split('-').map(Number);
    if (!isNaN(y) && !isNaN(m) && m >= 1 && m <= 12) {
      setSelectedYearState(y);
      setSelectedMonthState(m);
      try {
        localStorage.setItem('bms_selected_period', val);
        localStorage.setItem('bms_selected_year', String(y));
        localStorage.setItem('bms_selected_month', String(m));
      } catch (e) {}
    }
  };

  const setSelectedMonth = (val) => {
    const num = Number(val);
    if (!isNaN(num) && num >= 1 && num <= 12) {
      setSelectedMonthState(num);
      const newPeriod = `${selectedYear}-${String(num).padStart(2, '0')}`;
      try {
        localStorage.setItem('bms_selected_month', String(num));
        localStorage.setItem('bms_selected_period', newPeriod);
      } catch (e) {}
    }
  };

  const setSelectedYear = (val) => {
    const num = Number(val);
    if (!isNaN(num) && num >= 2000 && num <= 2100) {
      setSelectedYearState(num);
      const newPeriod = `${num}-${String(selectedMonth).padStart(2, '0')}`;
      try {
        localStorage.setItem('bms_selected_year', String(num));
        localStorage.setItem('bms_selected_period', newPeriod);
      } catch (e) {}
    }
  };

  // Format Periode Standar ISO: 'YYYY-MM'
  const selectedPeriod = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const period = selectedPeriod;

  return (
    <PeriodContext.Provider
      value={{
        selectedMonth,
        setSelectedMonth,
        selectedYear,
        setSelectedYear,
        selectedPeriod,
        setSelectedPeriod,
        period
      }}
    >
      {children}
    </PeriodContext.Provider>
  );
}

export function usePeriod() {
  const context = useContext(PeriodContext);
  if (!context) {
    const now = new Date();
    const m = now.getMonth() + 1;
    const y = now.getFullYear();
    const p = `${y}-${String(m).padStart(2, '0')}`;
    return {
      selectedMonth: m,
      setSelectedMonth: () => {},
      selectedYear: y,
      setSelectedYear: () => {},
      selectedPeriod: p,
      setSelectedPeriod: () => {},
      period: p
    };
  }
  return context;
}
