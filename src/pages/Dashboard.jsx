import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileCheck2, 
  RefreshCw, 
  Search, 
  ArrowRight,
  Flame,
  ShieldAlert,
  Eye,
  HeartPulse,
  Shield,
  Cylinder,
  Wind,
  Box,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usePeriod } from '../context/PeriodContext';
import PeriodFilter from '../components/PeriodFilter';
import { API_BASE_URL } from '../constants/periodConstants';

// ── 9 FORMULIR STANDAR HSE ──────────────────────────────────────────
export const FORM_DEFINITIONS = [
  { id: 'apar',      title: 'APAR Inspection',                 docNo: 'BMSD/13/FO/HSE/12/25', icon: Flame },
  { id: 'apd',       title: 'APD / PPE Inspection',             docNo: 'BMSD/22/FO/HSE/01/26', icon: ShieldAlert },
  { id: 'eyewash',   title: 'Eye Wash & Shower Form',          docNo: 'BMSD/44/FO/HSE/12/25', icon: Eye },
  { id: 'firstaid',  title: 'First Aid Box',                    docNo: 'BMSD/18/FO/HSE/12/25', icon: HeartPulse },
  { id: 'harness',   title: 'Harness Inspection',               docNo: 'BMSD/20/FO/HSE/12/25', icon: Shield },
  { id: 'oxigent',   title: 'Oxigent Monthly',                  docNo: 'BMSD/19/FO/HSE/12/25', icon: Cylinder },
  { id: 'scba',      title: 'SCBA Monthly',                     docNo: 'BMSD/21/FO/HSE/12/25', icon: Wind },
  { id: 'spillkit',  title: 'Spill Kit Inspection',             docNo: 'BMSD/15/FO/HSE/12/25', icon: Box },
  { id: 'stretcher', title: 'Stretcher Inspection',             docNo: 'BMSD/14/FO/HSE/12/25', icon: Activity },
];

export default function Dashboard({ onSelectForm }) {
  const { user, token } = useAuth();
  const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('bms_token') : null);

  // Filter Periode Bulan & Tahun dari Global State (PeriodContext)
  const { selectedMonth, setSelectedMonth, selectedYear, setSelectedYear } = usePeriod();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'complete', 'draft', 'incomplete'

  // Data State Dinamis dari Database
  const [rigList, setRigList] = useState([]);
  const [overviewSummary, setOverviewSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'admin' || user?.username === 'admin_besmindo';
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // ── Fetch Data Matriks Rig Dinamis dari Database Backend ──
  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');

    try {
      const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
      
      // Ambil overview matriks dari backend (yang membaca tabel users dan inspections secara dinamis)
      const res = await fetch(
        `${API_BASE_URL}/api/inspections/overview?month=${selectedMonth}&year=${selectedYear}`,
        { headers }
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal memuat matriks inspeksi dari database.');
      }

      setOverviewSummary(data.summary);
      setRigList(data.rigs || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Gagal terhubung ke database. Pastikan server backend MySQL aktif.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedMonth, selectedYear]);

  // ── Perhitungan Metrik Indikator Atas Dinamis ──
  const totalRigs = rigList.length;
  const completedRigs = rigList.filter(r => r.is_complete).length;
  const inProgressRigs = rigList.filter(r => !r.is_complete && (r.draft_count > 0 || r.submitted_count > 0)).length;
  const pendingRigs = totalRigs - completedRigs;
  const totalFormsSubmitted = rigList.reduce((acc, r) => acc + (r.submitted_count || 0), 0);
  const totalFormsExpected = totalRigs * 9;
  const overallPercentage = totalFormsExpected > 0 
    ? Math.round((totalFormsSubmitted / totalFormsExpected) * 100) 
    : 0;

  // ── Filter Pencarian & Status Rig ──
  const filteredRigs = rigList.filter((r) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = r.rig_name.toLowerCase().includes(q);

    if (statusFilter === 'complete') return matchesSearch && r.is_complete;
    if (statusFilter === 'draft') return matchesSearch && !r.is_complete && (r.draft_count > 0);
    if (statusFilter === 'incomplete') return matchesSearch && !r.is_complete;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* ── 1. HEADER UTAMA & FILTER PERIODE ── */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4 transition-colors">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-cyan-300 dark:border dark:border-blue-800">
              {isAdmin ? '👑 Monitoring Eksekutif' : `🏗️ Rig ${user?.rig_name || ''}`}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1.5">
            Dashboard Pemantauan Inspeksi HSE
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Status pemantauan kelengkapan dokumen 9 formulir HSE untuk <strong className="text-slate-700 dark:text-slate-200">{totalRigs} Rig terdaftar</strong> pada periode {monthNames[selectedMonth - 1]} {selectedYear}.
          </p>
        </div>

        <PeriodFilter
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          onRefresh={fetchDashboardData}
          loading={loading}
          isAdmin={isAdmin}
        />
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0" />
            <span className="text-xs font-semibold">{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchDashboardData}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* ── 2. METRIK INDIKATOR ATAS (SEPENUHNYA DINAMIS) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Metric 1: Total Rig Terdaftar = rigList.length */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Rig Terdaftar
              </p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                {totalRigs}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-cyan-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 font-medium">
            Terkoneksi Database MySQL
          </p>
        </div>

        {/* Metric 2: Rig Lengkap 100% */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Rig Lengkap 100%
              </p>
              <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {completedRigs}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 font-medium">
            9 dari 9 form terkirim
          </p>
        </div>

        {/* Metric 3: Ada Draft (Sedang Isi) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Ada Draft (Sedang Isi)
              </p>
              <h3 className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {inProgressRigs}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 font-medium">
            Draft tersimpan belum submit
          </p>
        </div>

        {/* Metric 4: Rig Belum Lengkap */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                Rig Belum Lengkap
              </p>
              <h3 className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-1">
                {pendingRigs}
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 font-medium">
            Masih ada formulir tertunda
          </p>
        </div>

        {/* Metric 5: Total Form Terkirim */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                Total Form Terkirim
              </p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                {totalFormsSubmitted} <span className="text-sm text-slate-400 font-normal">/ {totalFormsExpected}</span>
              </h3>
            </div>
            <div className="p-2.5 rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${overallPercentage}%` }}
            />
          </div>
        </div>

      </div>

      {/* ── 3. FILTER & PENCARIAN RIG ── */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3 transition-colors">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari Rig (misal: BMS 01, BMS 24)..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Semua ({totalRigs})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('complete')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === 'complete'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            ✓ Lengkap ({completedRigs})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('draft')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === 'draft'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            ⏳ Ada Draft ({inProgressRigs})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('incomplete')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === 'incomplete'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            ✗ Belum ({pendingRigs})
          </button>
        </div>
      </div>

      {/* ── 4. MAPPING CARD RIG (SECARA DINAMIS: JIKA ADA 25 RIG, MUNCUL 25 CARD) ── */}
      {loading && rigList.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-slate-200 dark:bg-slate-800/80 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : filteredRigs.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Tidak ada Rig yang sesuai dengan pencarian "{searchQuery}"
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredRigs.map((rig) => {
            const percentage = rig.percentage || (rig.total_forms ? Math.round(((rig.submitted_count || 0) / rig.total_forms) * 100) : 0);

            return (
              <div
                key={rig.rig_name}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-all"
              >
                <div>
                  {/* Header Kartu Rig */}
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-sm">
                        {(rig.rig_name.replace(/^BMS\s*/i, '') || 'R').slice(0, 3)}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                          Rig {rig.rig_name}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {monthNames[selectedMonth - 1]} {selectedYear}
                        </p>
                      </div>
                    </div>

                    {/* Badge Kelengkapan */}
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                      rig.is_complete
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : (rig.draft_count ?? 0) > 0
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                    }`}>
                      {rig.submitted_count ?? 0}/{rig.total_forms ?? 9} ✓
                      {(rig.draft_count ?? 0) > 0 && ` · ${rig.draft_count}⏳`}
                    </span>
                  </div>

                  {/* Progress Bar Persentase */}
                  <div className="my-3">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          rig.is_complete ? 'bg-emerald-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* ── 9 MENU FORMULIR INSPEKSI (STATUS DEFAULT 'BELUM' ATAU DARI DB) ── */}
                  <div className="space-y-1.5 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {FORM_DEFINITIONS.map((def) => {
                      // Cari data form spesifik dari rig.forms (jika ada dari backend)
                      const formRecord = rig.forms?.find(f => f.form_id === def.id);
                      
                      // Status: 'submitted', 'draft', atau default 'not_started' (Belum)
                      const fStatus = formRecord?.status || (formRecord?.is_filled ? 'submitted' : 'not_started');
                      const Icon = def.icon;

                      const rowClass = fStatus === 'submitted'
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200'
                        : fStatus === 'draft'
                          ? 'bg-amber-50/50 dark:bg-amber-950/30 hover:bg-amber-100/60 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-200'
                          : 'bg-slate-50 dark:bg-slate-950/60 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 text-slate-600 dark:text-slate-400';

                      const iconClass = fStatus === 'submitted'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : fStatus === 'draft'
                          ? 'text-amber-500 dark:text-amber-400'
                          : 'text-slate-400';

                      return (
                        <div
                          key={def.id}
                          onClick={() => onSelectForm && onSelectForm({
                            formKey: def.id,
                            rigName: rig.rig_name,
                            month: selectedMonth,
                            year: selectedYear
                          })}
                          className={`flex items-center justify-between p-2 rounded-xl text-xs transition cursor-pointer ${rowClass}`}
                          title={`Buka formulir ${def.title}`}
                        >
                          <div className="flex items-center space-x-2 truncate pr-2">
                            <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${iconClass}`} />
                            <span className="truncate font-semibold">{def.title}</span>
                          </div>

                          <div className="flex items-center space-x-1.5 flex-shrink-0">
                            {fStatus === 'submitted' ? (
                              <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>{formRecord?.last_submitted ? String(formRecord.last_submitted).split('T')[0] : 'Terkirim'}</span>
                              </span>
                            ) : fStatus === 'draft' ? (
                              <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100/50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
                                <Clock className="w-3 h-3" />
                                <span>Draft</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-100/50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded">
                                <XCircle className="w-3 h-3" />
                                <span>Belum</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Kartu Rig */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-[11px] text-slate-500 font-medium">
                    {rig.is_complete
                      ? '✓ 9 Formulir Lengkap'
                      : `${(rig.total_forms || 9) - (rig.submitted_count || 0)} formulir belum selesai`}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectForm && onSelectForm({
                      formKey: 'apar',
                      rigName: rig.rig_name,
                      month: selectedMonth,
                      year: selectedYear
                    })}
                    className="text-blue-600 dark:text-cyan-400 font-bold hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Buka Inspeksi</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
