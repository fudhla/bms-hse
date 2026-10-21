import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  FileDown, 
  Search, 
  Filter, 
  RefreshCw, 
  Calendar, 
  Eye, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  HardHat, 
  ChevronRight, 
  X, 
  Printer, 
  Shield, 
  ArrowUpDown,
  Download,
  Building2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { exportToPdf, exportToExcel, exportMonthlyRecapExcel, FORM_META_MAP, formatDateDisplay } from '../utils/exportUtils';
import PeriodFilter from '../components/PeriodFilter';
import { getAvailableYears, saveAvailableYears, DEFAULT_YEARS } from '../constants/periodConstants';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RIG_LIST = Array.from({ length: 20 }, (_, i) => `BMS ${String(i + 1).padStart(2, '0')}`);

const FORM_OPTIONS = [
  { key: 'all', label: 'Semua 9 Formulir HSE' },
  { key: 'apd', label: 'Inspeksi APD (Alat Pelindung Diri)', docNo: 'BMSD / 22/ FO/HSE/01/26' },
  { key: 'apar', label: 'Inspeksi APAR (Pemadam Api Ringan)', docNo: 'BMSD/ 13/ FO/ HSE/ 12/ 25' },
  { key: 'harness', label: 'Inspeksi Full Body Harness & Lanyard', docNo: 'BMSD/17/FO/HSE/08/26' },
  { key: 'eyewash', label: 'Eye Wash & Shower Inspection Form', docNo: 'BMSD/44/FO/HSE/12/25' },
  { key: 'firstaid', label: 'Inspeksi Kotak P3K (First Aid Box)', docNo: 'BMSD/46/FO/HSE/04/25' },
  { key: 'oxigent', label: 'Inspeksi Tabung Oksigen Medis', docNo: 'BMSD/47/FO/HSE/08/21' },
  { key: 'scba', label: 'Inspeksi SCBA Pernapasan Darurat', docNo: 'BMSD/43/FO/HSE/06/25' },
  { key: 'spillkit', label: 'Inspeksi Spill Kit Tumpahan Minyak', docNo: 'BMSD/48/FO/HSE/09/21' },
  { key: 'stretcher', label: 'Inspeksi Tandu Evakuasi (Stretcher)', docNo: 'BMSD/45/FO/HSE/06/20' }
];

const MONTHS = [
  { value: 'all', label: 'Semua Bulan' },
  { value: '1', label: 'Januari' },
  { value: '2', label: 'Februari' },
  { value: '3', label: 'Maret' },
  { value: '4', label: 'April' },
  { value: '5', label: 'Mei' },
  { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' },
  { value: '8', label: 'Agustus' },
  { value: '9', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' }
];

export default function AdminReportsPage() {
  const navigate = useNavigate();
  const { token } = useAuth();

  // State Data
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [generatingPdfId, setGeneratingPdfId] = useState(null);

  // State Filters
  const [selectedRig, setSelectedRig] = useState('all');
  const [selectedForm, setSelectedForm] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [availableYears, setAvailableYears] = useState(() => getAvailableYears());
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch data dari backend
  const fetchInspections = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/inspections');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setInspections(json.data);
      } else {
        throw new Error(json.message || 'Gagal memuat data inspeksi');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspections();

    // Sinkronisasi tahun periode dari backend
    async function syncYears() {
      try {
        const res = await fetch('/api/available-years');
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const valid = Array.from(new Set(json.data.map(Number))).sort((a, b) => a - b);
          setAvailableYears(valid);
          saveAvailableYears(valid);
        }
      } catch (err) {
        console.warn('Gagal memuat daftar tahun dari server:', err);
      }
    }
    syncYears();
  }, []);

  // Filter Data di sisi client
  const filteredData = useMemo(() => {
    return inspections.filter((item) => {
      // Filter Rig
      if (selectedRig !== 'all') {
        const itemRig = (item.rig_no || '').replace(/\s+/g, '').toUpperCase();
        const targetRig = selectedRig.replace(/\s+/g, '').toUpperCase();
        if (itemRig !== targetRig) return false;
      }

      // Filter Form Type
      if (selectedForm !== 'all') {
        const itemType = (item.form_type || '').toLowerCase();
        if (!itemType.includes(selectedForm.toLowerCase())) return false;
      }

      // Filter Status
      if (selectedStatus !== 'all' && item.status !== selectedStatus) {
        return false;
      }

      // Filter Tanggal / Bulan / Tahun
      if (item.tanggal) {
        const [y, m] = item.tanggal.split('-');
        if (selectedYear !== 'all' && y !== selectedYear) return false;
        if (selectedMonth !== 'all' && Number(m) !== Number(selectedMonth)) return false;
      }

      // Filter Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchRig = (item.rig_no || '').toLowerCase().includes(q);
        const matchType = (item.form_type || '').toLowerCase();
        const matchHfo = (item.hfo_name || '').toLowerCase().includes(q);
        const matchTp = (item.tool_pusher_name || '').toLowerCase().includes(q);
        const matchRem = (item.rekomendasi || '').toLowerCase().includes(q);
        if (!matchRig && !matchType.includes(q) && !matchHfo && !matchTp && !matchRem) {
          return false;
        }
      }

      return true;
    });
  }, [inspections, selectedRig, selectedForm, selectedMonth, selectedYear, selectedStatus, searchQuery]);

  // Statistik KPI
  const stats = useMemo(() => {
    const total = filteredData.length;
    const submitted = filteredData.filter(i => i.status === 'submitted').length;
    const draft = total - submitted;
    const withSignatures = filteredData.filter(i => {
      const fd = i.form_data || {};
      const sigs = i.signatures || fd.signatures || (fd.meta && fd.meta.signatures) || {};
      return !!(sigs.hfo?.image || sigs.wfo?.image) && !!(sigs.toolpush?.image || sigs.derickman?.image);
    }).length;

    const complianceRate = total > 0 ? Math.round((submitted / total) * 100) : 0;

    return { total, submitted, draft, withSignatures, complianceRate };
  }, [filteredData]);

  // Handler Download Single PDF Resmi
  const handleDownloadPdf = async (item) => {
    setGeneratingPdfId(item.id);
    try {
      await exportToPdf(item);
    } catch (e) {
      alert('Gagal menghasilkan file PDF: ' + e.message);
    } finally {
      setGeneratingPdfId(null);
    }
  };

  // Handler Download Single Excel
  const handleDownloadExcel = async (item) => {
    try {
      await exportToExcel(item);
    } catch (e) {
      alert('Gagal mengekspor file Excel: ' + e.message);
    }
  };

  // Handler Download Batch Excel Rekap
  const handleBatchExcel = async () => {
    try {
      const filterDesc = `${selectedRig === 'all' ? 'Semua Rig' : selectedRig} | ${selectedForm === 'all' ? 'Semua Form' : selectedForm.toUpperCase()} | ${selectedYear}`;
      await exportMonthlyRecapExcel(filteredData, filterDesc);
    } catch (e) {
      alert('Gagal mengekspor rekap Excel: ' + e.message);
    }
  };

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto pb-12 text-slate-800 dark:text-slate-100">
      {/* ── HEADER HALAMAN ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 shadow-xs">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Rekap &amp; Laporan Inspeksi HSE
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                Official Report Hub
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Arsip resmi dokumen kepatuhan HSE 20 Rig PT. Besmindo Materi Sewatama. Format cetak PDF identik dengan lembar fisik inspeksi lapangan &amp; validasi tanda tangan digital.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            type="button"
            onClick={fetchInspections}
            disabled={loading}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition border border-slate-300 dark:border-slate-700 cursor-pointer disabled:opacity-50"
            title="Muat ulang data inspeksi terkini"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleBatchExcel}
            disabled={filteredData.length === 0}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-sm hover:shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
            title="Download seluruh baris hasil filter ke Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Rekap Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* ── KPI STATISTICAL CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Inspeksi */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Laporan</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{stats.total}</p>
            <p className="text-[10px] text-slate-400 mt-1">Seluruh arsip formulir</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Laporan Sah / Submitted */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Terkirim &amp; Sah</p>
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5">{stats.submitted}</p>
            <p className="text-[10px] text-slate-400 mt-1">Status Submitted / Terkunci</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: TTD Digital Lengkap */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">TTD Lengkap (2 Pihak)</p>
            <p className="text-2xl font-black text-blue-700 dark:text-blue-400 mt-0.5">{stats.withSignatures}</p>
            <p className="text-[10px] text-slate-400 mt-1">HFO &amp; Toolpusher terverifikasi</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Draft Aktif */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Draft Berjalan</p>
            <p className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-0.5">{stats.draft}</p>
            <p className="text-[10px] text-slate-400 mt-1">Menunggu finalisasi Rig</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── FILTER & SEARCH BAR ── */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Field */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Rig No, jenis form, pemeriksa (HFO / Toolpusher), rekomendasi..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Selectors */}
          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            {/* Rig Selector */}
            <select
              value={selectedRig}
              onChange={(e) => setSelectedRig(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">Semua Rig (20 Rig)</option>
              {RIG_LIST.map((rig) => (
                <option key={rig} value={rig}>{rig}</option>
              ))}
            </select>

            {/* Form Selector */}
            <select
              value={selectedForm}
              onChange={(e) => setSelectedForm(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {FORM_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>{opt.label}</option>
              ))}
            </select>

            {/* Status Selector */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="submitted">Submitted (Sah)</option>
              <option value="draft">Draft (Berjalan)</option>
            </select>

            {/* Filter Periode Interaktif (Bulan & Tahun) */}
            <PeriodFilter
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
              selectedYear={Number(selectedYear) || 2026}
              onYearChange={(yr) => setSelectedYear(String(yr))}
              showAllMonths={true}
              onRefresh={fetchInspections}
              loading={loading}
              isAdmin={true}
            />
          </div>
        </div>

        {/* Filter Indicator Active */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span>
            Menampilkan <strong className="text-slate-900 dark:text-white">{filteredData.length}</strong> dari total {inspections.length} laporan inspeksi
          </span>
          {(selectedRig !== 'all' || selectedForm !== 'all' || selectedMonth !== 'all' || selectedStatus !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedRig('all');
                setSelectedForm('all');
                setSelectedMonth('all');
                setSelectedStatus('all');
                setSearchQuery('');
              }}
              className="text-rose-600 hover:text-rose-700 dark:text-rose-400 font-bold hover:underline cursor-pointer"
            >
              Reset Semua Filter
            </button>
          )}
        </div>
      </div>

      {/* ── TABEL UTAMA LAPORAN INSPEKSI ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-xs font-bold text-slate-500">Memuat basis data laporan inspeksi...</p>
          </div>
        ) : error ? (
          <div className="p-10 text-center flex flex-col items-center justify-center space-y-2 text-rose-600">
            <AlertCircle className="w-8 h-8" />
            <p className="text-xs font-bold">{error}</p>
            <button
              type="button"
              onClick={fetchInspections}
              className="mt-2 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 transition"
            >
              Coba Lagi
            </button>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-2 text-slate-400">
            <FileSpreadsheet className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-1" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Tidak ada laporan yang sesuai kriteria</p>
            <p className="text-xs text-slate-400">Silakan ubah kata kunci pencarian atau sesuaikan pilihan filter di atas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  <th className="py-3 px-3.5 w-12 text-center">No</th>
                  <th className="py-3 px-3.5 w-28">Rig</th>
                  <th className="py-3 px-3.5 min-w-[220px]">Formulir HSE</th>
                  <th className="py-3 px-3.5 w-32">Tanggal</th>
                  <th className="py-3 px-3.5 w-32">Status</th>
                  <th className="py-3 px-3.5 min-w-[170px]">Verifikasi TTD</th>
                  <th className="py-3 px-3.5 min-w-[140px]">Diperiksa Oleh</th>
                  <th className="py-3 px-3.5 text-center min-w-[190px]">Aksi &amp; Ekspor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredData.map((item, idx) => {
                  const fd = item.form_data || {};
                  const sigs = item.signatures || fd.signatures || (fd.meta && fd.meta.signatures) || {};
                  const hfoSigned = !!(sigs.hfo?.image || sigs.wfo?.image);
                  const toolpushSigned = !!(sigs.toolpush?.image || sigs.derickman?.image);
                  const isSubmitted = item.status === 'submitted';
                  const isPdfGenerating = generatingPdfId === item.id;

                  return (
                    <tr
                      key={item.id || idx}
                      className="hover:bg-blue-50/30 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* No */}
                      <td className="py-3 px-3.5 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Rig Badge */}
                      <td className="py-3 px-3.5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700">
                          {item.rig_no || 'BMS 01'}
                        </span>
                      </td>

                      {/* Form Type & Doc No */}
                      <td className="py-3 px-3.5">
                        <div className="font-extrabold text-slate-900 dark:text-white leading-snug">
                          {item.form_type}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          {item.form_code || 'BMSD/HSE/DOC'}
                        </div>
                      </td>

                      {/* Tanggal */}
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {formatDateDisplay(item.tanggal)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(item.created_at || Date.now()).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3.5">
                        {isSubmitted ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Submitted</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Draft</span>
                          </span>
                        )}
                      </td>

                      {/* Verifikasi TTD Digital */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center space-x-2 text-[10px]">
                          <span
                            className={`px-2 py-0.5 rounded font-bold border flex items-center space-x-1 ${
                              hfoSigned
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:text-slate-500'
                            }`}
                            title={hfoSigned ? `HFO Signed: ${sigs.hfo?.name || sigs.wfo?.name}` : 'Menunggu TTD HFO'}
                          >
                            <span>HFO:</span>
                            <span>{hfoSigned ? '✓' : '-'}</span>
                          </span>

                          <span
                            className={`px-2 py-0.5 rounded font-bold border flex items-center space-x-1 ${
                              toolpushSigned
                                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                                : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:text-slate-500'
                            }`}
                            title={toolpushSigned ? `Toolpusher/Derickman Signed: ${sigs.toolpush?.name || sigs.derickman?.name}` : 'Menunggu TTD'}
                          >
                            <span>TP:</span>
                            <span>{toolpushSigned ? '✓' : '-'}</span>
                          </span>
                        </div>
                      </td>

                      {/* Penanggung Jawab */}
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                          {item.hfo_name || sigs.hfo?.name || sigs.wfo?.name || '-'}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          TP: {item.tool_pusher_name || sigs.toolpush?.name || sigs.derickman?.name || '-'}
                        </div>
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Preview Modal */}
                          <button
                            type="button"
                            onClick={() => setSelectedInspection(item)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                            title="Lihat Pratinjau Dokumen"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* PDF Resmi */}
                          <button
                            type="button"
                            onClick={() => handleDownloadPdf(item)}
                            disabled={isPdfGenerating}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition shadow-2xs cursor-pointer disabled:opacity-50"
                            title="Download Format PDF Resmi Persis Fisik"
                          >
                            {isPdfGenerating ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <FileDown className="w-3 h-3" />
                            )}
                            <span>PDF</span>
                          </button>

                          {/* Excel */}
                          <button
                            type="button"
                            onClick={() => handleDownloadExcel(item)}
                            className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition shadow-2xs cursor-pointer"
                            title="Download Data Format Excel (.xlsx)"
                          >
                            <FileSpreadsheet className="w-3 h-3" />
                            <span>XLS</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL PREVIEW DETAIL DOKUMEN ── */}
      {selectedInspection && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-200"
          onClick={() => setSelectedInspection(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full border border-slate-300 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col text-slate-800 dark:text-slate-100 max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white flex-shrink-0">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    Pratinjau Resmi: {selectedInspection.form_type}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500">
                    {selectedInspection.rig_no} &bull; Tanggal: {formatDateDisplay(selectedInspection.tanggal)} &bull; No: {selectedInspection.form_code}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedInspection(null)}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body Dokumen Pratinjau */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Box KOP Resmi */}
              <div className="border-2 border-slate-800 dark:border-slate-700 rounded-lg overflow-hidden bg-white text-slate-900">
                <div className="grid grid-cols-12 divide-x-2 divide-slate-800">
                  <div className="col-span-3 p-3 flex items-center justify-center bg-white">
                    <img src="/logo-baru.png" alt="Besmindo" className="max-h-12 object-contain" />
                  </div>
                  <div className="col-span-6 p-3 text-center flex flex-col justify-center bg-slate-50">
                    <h4 className="font-black text-xs uppercase tracking-wide">
                      {selectedInspection.form_type}
                    </h4>
                    <p className="text-[9px] text-slate-500 italic mt-0.5">PT. Besmindo Materi Sewatama</p>
                  </div>
                  <div className="col-span-3 p-2 text-[9px] divide-y divide-slate-300">
                    <div className="flex justify-between py-0.5">
                      <span>No. Form:</span>
                      <span className="font-mono font-bold">{selectedInspection.form_code}</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span>Revisi:</span>
                      <span className="font-bold">#05</span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span>Tgl Efektif:</span>
                      <span className="font-bold">2026</span>
                    </div>
                  </div>
                </div>

                {/* Sub Metadata Bar */}
                <div className="border-t-2 border-slate-800 p-2 bg-slate-100 grid grid-cols-4 gap-2 font-bold text-[10px]">
                  <div>Rig: <span className="font-normal text-blue-900">{selectedInspection.rig_no}</span></div>
                  <div>Tanggal: <span className="font-normal">{formatDateDisplay(selectedInspection.tanggal)}</span></div>
                  <div>Lokasi: <span className="font-normal">{selectedInspection.lokasi || 'Rig Site'}</span></div>
                  <div>Status Rig: <span className="font-normal">{selectedInspection.status_rig || 'Operating'}</span></div>
                </div>
              </div>

              {/* Rekomendasi Section */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="font-bold text-[11px] text-slate-700 dark:text-slate-300">
                  Catatan / Rekomendasi Tindakan:
                </div>
                <p className="text-slate-600 dark:text-slate-400 italic">
                  {selectedInspection.rekomendasi || 'Peralatan memenuhi standar keselamatan operasional kerja PT. Besmindo Materi Sewatama.'}
                </p>
              </div>

              {/* Tanda Tangan Digital HFO & Toolpusher / Derickman */}
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-2 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Validasi Tanda Tangan Digital Pemeriksaan:</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* HFO */}
                  {(() => {
                    const fd = selectedInspection.form_data || {};
                    const sigs = selectedInspection.signatures || fd.signatures || (fd.meta && fd.meta.signatures) || {};
                    const hfo = sigs.hfo || sigs.wfo || {};
                    return (
                      <div className="rounded-xl border border-slate-300 dark:border-slate-700 p-3 bg-white dark:bg-slate-800/80 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs text-slate-900 dark:text-white">HFO (HES Field Officer)</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${hfo.image ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>
                              {hfo.image ? '✓ Terverifikasi' : 'Menunggu TTD'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400">Safety Officer / Pengawas HSE</p>
                        </div>

                        <div className="my-2 h-20 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center bg-slate-50 dark:bg-slate-900/50">
                          {hfo.image ? (
                            <img src={hfo.image} alt="TTD HFO" className="max-h-16 w-auto object-contain" />
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Belum ditandatangani</span>
                          )}
                        </div>

                        <div className="pt-1 border-t border-slate-200 dark:border-slate-700 text-center font-bold text-xs">
                          {hfo.name || selectedInspection.hfo_name || 'HES Officer'}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Toolpusher / Derickman (Khusus Harness) */}
                  {(() => {
                    const fd = selectedInspection.form_data || {};
                    const sigs = selectedInspection.signatures || fd.signatures || (fd.meta && fd.meta.signatures) || {};
                    const isHarness = (selectedInspection.form_type || selectedInspection.form_code || '').toLowerCase().includes('harness');
                    const tp = isHarness ? (sigs.derickman || sigs.toolpush || {}) : (sigs.toolpush || {});
                    const roleTitle = isHarness ? 'DERICKMAN' : 'TOOLPUSHER (Tool Pusher)';
                    const roleSub = isHarness ? 'Pekerja Ketinggian / Derickman' : 'Pimpinan Rig / Supervisor';
                    const nameText = tp.name || (isHarness ? (selectedInspection.derrickman_name || 'Derickman') : (selectedInspection.tool_pusher_name || 'Tool Pusher'));

                    return (
                      <div className="rounded-xl border border-slate-300 dark:border-slate-700 p-3 bg-white dark:bg-slate-800/80 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs text-slate-900 dark:text-white">{roleTitle}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${tp.image ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-400'}`}>
                              {tp.image ? '✓ Disetujui' : 'Menunggu TTD'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400">{roleSub}</p>
                        </div>

                        <div className="my-2 h-20 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center bg-slate-50 dark:bg-slate-900/50">
                          {tp.image ? (
                            <img src={tp.image} alt={`TTD ${roleTitle}`} className="max-h-16 w-auto object-contain" />
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Belum ditandatangani</span>
                          )}
                        </div>

                        <div className="pt-1 border-t border-slate-200 dark:border-slate-700 text-center font-bold text-xs">
                          {nameText}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Footer Modal Actions */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedInspection(null)}
                className="px-4 py-2 rounded-xl text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-800 transition text-xs cursor-pointer"
              >
                Tutup
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleDownloadExcel(selectedInspection)}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Download Excel (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadPdf(selectedInspection)}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-sm cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Download PDF Resmi</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
