import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  ShieldAlert, 
  Eye, 
  HeartPulse, 
  Shield, 
  Cylinder, 
  Wind, 
  Box, 
  Activity, 
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  Search,
  Filter,
  RefreshCw,
  Building2,
  FileCheck2,
  Clock,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usePeriod } from '../context/PeriodContext';
import PeriodFilter from './PeriodFilter';
import { MONTH_NAMES, API_BASE_URL } from '../constants/periodConstants';

// ── 9 FORMULIR STANDAR INSPEKSI HSE ─────────────────────────────
export const DEFAULT_FORMS = [
  { form_id: 'apar',      title: 'APAR Inspection Form',                 doc_no: 'BMSD/13/FO/HSE/12/25' },
  { form_id: 'apd',       title: 'APD / PPE Inspection Form',             doc_no: 'BMSD/22/FO/HSE/01/26' },
  { form_id: 'eyewash',   title: 'Eye Wash & Shower Inspection Form',     doc_no: 'BMSD/44/FO/HSE/12/25' },
  { form_id: 'firstaid',  title: 'First Aid Box Form',                    doc_no: 'BMSD/46/FO/HSE/04/25' },
  { form_id: 'harness',   title: 'Harness Inspection Form',               doc_no: 'BMSD/17/FO/HSE/08/26' },
  { form_id: 'oxigent',   title: 'Oxigent Monthly Form',                  doc_no: 'BMSD/47/FO/HSE/08/21' },
  { form_id: 'scba',      title: 'SCBA Monthly Form',                     doc_no: 'BMSD/43/FO/HSE/06/25' },
  { form_id: 'spillkit',  title: 'Spill Kit Inspection Form',             doc_no: 'BMSD/48/FO/HSE/09/21' },
  { form_id: 'stretcher', title: 'Stretcher Inspection Form',             doc_no: 'BMSD/45/FO/HSE/06/20' },
];

export default function DashboardOverview({ onSelectForm }) {
  const { user, token } = useAuth();
  const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('bms_token') : null);
  const { isDark } = useTheme();

  // Filter Periode Bulan & Tahun dari Global State (PeriodContext)
  const { selectedMonth, setSelectedMonth, selectedYear, setSelectedYear, period } = usePeriod();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'complete', 'draft', 'incomplete'

  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState(null);
  const [rigData, setRigData] = useState(null);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'admin';
  const userRigName = user?.rig_name || user?.rig_no || user?.rig || (user?.username?.toUpperCase?.()?.includes('BMS') ? user.username.toUpperCase() : 'BMS 01');

  // Ikon Map untuk 9 Form
  const iconMap = {
    apar: Flame,
    apd: ShieldAlert,
    eyewash: Eye,
    firstaid: HeartPulse,
    harness: Shield,
    oxigent: Cylinder,
    scba: Wind,
    spillkit: Box,
    stretcher: Activity
  };

  // Warna Aksen untuk Form
  const colorMap = {
    apar: 'text-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-400',
    apd: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400',
    eyewash: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/50 dark:text-cyan-400',
    firstaid: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400',
    harness: 'text-purple-600 bg-purple-50 dark:bg-purple-950/50 dark:text-purple-400',
    oxigent: 'text-sky-600 bg-sky-50 dark:bg-sky-950/50 dark:text-sky-400',
    scba: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 dark:text-indigo-400',
    spillkit: 'text-teal-600 bg-teal-50 dark:bg-teal-950/50 dark:text-teal-400',
    stretcher: 'text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400'
  };

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const fetchOverview = async () => {
    setLoading(true);
    setError('');

    try {
      const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
      const monthStr = String(selectedMonth).padStart(2, '0');
      const queryParams = `month=${selectedMonth}&year=${selectedYear}&period=${selectedYear}-${monthStr}`;

      if (isAdmin) {
        // Fetch Matriks Semua Rig untuk Admin
        const res = await fetch(`${API_BASE_URL}/api/inspections/overview?${queryParams}`, { headers });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Gagal memuat data matriks inspeksi.');
        setOverviewData(data);
      } else {
        // Fetch Status Rig Karyawan Spesifik
        const res = await fetch(`${API_BASE_URL}/api/inspections/overview/${encodeURIComponent(userRigName)}?${queryParams}`, { headers });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Gagal memuat data inspeksi Rig.');
        setRigData(data.rig_overview || null);
      }
    } catch (err) {
      console.error('Error fetching overview:', err);
      setError(err.message || 'Gagal terhubung ke backend BMS HSE. Pastikan server Node.js dan MySQL aktif.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [selectedMonth, selectedYear, isAdmin, userRigName]);

  // Filter Rigs untuk Admin
  const filteredRigs = (overviewData?.rigs || []).filter((r) => {
    const matchesSearch = (r?.rig_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (statusFilter === 'complete') return matchesSearch && r.is_complete;
    if (statusFilter === 'draft') return matchesSearch && !r.is_complete && (r.draft_count > 0);
    if (statusFilter === 'incomplete') return matchesSearch && !r.is_complete;
    return matchesSearch;
  });

  // Metrik aman Rig Karyawan dengan fallback dan optional chaining
  const submittedCount = rigData?.submitted_count ?? rigData?.filled_count ?? 0;
  const draftCount = rigData?.draft_count ?? 0;
  const totalForms = rigData?.total_forms ?? 9;
  const notStartedCount = rigData?.not_started_count ?? Math.max(0, totalForms - submittedCount - draftCount);
  const percentage = rigData?.percentage ?? (totalForms > 0 ? Math.round((submittedCount / totalForms) * 100) : 0);

  // Daftar 9 formulir aman: gunakan data dari backend jika ada, fallback ke DEFAULT_FORMS
  const safeFormsList = (rigData?.forms && Array.isArray(rigData.forms) && rigData.forms.length > 0)
    ? rigData.forms.map(form => ({
        ...form,
        form_id: form?.form_id || form?.id,
        title: form?.title || DEFAULT_FORMS.find(d => d.form_id === (form?.form_id || form?.id))?.title || 'Formulir HSE',
        doc_no: form?.doc_no || form?.docNo || DEFAULT_FORMS.find(d => d.form_id === (form?.form_id || form?.id))?.doc_no || '-',
        status: form?.status || (form?.is_filled ? 'submitted' : (form?.is_draft ? 'draft' : 'not_started')),
        last_submitted: form?.last_submitted || null,
        hfo_name: form?.hfo_name || null
      }))
    : DEFAULT_FORMS.map(def => ({
        ...def,
        status: 'not_started',
        is_filled: false,
        is_draft: false,
        last_submitted: null,
        submission_id: null,
        hfo_name: null
      }));

  // Kondisi Kosong (Empty State): belum ada formulir terkirim maupun draft pada periode terpilih
  const isRigDataEmpty = (submittedCount === 0 && draftCount === 0);

  return (
    <div className="space-y-6 transition-colors duration-200">
      
      {/* Header Banner Utama */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4 transition-colors">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-cyan-300 dark:border dark:border-blue-800">
              {isAdmin ? 'Portal Administrator' : `Rig ${userRigName}`}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1.5">
            Selamat Datang, {user?.name || user?.username}!
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {isAdmin 
              ? `Monitoring kelengkapan inspeksi bulanan seluruh ${overviewData?.summary?.total_rigs || 'seluruh'} Rig aktif PT. Besmindo Materi Sewatama.`
              : `Status kepatuhan pemeriksaan keselamatan untuk periode ${monthNames[selectedMonth - 1]} ${selectedYear}.`}
          </p>
        </div>

        {/* Filter Bulan & Tahun */}
        <PeriodFilter
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          onRefresh={fetchOverview}
          loading={loading}
          isAdmin={isAdmin}
        />
      </div>

      {/* Error Banner with Retry Button */}
      {error && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start sm:items-center space-x-3">
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-rose-700 dark:text-rose-300">Kendala Koneksi Server</p>
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchOverview}
            disabled={loading}
            className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Coba Hubungkan Kembali</span>
          </button>
        </div>
      )}

      {/* Loading Skeleton / Fetching Indicator */}
      {loading && !rigData && !overviewData && (
        <div className="space-y-6">
          <div className="h-44 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl border border-slate-700/50 shadow-xl shadow-slate-900/20 flex flex-col justify-center items-center text-center">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mb-2" />
            <p className="text-base font-bold text-white">Memuat Data Inspeksi Rig {userRigName}...</p>
            <p className="text-xs text-slate-300 mt-1">Periode pemeriksaan: {monthNames[selectedMonth - 1]} {selectedYear}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-40 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm animate-pulse"></div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAMPILAN 1: DASHBOARD KARYAWAN (PER RIG SPESIFIK) */}
      {/* ======================================================== */}
      {!isAdmin && (
        <div className="space-y-6">
          
          {/* Kartu Ringkasan Progres Rig */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl border border-slate-700/50 shadow-xl shadow-slate-900/20 relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-start lg:items-center gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <p className="text-xs uppercase font-extrabold tracking-widest text-cyan-400">
                    Ringkasan Kepatuhan Rig {userRigName}
                  </p>
                  {isRigDataEmpty && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      Belum ada data inspeksi
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-black mt-1">
                  {isRigDataEmpty ? (
                    <span className="text-amber-300">Belum ada data inspeksi</span>
                  ) : (
                    `${submittedCount} dari ${totalForms} Form Terkirim`
                  )}
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Periode pemeriksaan: <span className="font-bold text-white">{monthNames[selectedMonth - 1]} {selectedYear}</span>
                  {isRigDataEmpty && (
                    <span className="text-slate-400"> — Seluruh 9 formulir pemeriksaan belum diisi</span>
                  )}
                </p>
              </div>

              {/* Status Pills */}
              <div className="flex flex-wrap gap-2">
                {isRigDataEmpty ? (
                  <div className="px-3 py-1.5 rounded-xl text-xs font-black flex items-center space-x-1.5 bg-slate-800/90 text-amber-300 border border-amber-500/30">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Belum ada data inspeksi</span>
                  </div>
                ) : (
                  <div className="px-3 py-1.5 rounded-xl text-xs font-black flex items-center space-x-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{submittedCount} Terkirim</span>
                  </div>
                )}
                {draftCount > 0 && (
                  <div className="px-3 py-1.5 rounded-xl text-xs font-black flex items-center space-x-1.5 bg-amber-500/20 text-amber-300 border border-amber-400/40">
                    <Clock className="w-4 h-4" />
                    <span>{draftCount} Draft</span>
                  </div>
                )}
                <div className="px-3 py-1.5 rounded-xl text-xs font-black flex items-center space-x-1.5 bg-rose-500/20 text-rose-300 border border-rose-400/40">
                  <XCircle className="w-4 h-4" />
                  <span>{notStartedCount} Belum Diisi</span>
                </div>
              </div>
            </div>

            {/* Banner Penanganan Empty State */}
            {isRigDataEmpty && (
              <div className="mt-4 p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs flex items-start sm:items-center space-x-3 relative z-10">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <p className="font-bold text-white">Belum ada data inspeksi</p>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Data inspeksi untuk Rig {userRigName} pada bulan {monthNames[selectedMonth - 1]} {selectedYear} belum tersedia. Silakan klik tombol "Isi Sekarang" pada formulir di bawah ini untuk memulai pengisian.
                  </p>
                </div>
              </div>
            )}

            {/* Progress Bar Persentase */}
            <div className="mt-5 relative z-10">
              <div className="flex justify-between text-xs font-bold text-slate-300 mb-1.5">
                <span>Kelengkapan Dokumen ({submittedCount}/{totalForms} Form)</span>
                <span className="text-cyan-400 font-mono text-sm">{percentage}%</span>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-3 p-0.5 border border-slate-700/60">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ${
                    percentage === 100 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]' 
                      : percentage > 0
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_10px_rgba(37,99,235,0.4)]'
                        : 'bg-slate-700'
                  }`}
                  style={{ width: `${Math.max(percentage, isRigDataEmpty ? 0 : 5)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Grid 9 Formulir Inspeksi */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center space-x-2">
                <FileCheck2 className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
                <span>Status 9 Formulir Pemeriksaan Bulanan</span>
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Klik kartu untuk membuka formulir
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {safeFormsList.map((form) => {
                const Icon = iconMap[form?.form_id] || FileCheck2;
                // 3-color status: use form.status if available, fallback to is_filled
                const status = form?.status || (form?.is_filled ? 'submitted' : (form?.is_draft ? 'draft' : 'not_started'));

                return (
                  <div
                    key={form?.form_id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-slate-200/70 dark:hover:border-slate-700 dark:hover:shadow-2xl dark:hover:shadow-slate-950/80 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group overflow-hidden"
                  >
                    {/* Area Konten Utama */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Header Kartu Form */}
                        <div className="flex justify-between items-start mb-3.5">
                          {/* Ikon Form dengan container lembut */}
                          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/80 shadow-xs">
                            <Icon className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
                          </div>

                          {/* Status Badge — 3 warna (Clean & Luminous di Dark Mode) */}
                          {status === 'submitted' ? (
                            <span className="inline-flex items-center space-x-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/25">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>TERKIRIM</span>
                            </span>
                          ) : status === 'draft' ? (
                            <span className="inline-flex items-center space-x-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/25">
                              <Clock className="w-3.5 h-3.5" />
                              <span>DRAFT</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/25">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>BELUM DIISI</span>
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-colors">
                          {form?.title || 'Formulir Inspeksi'}
                        </h4>
                        <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                          {form?.doc_no || '-'}
                        </p>
                      </div>

                      {/* Info Pengisian Metadata */}
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
                        {status === 'submitted' ? (
                          <div className="space-y-1 text-slate-600 dark:text-slate-300">
                            <div className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Tgl: {form?.last_submitted ? String(form.last_submitted).split('T')[0] : '-'}</span>
                            </div>
                            {form?.hfo_name && (
                              <p className="truncate text-slate-400 dark:text-slate-500">
                                Oleh: <span className="font-medium text-slate-600 dark:text-slate-300">{form.hfo_name}</span>
                              </p>
                            )}
                          </div>
                        ) : status === 'draft' ? (
                          <p className="text-amber-600 dark:text-amber-400 font-semibold flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Draft tersimpan — belum dikirim</span>
                          </p>
                        ) : (
                          <p className="text-slate-400 dark:text-slate-500 text-xs flex items-center space-x-1">
                            <span>Belum ada data inspeksi tersimpan</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Tombol Aksi Full-Width Bawah (Tegas di Light Mode, Luminous Elegan di Dark Mode) */}
                    <button
                      type="button"
                      onClick={() => onSelectForm({ formKey: form?.form_id, rigName: userRigName, month: selectedMonth, year: selectedYear })}
                      className={`w-full py-3.5 text-[13px] font-bold flex justify-center items-center gap-2 transition-all duration-300 rounded-b-2xl cursor-pointer ${
                        status === 'submitted'
                          ? 'bg-emerald-100/90 text-emerald-800 border-t border-emerald-200/90 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 group-hover:shadow-md dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-t dark:border-emerald-500/25 dark:group-hover:bg-emerald-500/25 dark:group-hover:text-emerald-200 dark:group-hover:border-emerald-400/40 dark:group-hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                          : status === 'draft'
                            ? 'bg-amber-100/90 text-amber-900 border-t border-amber-200/90 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500 group-hover:shadow-md dark:bg-amber-500/10 dark:text-amber-400 dark:border-t dark:border-amber-500/25 dark:group-hover:bg-amber-500/25 dark:group-hover:text-amber-200 dark:group-hover:border-amber-400/40 dark:group-hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                            : 'bg-rose-100/90 text-rose-800 border-t border-rose-200/90 group-hover:bg-rose-600 group-hover:text-white group-hover:border-rose-600 group-hover:shadow-md dark:bg-rose-500/10 dark:text-rose-400 dark:border-t dark:border-rose-500/25 dark:group-hover:bg-rose-500/25 dark:group-hover:text-rose-200 dark:group-hover:border-rose-400/40 dark:group-hover:shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                      }`}
                    >
                      <span>{status === 'submitted' ? 'Lihat / Ekspor' : status === 'draft' ? 'Lanjut Isi Draft' : 'Isi Sekarang'}</span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* TAMPILAN 2: DASHBOARD ADMIN (MATRIKS SELURUH 20 RIG) */}
      {/* ======================================================== */}
      {isAdmin && overviewData && (
        <div className="space-y-6">
          
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            
            {/* Card 1: Total Rig Aktif */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Total Rig Terdaftar
                  </p>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                    {overviewData.summary.total_rigs}
                  </h3>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-cyan-400">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3">
                {overviewData.summary.total_rigs} Rig Operasional Aktif
              </p>
            </div>

            {/* Card 2: Rig Lengkap 100% */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Rig Lengkap 100%
                  </p>
                  <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    {overviewData.summary.completed_rigs}
                  </h3>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3">
                Telah mengisi 9 dari 9 form
              </p>
            </div>

            {/* Card 3: Rig Ada Draft */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    Ada Draft (Sedang Isi)
                  </p>
                  <h3 className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">
                    {overviewData.summary.in_progress_rigs ?? 0}
                  </h3>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3">
                Rig dengan form belum di-submit
              </p>
            </div>

            {/* Card 4: Rig Belum Lengkap / Menunggak */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                    Rig Belum Lengkap
                  </p>
                  <h3 className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-1">
                    {overviewData.summary.pending_rigs}
                  </h3>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                  <XCircle className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3">
                Masih memiliki formulir tertunda
              </p>
            </div>

            {/* Card 5: Total Form Terkirim */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                    Total Form Terkirim
                  </p>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                    {overviewData.summary.total_forms_submitted ?? overviewData.summary.total_forms_filled} <span className="text-sm text-slate-400 font-normal">/ {overviewData.summary.total_forms_expected}</span>
                  </h3>
                </div>
                <div className="p-2.5 rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400">
                  <FileCheck2 className="w-5 h-5" />
                </div>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full"
                  style={{ width: `${overviewData.summary.overall_percentage}%` }}
                />
              </div>
            </div>

          </div>

          {/* Filter Bar & Pencarian Rig */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3 transition-colors">
            
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Rig (misal: BMS 03)..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filter Tabs */}
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
                Semua ({overviewData.summary.total_rigs})
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
                ✓ Lengkap ({overviewData.summary.completed_rigs})
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
                ⏳ Ada Draft ({overviewData.summary.in_progress_rigs ?? 0})
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
                ✗ Belum ({overviewData.summary.pending_rigs})
              </button>
            </div>
          </div>

          {/* Matriks Kartu Rig (BMS 01 - BMS 23) */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {(filteredRigs || []).map((rig) => (
              <div
                key={rig?.rig_name}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-all"
              >
                <div>
                  {/* Header Kartu Rig */}
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-sm">
                        {(rig?.rig_name || '').replace('BMS ', '')}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                          Rig {rig?.rig_name}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {monthNames[selectedMonth - 1]} {selectedYear}
                        </p>
                      </div>
                    </div>

                    {/* Badge Kelengkapan — 3 status */}
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                      rig?.is_complete
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : (rig?.draft_count ?? 0) > 0
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                    }`}>
                      {rig?.submitted_count ?? rig?.filled_count ?? 0}/{rig?.total_forms ?? 9} ✓
                      {(rig?.draft_count ?? 0) > 0 && ` · ${rig.draft_count}⏳`}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="my-3">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          rig?.is_complete ? 'bg-emerald-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${rig?.percentage ?? 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Daftar 9 Form Status Pills — 3 warna */}
                  <div className="space-y-1.5 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {(rig?.forms || []).map((form) => {
                      const Icon = iconMap[form?.form_id] || FileCheck2;
                      const fStatus = form?.status || (form?.is_filled ? 'submitted' : (form?.is_draft ? 'draft' : 'not_started'));
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
                          key={form?.form_id}
                          onClick={() => onSelectForm({ formKey: form?.form_id, rigName: rig?.rig_name, month: selectedMonth, year: selectedYear })}
                          className={`flex items-center justify-between p-2 rounded-xl text-xs transition cursor-pointer ${rowClass}`}
                          title={`Buka formulir ${form?.title || 'Inspeksi'}`}
                        >
                          <div className="flex items-center space-x-2 truncate pr-2">
                            <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${iconClass}`} />
                            <span className="truncate font-semibold">{form?.title || 'Formulir HSE'}</span>
                          </div>

                          <div className="flex items-center space-x-1.5 flex-shrink-0">
                            {fStatus === 'submitted' ? (
                              <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>{form?.last_submitted ? String(form.last_submitted).split('T')[0] : '✓'}</span>
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
                    {rig?.is_complete
                      ? '✓ Semua form beres'
                      : `${rig?.not_started_count ?? ((rig?.total_forms ?? 9) - (rig?.filled_count ?? 0))} form perlu diisi`}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectForm({ formKey: 'apar', rigName: rig?.rig_name, month: selectedMonth, year: selectedYear })}
                    className="text-blue-600 dark:text-cyan-400 font-bold hover:underline flex items-center space-x-1"
                  >
                    <span>Buka Inspeksi</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {(!filteredRigs || filteredRigs.length === 0) && (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {searchQuery ? `Tidak ada Rig yang sesuai dengan pencarian "${searchQuery}"` : `Belum ada data inspeksi untuk periode ${monthNames[selectedMonth - 1]} ${selectedYear}`}
              </p>
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                className="mt-3 text-xs text-blue-600 dark:text-cyan-400 font-bold hover:underline"
              >
                Reset Filter Pencarian
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  );
}