/**
 * Konstanta dan Utility Periode Inspeksi BMS HSE
 * Dipisahkan dari komponen React untuk memastikan kompatibilitas Vite Fast Refresh (HMR).
 */

export const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:5000';
export const DEFAULT_YEARS = [2024, 2025, 2026, 2027];
export const STORAGE_KEY = 'bms_available_years';

export const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const MONTH_SHORT_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

export const MONTH_SHORT = [
  'JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN',
  'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'
];

/**
 * Mengambil daftar tahun yang tersimpan di localStorage
 */
export function getAvailableYears() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const valid = parsed
          .map(Number)
          .filter(y => !isNaN(y) && y >= 2020 && y <= 2099);
        if (valid.length > 0) {
          return Array.from(new Set(valid)).sort((a, b) => a - b);
        }
      }
    }
  } catch (e) {
    console.warn('Gagal membaca bms_available_years dari localStorage:', e);
  }
  return DEFAULT_YEARS;
}

/**
 * Menyimpan daftar tahun ke localStorage
 */
export function saveAvailableYears(years) {
  try {
    const clean = Array.from(new Set(years.map(Number)))
      .filter(y => !isNaN(y) && y >= 2020 && y <= 2099)
      .sort((a, b) => a - b);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    return clean;
  } catch (e) {
    console.warn('Gagal menyimpan bms_available_years ke localStorage:', e);
    return years;
  }
}
