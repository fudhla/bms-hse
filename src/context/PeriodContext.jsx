import React, { createContext, useContext, useState, useEffect } from 'react';

const PeriodContext = createContext(null);

export function PeriodProvider({ children }) {
  const currentDate = new Date();

  // Membaca nilai awal dari localStorage atau default ke bulan & tahun sekarang
  const [selectedMonth, setSelectedMonthState] = useState(() => {
    try {
      const saved = localStorage.getItem('bms_selected_month');
      if (saved) {
        const num = Number(saved);
        if (!isNaN(num) && num >= 1 && num <= 12) return num;
      }
    } catch (e) {
      console.warn('Gagal membaca bms_selected_month:', e);
    }
    return currentDate.getMonth() + 1;
  });

  const [selectedYear, setSelectedYearState] = useState(() => {
    try {
      const saved = localStorage.getItem('bms_selected_year');
      if (saved) {
        const num = Number(saved);
        if (!isNaN(num) && num >= 2020 && num <= 2099) return num;
      }
    } catch (e) {
      console.warn('Gagal membaca bms_selected_year:', e);
    }
    return currentDate.getFullYear();
  });

  const setSelectedMonth = (val) => {
    const num = Number(val);
    if (!isNaN(num) && num >= 1 && num <= 12) {
      setSelectedMonthState(num);
      try {
        localStorage.setItem('bms_selected_month', String(num));
      } catch (e) {}
    }
  };

  const setSelectedYear = (val) => {
    const num = Number(val);
    if (!isNaN(num) && num >= 2020 && num <= 2099) {
      setSelectedYearState(num);
      try {
        localStorage.setItem('bms_selected_year', String(num));
      } catch (e) {}
    }
  };

  // Format Periode Standar ISO: 'YYYY-MM'
  const period = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

  return (
    <PeriodContext.Provider
      value={{
        selectedMonth,
        setSelectedMonth,
        selectedYear,
        setSelectedYear,
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
    return {
      selectedMonth: m,
      setSelectedMonth: () => {},
      selectedYear: y,
      setSelectedYear: () => {},
      period: `${y}-${String(m).padStart(2, '0')}`
    };
  }
  return context;
}
