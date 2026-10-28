import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { PeriodProvider, usePeriod } from './context/PeriodContext';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import DashboardOverview from './components/DashboardOverview';

// 9 Komponen Formulir Inspeksi HSE
import AparForm from './components/forms/AparForm';
import ApdForm from './components/forms/ApdForm';
import EyewashForm from './components/forms/EyewashForm';
import FirstAidForm from './components/forms/FirstAidForm';
import HarnessForm from './components/forms/HarnessForm';
import OxigentForm from './components/forms/OxigentForm';
import ScbaForm from './components/forms/ScbaForm';
import SpillKitForm from './components/forms/SpillKitForm';
import StretcherForm from './components/forms/StretcherForm';

// Halaman Khusus Admin
import AlertPage from './pages/AlertPage';
import ReportPage from './pages/ReportPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AdminRigAccountsPage from './pages/AdminRigAccountsPage';
import ManageRigPage from './pages/ManageRigPage';

// Halaman Buku Panduan Pengguna (User Guide)
import UserGuide from './pages/UserGuide';

/* ─── Helper: URL path → activeTab ID ─────────────────────────── */
function pathToTabId(pathname) {
  const clean = pathname.replace(/^\//, '');
  if (!clean || clean === 'dashboard') return 'dashboard';
  if (clean === 'alert' || clean === 'alerts' || clean === 'admin/alerts' || clean === 'rig/alerts') return 'alert';
  if (clean === 'rekap' || clean === 'admin/reports') return 'rekap';
  if (clean === 'analitik' || clean === 'admin/analytics') return 'analitik';
  if (clean === 'admin/rig-accounts' || clean === 'manage-rigs' || clean === 'admin/manage-rigs') return 'rig-accounts';
  if (clean.startsWith('admin/')) return clean.replace('admin/', '');
  // strip query string — split on '?'
  return clean.split('?')[0];
}

/* ─── Form route wrapper — membaca searchParams & pass ke form ─── */
function FormRoute({ FormComponent, onBack }) {
  const { user } = useAuth();
  const { selectedMonth, selectedYear, setSelectedMonth, setSelectedYear } = usePeriod();
  const [searchParams] = useSearchParams();

  // Ambil override dari URL query string (dikirim oleh Admin dari Dashboard)
  const rigFromUrl   = searchParams.get('rig')   || null;
  const monthQuery   = searchParams.get('month');
  const yearQuery    = searchParams.get('year');

  const monthFromUrl = monthQuery ? Number(monthQuery) : selectedMonth;
  const yearFromUrl  = yearQuery  ? Number(yearQuery)  : selectedYear;

  // Sinkronisasi ke Global Period jika ada query param di URL
  useEffect(() => {
    if (monthQuery && Number(monthQuery) !== selectedMonth) {
      setSelectedMonth(Number(monthQuery));
    }
    if (yearQuery && Number(yearQuery) !== selectedYear) {
      setSelectedYear(Number(yearQuery));
    }
  }, [monthQuery, yearQuery, selectedMonth, selectedYear, setSelectedMonth, setSelectedYear]);

  return (
    <div className="form-sheet">
      <FormComponent
        onBack={onBack}
        currentUser={user}
        overrideRigNo={rigFromUrl}
        viewMonth={monthFromUrl}
        viewYear={yearFromUrl}
      />
    </div>
  );
}

/* ─── ProtectedLayout ──────────────────────────────────────────── */
function ProtectedLayout() {
  const { isAuthenticated, user } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();

  const [activeTab, setActiveTab] = useState(() => pathToTabId(location.pathname));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setActiveTab(pathToTabId(location.pathname));
    setMobileMenuOpen(false);
  }, [location.pathname]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  /**
   * handleSelectForm — dipanggil dari DashboardOverview.
   * Menerima: formKey (string) ATAU objek { formKey, rigName, month, year }
   */
  const handleSelectForm = (formKeyOrObj, rigName, month, year) => {
    let key, rig, mon, yr;

    if (typeof formKeyOrObj === 'object' && formKeyOrObj !== null) {
      ({ formKey: key, rigName: rig, month: mon, year: yr } = formKeyOrObj);
    } else {
      key = formKeyOrObj;
      rig = rigName;
      mon = month;
      yr  = year;
    }

    setActiveTab(key);

    // Bangun URL dengan query params jika ada overrides
    const params = new URLSearchParams();
    if (rig) params.set('rig', rig);
    if (mon) params.set('month', String(mon));
    if (yr)  params.set('year',  String(yr));

    const qs = params.toString() ? `?${params.toString()}` : '';
    navigate(`/${key}${qs}`);
  };

  const handleBackToDashboard = () => {
    setActiveTab('dashboard');
    navigate('/dashboard');
  };

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 transition-colors duration-200">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* ── Sticky Topbar Khusus Layar HP / Mobile Web ── */}
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-3.5 py-2.5 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-white shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
              aria-label="Buka Menu Navigasi"
            >
              <Menu size={22} />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center flex-shrink-0 shadow-sm">
                <img src="/logo-baru.png" alt="Besmindo" className="max-h-full max-w-full object-contain" />
              </div>
              <div className="truncate">
                <div className="text-xs font-bold tracking-tight text-white uppercase leading-none truncate">
                  BESMINDO HSE
                </div>
                <div className="text-[10px] text-slate-400 font-medium leading-none mt-0.5 truncate">
                  Inspection System
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {user?.role === 'admin' ? (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                ADMIN
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {user?.rig_name || 'RIG'}
              </span>
            )}
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto custom-scrollbar">
          <Routes>
            {/* ── Dashboard ── */}
            <Route path="/"         element={<DashboardOverview onSelectForm={handleSelectForm} />} />
            <Route path="/dashboard" element={<DashboardOverview onSelectForm={handleSelectForm} />} />

            {/* ── Admin & Rig Alert pages ── */}
            <Route path="/alert"              element={<AlertPage />} />
            <Route path="/alerts"             element={<AlertPage />} />
            <Route path="/rig/alerts"         element={<AlertPage />} />
            <Route path="/rekap"              element={<ReportPage />} />
            <Route path="/analitik"           element={<AnalyticsPage />} />
            <Route path="/admin/alerts"       element={<AlertPage />} />
            <Route path="/admin/reports"      element={<ReportPage />} />
            <Route path="/admin/rig-accounts" element={<ManageRigPage />} />
            <Route path="/manage-rigs"       element={<ManageRigPage />} />
            <Route path="/admin/manage-rigs" element={<ManageRigPage />} />

            {/* ── Buku Panduan Pengguna (User Guide) ── */}
            <Route path="/guide"              element={<UserGuide />} />

            {/* ── Form routes — semua lewat FormRoute wrapper ── */}
            <Route path="/apar"      element={<FormRoute FormComponent={AparForm}      onBack={handleBackToDashboard} />} />
            <Route path="/apd"       element={<FormRoute FormComponent={ApdForm}       onBack={handleBackToDashboard} />} />
            <Route path="/eyewash"   element={<FormRoute FormComponent={EyewashForm}   onBack={handleBackToDashboard} />} />
            <Route path="/firstaid"  element={<FormRoute FormComponent={FirstAidForm}  onBack={handleBackToDashboard} />} />
            <Route path="/harness"   element={<FormRoute FormComponent={HarnessForm}   onBack={handleBackToDashboard} />} />
            <Route path="/oxigent"   element={<FormRoute FormComponent={OxigentForm}   onBack={handleBackToDashboard} />} />
            <Route path="/scba"      element={<FormRoute FormComponent={ScbaForm}      onBack={handleBackToDashboard} />} />
            <Route path="/spillkit"  element={<FormRoute FormComponent={SpillKitForm}  onBack={handleBackToDashboard} />} />
            <Route path="/stretcher" element={<FormRoute FormComponent={StretcherForm} onBack={handleBackToDashboard} />} />

            {/* ── Fallback ── */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

/* ─── Login page ─────────────────────────────────────────────── */
function LoginPage() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Login />;
}

/* ─── Root App ───────────────────────────────────────────────── */
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PeriodProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/*"     element={<ProtectedLayout />} />
            </Routes>
          </BrowserRouter>
        </PeriodProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}