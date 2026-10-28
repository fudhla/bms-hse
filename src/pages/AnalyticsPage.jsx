import { useState, useEffect } from 'react';
import {
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Trophy,
  Crown,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function formatPeriodToLabel(periodStr) {
  if (!periodStr || !periodStr.includes('-')) return periodStr || '';
  const [y, m] = periodStr.split('-');
  const mIndex = parseInt(m, 10) - 1;
  return `${MONTH_NAMES[mIndex] || m} ${y}`;
}

export default function AnalyticsPage() {
  // State untuk filter periode bulan interaktif (Format ISO YYYY-MM)
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`; // Default "2026-10" sesuai bulan & tahun aktif
  });

  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch data analytics riil dari backend setiap kali selectedPeriod berubah
  useEffect(() => {
    let isMounted = true;
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/analytics?period=${selectedPeriod}`);
        const json = await res.json();
        if (isMounted && json.success && json.data) {
          setAnalyticsData(json.data);
        }
      } catch (err) {
        console.warn('Gagal memuat data analitik:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAnalytics();
    return () => { isMounted = false; };
  }, [selectedPeriod]);

  // Ekstraksi nilai metrik dari analyticsData dengan nilai default yang aman
  const periodLabel = analyticsData?.periodLabel || formatPeriodToLabel(selectedPeriod);
  const totalFormulir = analyticsData?.totalWajib ?? 180;
  const selesaiCount = analyticsData?.submittedCount ?? 0;
  const sisaFormulir = analyticsData?.pendingCount ?? Math.max(0, totalFormulir - selesaiCount);
  const percentageCompleted = analyticsData?.percentageCompleted ?? 0;
  const temuanRusak = analyticsData?.temuanRusakCount ?? 0;
  const disciplinedRig = analyticsData?.disciplinedRig ?? { rig: 'BMS 01', description: 'Memuat data...' };

  const completionData = analyticsData?.completionData || [
    { name: 'Selesai (Submitted)', value: selesaiCount, color: '#10B981' },
    { name: 'Belum Selesai (Pending/Draft)', value: sisaFormulir, color: '#94A3B8' }
  ];

  const topPerformers = analyticsData?.topPerformers || [];
  const topDefectRigs = analyticsData?.topDefectRigs || [];
  const weeklyTrends = analyticsData?.weeklyTrends || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── HEADER HALAMAN & FILTER BULAN (MONTH PICKER) ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Executive Dashboard &amp; Intelligence</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Analitik &amp; Grafik HSE
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
              Visualisasi metrik kepatuhan inspeksi keselamatan, rasio penyelesaian dokumen per Rig, dan tren temuan defek peralatan kerja untuk <strong className="text-slate-800 dark:text-slate-200 font-bold">{periodLabel}</strong>.
            </p>
          </div>

          {/* ── INTERACTIVE MONTH PICKER INPUT ── */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <div className="flex items-center gap-2">
              <input
                id="period-month-picker"
                type="month"
                value={selectedPeriod}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedPeriod(e.target.value);
                  }
                }}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg px-4 py-2 cursor-pointer hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-blue-400 shadow-xs"
                title="Pilih Bulan & Tahun Periode Analitik"
              />
            </div>
            {loading && (
              <RefreshCw className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" title="Memuat data periode..." />
            )}
          </div>
        </div>

        {/* ── 4 KARTU KPI METRIC (TERHUBUNG KE DATA BACKEND) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 transition-all">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>Tingkat Kepatuhan</span>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {percentageCompleted}%
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {selesaiCount} dari {totalFormulir} form selesai
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 transition-all">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>Formulir Terverifikasi</span>
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {selesaiCount} Unit
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Status final dikunci &amp; TTD
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 transition-all">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>Temuan Alat Rusak</span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
              {temuanRusak} Poin
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {temuanRusak > 0 ? 'Butuh tindakan perbaikan' : 'Semua peralatan prima'}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 transition-all">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>Rig Terdisiplin</span>
              <TrendingUp className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1 truncate">
              {disciplinedRig.rig}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {disciplinedRig.description}
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW 3 KOLOM: PIE CHART (KIRI), TOP 3 HFO (TENGAH), BAR CHART (KANAN) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── KARTU 1: PIE CHART (Persentase Total Inspeksi - Kiri) ── */}
        <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <PieIcon className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Persentase Total Inspeksi
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Selesai vs Belum Selesai ({periodLabel})
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-1 rounded-md">
                {percentageCompleted}% Tercapai
              </span>
            </div>

            {/* Area Visualisasi Pie Chart */}
            <div className="h-60 sm:h-64 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={completionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {completionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#f8fafc',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}
                    formatter={(value, name) => [`${value} Formulir (${totalFormulir > 0 ? Math.round((value / totalFormulir) * 100) : 0}%)`, name]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 mt-2 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Total Wajib: {totalFormulir} Form</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Sisa {sisaFormulir} Form
            </span>
          </div>
        </div>

        {/* ── KARTU 2: TOP 3 HFO PERFORMERS (Tengah) ── */}
        <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-500 dark:text-cyan-400">
                  <Trophy className="w-4 h-4 text-blue-500 dark:text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-semibold text-slate-700 dark:text-white">
                    Top 3 HFO Teraktif
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Penyelesaian formulir {periodLabel}
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200/60 dark:border-slate-700/60">
                Top 3
              </span>
            </div>

            {/* List 3 Baris Rapi & Minimalis */}
            {topPerformers.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 mt-2">
                {topPerformers.map((item, index) => {
                  const rankStyles = [
                    {
                      avatar: 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-400 ring-offset-2 dark:bg-yellow-950/60 dark:text-yellow-300 dark:ring-yellow-500 dark:ring-offset-slate-900',
                      isFirst: true
                    },
                    {
                      avatar: 'bg-slate-100 text-slate-700 ring-2 ring-slate-300 ring-offset-2 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-600 dark:ring-offset-slate-900',
                      isFirst: false
                    },
                    {
                      avatar: 'bg-orange-50 text-orange-700 ring-2 ring-orange-300 ring-offset-2 dark:bg-orange-950/60 dark:text-orange-300 dark:ring-orange-500 dark:ring-offset-slate-900',
                      isFirst: false
                    }
                  ][index] || {
                    avatar: 'bg-blue-100 text-blue-600 ring-2 ring-blue-300 ring-offset-2 dark:bg-blue-950/60 dark:text-cyan-400 dark:ring-blue-500 dark:ring-offset-slate-900',
                    isFirst: false
                  };

                  return (
                    <div
                      key={`${item.name}-${index}`}
                      className="flex items-center justify-between p-2 -mx-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200 cursor-default rounded-xl"
                    >
                      {/* Sisi Kiri: Avatar Inisial & Nama / Rig */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-full ${rankStyles.avatar} font-bold text-xs flex items-center justify-center flex-shrink-0 transition-transform duration-200`}>
                          {getInitials(item.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className={`text-sm truncate ${rankStyles.isFirst ? 'font-bold text-slate-800 dark:text-slate-100' : 'font-semibold text-slate-700 dark:text-slate-200'}`}>
                              {item.name}
                            </p>
                            {rankStyles.isFirst && (
                              <span title="Peringkat 1 - Top Performer" className="inline-flex items-center text-amber-500">
                                <Crown className="w-3.5 h-3.5 fill-amber-400 text-amber-500 flex-shrink-0" />
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 truncate">
                            Rig {item.rig}
                          </p>
                        </div>
                      </div>

                      {/* Sisi Kanan: Penonjolan Angka Metrik (Pill Badge) */}
                      <div className="flex flex-col items-end flex-shrink-0 pl-3">
                        <div className="bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-cyan-400 font-extrabold text-base sm:text-xl px-3 py-1 rounded-lg border border-blue-100/80 dark:border-blue-900/40 shadow-xs">
                          {item.submittedCount}
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium mt-1">
                          Form Selesai
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-center text-slate-400 p-4">
                <Trophy className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-1" />
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Belum ada formulir diselesaikan</p>
                <p className="text-[11px] text-slate-400">Data HFO akan muncul setelah inspeksi disubmit.</p>
              </div>
            )}
          </div>

          {/* Area Footer Highlight */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-blue-50/60 via-indigo-50/20 to-transparent dark:from-blue-950/40 dark:via-indigo-950/10 dark:to-transparent border border-blue-100/70 dark:border-blue-900/40 mt-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <span className="text-slate-600 dark:text-slate-300 font-medium truncate">
                Top 1: <strong className="text-slate-900 dark:text-white font-bold">{topPerformers[0]?.name || 'Belum Ada'}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-cyan-400 font-bold flex-shrink-0 ml-2">
              <span>Apresiasi K3</span>
              <span className="text-xs">✨</span>
            </div>
          </div>
        </div>

        {/* ── KARTU 3: BAR CHART (Top 5 Rig Temuan Rusak - Kanan) ── */}
        <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Top 5 Rig Temuan Rusak
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Komponen rusak / servis ({periodLabel})
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-2 py-1 rounded-md">
                Prioritas
              </span>
            </div>

            {/* Area Visualisasi Bar Chart */}
            <div className="h-60 sm:h-64 w-full mt-4">
              {topDefectRigs.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topDefectRigs}
                    margin={{ top: 15, right: 10, left: -20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                    <XAxis
                      dataKey="rig"
                      tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        color: '#f8fafc',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                      formatter={(value, name, item) => [
                        `${value} Temuan Rusak (${item?.payload?.kategori || 'Komponen'})`,
                        'Jumlah'
                      ]}
                      labelFormatter={(label) => `Rig: ${label}`}
                    />
                    <Bar
                      dataKey="temuanRusak"
                      name="Temuan Alat Rusak"
                      fill="#F43F5E"
                      radius={[6, 6, 0, 0]}
                      barSize={26}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-4">
                  <ShieldCheck className="w-10 h-10 text-emerald-500 mb-2" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Nihil Temuan Alat Rusak</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Semua peralatan dalam kondisi prima pada periode ini.</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 mt-2 flex items-center justify-between text-xs">
            <span className="text-rose-700 dark:text-rose-300 font-medium truncate">
              {topDefectRigs.length > 0 
                ? `Tertinggi: ${topDefectRigs[0].rig} (${topDefectRigs[0].temuanRusak} temuan)` 
                : 'Kondisi Peralatan: Baik'}
            </span>
            <span className="text-[11px] text-rose-600 dark:text-rose-400 font-bold flex-shrink-0 ml-2">
              {topDefectRigs.length > 0 ? 'Follow up' : 'Optimal'}
            </span>
          </div>
        </div>
      </div>

      {/* ── ROW: TREN PENGISIAN FORMULIR MINGGUAN (FULL WIDTH) ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Tren Pengisian Formulir Mingguan
              </h2>
              <p className="text-[11px] text-slate-400">
                Perbandingan realisasi pengisian vs target mingguan ({periodLabel})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <span className="w-3 h-0.5 bg-blue-500 rounded-full" />
              <span>Target ({Math.round(totalFormulir / 4)}/mgg)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-bold">
              <span className="w-3 h-0.5 bg-emerald-500 rounded-full" />
              <span>Realisasi Masuk</span>
            </div>
          </div>
        </div>

        {/* Area Visualisasi Line Chart */}
        <div className="h-72 sm:h-80 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={weeklyTrends}
              margin={{ top: 15, right: 20, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <XAxis
                dataKey="minggu"
                tick={{ fontSize: 12, fill: '#64748b', fontWeight: 'bold' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 'auto']}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  color: '#f8fafc',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
                formatter={(value, name) => [`${value} Formulir`, name === 'realisasi' ? 'Realisasi Masuk' : 'Target Wajib']}
                labelFormatter={(label) => `${label} - Periode ${periodLabel}`}
              />
              <Legend
                verticalAlign="bottom"
                wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }}
              />
              <Line
                type="monotone"
                dataKey="target"
                name="Target Wajib"
                stroke="#3B82F6"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 4, fill: '#3B82F6' }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="realisasi"
                name="Realisasi Pengisian"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ r: 5, fill: '#10B981' }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
          {weeklyTrends.map((w) => (
            <div key={w.minggu} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{w.minggu}</div>
              <div className="text-base font-black text-slate-800 dark:text-slate-100 mt-0.5">
                {w.realisasi} <span className="text-xs font-normal text-slate-400">/ {w.target}</span>
              </div>
              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                {w.onTimeRate}% Disiplin
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
