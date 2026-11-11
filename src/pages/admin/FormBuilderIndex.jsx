import { useState } from 'react';
import {
  FilePlus2,
  Plus,
  Search,
  Code2,
  Sliders,
  CheckCircle2,
  Clock,
  Trash2,
  Eye,
  Settings,
  Layers,
  Sparkles,
  Info,
  X
} from 'lucide-react';

/* ── SIMULASI STRUKTUR DATA JSON MASTER FORM DINAMIS (ARCHITECTURAL DRAFT) ── */
const INITIAL_MASTER_FORMS = [
  {
    id: 'frm-p3k',
    formCode: 'FRM-HSE-P3K',
    formName: 'Inspeksi Kotak P3K',
    description: 'Pemeriksaan berkala isi dan kuantitas standar obat P3K di area Rig',
    category: 'Medis & P3K',
    status: 'Aktif',
    version: '1.0.0',
    updatedAt: '2026-11-10',
    fields: [
      { id: 1, name: 'Betadine (Povidon Iodin 60ml)', type: 'number', stdQty: 1, unit: 'Botol', required: true },
      { id: 2, name: 'Kasa Steril 16x16 cm', type: 'number', stdQty: 20, unit: 'Lembar', required: true },
      { id: 3, name: 'Kondisi Kotak & Higienitas', type: 'checklist', options: ['Baik', 'Rusak / Kotor'], required: true },
      { id: 4, name: 'Catatan Kerusakan / Kebutuhan Restock', type: 'text', required: false }
    ]
  },
  {
    id: 'frm-apar',
    formCode: 'FRM-HSE-APAR',
    formName: 'Inspeksi Tabung APAR',
    description: 'Pemeriksaan fisik, pin, segel, dan tekanan manometer tabung pemadam api',
    category: 'Proteksi Kebakaran',
    status: 'Aktif',
    version: '1.2.0',
    updatedAt: '2026-11-09',
    fields: [
      { id: 1, name: 'Tekanan Jarum Manometer', type: 'checklist', options: ['Zona Hijau (Normal)', 'Zona Merah (Drop)'], required: true },
      { id: 2, name: 'Pin & Segel Pengaman', type: 'checklist', options: ['Tersegel Utuh', 'Putus / Hilang'], required: true },
      { id: 3, name: 'Kondisi Selang Nozzle', type: 'checklist', options: ['Lentur / Baik', 'Retak / Tersumbat'], required: true },
      { id: 4, name: 'Masa Berlaku Hydrotest (Tahun)', type: 'number', stdQty: 5, unit: 'Tahun', required: true }
    ]
  },
  {
    id: 'frm-gas',
    formCode: 'FRM-HSE-GAS',
    formName: 'Inspeksi Multi-Gas Detector',
    description: 'Uji respons sensor H2S, LEL, CO, O2 dan level baterai unit portabel',
    category: 'Deteksi Bahaya Gas',
    status: 'Draft',
    version: '0.9.0',
    updatedAt: '2026-11-11',
    fields: [
      { id: 1, name: 'Bump Test H2S / LEL', type: 'checklist', options: ['Pass', 'Fail'], required: true },
      { id: 2, name: 'Daya Baterai (%)', type: 'number', stdQty: 80, unit: '%', required: true },
      { id: 3, name: 'Tanggal Kalibrasi Terakhir', type: 'date', required: true }
    ]
  }
];

export default function FormBuilderIndex() {
  const [forms, setForms] = useState(INITIAL_MASTER_FORMS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJsonForm, setSelectedJsonForm] = useState(null);
  const [notification, setNotification] = useState(null);

  // Filter formulir berdasarkan pencarian
  const filteredForms = forms.filter((f) => {
    const q = searchQuery.toLowerCase();
    return (
      f.formCode.toLowerCase().includes(q) ||
      f.formName.toLowerCase().includes(q) ||
      f.category.toLowerCase().includes(q)
    );
  });

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleCreateNewForm = () => {
    showToast('Fitur Form Designer (Visual Drag & Drop) sedang disiapkan untuk tahap selanjutnya.');
  };

  const handleDeleteForm = (id, name) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus master form "${name}"?`)) {
      setForms((prev) => prev.filter((f) => f.id !== id));
      showToast(`Master form "${name}" berhasil dihapus.`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── NOTIFIKASI TOAST ── */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center space-x-2 animate-bounce">
          <Info className="w-4 h-4 text-cyan-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* ── 1. HEADER BANNER HALAMAN ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-cyan-400 text-xs font-bold">
              <FilePlus2 className="w-3.5 h-3.5" />
              <span>Dynamic Form Architecture (JSON-driven)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Kelola Master Formulir K3
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Buat, edit, dan atur struktur formulir inspeksi secara dinamis. Setiap jenis formulir didukung oleh skema JSON yang modular untuk menyesuaikan variasi kolom dan item pemeriksaan K3 antar-Rig.
            </p>
          </div>

          {/* Tombol Utama: + Buat Form Baru */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleCreateNewForm}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Form Baru</span>
            </button>
          </div>
        </div>

        {/* ── STATISTIK CEPAT MASTER FORM ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total Master Form</span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{forms.length} Template</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Status Aktif</span>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {forms.filter((f) => f.status === 'Aktif').length} Form
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Status Draft</span>
            <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
              {forms.filter((f) => f.status === 'Draft').length} Form
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Struktur Dinamis</span>
            <div className="text-xl font-black text-blue-600 dark:text-cyan-400 mt-0.5">JSON Schema</div>
          </div>
        </div>
      </div>

      {/* ── 2. BAR PENCARIAN & FILTER ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode atau nama formulir..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 self-end sm:self-auto font-medium">
          Menampilkan <strong className="text-slate-900 dark:text-white">{filteredForms.length}</strong> formulir
        </div>
      </div>

      {/* ── 3. TABEL MASTER FORMULIR ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                <th className="py-3.5 px-4 sm:px-6">Kode Form</th>
                <th className="py-3.5 px-4 sm:px-6">Nama Form</th>
                <th className="py-3.5 px-4 sm:px-6">Kategori &amp; Bidang</th>
                <th className="py-3.5 px-4 sm:px-6 text-center">Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
              {filteredForms.length > 0 ? (
                filteredForms.map((item) => {
                  const isAktif = item.status === 'Aktif';
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Kolom 1: Kode Form */}
                      <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                        <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          {item.formCode}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1">v{item.version}</div>
                      </td>

                      {/* Kolom 2: Nama Form */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="font-bold text-sm text-slate-900 dark:text-white">
                          {item.formName}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {item.description}
                        </p>
                      </td>

                      {/* Kolom 3: Kategori & Struktur Fields */}
                      <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-cyan-400 border border-blue-200/60 dark:border-blue-900/60">
                          <Layers className="w-3 h-3" />
                          <span>{item.category}</span>
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {item.fields?.length || 0} Bidang Input Dinamis
                        </div>
                      </td>

                      {/* Kolom 4: Status */}
                      <td className="py-4 px-4 sm:px-6 text-center whitespace-nowrap">
                        {isAktif ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Aktif</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Draft</span>
                          </span>
                        )}
                      </td>

                      {/* Kolom 5: Aksi */}
                      <td className="py-4 px-4 sm:px-6 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Tombol Lihat JSON Schema */}
                          <button
                            type="button"
                            onClick={() => setSelectedJsonForm(item)}
                            title="Lihat Skema JSON Dinamis"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-cyan-400 dark:hover:bg-slate-800 transition cursor-pointer"
                          >
                            <Code2 className="w-4 h-4" />
                          </button>

                          {/* Tombol Konfigurasi / Edit */}
                          <button
                            type="button"
                            onClick={() => showToast(`Membuka editor untuk ${item.formName}...`)}
                            title="Konfigurasi Struktur Form"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 dark:text-slate-400 dark:hover:text-emerald-400 dark:hover:bg-slate-800 transition cursor-pointer"
                          >
                            <Sliders className="w-4 h-4" />
                          </button>

                          {/* Tombol Hapus */}
                          <button
                            type="button"
                            onClick={() => handleDeleteForm(item.id, item.formName)}
                            title="Hapus Master Form"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-slate-800 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <FilePlus2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-sm">Belum ada formulir yang terdaftar</p>
                    <p className="text-xs mt-1">Klik tombol "+ Buat Form Baru" untuk memulai merancang formulir K3.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 4. MODAL PREVIEW SKEMA JSON DINAMIS ── */}
      {selectedJsonForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Code2 className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="font-bold text-sm text-white">Skema JSON Master: {selectedJsonForm.formName}</h3>
                  <p className="text-[11px] text-slate-400">Kode: {selectedJsonForm.formCode}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJsonForm(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto font-mono text-xs bg-slate-950 custom-scrollbar flex-1">
              <pre className="text-emerald-400 leading-relaxed">
                {JSON.stringify(
                  {
                    formCode: selectedJsonForm.formCode,
                    formName: selectedJsonForm.formName,
                    category: selectedJsonForm.category,
                    version: selectedJsonForm.version,
                    status: selectedJsonForm.status,
                    fields: selectedJsonForm.fields
                  },
                  null,
                  2
                )}
              </pre>
            </div>

            <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedJsonForm(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
