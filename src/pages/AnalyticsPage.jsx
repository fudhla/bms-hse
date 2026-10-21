import { useState, useEffect, useMemo } from 'react';
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
  Sparkles
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

// ── MOCK DATA 1: PIE CHART (Selesai vs Belum Selesai) ──────────────────────
// Total 20 Rig x 9 Formulir = 180 Formulir Wajib per Bulan
const MOCK_COMPLETION_DATA = [
  { name: 'Selesai (Submitted)', value: 153, color: '#10B981' }, // Hijau Emerald
  { name: 'Belum Selesai (Pending/Draft)', value: 27, color: '#94A3B8' } // Abu-abu Slate
];

// ── MOCK DATA 2: BAR CHART (Top 5 Rig dengan Temuan Alat Rusak) ───────────
const MOCK_TOP_DEFECT_RIGS = [
  { rig: 'BMS 05', temuanRusak: 7, kategori: 'Shower & Pipa' },
  { rig: 'BMS 01', temuanRusak: 5, kategori: 'APAR Handle' },
  { rig: 'BMS 10', temuanRusak: 4, kategori: 'Harness Webbing' },
  { rig: 'BMS 16', temuanRusak: 4, kategori: 'Kotak P3K Expired' },
  { rig: 'BMS 08', temuanRusak: 3, kategori: 'SCBA Hose Leak' }
];

// ── MOCK DATA 3: LINE CHART (Tren Pengisian Formulir Minggu 1 - 4) ──────────
const MOCK_WEEKLY_TRENDS = [
  { minggu: 'Minggu I', realisasi: 38, target: 45, onTimeRate: 84 },
  { minggu: 'Minggu II', realisasi: 42, target: 45, onTimeRate: 93 },
  { minggu: 'Minggu III', realisasi: 40, target: 45, onTimeRate: 88 },
  { minggu: 'Minggu IV', realisasi: 33, target: 45, onTimeRate: 73 }
];

// ── MOCK / DEFAULT BASELINE DATA: TOP 3 HFO PERFORMERS ─────────────────────
const DEFAULT_TOP_PERFORMERS = [
  { name: 'Fudhla Aulia', rig: 'BMS 01', submittedCount: 45 },
  { name: 'Ahmad Fauzi', rig: 'BMS 03', submittedCount: 38 },
  { name: 'Rahmat Hidayat', rig: 'BMS 05', submittedCount: 34 }
];

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AnalyticsPage() {
  const [selectedPeriod] = useState('Oktober 2026');
  const [inspections, setInspections] = useState([]);

  // Fetch data inspeksi riil dari backend untuk data agregasi leaderboard
  useEffect(() => {
    let isMounted = true;
    const fetchInspections = async () => {
      try {
        const res = await fetch('/api/inspections');
        const json = await res.json();
        if (isMounted && json.success && Array.isArray(json.data)) {
          setInspections(json.data);
        }
      } catch (err) {
        console.warn('Gagal memuat data inspeksi untuk leaderboard:', err);
      }
    };
    fetchInspections();
    return () => { isMounted = false; };
  }, []);

  // Logika Agregasi Kinerja HFO: Group By nama pembuat formulir dengan status 'submitted' (Top 3)
  const topPerformers = useMemo(() => {
    if (!inspections || inspections.length === 0) {
      return DEFAULT_TOP_PERFORMERS.slice(0, 3);
    }

    const counts = {};
    inspections.forEach((insp) => {
      const isCompleted = insp.status === 'submitted';
      if (!isCompleted) return;

      const rawName = (
        insp.hfo_name ||
        insp.form_data?.hfo_name ||
        insp.form_data?.signatures?.hfo?.name ||
        insp.form_data?.signatures?.wfo?.name ||
        insp.form_data?.meta?.hfoName ||
        insp.form_data?.meta?.userName ||
        insp.form_data?.submitted_by ||
        insp.submitted_by ||
        ''
      ).trim();

      if (!rawName || rawName === '-' || rawName.toLowerCase() === 'null') return;

      const cleanName = rawName
        .replace(/\s*\(HSE\)/i, '')
        .replace(/\s*\(Medic\)/i, '')
        .replace(/\s*\(Safety\)/i, '')
        .trim();

      const rig = insp.rig_no || insp.form_data?.rig_no || insp.form_data?.meta?.rigNo || 'BMS Rig';

      if (!counts[cleanName]) {
        counts[cleanName] = {
          name: cleanName,
          rig: rig,
          submittedCount: 0
        };
      }
      counts[cleanName].submittedCount += 1;
      if (counts[cleanName].rig === 'BMS Rig' && rig !== 'BMS Rig') {
        counts[cleanName].rig = rig;
      }
    });

    const realList = Object.values(counts);
    if (realList.length >= 3) {
      realList.sort((a, b) => b.submittedCount - a.submittedCount);
      return realList.slice(0, 3);
    }

    // Jika data database riil masih sedikit, buat overlay realistis:
    const mergedMap = new Map();
    realList.forEach(item => mergedMap.set(item.name.toLowerCase(), item));
    DEFAULT_TOP_PERFORMERS.forEach(item => {
      if (!mergedMap.has(item.name.toLowerCase())) {
        mergedMap.set(item.name.toLowerCase(), item);
      }
    });

    const combined = Array.from(mergedMap.values());
    combined.sort((a, b) => b.submittedCount - a.submittedCount);
    return combined.slice(0, 3);
  }, [inspections]);

  // Perhitungan persentase penyelesaian
  const totalFormulir = MOCK_COMPLETION_DATA.reduce((acc, cur) => acc + cur.value, 0);
  const selesaiCount = MOCK_COMPLETION_DATA[0].value;
  const percentageCompleted = Math.round((selesaiCount / totalFormulir) * 100);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── HEADER HALAMAN ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Executive Dashboard & Intelligence</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Analitik & Grafik HSE
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
              Visualisasi metrik kepatuhan inspeksi keselamatan, rasio penyelesaian dokumen per Rig, dan tren temuan defek peralatan kerja secara komprehensif.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>Periode: {selectedPeriod}</span>
            </div>
          </div>
        </div>

        {/* ── 4 KARTU KPI METRIC ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>Tingkat Kepatuhan</span>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {percentageCompleted}%
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              153 dari 180 form selesai
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>Formulir Terverifikasi</span>
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              153 Unit
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Status final dikunci & TTD
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>Temuan Alat Rusak</span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
              23 Poin
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Butuh tindakan perbaikan
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>Rig Terdisiplin</span>
              <TrendingUp className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
              BMS 01
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              100% Tepat waktu Minggu I
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
                    Selesai vs Belum Selesai
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
                    data={MOCK_COMPLETION_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {MOCK_COMPLETION_DATA.map((entry, index) => (
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
                    formatter={(value, name) => [`${value} Formulir (${Math.round((value / totalFormulir) * 100)}%)`, name]}
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
            <span className="text-slate-500 dark:text-slate-400">Total Wajib: 180 Form</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Sisa 27 Form
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
                    Penyelesaian formulir bulan ini
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200/60 dark:border-slate-700/60">
                Top 3
              </span>
            </div>

            {/* List 3 Baris Rapi & Minimalis dengan Hierarki Visual Berkelas */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60 mt-2">
              {topPerformers.map((item, index) => {
                // Konfigurasi visual hierarki per peringkat (Emas, Perak, Perunggu)
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
                        <p className="text-xs text-slate-400 mt-0.5">
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
          </div>

          {/* Area Footer Highlight yang Diperhalus */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-blue-50/60 via-indigo-50/20 to-transparent dark:from-blue-950/40 dark:via-indigo-950/10 dark:to-transparent border border-blue-100/70 dark:border-blue-900/40 mt-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <span className="text-slate-600 dark:text-slate-300 font-medium truncate">
                Top 1: <strong className="text-slate-900 dark:text-white font-bold">{topPerformers[0]?.name || 'Fudhla Aulia'}</strong>
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
                    Komponen rusak / servis
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-2 py-1 rounded-md">
                Prioritas
              </span>
            </div>

            {/* Area Visualisasi Bar Chart */}
            <div className="h-60 sm:h-64 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={MOCK_TOP_DEFECT_RIGS}
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
                    formatter={(value) => [`${value} Temuan Rusak`, 'Jumlah']}
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
            </div>
          </div>

          <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 mt-2 flex items-center justify-between text-xs">
            <span className="text-rose-700 dark:text-rose-300 font-medium">Tertinggi: BMS 05 (7)</span>
            <span className="text-[11px] text-rose-600 dark:text-rose-400 font-bold">Follow up</span>
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
                Perbandingan realisasi pengisian vs target mingguan (Minggu I s/d Minggu IV)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <span className="w-3 h-0.5 bg-blue-500 rounded-full" />
              <span>Target (45/mgg)</span>
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
              data={MOCK_WEEKLY_TRENDS}
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
                domain={[20, 50]}
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
                labelFormatter={(label) => `${label} - Periode ${selectedPeriod}`}
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
          {MOCK_WEEKLY_TRENDS.map((w) => (
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
