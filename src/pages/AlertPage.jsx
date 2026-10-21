import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  Wrench,
  CheckCircle2,
  Search,
  Flame,
  Eye,
  Shield,
  HeartPulse,
  Wind,
  Box,
  Activity,
  Calendar,
  Building2,
  Clock,
  RefreshCw,
  Loader2,
  ShieldAlert,
  Cylinder,
  Camera,
  UploadCloud,
  Check,
  X,
  Maximize2,
  MessageSquare,
  UserCheck,
  FileCheck,
  CheckCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ICON_MAP = {
  Flame,
  Eye,
  Shield,
  HeartPulse,
  Wind,
  Box,
  Activity,
  ShieldAlert,
  Cylinder,
  AlertTriangle,
};

function getIconComponent(icon) {
  if (typeof icon === 'function') return icon;
  if (typeof icon === 'string' && ICON_MAP[icon]) return ICON_MAP[icon];
  return AlertTriangle;
}

export default function AlertPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.username === 'admin_besmindo';
  const userRig = user?.rig_name || null;

  // Data states
  const [alertItems, setAlertItems] = useState([]);
  const [counts, setCounts] = useState({
    total: 0,
    open_count: 0,
    pending_count: 0,
    closed_count: 0,
    active_count: 0,
    critical_count: 0,
    maintenance_count: 0,
    rigs_impacted: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState('');
  const [notification, setNotification] = useState(null);

  // Tab & Filter states
  // Tab options: 'OPEN' (Perlu Tindakan), 'PENDING_REVIEW' (Menunggu Verifikasi), 'CLOSED' (Selesai), 'ALL' (Semua)
  const [activeStatusTab, setActiveStatusTab] = useState('OPEN');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('ALL');
  const [selectedRig, setSelectedRig] = useState(() => (isAdmin ? 'ALL' : (userRig || 'ALL')));

  // Modal states: Repair reporting (User Rig)
  const [repairModalItem, setRepairModalItem] = useState(null);
  const [repairForm, setRepairForm] = useState({
    buktiFoto: '',
    tanggalPerbaikan: new Date().toISOString().split('T')[0],
    catatanPerbaikan: '',
  });
  const [submittingRepair, setSubmittingRepair] = useState(false);

  // Modal states: Admin Reject
  const [rejectModalItem, setRejectModalItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submittingReject, setSubmittingReject] = useState(false);

  // Lightbox Modal for Photo Preview
  const [lightboxImage, setLightboxImage] = useState(null);

  // Inline action loading state
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Fetch alerts from backend
  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Build query string
      const params = new URLSearchParams();
      if (!isAdmin && userRig) {
        params.set('rig_no', userRig);
      } else if (isAdmin && selectedRig !== 'ALL') {
        params.set('rig_no', selectedRig);
      }

      const res = await fetch(`http://localhost:5000/api/inspections/alerts?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Gagal menghubungi server`);
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setAlertItems(data.data);
        setCounts({
          total: data.total || 0,
          open_count: data.open_count || 0,
          pending_count: data.pending_count || 0,
          closed_count: data.closed_count || 0,
          active_count: data.active_count || 0,
          critical_count: data.critical_count || 0,
          maintenance_count: data.maintenance_count || 0,
          rigs_impacted: data.rigs_impacted || 0
        });
      } else {
        setAlertItems([]);
      }
      const now = new Date();
      setLastSyncTime(
        `${now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}, ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
      );
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError(err.message || 'Gagal memuat data dari database.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, userRig, selectedRig]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Unique Rigs for Dropdown
  const uniqueRigs = useMemo(() => {
    return Array.from(new Set(alertItems.map((i) => i.rigNo || i.rig_no).filter(Boolean))).sort();
  }, [alertItems]);

  // Tab Filtering Logic
  const filteredData = useMemo(() => {
    return alertItems.filter((item) => {
      const itemStatusAlert = (item.statusAlert || item.status_alert || 'OPEN').toUpperCase();

      // Filter by Active Tab
      let matchTab = true;
      if (activeStatusTab === 'OPEN') {
        // 'OPEN' includes OPEN and REJECTED (both require action from Rig)
        matchTab = itemStatusAlert === 'OPEN' || itemStatusAlert === 'REJECTED';
      } else if (activeStatusTab === 'PENDING_REVIEW') {
        matchTab = itemStatusAlert === 'PENDING_REVIEW';
      } else if (activeStatusTab === 'CLOSED') {
        matchTab = itemStatusAlert === 'CLOSED';
      } else if (activeStatusTab === 'ALL') {
        matchTab = true;
      }

      // Filter by Condition (Rusak vs Perlu Perawatan)
      const itemCondition = (item.status || item.kondisi || '').toLowerCase();
      const matchCondition =
        selectedCondition === 'ALL' || itemCondition === selectedCondition.toLowerCase();

      // Filter by Rig (if admin changed rig in dropdown)
      const itemRig = (item.rigNo || item.rig_no || '').toUpperCase();
      const matchRig =
        selectedRig === 'ALL' || itemRig === selectedRig.toUpperCase();

      // Filter by Search
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        itemRig.toLowerCase().includes(q) ||
        (item.jenisInspeksi || item.form_type || '').toLowerCase().includes(q) ||
        (item.komponenAlat || item.komponen_alat || '').toLowerCase().includes(q) ||
        (item.catatanTeknisi || item.catatan_temuan || '').toLowerCase().includes(q) ||
        (item.lokasiArea || item.lokasi_area || '').toLowerCase().includes(q) ||
        (item.catatanPerbaikan || item.catatan_perbaikan || '').toLowerCase().includes(q);

      return matchTab && matchCondition && matchRig && matchSearch;
    });
  }, [alertItems, activeStatusTab, selectedCondition, selectedRig, searchQuery]);

  // Notification Banner Timeout
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // ── IMAGE COMPRESSION & HANDLER ──
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Harap unggah file gambar yang valid (JPG, PNG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        setRepairForm((prev) => ({ ...prev, buktiFoto: compressedDataUrl }));
      };
      img.src = event.target?.result;
    };
    reader.readAsDataURL(file);
  };

  // ── SUBMIT REPAIR (User Rig) ──
  const handleOpenRepairModal = (item) => {
    setRepairModalItem(item);
    setRepairForm({
      buktiFoto: item.buktiFoto || item.bukti_foto || '',
      tanggalPerbaikan: item.tanggalPerbaikan || item.tanggal_perbaikan || new Date().toISOString().split('T')[0],
      catatanPerbaikan: item.catatanPerbaikan || item.catatan_perbaikan || '',
    });
  };

  const handleSubmitRepair = async (e) => {
    e.preventDefault();
    if (!repairModalItem) return;

    if (!repairForm.buktiFoto) {
      alert('Foto bukti perbaikan wajib dilampirkan!');
      return;
    }
    if (!repairForm.catatanPerbaikan.trim()) {
      alert('Catatan tindakan perbaikan wajib diisi!');
      return;
    }

    setSubmittingRepair(true);
    try {
      const res = await fetch(`http://localhost:5000/api/inspections/alerts/${repairModalItem.id}/repair`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bukti_foto: repairForm.buktiFoto,
          tanggal_perbaikan: repairForm.tanggalPerbaikan,
          catatan_perbaikan: repairForm.catatanPerbaikan,
          diperbaiki_oleh: user?.username || userRig || 'HSO Rig'
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal mengirim laporan perbaikan');
      }

      setNotification({
        type: 'success',
        title: 'Laporan Perbaikan Terkirim!',
        message: `Bukti perbaikan untuk ${repairModalItem.komponenAlat} berhasil dikirim dan kini berstatus Menunggu Verifikasi Admin.`
      });

      setRepairModalItem(null);
      await fetchAlerts();
      // Auto-switch to PENDING_REVIEW tab to show submitted item
      setActiveStatusTab('PENDING_REVIEW');
    } catch (err) {
      console.error('Error submitting repair:', err);
      alert('Gagal mengirim bukti perbaikan: ' + err.message);
    } finally {
      setSubmittingRepair(false);
    }
  };

  // ── APPROVE ACTION (Admin) ──
  const handleApprove = async (item) => {
    if (!window.confirm(`Setujui perbaikan untuk "${item.komponenAlat}" di ${item.rigNo}? Status akan ditutup (CLOSED).`)) {
      return;
    }

    setActionLoadingId(item.id);
    try {
      const res = await fetch(`http://localhost:5000/api/inspections/alerts/${item.id}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          diverifikasi_oleh: user?.username || 'Administrator Besmindo'
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal menyetujui perbaikan');
      }

      setNotification({
        type: 'success',
        title: 'Perbaikan Disetujui!',
        message: `Temuan ${item.komponenAlat} (${item.rigNo}) telah berhasil diverifikasi dan ditutup (CLOSED). Badge alert otomatis berkurang.`
      });

      await fetchAlerts();
    } catch (err) {
      console.error('Error approving alert:', err);
      alert('Gagal menyetujui alert: ' + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // ── REJECT ACTION (Admin) ──
  const handleOpenRejectModal = (item) => {
    setRejectModalItem(item);
    setRejectReason('');
  };

  const handleSubmitReject = async (e) => {
    e.preventDefault();
    if (!rejectModalItem) return;

    if (!rejectReason.trim()) {
      alert('Harap tuliskan alasan penolakan atau instruksi revisi untuk HSO Rig.');
      return;
    }

    setSubmittingReject(true);
    try {
      const res = await fetch(`http://localhost:5000/api/inspections/alerts/${rejectModalItem.id}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          alasan_reject: rejectReason.trim(),
          diverifikasi_oleh: user?.username || 'Administrator Besmindo'
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal menolak laporan');
      }

      setNotification({
        type: 'warning',
        title: 'Laporan Perbaikan Ditolak',
        message: `Laporan perbaikan untuk ${rejectModalItem.komponenAlat} telah dikembalikan ke Rig ${rejectModalItem.rigNo} dengan catatan revisi.`
      });

      setRejectModalItem(null);
      await fetchAlerts();
    } catch (err) {
      console.error('Error rejecting alert:', err);
      alert('Gagal menolak laporan: ' + err.message);
    } finally {
      setSubmittingReject(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── NOTIFICATION TOAST ── */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-start justify-between shadow-md transition-all animate-in fade-in slide-in-from-top-2 ${
            notification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-100'
          }`}
        >
          <div className="flex items-start gap-3">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold text-sm">{notification.title}</p>
              <p className="text-xs mt-0.5 opacity-90">{notification.message}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── HEADER HALAMAN ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-bold">
              <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
              <span>
                {isAdmin
                  ? 'Pusat Verifikasi Closed-Loop (20 Rig Terhubung)'
                  : `Tindak Lanjut & Perbaikan Rig ${userRig || 'BMS'}`}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isAdmin ? 'Alert Temuan Rusak & Verifikasi' : 'Alert & Perbaikan Alat Keselamatan'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              {isAdmin
                ? 'Pantau anomali temuan rusak dari seluruh formulir 20 Rig PT. Besmindo Materi Sewatama dan verifikasi bukti foto tindakan perbaikan dari personil HSO Rig.'
                : 'Daftar peralatan keselamatan kerja yang rusak atau butuh perawatan di Rig Anda. Silakan lakukan tindakan perbaikan, unggah bukti foto, dan kirim untuk verifikasi Admin.'}
            </p>
          </div>

          {/* Timestamp & Refresh Button */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="truncate">
                Sinkron: <strong>{lastSyncTime || 'Menghubungkan...'}</strong>
              </span>
            </div>

            <button
              type="button"
              onClick={fetchAlerts}
              disabled={loading}
              title="Perbarui Data dari Database"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-900 text-xs font-bold transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* ── KARTU STATISTIK TEMUAN DINAMIS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
          {/* Card 1: Total Temuan */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>Total Temuan</span>
              <AlertOctagon className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {loading && alertItems.length === 0 ? '...' : counts.total}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {isAdmin ? 'Seluruh Rig Aktif' : `Unit Rig ${userRig || ''}`}
            </div>
          </div>

          {/* Card 2: Perlu Tindakan (OPEN) */}
          <div
            onClick={() => setActiveStatusTab('OPEN')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              activeStatusTab === 'OPEN'
                ? 'bg-red-100/70 dark:bg-red-950/40 border-red-400 ring-2 ring-red-400/40'
                : 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 hover:border-red-300'
            }`}
          >
            <div className="flex items-center justify-between text-red-600 dark:text-red-400 text-xs font-bold">
              <span>Perlu Tindakan (OPEN)</span>
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">
              {loading && alertItems.length === 0 ? '...' : counts.open_count}
            </div>
            <div className="text-[11px] text-red-600/80 dark:text-red-400/80 mt-0.5">
              Belum ada laporan perbaikan
            </div>
          </div>

          {/* Card 3: Menunggu Verifikasi (PENDING) */}
          <div
            onClick={() => setActiveStatusTab('PENDING_REVIEW')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              activeStatusTab === 'PENDING_REVIEW'
                ? 'bg-amber-100/70 dark:bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/40'
                : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <span>Menunggu Verifikasi</span>
                {counts.pending_count > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                )}
              </span>
              <FileCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-1">
              {loading && alertItems.length === 0 ? '...' : counts.pending_count}
            </div>
            <div className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">
              {isAdmin ? 'Butuh review & approve Admin' : 'Sedang ditinjau oleh Admin'}
            </div>
          </div>

          {/* Card 4: Selesai (CLOSED) */}
          <div
            onClick={() => setActiveStatusTab('CLOSED')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              activeStatusTab === 'CLOSED'
                ? 'bg-emerald-100/70 dark:bg-emerald-950/40 border-emerald-400 ring-2 ring-emerald-400/40'
                : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-xs font-bold">
              <span>Selesai (CLOSED)</span>
              <CheckCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
              {loading && alertItems.length === 0 ? '...' : counts.closed_count}
            </div>
            <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
              Perbaikan terverifikasi & ditutup
            </div>
          </div>
        </div>
      </div>

      {/* ── STATUS FILTER TABS (CLOSED-LOOP PIPELINE) ── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setActiveStatusTab('OPEN')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeStatusTab === 'OPEN'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Perlu Tindakan</span>
            <span
              className={`px-2 py-0.5 text-[10px] rounded-full font-black ${
                activeStatusTab === 'OPEN'
                  ? 'bg-white/20 text-white'
                  : 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300'
              }`}
            >
              {counts.open_count}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStatusTab('PENDING_REVIEW')}
            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeStatusTab === 'PENDING_REVIEW'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Menunggu Verifikasi</span>
            <span
              className={`px-2 py-0.5 text-[10px] rounded-full font-black ${
                activeStatusTab === 'PENDING_REVIEW'
                  ? 'bg-white/20 text-white'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 font-extrabold animate-pulse'
              }`}
            >
              {counts.pending_count}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStatusTab('CLOSED')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeStatusTab === 'CLOSED'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Selesai (Closed)</span>
            <span
              className={`px-2 py-0.5 text-[10px] rounded-full font-black ${
                activeStatusTab === 'CLOSED'
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
              }`}
            >
              {counts.closed_count}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStatusTab('ALL')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeStatusTab === 'ALL'
                ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>Semua Log ({counts.total})</span>
          </button>
        </div>
      </div>

      {/* ── KONTROL FILTER & SEARCH BAR ── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Input Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan Rig, nama alat, catatan teknisi, atau tindakan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2">
            {/* Filter Kondisi Fisik Alat */}
            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">Semua Kondisi</option>
              <option value="rusak">Kondisi Rusak</option>
              <option value="perlu perawatan">Perlu Perawatan</option>
            </select>

            {/* Filter Rig (Khusus Admin) */}
            {isAdmin && (
              <select
                value={selectedRig}
                onChange={(e) => setSelectedRig(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">Semua Rig</option>
                {uniqueRigs.map((rig) => (
                  <option key={rig} value={rig}>
                    {rig}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* ── TABEL CLOSED-LOOP CORRECTIVE ACTION ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
              {activeStatusTab === 'OPEN' && 'Daftar Temuan Membutuhkan Perbaikan'}
              {activeStatusTab === 'PENDING_REVIEW' && 'Daftar Perbaikan Menunggu Verifikasi Admin'}
              {activeStatusTab === 'CLOSED' && 'Daftar Temuan Selesai & Terverifikasi'}
              {activeStatusTab === 'ALL' && 'Seluruh Riwayat Log Temuan'}
            </span>
            <span className="text-xs bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-cyan-400 font-bold px-2 py-0.5 rounded-full">
              {filteredData.length} Item
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
            * Closed-Loop System PT. Besmindo Materi Sewatama
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-28">Tanggal</th>
                <th className="py-3 px-4 w-24">Rig</th>
                <th className="py-3 px-4 w-40">Jenis Inspeksi</th>
                <th className="py-3 px-4 min-w-[200px]">Komponen & Temuan</th>
                <th className="py-3 px-4 w-32 text-center">Status Alert</th>
                <th className="py-3 px-4 min-w-[260px]">Bukti & Tindak Lanjut</th>
                <th className="py-3 px-4 w-36 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
              {loading && alertItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-blue-600 dark:text-cyan-400" />
                    <p className="font-bold text-sm text-slate-700 dark:text-slate-200">
                      Memuat data temuan dari database MySQL...
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Menghubungkan ke API /api/inspections/alerts
                    </p>
                  </td>
                </tr>
              ) : error && alertItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-red-500">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-red-500" />
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-100">
                      Gagal mengambil data dari database.
                    </p>
                    <p className="text-xs text-red-500 mt-1">{error}</p>
                    <button
                      type="button"
                      onClick={fetchAlerts}
                      className="mt-3 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      Coba Lagi
                    </button>
                  </td>
                </tr>
              ) : filteredData.length > 0 ? (
                filteredData.map((item) => {
                  const IconComp = getIconComponent(item.icon);
                  const isRusak = (item.status || item.kondisi || '').toLowerCase() === 'rusak';
                  const statusAlert = (item.statusAlert || item.status_alert || 'OPEN').toUpperCase();
                  const photo = item.buktiFoto || item.bukti_foto;
                  const isActionLoading = actionLoadingId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-blue-50/30 dark:hover:bg-slate-800/60 transition-colors ${
                        statusAlert === 'REJECTED' ? 'bg-red-50/20 dark:bg-red-950/10' : ''
                      }`}
                    >
                      {/* Tanggal */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400 font-mono text-[11px] align-top">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{item.tanggal}</span>
                        </div>
                        {item.hfoName && (
                          <div className="text-[10px] text-slate-400 mt-1">
                            HFO: {item.hfoName}
                          </div>
                        )}
                      </td>

                      {/* Rig No */}
                      <td className="py-3.5 px-4 whitespace-nowrap align-top">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-cyan-400 font-black text-xs">
                          {item.rigNo || item.rig_no}
                        </span>
                      </td>

                      {/* Jenis Inspeksi */}
                      <td className="py-3.5 px-4 whitespace-nowrap align-top text-slate-800 dark:text-slate-200 font-semibold">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            <IconComp className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                          </div>
                          <span>{item.jenisInspeksi || item.form_type}</span>
                        </div>
                        <div className="mt-1">
                          {isRusak ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 dark:text-red-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                              Kondisi Rusak
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Perlu Perawatan
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Komponen & Temuan Kerusakan */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                          {item.komponenAlat || item.komponen_alat}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          {item.catatanTeknisi || item.catatan_temuan}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Lokasi: {item.lokasiArea || item.lokasi_area || 'Area Rig Operasional'}
                        </div>
                      </td>

                      {/* Status Alert (Closed-Loop Status) */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap align-top">
                        {statusAlert === 'OPEN' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border border-red-200 dark:border-red-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                            <span>OPEN</span>
                          </span>
                        )}
                        {statusAlert === 'PENDING_REVIEW' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                            <span>PENDING</span>
                          </span>
                        )}
                        {statusAlert === 'CLOSED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>CLOSED</span>
                          </span>
                        )}
                        {statusAlert === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
                            <X className="w-3 h-3 text-rose-600" />
                            <span>REVISI / REJECT</span>
                          </span>
                        )}
                      </td>

                      {/* Bukti Foto & Catatan Tindak Lanjut */}
                      <td className="py-3.5 px-4 align-top text-slate-700 dark:text-slate-300">
                        {statusAlert === 'REJECTED' && (
                          <div className="mb-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-[11px]">
                            <div className="font-bold flex items-center gap-1 text-red-800 dark:text-red-200">
                              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>Catatan Penolakan Admin:</span>
                            </div>
                            <p className="mt-0.5">{item.alasanReject || item.alasan_reject || 'Harap perbaiki dan kirim ulang bukti perbaikan.'}</p>
                          </div>
                        )}

                        {photo ? (
                          <div className="flex items-start gap-3">
                            {/* Thumbnail Foto Bukti */}
                            <div
                              onClick={() => setLightboxImage({
                                url: photo,
                                title: `${item.komponenAlat || item.komponen_alat} (${item.rigNo || item.rig_no})`,
                                notes: item.catatanPerbaikan || item.catatan_perbaikan,
                                date: item.tanggalPerbaikan || item.tanggal_perbaikan
                              })}
                              className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 flex-shrink-0 cursor-pointer group/thumb bg-slate-100"
                              title="Klik untuk memperbesar foto bukti"
                            >
                              <img
                                src={photo}
                                alt="Bukti Perbaikan"
                                className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity text-white">
                                <Maximize2 className="w-4 h-4" />
                              </div>
                            </div>

                            {/* Detail Tindakan */}
                            <div className="text-[11px] flex-1">
                              <div className="font-bold text-slate-800 dark:text-slate-200">
                                Tindakan HSO Rig:
                              </div>
                              <p className="text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                                {item.catatanPerbaikan || item.catatan_perbaikan || '-'}
                              </p>
                              <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                                <span>Tgl: {item.tanggalPerbaikan || item.tanggal_perbaikan || '-'}</span>
                                {item.diperbaikiOleh && <span>• Oleh: {item.diperbaikiOleh}</span>}
                              </div>
                              {statusAlert === 'CLOSED' && item.diverifikasiOleh && (
                                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                                  ✓ Diverifikasi oleh: {item.diverifikasiOleh}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 italic">
                            Belum ada bukti perbaikan diunggah.
                          </div>
                        )}
                      </td>

                      {/* Tombol Aksi */}
                      <td className="py-3.5 px-4 text-center align-top whitespace-nowrap">
                        {/* 1. SISI USER HSO RIG: Tombol Lapor Perbaikan */}
                        {!isAdmin && (statusAlert === 'OPEN' || statusAlert === 'REJECTED') && (
                          <button
                            type="button"
                            onClick={() => handleOpenRepairModal(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>{statusAlert === 'REJECTED' ? 'Kirim Ulang' : 'Lapor Perbaikan'}</span>
                          </button>
                        )}

                        {!isAdmin && statusAlert === 'PENDING_REVIEW' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800">
                            <Clock className="w-3 h-3" />
                            <span>Menunggu Review</span>
                          </span>
                        )}

                        {!isAdmin && statusAlert === 'CLOSED' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Selesai</span>
                          </span>
                        )}

                        {/* 2. SISI ADMIN BESMINDO: Aksi Verifikasi */}
                        {isAdmin && statusAlert === 'PENDING_REVIEW' && (
                          <div className="flex flex-col gap-1.5">
                            <button
                              type="button"
                              disabled={isActionLoading}
                              onClick={() => handleApprove(item)}
                              className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                            >
                              {isActionLoading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              <span>Approve & Close</span>
                            </button>
                            <button
                              type="button"
                              disabled={isActionLoading}
                              onClick={() => handleOpenRejectModal(item)}
                              className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        )}

                        {isAdmin && statusAlert === 'OPEN' && (
                          <button
                            type="button"
                            onClick={() => handleOpenRepairModal(item)}
                            title="Admin juga dapat menginputkan perbaikan langsung atas nama Rig"
                            className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-blue-600 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 hover:border-blue-300 transition cursor-pointer"
                          >
                            <Wrench className="w-3 h-3" />
                            <span>Bantu Input</span>
                          </button>
                        )}

                        {isAdmin && statusAlert === 'CLOSED' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                            <CheckCheck className="w-3 h-3" />
                            <span>Terverifikasi</span>
                          </span>
                        )}

                        {isAdmin && statusAlert === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-md border border-rose-200 dark:border-rose-800">
                            <Clock className="w-3 h-3" />
                            <span>Menunggu Revisi</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400 dark:text-slate-500">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-emerald-500 opacity-60" />
                    <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
                      Tidak ada temuan yang cocok dengan filter.
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {activeStatusTab === 'PENDING_REVIEW'
                        ? 'Tidak ada perbaikan yang menunggu verifikasi saat ini.'
                        : 'Semua sistem HSE dalam kondisi aman atau sesuai kriteria pencarian.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL FORM: LAPOR PERBAIKAN (User Rig / Admin Bantu Input) ── */}
      {repairModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-cyan-400 text-[11px] font-bold">
                  <Wrench className="w-3 h-3" />
                  <span>Closed-Loop Action • {repairModalItem.rigNo || repairModalItem.rig_no}</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  Lapor Bukti Tindak Lanjut Perbaikan
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRepairModalItem(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Context Box Temuan */}
            <div className="mt-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                  {repairModalItem.komponenAlat || repairModalItem.komponen_alat}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  ID: {repairModalItem.id}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                <strong className="text-slate-700 dark:text-slate-300">Temuan Rusak:</strong>{' '}
                {repairModalItem.catatanTeknisi || repairModalItem.catatan_temuan}
              </p>
              <div className="text-[10px] text-blue-600 dark:text-cyan-400 font-semibold">
                Rekomendasi: {repairModalItem.tindakan || repairModalItem.tindakan_rekomendasi || '-'}
              </div>
            </div>

            {/* Warning Catatan Revisi jika sebelumnya ditolak */}
            {(repairModalItem.statusAlert === 'REJECTED' || repairModalItem.status_alert === 'REJECTED') && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Perbaikan Sebelumnya Ditolak Admin:</div>
                  <p className="text-[11px] mt-0.5">
                    {repairModalItem.alasanReject || repairModalItem.alasan_reject}
                  </p>
                  <p className="text-[10px] text-red-600/80 dark:text-red-400/80 mt-1 italic">
                    Harap upload foto bukti yang lebih jelas atau perbarui catatan perbaikan sebelum mengirim ulang.
                  </p>
                </div>
              </div>
            )}

            {/* Form Input */}
            <form onSubmit={handleSubmitRepair} className="mt-4 space-y-4">
              {/* 1. Upload Foto Bukti Perbaikan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Foto Bukti Perbaikan (Upload Gambar) <span className="text-red-500">*</span>
                </label>

                {repairForm.buktiFoto ? (
                  <div className="relative rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800 p-2 flex items-center gap-3">
                    <img
                      src={repairForm.buktiFoto}
                      alt="Preview Bukti"
                      className="w-20 h-20 object-cover rounded-lg border border-slate-200 dark:border-slate-700 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0 text-xs">
                      <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Foto Berhasil Diunggah</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        Gambar terkompresi otomatis siap dikirim ke database.
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <label className="text-blue-600 dark:text-cyan-400 hover:underline text-[11px] font-bold cursor-pointer">
                          Ganti Foto
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                        <span className="text-slate-300">•</span>
                        <button
                          type="button"
                          onClick={() => setRepairForm((prev) => ({ ...prev, buktiFoto: '' }))}
                          className="text-red-600 hover:underline text-[11px] font-bold cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl cursor-pointer bg-slate-50/50 dark:bg-slate-800/30 hover:bg-blue-50/20 transition group">
                    <div className="p-3 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400 group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <span className="mt-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                      Klik atau Tarik Foto Bukti ke Sini
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      Format JPG, PNG, WEBP (Otomatis dikompresi)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* 2. Tanggal Perbaikan (Close Date) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tanggal Perbaikan (Close Date) <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={repairForm.tanggalPerbaikan}
                  onChange={(e) => setRepairForm((prev) => ({ ...prev, tanggalPerbaikan: e.target.value }))}
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {/* 3. Catatan Tindakan Perbaikan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Catatan Tindakan Perbaikan <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={repairForm.catatanPerbaikan}
                  onChange={(e) => setRepairForm((prev) => ({ ...prev, catatanPerbaikan: e.target.value }))}
                  required
                  placeholder="Contoh: Tabung APAR telah diganti dengan unit cadangan nomor seri PW-2026-90, diuji dan ditempatkan kembali pada braket..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setRepairModalItem(null)}
                  disabled={submittingRepair}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingRepair}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submittingRepair ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Mengirim Bukti...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Kirim Laporan Perbaikan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL TOLAK PERBAIKAN (ADMIN REJECT) ── */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-[11px] font-bold">
                  <X className="w-3 h-3" />
                  <span>Penolakan Verifikasi Perbaikan</span>
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">
                  Kembalikan ke Rig {rejectModalItem.rigNo || rejectModalItem.rig_no}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectModalItem(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
              Anda akan menolak laporan perbaikan untuk{' '}
              <strong>{rejectModalItem.komponenAlat || rejectModalItem.komponen_alat}</strong>.
              Tuliskan instruksi perbaikan atau alasan penolakan agar HSO Rig dapat merevisi bukti yang diajukan.
            </p>

            <form onSubmit={handleSubmitReject} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Alasan Penolakan / Catatan Revisi <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  required
                  placeholder="Contoh: Foto bukti perbaikan buram / tidak tampak nomor seri tabung baru. Mohon ambil foto tampak jelas."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setRejectModalItem(null)}
                  disabled={submittingReject}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingReject}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submittingReject ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Mengirim...</span>
                    </>
                  ) : (
                    <>
                      <X className="w-3.5 h-3.5" />
                      <span>Kirim Penolakan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── LIGHTBOX MODAL: FULL RESOLUTION PHOTO PREVIEW ── */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="truncate">
                <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                  {lightboxImage.title}
                </h4>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Foto Bukti Perbaikan • Tanggal: {lightboxImage.date || '-'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-black/95 flex items-center justify-center max-h-[70vh] p-2">
              <img
                src={lightboxImage.url}
                alt="Bukti Perbaikan Full"
                className="max-h-[68vh] max-w-full object-contain rounded-lg"
              />
            </div>

            {lightboxImage.notes && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Catatan HSO:</span>{' '}
                <span className="text-slate-600 dark:text-slate-400">{lightboxImage.notes}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
