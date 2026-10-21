import React, { useState } from 'react';
import { 
  BookOpen, 
  HelpCircle, 
  FileText, 
  Upload, 
  Clock, 
  FileSpreadsheet, 
  FileDown, 
  PhoneCall, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Download, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Camera, 
  Lock, 
  Save, 
  Info, 
  Mail, 
  MapPin, 
  HardHat 
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function UserGuide() {
  const [activeTab, setActiveTab] = useState('flow');
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  const tabs = [
    { id: 'flow', label: '1. Alur Pengisian Form', icon: FileText },
    { id: 'upload', label: '2. Upload Foto Komponen', icon: Camera },
    { id: 'status', label: '3. Arti Status Form', icon: Clock },
    { id: 'export', label: '4. Ekspor PDF & Excel', icon: FileDown },
    { id: 'contact', label: '5. Bantuan & Kontak HSE', icon: PhoneCall },
  ];

  // Fungsi Unduh Dokumen Panduan Resmi PDF
  const handleDownloadPdf = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    // Header Kop Dokumen
    doc.setFillColor(15, 23, 42); // Navy 900
    doc.rect(0, 0, pageWidth, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('PT. BESMINDO MATERI SEWATAMA', margin, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(56, 189, 248); // Cyan 400
    doc.text('BUKU PANDUAN PENGGUNA SISTEM INSPEKSI HSE (RIG USER GUIDE)', margin, 18);

    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text('Versi 2.0 • Dokumen Operasional K3 Lapangan', margin, 23);

    let startY = 36;

    // Konten Bab 1
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('BAB 1: ALUR PENGISIAN 9 FORMULIR INSPEKSI BULANAN', margin, startY);

    autoTable(doc, {
      startY: startY + 3,
      margin: { left: margin, right: margin },
      head: [['Langkah', 'Tindakan Operator Rig', 'Catatan Penting']],
      body: [
        ['1. Login', 'Masuk menggunakan username Rig (misal: BMS 01)', 'Password default berulang sesuai nomor rig'],
        ['2. Buka Form', 'Pilih salah satu dari 9 menu form di sidebar kiri', 'Pastikan nama Rig di header sudah sesuai'],
        ['3. Isi Checklist', 'Lakukan pemeriksaan fisik dan centang item per unit', 'Input otomatis tersimpan sebagai DRAFT'],
        ['4. Final Submit', 'Klik tombol "Simpan Inspeksi" di bagian bawah', 'Setelah klik ini, form terkunci untuk User']
      ],
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2.5 }
    });

    startY = doc.lastAutoTable.finalY + 8;

    // Konten Bab 2
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('BAB 2: ARTI STATUS FORMULIR INSPEKSI', margin, startY);

    autoTable(doc, {
      startY: startY + 3,
      margin: { left: margin, right: margin },
      head: [['Status', 'Warna Badge', 'Arti & Dampak']],
      body: [
        ['BELUM DIISI', 'Merah (Rose)', 'Formulir belum disentuh pada periode bulan ini. Wajib segera diinspeksi.'],
        ['DRAFT (Sedang Diisi)', 'Kuning (Amber)', 'Sebagian data tersimpan otomatis. Masih dapat diedit sebelum disubmit final.'],
        ['TERKIRIM (Submitted)', 'Hijau (Emerald)', 'Data resmi tercatat di database Admin. Form terkunci read-only bagi user.']
      ],
      headStyles: { fillColor: [15, 118, 110], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2.5 }
    });

    startY = doc.lastAutoTable.finalY + 8;

    // Konten Bab 3
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('BAB 3: PANDUAN UPLOAD FOTO & DOKUMENTASI (HARNESS)', margin, startY);

    autoTable(doc, {
      startY: startY + 3,
      margin: { left: margin, right: margin },
      head: [['Ketentuan', 'Penjelasan Teknis']],
      body: [
        ['Format File', 'Mendukung format gambar kamera langsung: JPG, JPEG, PNG, dan WebP.'],
        ['Kompresi Otomatis', 'Sistem mengompresi gambar otomatis agar hemat kuota internet Rig dan cepat tersimpan.'],
        ['Zoom / Lightbox', 'Klik thumbnail foto untuk memperbesar dan memeriksa serat tali/karabiner secara teliti.'],
        ['Ganti / Reset Foto', 'Tersedia tombol "Reset Foto" jika ingin mengambil ulang gambar sebelum final submit.']
      ],
      headStyles: { fillColor: [109, 40, 217], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2.5 }
    });

    startY = doc.lastAutoTable.finalY + 8;

    // Footer Kontak
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('LAYANAN BANTUAN HSE PUSAT:', margin, startY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('Email: hse@besmindo.co.id  |  Hotline Lapangan: +62 811-750-8899 (Pak Edo / Admin HSE)', margin, startY + 5);

    doc.save('Buku_Panduan_User_HSE_Besmindo.pdf');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10 text-slate-800 dark:text-slate-100">
      
      {/* ── Banner Header Buku Panduan ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 border border-blue-800/40 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-cyan-300 text-xs font-black uppercase tracking-wider mb-2">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Panduan Resmi HSE Operator Rig</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Buku Panduan Pengguna (User Guide)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Petunjuk komprehensif tata cara pengoperasian Sistem Inspeksi K3 Lapangan PT. Besmindo Materi Sewatama untuk personil dan kru di 20 Rig aktif.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadPdf}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-extrabold text-xs shadow-lg hover:shadow-cyan-500/25 transition cursor-pointer flex-shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Dokumen PDF (.pdf)</span>
          </button>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB CONTENT ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
        
        {/* ── 1. ALUR PENGISIAN FORM ── */}
        {activeTab === 'flow' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
                <span>Alur Standar Pengisian 9 Formulir Inspeksi Bulanan</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Lakukan pengisian secara berkala setiap awal/pertengahan bulan berjalan sesuai jadwal HSE rig.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 relative">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs mb-3">1</div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Pilih Menu Form</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Buka sidebar kiri dan pilih jenis peralatan yang diinspeksi (misal: APAR, APD, Harness, Kotak P3K, SCBA, dll.).
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 relative">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs mb-3">2</div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Isi Fisik & Checklist</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Periksa kondisi fisik barang di lapangan. Centang opsi <strong>Bagus (✓)</strong> atau <strong>Rusak (✗)</strong> pada setiap unit.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 relative">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs mb-3">3</div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Auto-Save Aktif</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Setiap ketikan dan checklist tersimpan otomatis ke database sebagai <strong>Draft</strong> tanpa khawatir data hilang saat koneksi terputus.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/50 relative">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs mb-3">4</div>
                <h3 className="font-bold text-sm text-emerald-800 dark:text-emerald-300">Simpan Inspeksi</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Setelah seluruh baris tuntas diisi, klik tombol <strong>"Simpan Inspeksi"</strong> di footer bawah untuk mengirim laporan resmi ke Admin Pusat.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-300 flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <strong className="block font-bold mb-0.5">Penting Diperhatikan:</strong>
                Pastikan nama Petugas Pemeriksa (HFO / Derrickman / Tool Pusher) diisi dengan nama terang sebelum menekan tombol Simpan Inspeksi final.
              </div>
            </div>
          </div>
        )}

        {/* ── 2. UPLOAD FOTO KOMPONEN ── */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center space-x-2">
                <Camera className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
                <span>Panduan Dokumentasi & Upload Foto (Form Harness)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Khusus formulir Harness (BMSD/17/FO/HSE/08/26), tersedia kolom foto untuk 9 komponen keselamatan kerja diketinggian.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-cyan-300 w-fit mb-2">
                  <Upload className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">1. Ambil / Pilih Foto</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Klik tombol <strong>"Upload"</strong> pada kolom Gambar di baris komponen terkait. Anda dapat mengambil foto langsung via kamera HP/tablet atau galeri file.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 w-fit mb-2">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">2. Kompresi Cepat</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Sistem otomatis menyesuaikan ukuran file foto menjadi optimal tanpa mengurangi ketajaman detail jahitan atau serat tali webbing.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 w-fit mb-2">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">3. Fitur Zoom (Lightbox)</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Klik thumbnail foto untuk memperbesar gambar dalam tampilan modal penuh agar kondisi fisik alat terlihat sangat jelas.
                </p>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-950/30">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Daftar 9 Komponen Harness yang Wajib Difoto:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 dark:text-slate-400">
                <div>1. WEBBING (Sabuk Utama)</div>
                <div>2. SNAP HOOKS & KARABINER</div>
                <div>3. D-RINGS</div>
                <div>4. BUCKLETS & ADJUSTERS</div>
                <div>5. SEWING (Jahitan Pengunci)</div>
                <div>6. ROPE (Tali Lanyard)</div>
                <div>7. ENERGY ABSORBER</div>
                <div>8. BLOOD SUSPENSION TRAUMA</div>
                <div>9. LABELLING (Sertifikasi/SN)</div>
              </div>
            </div>
          </div>
        )}

        {/* ── 3. ARTI STATUS FORMULIR ── */}
        {activeTab === 'status' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
                <span>Penjelasan 3 Indikator Status Formulir Inspeksi</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Sistem menggunakan 3 status warna standar untuk memudahkan pemantauan kelengkapan di Dashboard.
              </p>
            </div>

            <div className="space-y-4">
              {/* Status 1: BELUM DIISI */}
              <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-700 dark:bg-rose-900/80 dark:text-rose-200 border border-rose-300 dark:border-rose-800">
                    BELUM DIISI
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Formulir Tertunda (Merah)</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Menandakan formulir belum pernah dibuka atau diinput sama sekali pada bulan berjalan.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400">Tindakan: Segera buka & isi</span>
              </div>

              {/* Status 2: DRAFT */}
              <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-700 dark:bg-amber-900/80 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                    DRAFT (Sedang Diisi)
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Tersimpan Sementara (Kuning)</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Sebagian data sudah terisi dan tersimpan otomatis. Form masih terbuka untuk diselesaikan.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Tindakan: Lanjutkan hingga lengkap</span>
              </div>

              {/* Status 3: TERKIRIM */}
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-900/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800">
                    ✓ TERKIRIM & TERKUNCI
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Laporan Sah & Selesai (Hijau)</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Inspeksi final telah dikirim. Formulir menjadi <strong>Read-Only</strong> untuk personil Rig agar integritas data terjamin.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Tindakan: Siap diunduh PDF/Excel</span>
              </div>
            </div>
          </div>
        )}

        {/* ── 4. CARA EKSPOR PDF & EXCEL ── */}
        {activeTab === 'export' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center space-x-2">
                <FileDown className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
                <span>Petunjuk Ekspor Dokumen Resmi (PDF & Excel)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Laporan dapat dicetak langsung atau disimpan sebagai arsip bukti audit keselamatan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl border border-rose-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xs space-y-3">
                <div className="flex items-center space-x-2 text-rose-600">
                  <FileDown className="w-5 h-5" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Export ke PDF Resmi</h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Menghasilkan lembar dokumen formulir lengkap dengan <strong>Kop Surat PT. Besmindo Materi Sewatama</strong>, nomor dokumen resmi, tabel checklist kondisi, dan kolom tanda tangan digital.
                </p>
                <div className="text-[11px] bg-slate-100 dark:bg-slate-900 p-2.5 rounded-lg text-slate-600 dark:text-slate-300">
                  <strong>Cara:</strong> Klik tombol merah <span className="text-rose-600 font-bold">"Export PDF"</span> di pojok kanan atas formulir.
                </div>
              </div>

              <div className="p-5 rounded-xl border border-emerald-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xs space-y-3">
                <div className="flex items-center space-x-2 text-emerald-600">
                  <FileSpreadsheet className="w-5 h-5" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Export ke Excel (.xlsx)</h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Menghasilkan tabel data mentah Microsoft Excel untuk keperluan rekap bulanan, kalkulasi temuan rusak, dan penyusunan matriks HSE mingguan di Rig.
                </p>
                <div className="text-[11px] bg-slate-100 dark:bg-slate-900 p-2.5 rounded-lg text-slate-600 dark:text-slate-300">
                  <strong>Cara:</strong> Klik tombol hijau <span className="text-emerald-600 font-bold">"Export Excel"</span> di pojok kanan atas formulir.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 5. KONTAK BANTUAN HSE ── */}
        {activeTab === 'contact' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center space-x-2">
                <PhoneCall className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
                <span>Pusat Layanan Bantuan HSE & Administrasi Sistem</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Hubungi tim HSE Kantor Pusat jika menemukan kendala teknis sistem, reset password, atau temuan darurat alat.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
                <PhoneCall className="w-5 h-5 text-blue-600 dark:text-cyan-400 mb-2" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Hotline HSE Rig</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Telepon / WhatsApp Resmi Operasional:
                </p>
                <p className="font-mono font-bold text-blue-600 dark:text-cyan-400 text-xs mt-1">
                  +62 811-750-8899
                </p>
                <span className="text-[10px] text-slate-500">Siap melayani 24/7 jam kerja rig</span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
                <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mb-2" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Email Resmi HSE</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Kirimkan berita acara atau foto temuan:
                </p>
                <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs mt-1">
                  hse@besmindo.co.id
                </p>
                <span className="text-[10px] text-slate-500">PT. Besmindo Materi Sewatama</span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-2" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Admin Sistem (Pak Edo)</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Bantuan akun, password, dan revisi form:
                </p>
                <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs mt-1">
                  Username: admin_besmindo
                </p>
                <span className="text-[10px] text-slate-500">HSE Department Head</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
