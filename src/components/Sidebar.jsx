import { useState, useEffect } from 'react';
import {
  // Admin icons
  LayoutDashboard,
  AlertTriangle,
  FileSpreadsheet,
  BarChart3,
  Users,
  // Karyawan form icons
  Flame,
  ShieldAlert,
  Eye,
  HeartPulse,
  Shield,
  Cylinder,
  Wind,
  Box,
  Activity,
  // Shared & Profile
  LogOut,
  Sun,
  Moon,
  X,
  BookOpen,
  User,
  Lock,
  Save
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

/* ── 1. DEFINISI PENGELOMPOKAN MENU ADMINISTRATOR (3 KATEGORI) ── */
const ADMIN_MENU_GROUPS = [
  {
    groupTitle: 'ANALISIS',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard Utama',
        icon: LayoutDashboard,
        path: '/dashboard',
        description: 'Matriks pemantauan 20 Rig',
      },
      {
        id: 'analitik',
        label: 'Analitik & Grafik HSE',
        icon: BarChart3,
        path: '/analitik',
        description: 'Tren & statistik inspeksi',
      },
    ],
  },
  {
    groupTitle: 'INSPEKSI',
    items: [
      {
        id: 'alert',
        label: 'Alert Temuan Rusak',
        icon: AlertTriangle,
        path: '/alert',
        description: 'Notifikasi item rusak / bermasalah',
        badge: 8,
      },
      {
        id: 'rekap',
        label: 'Rekap & Laporan',
        icon: FileSpreadsheet,
        path: '/rekap',
        description: 'Ekspor laporan bulanan',
      },
    ],
  },
  {
    groupTitle: 'PENGATURAN',
    items: [
      {
        id: 'rig-accounts',
        label: 'Kelola Akun Rig',
        icon: Users,
        path: '/admin/rig-accounts',
        description: 'Manajemen user & password rig',
      },
    ],
  },
];

const RIG_FORM_MENU = [
  { id: 'apar',      label: 'Inspeksi APAR',                  icon: Flame,       path: '/apar' },
  { id: 'apd',       label: 'Inspeksi APD (PPE)',             icon: ShieldAlert, path: '/apd' },
  { id: 'eyewash',   label: 'Inspeksi Eye Wash & Shower',     icon: Eye,         path: '/eyewash' },
  { id: 'firstaid',  label: 'Inspeksi Kotak P3K',             icon: HeartPulse,  path: '/firstaid' },
  { id: 'harness',   label: 'Inspeksi Full Body Harness',     icon: Shield,      path: '/harness' },
  { id: 'oxigent',   label: 'Inspeksi Tabung Oksigen',        icon: Cylinder,    path: '/oxigent' },
  { id: 'scba',      label: 'Inspeksi SCBA',                  icon: Wind,        path: '/scba' },
  { id: 'spillkit',  label: 'Inspeksi Spill Kit',             icon: Box,         path: '/spillkit' },
  { id: 'stretcher', label: 'Inspeksi Tandu (Stretcher)',     icon: Activity,    path: '/stretcher' },
];

/* ── NavItem Sub-Component (Floating Pill - Enterprise Clean SaaS) ───────── */
function NavItem({ item, isActive, onClick }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      title={item.label}
      className={`
        relative flex items-center justify-between w-[calc(100%-1.5rem)] my-0.5 text-xs cursor-pointer
        ${isActive
          ? 'bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-900/50 font-medium mx-3 px-4 py-2.5 transition-all'
          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 rounded-xl mx-3 px-4 py-2.5 transition-all'
        }
      `}
    >
      <div className="flex items-center space-x-2.5 min-w-0 flex-1 pr-2">
        <Icon
          className={`w-4 h-4 flex-shrink-0 transition-colors ${
            isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-100'
          }`}
        />
        <span className="truncate flex-1 text-left">{item.label}</span>
      </div>

      {item.badge != null && (
        <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ml-auto animate-pulse">
          {item.badge}
        </span>
      )}
    </button>
  );
}

/* ── Main Sidebar Component (Desktop Permanen Lebar w-64, Responsif HP) ──── */
export default function Sidebar({
  activeTab,
  setActiveTab,
  mobileOpen = false,
  setMobileOpen
}) {
  const { user, logout } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin' || user?.username === 'admin_besmindo';

  /* State Dynamic Alert Badge Count (Real-time DB sync) */
  const [alertBadgeCount, setAlertBadgeCount] = useState(0);
  const [rigAlertCount, setRigAlertCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchBadge = async () => {
      try {
        if (isAdmin) {
          const res = await fetch('http://localhost:5000/api/inspections/alerts');
          if (res.ok) {
            const json = await res.json();
            if (isMounted) {
              const active = typeof json.active_count === 'number' ? json.active_count : (json.total || 0);
              setAlertBadgeCount(active);
            }
          }
        } else if (user?.rig_name) {
          const res = await fetch(`http://localhost:5000/api/inspections/alerts?rig_no=${encodeURIComponent(user.rig_name)}`);
          if (res.ok) {
            const json = await res.json();
            if (isMounted) {
              const openOrRejected = typeof json.open_count === 'number' ? json.open_count : 0;
              setRigAlertCount(openOrRejected);
            }
          }
        }
      } catch {
        // Fallback tetap silent jika server offline
      }
    };
    fetchBadge();
    const interval = setInterval(fetchBadge, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAdmin, user?.rig_name]);

  /* Avatar initials */
  const avatarLabel = isAdmin
    ? 'AB'
    : user?.rig_name
      ? user.rig_name.replace('BMS ', '')
      : 'RG';

  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
      logout();
      navigate('/login', { replace: true });
    }
  };

  const handleMenuClick = (item) => {
    setActiveTab(item.id);
    navigate(item.path);
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  };

  /* Resolve active tab from URL-derived ID */
  const resolveActive = (id) =>
    activeTab === id ||
    (id === 'alert' && (activeTab === 'alerts' || activeTab === 'admin/alerts' || activeTab === 'rig/alerts')) ||
    (id === 'rekap' && (activeTab === 'reports' || activeTab === 'admin/reports')) ||
    (id === 'analitik' && (activeTab === 'analytics' || activeTab === 'admin/analytics'));

  return (
    <>
      {/* ── 1. Overlay Blur Gelap untuk Layar HP (Mobile Drawer Backdrop) ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/75 backdrop-blur-sm transition-opacity duration-300 md:hidden"
          onClick={() => setMobileOpen && setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── 2. Sidebar Container: Desktop Permanen Lebar (w-64), HP Slide-In ── */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 bottom-0 z-50
          flex flex-col h-screen min-h-screen
          bg-slate-900 dark:bg-slate-950
          border-r border-slate-800/80
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
          w-64 md:w-64 max-w-[85vw] flex-shrink-0
        `}
      >
        {/* ── Brand Header (Tanpa Tombol Lipat / Permanen Terbuka) ── */}
        <div className="flex-shrink-0 pt-4 pb-3 px-4 border-b border-slate-800/60 relative">
          <div className="flex items-center justify-between w-full mb-1">
            <div className="bg-white rounded-xl p-2 flex items-center justify-center shadow-md flex-1 mr-2">
              <img
                src="/logo-baru.png"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/besmindo-logo.png';
                }}
                alt="PT. Besmindo Materi Sewatama"
                className="w-full h-auto object-contain max-h-10"
              />
            </div>

            {/* Tombol Tutup HANYA di Layar HP (X) */}
            <button
              type="button"
              onClick={() => setMobileOpen && setMobileOpen(false)}
              className="md:hidden p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              title="Tutup Menu"
              aria-label="Tutup Menu Navigasi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-[10px] text-slate-400 font-bold tracking-widest text-center uppercase mt-1">
            HSE Inspection System
          </p>

          {/* Role badge under logo */}
          <div className="flex justify-center mt-2">
            <span
              className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold tracking-wider uppercase border ${
                isAdmin
                  ? 'bg-amber-400/10 text-amber-300 border-amber-400/30'
                  : 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30'
              }`}
            >
              {isAdmin ? 'Administrator' : (user?.rig_name || 'Rig User')}
            </span>
          </div>
        </div>

        {/* ── 3. Navigation Menus dengan Pengelompokan Estetik ── */}
        <nav className="flex-1 min-h-0 overflow-y-auto scrollbar-hide py-3 space-y-1">
          {isAdmin ? (
            /* ── ADMIN NAV: 3 KELOMPOK (ANALISIS, INSPEKSI, PENGATURAN) ── */
            <>
              {ADMIN_MENU_GROUPS.map((group, gIdx) => (
                <div key={group.groupTitle} className={gIdx > 0 ? 'mt-6' : 'mt-1'}>
                  <p className="text-[11px] font-bold text-slate-500 tracking-widest uppercase px-6 mb-2 mt-6 block">
                    {group.groupTitle}
                  </p>

                  <div className="space-y-0.5">
                    {group.items.map((item) => (
                      <NavItem
                        key={item.id}
                        item={item.id === 'alert' ? { ...item, badge: alertBadgeCount } : item}
                        isActive={resolveActive(item.id)}
                        onClick={handleMenuClick}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </>
          ) : (
            /* ── KARYAWAN RIG NAV (STANDAR ENTERPRISE HSE) ── */
            <>
              {/* 1. DASHBOARD UTAMA */}
              <p className="text-[11px] font-bold text-slate-500 tracking-widest uppercase px-6 mb-2 mt-3 block">
                DASHBOARD UTAMA
              </p>
              <NavItem
                item={{ id: 'dashboard', label: 'Beranda Rig', icon: LayoutDashboard, path: '/dashboard' }}
                isActive={resolveActive('dashboard')}
                onClick={handleMenuClick}
              />

              {/* 2. DAFTAR INSPEKSI HSE */}
              <p className="text-[11px] font-bold text-slate-500 tracking-widest uppercase px-6 mb-2 mt-6 block">
                DAFTAR INSPEKSI HSE
              </p>
              <div className="space-y-0.5">
                {RIG_FORM_MENU.map((item) => (
                  <NavItem
                    key={item.id}
                    item={item}
                    isActive={resolveActive(item.id)}
                    onClick={handleMenuClick}
                  />
                ))}
              </div>

              {/* 3. MONITORING & ALERT */}
              <p className="text-[11px] font-bold text-slate-500 tracking-widest uppercase px-6 mb-2 mt-6 block">
                MONITORING & ALERT
              </p>
              <NavItem
                item={{
                  id: 'alert',
                  label: 'Alert & Perbaikan',
                  icon: AlertTriangle,
                  path: '/alert',
                  description: 'Tindak lanjut perbaikan temuan alat rusak',
                  badge: rigAlertCount > 0 ? rigAlertCount : null
                }}
                isActive={resolveActive('alert')}
                onClick={handleMenuClick}
              />

              {/* 4. BANTUAN */}
              <p className="text-[11px] font-bold text-slate-500 tracking-widest uppercase px-6 mb-2 mt-6 block">
                BANTUAN
              </p>
              <NavItem
                item={{ id: 'guide', label: 'Panduan Penggunaan', icon: BookOpen, path: '/guide', description: 'Buku panduan operator rig' }}
                isActive={resolveActive('guide')}
                onClick={handleMenuClick}
              />
            </>
          )}
        </nav>

        {/* ── 4. Footer: Theme Toggle + Area Profil Interaktif + Logout ── */}
        <div className="mt-auto flex-shrink-0 pb-4 pt-3 px-3 border-t border-slate-800/60 space-y-2">
          {/* Dark / Light mode toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/40 transition shadow-sm cursor-pointer"
            title={isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
          >
            <span className="flex items-center space-x-2">
              {isDark
                ? <Sun className="w-3.5 h-3.5 text-amber-400" />
                : <Moon className="w-3.5 h-3.5 text-cyan-400" />}
              <span className="text-[11px]">{isDark ? 'Mode Terang' : 'Mode Gelap'}</span>
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 uppercase font-mono font-bold">
              {theme}
            </span>
          </button>

          {/* User Profile Card */}
          {user && (
            <div className="rounded-xl border border-slate-700/50 p-2.5 bg-slate-800/60">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-xs flex-shrink-0 shadow-md ring-2 ring-blue-500/30">
                  {avatarLabel}
                </div>
                <div className="overflow-hidden flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate leading-tight">
                    {user.name || user.username}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {isAdmin ? 'Administrator' : (user.rig_name || 'Karyawan Rig')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center w-full space-x-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer"
            title="Keluar / Logout"
          >
            <LogOut className="w-3.5 h-3.5 text-red-400" />
            <span>Keluar / Logout</span>
          </button>

          {/* Watermark / Credit Developer */}
          <p className="text-[10px] text-slate-600 tracking-widest text-center mt-4 mb-1 font-semibold uppercase cursor-default hover:text-slate-500 transition-colors duration-300">
            Developed by Fudhla Aulia
          </p>
        </div>
      </aside>
    </>
  );
}