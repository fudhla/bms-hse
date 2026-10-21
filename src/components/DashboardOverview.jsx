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
import PeriodFilter from './PeriodFilter';
import { MONTH_NAMES, API_BASE_URL } from '../constants/periodConstants';

export default function DashboardOverview({ onSelectForm }) {
  const { user, token } = useAuth();
  const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('bms_token') : null);
  const { isDark } = useTheme();

  // Filter Periode Bulan & Tahun
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'complete', 'draft', 'incomplete'

  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState(null);
  const [rigData, setRigData] = useState(null);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'admin';
  const userRigName = user?.rig_name || 'BMS 01';

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

      if (isAdmin) {
        // Fetch Matriks Semua Rig untuk Admin
        const res = await fetch(`${API_BASE_URL}/api/inspections/overview?month=${selectedMonth}&year=${selectedYear}`, { headers });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Gagal memuat data matriks inspeksi.');
        setOverviewData(data);
      } else {
        // Fetch Status Rig Karyawan Spesifik
        const res = await fetch(`${API_BASE_URL}/api/inspections/overview/${encodeURIComponent(userRigName)}?month=${selectedMonth}&year=${selectedYear}`, { headers });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || 'Gagal memuat data inspeksi Rig.');
        setRigData(data.rig_overview);
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
    const matchesSearch = r.rig_name.toLowerCase().includes(searchQuery.toLowerCase());
    if (statusFilter === 'complete') return matchesSearch && r.is_complete;
    if (statusFilter === 'draft') return matchesSearch && !r.is_complete && (r.draft_count > 0);
    if (statusFilter === 'incomplete') return matchesSearch && !r.is_complete;
    return matchesSearch;
  });

  return (
    <div className="space-y-6 transition-colors duration-200">
      
      {/* Header Banner Utama */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4 transition-colors">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-cyan-300 dark:border dark:border-blue-800">
              {isAdmin ? '👑 Portal Administrator' : `🏗️ Rig ${userRigName}`}
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

      {/* Loading Skeleton Pulse */}
      {loading && !rigData && !overviewData && (
        <div className="space-y-6 animate-pulse">
          <div className="h-44 bg-slate-200 dark:bg-slate-800/80 rounded-2xl border border-slate-300 dark:border-slate-700/50"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-40 bg-slate-200 dark:bg-slate-800/80 rounded-2xl border border-slate-300 dark:border-slate-700/50"></div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAMPILAN 1: DASHBOARD KARYAWAN (PER RIG SPESIFIK) */}
      {/* ======================================================== */}
      {!isAdmin && rigData && (
        <div className="space-y-6">
          
          {/* Kartu Ringkasan Progres Rig */}
          <div className="bg-gradient-to-br from-blue-900 via-slate-900 to-slate-950 text-white p-6 rounded-2xl shadow-lg border border-blue-800/40 relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <p className="text-xs uppercase font-extrabold tracking-widest text-cyan-400">
                  Ringkasan Kepatuhan Rig {userRigName}
                </p>
                <h2 className="text-2xl font-black mt-1">
                  {rigData.submitted_count ?? rigData.filled_count} dari {rigData.total_forms} Form Terkirim
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Periode pemeriksaan: <span className="font-bold text-white">{monthNames[selectedMonth - 1]} {selectedYear}</span>
                </p>
              </div>

              {/* Status Pills */}
              <div className="flex flex-wrap gap-2">
                <div className="px-3 py-1.5 rounded-xl text-xs font-black flex items-center space-x-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{rigData.submitted_count ?? rigData.filled_count} Terkirim</span>
                </div>
                {(rigData.draft_count ?? 0) > 0 && (
                  <div className="px-3 py-1.5 rounded-xl text-xs font-black flex items-center space-x-1.5 bg-amber-500/20 text-amber-300 border border-amber-400/40">
                    <Clock className="w-4 h-4" />
                    <span>{rigData.draft_count} Draft</span>
                  </div>
                )}
                {(rigData.not_started_count ?? (rigData.total_forms - rigData.filled_count)) > 0 && (
                  <div className="px-3 py-1.5 rounded-xl text-xs font-black flex items-center space-x-1.5 bg-rose-500/20 text-rose-300 border border-rose-400/40">
                    <XCircle className="w-4 h-4" />
                    <span>{rigData.not_started_count ?? (rigData.total_forms - rigData.filled_count)} Belum</span>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar Persentase */}
            <div className="mt-5 relative z-10">
              <div className="flex justify-between text-xs font-bold text-slate-300 mb-1.5">
                <span>Kelengkapan Dokumen</span>
                <span className="text-cyan-400 font-mono text-sm">{rigData.percentage}%</span>
              </div>
              <div className="w-full bg-slate-800/90 rounded-full h-3 p-0.5 border border-slate-700">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ${
                    rigData.percentage === 100 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                      : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                  }`}
                  style={{ width: `${Math.max(rigData.percentage, 5)}%` }}
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
              {rigData.forms.map((form) => {
                const Icon = iconMap[form.form_id] || FileCheck2;
                const accentColor = colorMap[form.form_id] || 'text-blue-600 bg-blue-50';
                // 3-color status: use form.status if available, fallback to is_filled
                const status = form.status || (form.is_filled ? 'submitted' : 'not_started');

                const borderClass = status === 'submitted'
                  ? 'border-emerald-200 dark:border-emerald-900/60 hover:border-emerald-400'
                  : status === 'draft'
                    ? 'border-amber-200 dark:border-amber-900/60 hover:border-amber-400'
                    : 'border-rose-200 dark:border-rose-900/60 hover:border-rose-400';

                return (
                  <div
                    key={form.form_id}
                    className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border transition-all duration-200 shadow-sm flex flex-col justify-between group hover:shadow-md ${borderClass}`}
                  >
                    <div>
                      {/* Header Kartu Form */}
                      <div className="flex justify-between items-start mb-3">
                        <div className={`p-2.5 rounded-xl ${accentColor}`}>
                          <Icon className="w-5 h-5" />
                        </div>

                        {/* Status Badge — 3 warna */}
                        {status === 'submitted' ? (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>TERKIRIM</span>
                          </span>
                        ) : status === 'draft' ? (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <Clock className="w-3.5 h-3.5" />
                            <span>DRAFT</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-black px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>BELUM DIISI</span>
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                        {form.title}
                      </h4>
                      <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                        {form.doc_no}
                      </p>

                      {/* Info Pengisian */}
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                        {status === 'submitted' ? (
                          <div className="space-y-1 text-slate-600 dark:text-slate-300">
                            <div className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Tgl: {form.last_submitted ? String(form.last_submitted).split('T')[0] : '-'}</span>
                            </div>
                            {form.hfo_name && (
                              <p className="truncate text-slate-500 dark:text-slate-400">
                                Oleh: <span className="font-medium text-slate-700 dark:text-slate-200">{form.hfo_name}</span>
                              </p>
                            )}
                          </div>
                        ) : status === 'draft' ? (
                          <p className="text-amber-600 dark:text-amber-400 font-semibold flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Draft tersimpan — belum dikirim</span>
                          </p>
                        ) : (
                          <p className="text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center space-x-1">
                            <span>Formulir wajib diisi bulan ini!</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Tombol Aksi */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => onSelectForm({ formKey: form.form_id, rigName: userRigName, month: selectedMonth, year: selectedYear })}
                        className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-sm ${
                          status === 'submitted'
                            ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                            : status === 'draft'
                              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30'
                              : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30'
                        }`}
                      >
                        <span>{status === 'submitted' ? 'Lihat / Ekspor' : status === 'draft' ? 'Lanjut Isi Draft' : 'Isi Sekarang'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
            {filteredRigs.map((rig) => (
              <div
                key={rig.rig_name}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-all"
              >
                <div>
                  {/* Header Kartu Rig */}
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-sm">
                        {rig.rig_name.replace('BMS ', '')}
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

                    {/* Badge Kelengkapan — 3 status */}
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                      rig.is_complete
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : (rig.draft_count ?? 0) > 0
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                    }`}>
                      {rig.submitted_count ?? rig.filled_count}/{rig.total_forms} ✓
                      {(rig.draft_count ?? 0) > 0 && ` · ${rig.draft_count}⏳`}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="my-3">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          rig.is_complete ? 'bg-emerald-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${rig.percentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Daftar 9 Form Status Pills — 3 warna */}
                  <div className="space-y-1.5 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {rig.forms.map((form) => {
                      const Icon = iconMap[form.form_id] || FileCheck2;
                      const fStatus = form.status || (form.is_filled ? 'submitted' : 'not_started');
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
                          key={form.form_id}
                          onClick={() => onSelectForm({ formKey: form.form_id, rigName: rig.rig_name, month: selectedMonth, year: selectedYear })}
                          className={`flex items-center justify-between p-2 rounded-xl text-xs transition cursor-pointer ${rowClass}`}
                          title={`Buka formulir ${form.title}`}
                        >
                          <div className="flex items-center space-x-2 truncate pr-2">
                            <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${iconClass}`} />
                            <span className="truncate font-semibold">{form.title}</span>
                          </div>

                          <div className="flex items-center space-x-1.5 flex-shrink-0">
                            {fStatus === 'submitted' ? (
                              <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>{form.last_submitted ? String(form.last_submitted).split('T')[0] : '✓'}</span>
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
                      ? '✓ Semua form beres'
                      : `${rig.not_started_count ?? (rig.total_forms - rig.filled_count)} form perlu diisi`}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectForm({ formKey: 'apar', rigName: rig.rig_name, month: selectedMonth, year: selectedYear })}
                    className="text-blue-600 dark:text-cyan-400 font-bold hover:underline flex items-center space-x-1"
                  >
                    <span>Buka Inspeksi</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredRigs.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Tidak ada Rig yang sesuai dengan pencarian "{searchQuery}"
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