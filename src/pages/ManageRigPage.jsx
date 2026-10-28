import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  Key, 
  RefreshCw, 
  AlertCircle, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  X, 
  Edit3, 
  Check,
  User,
  Plus,
  Archive,
  Trash2,
  RotateCcw,
  Power,
  Search,
  Building2,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../constants/periodConstants';

function suggestUsername(rigName) {
  if (!rigName) return '';
  const clean = rigName.trim().toLowerCase();
  return 'bms_' + clean.replace(/^bms\s*/i, '').replace(/[^a-z0-9]/g, '_');
}

export default function ManageRigPage() {
  const { user, token, login } = useAuth();
  const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('bms_token') : null);

  const [rigs, setRigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'

  // ── Admin Profile State (Pengaturan Akun Administrator) ──
  const [adminName, setAdminName] = useState(user?.name || 'Admin Besmindo');
  const [adminOldPassword, setAdminOldPassword] = useState('');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [showAdminOldPassword, setShowAdminOldPassword] = useState(false);
  const [showAdminNewPassword, setShowAdminNewPassword] = useState(false);
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');

  useEffect(() => {
    if (user?.name) {
      setAdminName(user.name);
    }
  }, [user?.name]);

  // ── Modal State: Tambah Rig Baru ──
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRigName, setNewRigName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newRigPassword, setNewRigPassword] = useState('');
  const [showNewRigPassword, setShowNewRigPassword] = useState(false);
  const [addingRig, setAddingRig] = useState(false);
  const [addError, setAddError] = useState('');

  // ── Modal State: Edit Password Rig ──
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [modalError, setModalError] = useState('');

  // ── Modal State: Konfirmasi Arsip Rig (Soft Delete) ──
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [isArchiving, setIsArchiving] = useState(false);

  // ── Modal State: Konfirmasi Hapus Permanen (Proteksi Password Admin) ──
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState(null);
  const [adminDeletePassword, setAdminDeletePassword] = useState('');
  const [showAdminDeletePass, setShowAdminDeletePass] = useState(false);
  const [isPermanentlyDeleting, setIsPermanentlyDeleting] = useState(false);
  const [permanentDeleteError, setPermanentDeleteError] = useState('');

  // ── Password Visibility di Tabel ──
  const [showAllPasswords, setShowAllPasswords] = useState(false);
  const [showPasswordMap, setShowPasswordMap] = useState({});

  const toggleRowPassword = (id) => {
    setShowPasswordMap(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // ── Helper Toast ──
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  // ── 1. READ: Fetch Data Rigs dari MySQL Backend ──
  const fetchRigs = async () => {
    setLoading(true);
    try {
      const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
      const res = await fetch(`${API_BASE_URL}/api/rigs?include_archived=true`, { headers });
      const result = await res.json();
      if (res.ok && result.success && Array.isArray(result.data)) {
        setRigs(result.data);
      } else {
        throw new Error(result.message || 'Gagal memuat data akun rig.');
      }
    } catch (err) {
      console.error('Error fetching rigs:', err);
      showToast(err.message || 'Gagal terhubung ke database rig.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRigs();
  }, []);

  // ── 2. CREATE: Tambah Akun Rig Baru ──
  const handleOpenAddModal = () => {
    setNewRigName('');
    setNewUsername('');
    setNewRigPassword('');
    setShowNewRigPassword(false);
    setAddError('');
    setIsAddModalOpen(true);
  };

  const handleRigNameChange = (val) => {
    setNewRigName(val);
    // Auto-suggest username jika belum diedit manual atau diawali 'bms_'
    if (!newUsername || newUsername.startsWith('bms_')) {
      setNewUsername(suggestUsername(val));
    }
  };

  const handleCreateRig = async (e) => {
    e.preventDefault();
    setAddError('');

    if (!newRigName.trim()) {
      setAddError('Nama Rig wajib diisi!');
      return;
    }
    if (!newUsername.trim()) {
      setAddError('Username login wajib diisi!');
      return;
    }
    if (!newRigPassword || newRigPassword.trim().length < 8) {
      setAddError('Password minimal harus 8 karakter.');
      return;
    }

    setAddingRig(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      };
      const res = await fetch(`${API_BASE_URL}/api/rigs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          rig_name: newRigName.trim(),
          username: newUsername.trim(),
          password: newRigPassword.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal menambahkan akun Rig.');
      }

      showToast(data.message || `Akun Rig ${newRigName} berhasil ditambahkan!`);
      setIsAddModalOpen(false);
      fetchRigs();
    } catch (err) {
      setAddError(err.message || 'Terjadi kesalahan saat menambahkan akun Rig.');
    } finally {
      setAddingRig(false);
    }
  };

  // ── 3. UPDATE: Edit Password Rig ──
  const handleOpenPasswordModal = (account) => {
    setSelectedUser(account);
    const currentPass = account?.password && !account.password.includes('Bcrypt') && !account.password.startsWith('$2')
      ? account.password
      : (account?.password || '');
    setNewPassword(currentPass);
    setConfirmPassword(currentPass);
    setShowPassword(true);
    setShowConfirmPassword(true);
    setModalError('');
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!newPassword || newPassword.trim().length < 8) {
      setModalError('Password minimal harus 8 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setModalError('Konfirmasi password tidak cocok dengan password baru!');
      return;
    }

    setSavingPassword(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      };
      const res = await fetch(`${API_BASE_URL}/api/rigs/${selectedUser.id}/password`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          newPassword: newPassword.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal mengubah password');
      }

      setRigs(prev => prev.map(acc => {
        if (acc.id === selectedUser.id) {
          return { ...acc, password: newPassword.trim() };
        }
        return acc;
      }));

      showToast(`Password untuk ${selectedUser.rig_name || selectedUser.username} berhasil diubah!`);
      setSelectedUser(null);
    } catch (err) {
      setModalError(err.message || 'Terjadi kesalahan saat menyimpan password');
    } finally {
      setSavingPassword(false);
    }
  };

  // ── 4. TOGGLE STATUS: Aktifkan / Nonaktifkan Rig ──
  const handleToggleStatus = async (account) => {
    const targetStatus = account.status === 'inactive' ? 'active' : 'inactive';
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      };
      const res = await fetch(`${API_BASE_URL}/api/rigs/${account.id}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: targetStatus })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Gagal mengubah status rig');

      setRigs(prev => prev.map(r => r.id === account.id ? { ...r, status: targetStatus } : r));
      showToast(data.message || `Status ${account.rig_name} berhasil diubah.`);
    } catch (err) {
      showToast(err.message || 'Gagal memperbarui status rig', 'error');
    }
  };

  // ── 5. ARCHIVE: Arsipkan Rig (Soft Delete) ──
  const handleArchiveRig = async () => {
    if (!archiveTarget) return;
    setIsArchiving(true);
    try {
      const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
      const url = `${API_BASE_URL}/api/rigs/${archiveTarget.id}/archive`;
      const res = await fetch(url, { method: 'PUT', headers });
      const data = await res.json();

      if (!res.ok || !data.success) throw new Error(data.message || 'Gagal mengarsipkan akun rig.');

      // Update state: tandai akun sebagai diarsipkan
      setRigs(prev => prev.map(r => r.id === archiveTarget.id ? { ...r, is_archived: 1, status: 'inactive' } : r));

      showToast(data.message || `Akun ${archiveTarget.rig_name || archiveTarget.username} berhasil diarsipkan.`);
      setArchiveTarget(null);
    } catch (err) {
      showToast(err.message || 'Gagal mengarsipkan akun rig.', 'error');
    } finally {
      setIsArchiving(false);
    }
  };

  // ── 5b. RESTORE: Pulihkan Akun Rig dari Arsip ──
  const [restoringId, setRestoringId] = useState(null);
  const handleRestoreRig = async (account) => {
    setRestoringId(account.id);
    try {
      const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
      const url = `${API_BASE_URL}/api/rigs/${account.id}/restore`;
      const res = await fetch(url, { method: 'PUT', headers });
      const data = await res.json();

      if (!res.ok || !data.success) throw new Error(data.message || 'Gagal memulihkan akun rig.');

      setRigs(prev => prev.map(r => r.id === account.id ? { ...r, is_archived: 0, status: 'active' } : r));
      showToast(data.message || `Akun ${account.rig_name || account.username} berhasil dipulihkan dari arsip!`);
    } catch (err) {
      showToast(err.message || 'Gagal memulihkan rig dari arsip.', 'error');
    } finally {
      setRestoringId(null);
    }
  };

  // ── 5c. PERMANENT DELETE: Hapus Rig Permanen dengan Verifikasi Password Admin ──
  const handleConfirmPermanentDelete = async (e) => {
    if (e) e.preventDefault();
    if (!permanentDeleteTarget) return;

    if (!adminDeletePassword.trim()) {
      setPermanentDeleteError('Kata sandi Administrator wajib dimasukkan!');
      return;
    }

    setIsPermanentlyDeleting(true);
    setPermanentDeleteError('');

    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      };
      const res = await fetch(`${API_BASE_URL}/api/rigs/${permanentDeleteTarget.id}/delete-permanent`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ adminPassword: adminDeletePassword.trim() })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal menghapus akun rig secara permanen.');
      }

      // Hapus akun dari state
      setRigs(prev => prev.filter(r => r.id !== permanentDeleteTarget.id));
      showToast(data.message || `Akun ${permanentDeleteTarget.rig_name || permanentDeleteTarget.username} berhasil dihapus permanen.`);
      setPermanentDeleteTarget(null);
      setAdminDeletePassword('');
      setShowAdminDeletePass(false);
    } catch (err) {
      console.error('Error permanently deleting rig:', err);
      setPermanentDeleteError(err.message || 'Gagal menghapus rig. Silakan periksa kembali kata sandi Administrator.');
    } finally {
      setIsPermanentlyDeleting(false);
    }
  };

  // ── 6. UPDATE PROFIL ADMIN MASTER ──
  const handleSaveAdminProfile = async (e) => {
    e.preventDefault();
    setAdminError('');
    setAdminSuccess('');

    if (adminNewPassword && adminNewPassword.trim().length > 0) {
      if (adminNewPassword.trim().length < 6) {
        setAdminError('Kata sandi baru minimal harus 6 karakter!');
        return;
      }
      if (!adminOldPassword || adminOldPassword.trim().length === 0) {
        setAdminError('Kata sandi lama wajib diisi untuk verifikasi keamanan!');
        return;
      }
    }

    setSavingAdmin(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      };
      const res = await fetch(`${API_BASE_URL}/api/admin/profile`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          name: adminName.trim(),
          oldPassword: adminOldPassword.trim(),
          newPassword: adminNewPassword.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal menyimpan perubahan profil admin.');
      }

      if (user && login) {
        login({ ...user, name: adminName.trim() }, authToken);
      }

      setAdminSuccess(data.message || 'Profil Administrator berhasil diperbarui!');
      showToast(data.message || 'Profil Administrator berhasil diperbarui!');
      setAdminOldPassword('');
      setAdminNewPassword('');
    } catch (err) {
      console.error('Error saving admin profile:', err);
      setAdminError(err.message || 'Terjadi kesalahan saat memperbarui profil admin.');
    } finally {
      setSavingAdmin(false);
    }
  };

  // ── Data Rig Non-Arsip & Arsip ──
  const nonArchivedRigs = rigs.filter(r => !r.is_archived || r.is_archived === 0);
  const archivedRigs = rigs.filter(r => r.is_archived === 1 || r.is_archived === true);

  // ── Filtered Rigs ──
  const filteredRigs = rigs.filter((r) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      (r.rig_name && r.rig_name.toLowerCase().includes(q)) ||
      (r.username && r.username.toLowerCase().includes(q));

    const isArchived = r.is_archived === 1 || r.is_archived === true;
    const isRigActive = r.status !== 'inactive';

    if (statusFilter === 'archived') {
      return matchesSearch && isArchived;
    }

    // Jika filter tab selain 'archived', sembunyikan akun yang diarsipkan
    if (isArchived) return false;

    if (statusFilter === 'active') return matchesSearch && isRigActive;
    if (statusFilter === 'inactive') return matchesSearch && !isRigActive;
    return matchesSearch;
  });

  const totalActiveRigs = nonArchivedRigs.filter(r => r.status !== 'inactive').length;
  const totalInactiveRigs = nonArchivedRigs.filter(r => r.status === 'inactive').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`p-4 rounded-xl flex items-center space-x-2 text-xs font-bold shadow-lg transition-all animate-in fade-in slide-in-from-top-2 fixed top-5 right-5 z-50 ${
          toast.type === 'success' 
            ? 'bg-emerald-600 text-white shadow-emerald-500/20' 
            : 'bg-rose-600 text-white shadow-rose-500/20'
        }`}>
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── 1. HEADER HALAMAN & TOMBOL TAMBAH RIG BARU ── */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-cyan-300 dark:border dark:border-blue-800">
              User Management
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 flex items-center space-x-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            <span>Kelola Akun Rig (Manage Rig Accounts)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tambah Rig baru, ubah kata sandi, dan atur akun karyawan Rig yang terdaftar di database MySQL.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchRigs}
            disabled={loading}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
            title="Segarkan daftar akun"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 hover:shadow-blue-600/30 active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Rig Baru</span>
          </button>
        </div>
      </div>

      {/* ── 2. METRIK RINGKASAN AKUN RIG ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Rig Terdaftar
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {nonArchivedRigs.length} <span className="text-xs text-slate-400 font-normal">Akun</span>
            </h3>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Rig Aktif (Operasional)
            </p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {totalActiveRigs} <span className="text-xs text-emerald-600/70 font-normal">Rig Aktif</span>
            </h3>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Rig Nonaktif
            </p>
            <h3 className="text-2xl font-black text-slate-700 dark:text-slate-300 mt-1">
              {totalInactiveRigs} <span className="text-xs text-slate-400 font-normal">Nonaktif</span>
            </h3>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
            <Power className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── 3. CARD PENGATURAN AKUN ADMINISTRATOR MASTER ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Pengaturan Akun Administrator</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold uppercase tracking-wider">
                  Admin Master
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Perbarui nama tampilan dan kata sandi login Administrator Besmindo secara langsung.
              </p>
            </div>
          </div>
        </div>

        {/* Feedback Alert Banners */}
        {adminError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
              <span>{adminError}</span>
            </div>
            <button
              type="button"
              onClick={() => setAdminError('')}
              className="text-rose-400 hover:text-rose-600 dark:hover:text-rose-200 text-xs font-bold"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {adminSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-500" />
              <span>{adminSuccess}</span>
            </div>
            <button
              type="button"
              onClick={() => setAdminSuccess('')}
              className="text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-200 text-xs font-bold"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <form onSubmit={handleSaveAdminProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-blue-500" />
                <span>Nama Tampilan Admin</span>
              </label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="Contoh: Admin Besmindo"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                required
              />
              <p className="text-[10px] text-slate-400">
                Nama yang tampil di sidebar & sistem.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Kata Sandi Lama</span>
              </label>
              <div className="relative">
                <input
                  type={showAdminOldPassword ? 'text' : 'password'}
                  value={adminOldPassword}
                  onChange={(e) => setAdminOldPassword(e.target.value)}
                  placeholder="Diperlukan jika ganti sandi"
                  className="w-full pl-3 pr-10 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminOldPassword(!showAdminOldPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showAdminOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                Verifikasi untuk mengganti kata sandi.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <Key className="w-3.5 h-3.5 text-slate-400" />
                <span>Kata Sandi Baru</span>
              </label>
              <div className="relative">
                <input
                  type={showAdminNewPassword ? 'text' : 'password'}
                  value={adminNewPassword}
                  onChange={(e) => setAdminNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full pl-3 pr-10 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminNewPassword(!showAdminNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showAdminNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                Kosongkan jika hanya ingin mengubah nama.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 italic">
              * Biarkan field kata sandi kosong jika hanya ingin memperbarui Nama Tampilan Admin.
            </span>
            <button
              type="submit"
              disabled={savingAdmin}
              className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm disabled:opacity-50 cursor-pointer w-full sm:w-auto"
            >
              {savingAdmin ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan Perubahan...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan Admin</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── 4. FILTER PENCARIAN & TABEL DAFTAR RIG ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        
        {/* Search & Status Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
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

          <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              Semua ({nonArchivedRigs.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                statusFilter === 'active'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              Aktif ({totalActiveRigs})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                statusFilter === 'inactive'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              Nonaktif ({totalInactiveRigs})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('archived')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
                statusFilter === 'archived'
                  ? 'bg-slate-800 text-white dark:bg-slate-700 shadow-sm ring-1 ring-slate-400'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Arsip ({archivedRigs.length})</span>
            </button>
          </div>
        </div>

        {/* Tabel Data Rig */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                <th className="text-left px-4 py-3 font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">#</th>
                <th className="text-left px-4 py-3 font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">Nama Rig</th>
                <th className="text-left px-4 py-3 font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">Username Login</th>
                <th className="text-left px-4 py-3 font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  <div className="flex items-center space-x-1.5">
                    <span>Password</span>
                    <button
                      type="button"
                      onClick={() => setShowAllPasswords(!showAllPasswords)}
                      className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 transition cursor-pointer"
                      title={showAllPasswords ? "Sembunyikan semua password" : "Tampilkan semua password (Plain Text)"}
                    >
                      {showAllPasswords ? <EyeOff className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </th>
                <th className="text-center px-4 py-3 font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">Aksi Kelola</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Memuat daftar seluruh akun Rig...
                  </td>
                </tr>
              ) : filteredRigs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Tidak ada data Rig yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredRigs.map((acc, idx) => {
                  const isArchived = acc.is_archived === 1 || acc.is_archived === true;
                  const isActive = !isArchived && acc.status !== 'inactive';
                  const rigLabel = acc.rig_name || acc.username;

                  return (
                    <tr
                      key={acc.id || acc.username}
                      className={`border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition ${
                        isArchived
                          ? 'bg-slate-50/70 dark:bg-slate-900/60'
                          : !isActive 
                            ? 'opacity-60 bg-slate-50/50 dark:bg-slate-950/40' 
                            : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <span className={`w-7 h-7 rounded-lg font-black text-[11px] flex items-center justify-center ${
                            isArchived
                              ? 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              : 'bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                          }`}>
                            {(rigLabel.replace(/^BMS\s*/i, '') || 'R').slice(0, 3)}
                          </span>
                          <span className="font-extrabold text-slate-900 dark:text-white">
                            {rigLabel}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-blue-600 dark:text-cyan-400 font-bold">
                        {acc.username}
                      </td>
                      <td className="px-4 py-3">
                        {isArchived ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                            <Archive className="w-3 h-3 text-slate-400" />
                            <span>Diarsipkan</span>
                          </span>
                        ) : isActive ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>Aktif</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                            <span>Nonaktif</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                        <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg w-fit border border-slate-200 dark:border-slate-700 shadow-2xs">
                          <Key className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="font-bold select-all tracking-wide text-xs">
                            {(showAllPasswords || showPasswordMap[acc.id])
                              ? (acc.password || '-')
                              : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleRowPassword(acc.id)}
                            className="text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 transition cursor-pointer p-0.5 rounded hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
                            title={(showAllPasswords || showPasswordMap[acc.id]) ? "Sembunyikan Password" : "Lihat Password Asli"}
                          >
                            {(showAllPasswords || showPasswordMap[acc.id]) ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {isArchived ? (
                            <>
                              <button
                                type="button"
                                disabled={restoringId === acc.id}
                                onClick={() => handleRestoreRig(acc)}
                                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer shadow-xs disabled:opacity-50"
                                title="Pulihkan dan aktifkan kembali akun Rig ini"
                              >
                                <RotateCcw className={`w-3.5 h-3.5 ${restoringId === acc.id ? 'animate-spin' : ''}`} />
                                <span>Pulihkan Akun</span>
                              </button>

                              {/* Tombol Hapus Permanen (Agak blur & diproteksi sandi admin) */}
                              <button
                                type="button"
                                onClick={() => {
                                  setPermanentDeleteTarget(acc);
                                  setAdminDeletePassword('');
                                  setShowAdminDeletePass(false);
                                  setPermanentDeleteError('');
                                }}
                                className="p-1.5 rounded-lg text-rose-500/50 hover:text-rose-600 bg-rose-50/40 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/60 border border-rose-200/40 hover:border-rose-300 dark:border-rose-900/30 backdrop-blur-xs filter blur-[0.4px] hover:filter-none transition-all duration-200 cursor-pointer shadow-xs group"
                                title="Hapus Permanen dari Database (Perlu Sandi Admin)"
                              >
                                <Trash2 className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                              </button>
                            </>
                          ) : (
                            <>
                              {/* Tombol Edit Password */}
                              <button
                                type="button"
                                onClick={() => handleOpenPasswordModal(acc)}
                                className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                                title={`Ubah Password untuk ${rigLabel}`}
                              >
                                <Lock className="w-3 h-3" />
                                <span>Edit Password</span>
                              </button>

                              {/* Tombol Toggle Status */}
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(acc)}
                                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                  isActive
                                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-300'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300'
                                }`}
                                title={isActive ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                              >
                                <Power className="w-3.5 h-3.5" />
                              </button>

                              {/* Tombol Arsip (Soft Delete) */}
                              <button
                                type="button"
                                onClick={() => setArchiveTarget(acc)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer shadow-xs"
                                title="Arsipkan Akun Rig (Soft Delete)"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>

                              {/* Tombol Hapus Permanen (Agak blur & diproteksi sandi admin) */}
                              <button
                                type="button"
                                onClick={() => {
                                  setPermanentDeleteTarget(acc);
                                  setAdminDeletePassword('');
                                  setShowAdminDeletePass(false);
                                  setPermanentDeleteError('');
                                }}
                                className="p-1.5 rounded-lg text-rose-500/50 hover:text-rose-600 bg-rose-50/40 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/60 border border-rose-200/40 hover:border-rose-300 dark:border-rose-900/30 backdrop-blur-xs filter blur-[0.4px] hover:filter-none transition-all duration-200 cursor-pointer shadow-xs group"
                                title="Hapus Permanen dari Database (Perlu Sandi Admin)"
                              >
                                <Trash2 className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Total <strong className="text-slate-700 dark:text-slate-200">{filteredRigs.length}</strong> akun Rig ditampilkan. Setiap Rig baru yang Anda tambahkan otomatis muncul di Dashboard Utama.
            </span>
          </div>
        </div>
      </div>

      {/* ── MODAL: TAMBAH RIG BARU ── */}
      {isAddModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-300 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-xs">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Tambah Rig Baru
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Daftarkan akun Rig baru ke sistem operasional
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRig} className="p-5 space-y-4">
              {addError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
                  <span>{addError}</span>
                </div>
              )}

              {/* 1. Nama Rig */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Nama Rig <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newRigName}
                  onChange={(e) => handleRigNameChange(e.target.value)}
                  placeholder="Contoh: BMS 24 atau BMS 25"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium uppercase"
                  required
                  autoFocus
                />
                <p className="text-[10px] text-slate-400">
                  Label Rig yang akan ditampilkan pada dashboard dan formulir.
                </p>
              </div>

              {/* 2. Username Login */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Username Login <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="Contoh: bms_24"
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  required
                />
                <p className="text-[10px] text-slate-400">
                  Username unik untuk login operator Rig.
                </p>
              </div>

              {/* 3. Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewRigPassword ? 'text' : 'password'}
                    value={newRigPassword}
                    onChange={(e) => setNewRigPassword(e.target.value)}
                    placeholder="Minimal 8 karakter (misal: 24242424)"
                    minLength={8}
                    className="w-full pl-3 pr-10 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewRigPassword(!showNewRigPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showNewRigPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={addingRig}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addingRig}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {addingRig ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Daftarkan Rig</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: EDIT PASSWORD RIG ── */}
      {selectedUser && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedUser(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-300 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-xs">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Ganti Password Akun
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {selectedUser.rig_name || selectedUser.username} ({selectedUser.username})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePassword} className="p-5 space-y-4">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Password Baru <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    minLength={8}
                    className="w-full pl-3 pr-10 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Konfirmasi Password Baru <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru (min. 8 karakter)"
                    minLength={8}
                    className="w-full pl-3 pr-10 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  disabled={savingPassword}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {savingPassword ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Simpan Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: KONFIRMASI ARSIPKAN RIG (SOFT DELETE) ── */}
      {archiveTarget && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => setArchiveTarget(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full border border-slate-300 dark:border-slate-700 shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center mx-auto mb-4 border border-slate-200 dark:border-slate-700">
              <Archive className="w-6 h-6" />
            </div>

            <h3 className="text-center font-black text-base text-slate-900 dark:text-white">
              Arsipkan Akun {archiveTarget.rig_name || archiveTarget.username}?
            </h3>
            <p className="text-center text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
              Apakah Anda yakin ingin mengarsipkan Rig ini? Rig tidak akan bisa login, namun riwayat laporannya akan tetap tersimpan aman.
            </p>

            <div className="mt-6 space-y-2.5">
              <button
                type="button"
                disabled={isArchiving}
                onClick={handleArchiveRig}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center justify-center space-x-2"
              >
                {isArchiving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Mengarsipkan...</span>
                  </>
                ) : (
                  <>
                    <Archive className="w-3.5 h-3.5" />
                    <span>Ya, Arsipkan Rig</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isArchiving}
                onClick={() => setArchiveTarget(null)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: KONFIRMASI HAPUS PERMANEN (PROTEKSI PASSWORD ADMIN & BLUR BACKDROP) ── */}
      {permanentDeleteTarget && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => !isPermanentlyDeleting && setPermanentDeleteTarget(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full border border-rose-200 dark:border-rose-900/60 shadow-2xl p-6 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Red accent strip */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-red-500 to-rose-600"></div>

            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3.5 border border-rose-200 dark:border-rose-800/60 shadow-inner">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-center font-black text-base text-slate-900 dark:text-white">
              Hapus Permanen {permanentDeleteTarget.rig_name || permanentDeleteTarget.username}?
            </h3>
            
            <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Tindakan ini <strong className="text-rose-600 dark:text-rose-400 font-semibold">permanen</strong> dan akan menghapus akun Rig ini sepenuhnya dari database MySQL.
            </p>

            <form onSubmit={handleConfirmPermanentDelete} className="mt-4 space-y-3">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-start space-x-2 text-left">
                <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-snug">
                  <strong>Verifikasi Admin:</strong> Masukkan kata sandi Administrator untuk mengonfirmasi penghapusan.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-left">
                  Kata Sandi Administrator Master
                </label>
                <div className="relative">
                  <input
                    type={showAdminDeletePass ? 'text' : 'password'}
                    value={adminDeletePassword}
                    onChange={(e) => {
                      setAdminDeletePassword(e.target.value);
                      setPermanentDeleteError('');
                    }}
                    placeholder="Masukkan sandi admin..."
                    autoFocus
                    className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                  />
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <button
                    type="button"
                    onClick={() => setShowAdminDeletePass(!showAdminDeletePass)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showAdminDeletePass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {permanentDeleteError && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center space-x-2 text-rose-600 dark:text-rose-400 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{permanentDeleteError}</span>
                </div>
              )}

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={isPermanentlyDeleting || !adminDeletePassword.trim()}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition cursor-pointer flex items-center justify-center space-x-2"
                >
                  {isPermanentlyDeleting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menghapus dari DB...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Permanen Akun</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isPermanentlyDeleting}
                  onClick={() => setPermanentDeleteTarget(null)}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
