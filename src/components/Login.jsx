import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  LogIn, 
  AlertCircle, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Sun, 
  Moon,
  Sparkles
} from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAccountList, setShowAccountList] = useState(false);

  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Harap masukkan username dan password!');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim()
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Login gagal. Periksa kembali username dan password.');
      }

      // Simpan session user dan token
      login(data.user, data.token);

      // Arahkan ke dashboard
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Terjadi gangguan saat menghubungkan ke server.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-blue-500 selection:text-white">
      
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[130px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-cyan-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[40%] right-[30%] w-[350px] h-[350px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Bar with Theme Toggle */}
      <div className="absolute top-4 right-4 z-20 flex items-center space-x-2">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800 transition backdrop-blur-md shadow-lg flex items-center space-x-1.5 text-xs font-semibold"
          title={isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
        >
          {isDark ? (
            <>
              <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
              <span className="hidden sm:inline text-slate-200">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline text-slate-200">Dark Mode</span>
            </>
          )}
        </button>
      </div>

      {/* Main Glassmorphic Login Card */}
      <div className="w-full max-w-md relative z-10">
        
        {/* Card Outer Shell with Subtle Border Gradient */}
        <div className="relative rounded-3xl p-[1px] bg-gradient-to-b from-blue-500/30 via-slate-700/30 to-blue-600/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
          
          <div className="rounded-[23px] bg-slate-900/85 backdrop-blur-xl border border-slate-800/80 overflow-hidden">
            
            {/* Header with Animated Besmindo Logo */}
            <div className="p-7 pb-4 text-center flex flex-col items-center border-b border-slate-800/80 relative">
              
              {/* Subtle top light bar */}
              <div className="absolute top-0 inset-x-12 h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-60" />

              {/* Logo Baru PT. Besmindo Materi Sewatama */}
              <div className="relative mb-3 group flex items-center justify-center w-full px-2">
                {/* Glow ambient halus di belakang logo */}
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-600/30 via-cyan-400/25 to-blue-600/30 rounded-2xl blur-xl opacity-60 group-hover:opacity-90 transition duration-500 pointer-events-none" />
                
                <div className="relative p-2.5 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-lg backdrop-blur-md max-w-[280px] w-full flex items-center justify-center">
                  <img
                    src="/logo-baru.png"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/besmindo-logo.png';
                    }}
                    alt="PT. Besmindo Materi Sewatama"
                    className="w-full h-auto max-h-16 object-contain mx-auto transition-transform duration-300 group-hover:scale-102"
                  />
                </div>
              </div>

              {/* Company & System Title */}
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white mt-1">
                PT. BESMINDO MATERI SEWATAMA
              </h1>
              <p className="text-[11px] font-bold tracking-widest text-cyan-400 uppercase mt-0.5">
                HSE Inspection & Safety System
              </p>

              {/* Security Badge */}
              <div className="inline-flex items-center space-x-1.5 mt-2.5 px-3 py-1 rounded-full bg-blue-950/70 border border-blue-500/30 text-blue-300 text-[10px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Portal Masuk Resmi & Terenkripsi</span>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="p-7 pt-5 space-y-4">
              
              {/* Alert Error Box */}
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-start space-x-2.5 animate-fadeIn shadow-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
                  <span className="font-semibold leading-relaxed">{error}</span>
                </div>
              )}

              {/* Input Username */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Username / Akun Rig</span>
                  <span className="text-[10px] text-slate-500 font-normal">Contoh: admin_besmindo / BMS 01</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin_besmindo atau BMS 01"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 font-medium transition-all shadow-inner"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Input Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  Kata Sandi / Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 font-medium transition-all shadow-inner"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition"
                    title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 text-cyan-400" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 mt-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 active:scale-[0.99] text-white rounded-xl font-extrabold text-xs shadow-[0_10px_25px_-5px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center space-x-2 border border-blue-400/30 ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Masuk ke Sistem Inspeksi</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials Accordion */}
            <div className="bg-slate-950/70 p-4 border-t border-slate-800/80 text-xs">
              <button
                type="button"
                onClick={() => setShowAccountList(!showAccountList)}
                className="w-full flex items-center justify-between text-slate-400 hover:text-cyan-300 font-bold transition text-[11px]"
              >
                <div className="flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Kredensial Akses Cepat (Quick Demo)</span>
                </div>
                {showAccountList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showAccountList && (
                <div className="mt-3 space-y-2 text-[11px] text-slate-300 max-h-52 overflow-y-auto pr-1">
                  
                  {/* Admin Besmindo Card */}
                  <div className="p-2.5 bg-blue-950/60 rounded-xl border border-blue-500/30">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-extrabold text-cyan-300">👑 Admin (Admin Besmindo):</span>
                      <button 
                        type="button"
                        onClick={() => handleQuickFill('admin_besmindo', 'adminbesmindo')}
                        className="text-[10px] px-2 py-0.5 rounded bg-blue-600/30 hover:bg-blue-600 text-blue-200 font-bold border border-blue-400/30 transition"
                      >
                        Pakai Akun Ini
                      </button>
                    </div>
                    <p className="text-slate-300">Username: <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded font-mono">admin_besmindo</code></p>
                    <p className="text-slate-300">Password: <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded font-mono">adminbesmindo</code></p>
                  </div>

                  {/* Karyawan Rig Quick-Pick */}
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="font-extrabold text-slate-300">🏗️ Karyawan Rig (20 Rig BMS 01 – BMS 23):</div>
                    <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                      <button 
                        type="button" 
                        onClick={() => handleQuickFill('BMS 01', '11111111')}
                        className="text-left p-1.5 rounded-lg bg-slate-950 hover:bg-blue-900/30 border border-slate-800 hover:border-blue-500/40 transition"
                      >
                        <strong>BMS 01</strong>: <code className="text-cyan-300">11111111</code>
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleQuickFill('BMS 02', '22222222')}
                        className="text-left p-1.5 rounded-lg bg-slate-950 hover:bg-blue-900/30 border border-slate-800 hover:border-blue-500/40 transition"
                      >
                        <strong>BMS 02</strong>: <code className="text-cyan-300">22222222</code>
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleQuickFill('BMS 03A', '03030303a')}
                        className="text-left p-1.5 rounded-lg bg-slate-950 hover:bg-blue-900/30 border border-slate-800 hover:border-blue-500/40 transition"
                      >
                        <strong>BMS 03A</strong>: <code className="text-cyan-300">03030303a</code>
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleQuickFill('BMS 10', '10101010')}
                        className="text-left p-1.5 rounded-lg bg-slate-950 hover:bg-blue-900/30 border border-slate-800 hover:border-blue-500/40 transition"
                      >
                        <strong>BMS 10</strong>: <code className="text-cyan-300">10101010</code>
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 italic">
                      *Tersedia untuk seluruh 20 Rig aktif dengan password pengulangan nomor Rig.
                    </p>
                  </div>

                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* Footer Info */}
      <div className="text-center mt-6 relative z-10">
        <p className="text-[11px] text-slate-500 font-medium">
          &copy; {new Date().getFullYear()} PT. Besmindo Materi Sewatama &bull; Health, Safety, and Environment (HSE) Portal
        </p>
        <p className="text-xs text-slate-500 mt-2 tracking-wide hover:text-slate-300 transition-colors duration-300 cursor-default">
          Developed by Fudhla Aulia
        </p>
      </div>
    </div>
  );
}
