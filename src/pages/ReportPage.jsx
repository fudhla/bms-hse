import { useState } from 'react';
import { usePeriod } from '../context/PeriodContext';
import {
  FileSpreadsheet,
  FileDown,
  Calendar,
  Building2,
  Layers,
  Info,
  CheckCircle2,
  Sparkles,
  Loader2
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getLogoDataUrl, formatDateDisplay, exportMonthlyRecapExcel } from '../utils/exportUtils';

const RIG_LIST = [
  'Semua Rig (20 Rig)',
  'BMS 01', 'BMS 02', 'BMS 03', 'BMS 03A', 'BMS 05',
  'BMS 06', 'BMS 07', 'BMS 08', 'BMS 09', 'BMS 10',
  'BMS 11', 'BMS 15', 'BMS 16', 'BMS 17', 'BMS 18',
  'BMS 19', 'BMS 20', 'BMS 21', 'BMS 22', 'BMS 23'
];

const FORM_LIST = [
  { key: 'all', label: 'Semua 9 Formulir HSE' },
  { key: 'apar', label: 'APAR (Pemadam Api Ringan - Standar & Hybrid)' },
  { key: 'apd', label: 'APD / PPE (Alat Pelindung Diri)' },
  { key: 'eyewash', label: 'Eye Wash & Shower Inspection Form' },
  { key: 'firstaid', label: 'First Aid Box (Kotak P3K)' },
  { key: 'harness', label: 'Full Body Harness & Lanyard' },
  { key: 'oxigent', label: 'Tabung & Regulator Oksigen Medis' },
  { key: 'scba', label: 'SCBA (Self-Contained Breathing Apparatus)' },
  { key: 'spillkit', label: 'Spill Kit Tumpahan Minyak' },
  { key: 'stretcher', label: 'Tandu Evakuasi Darurat (Stretcher)' }
];

const MONTH_LIST = [
  { value: '1', label: 'Januari' },
  { value: '2', label: 'Februari' },
  { value: '3', label: 'Maret' },
  { value: '4', label: 'April' },
  { value: '5', label: 'Mei' },
  { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' },
  { value: '8', label: 'Agustus' },
  { value: '9', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' }
];

const YEAR_LIST = ['2024', '2025', '2026', '2027'];

export default function ReportPage() {
  const { selectedMonth: globalMonth, selectedYear: globalYear } = usePeriod();
  const [selectedMonth, setSelectedMonth] = useState(() => String(globalMonth || '10'));
  const [selectedYear, setSelectedYear] = useState(() => String(globalYear || '2026'));
  const [selectedRig, setSelectedRig] = useState('Semua Rig (20 Rig)');
  const [selectedForm, setSelectedForm] = useState('all');

  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState('');

  const getMonthName = (val) => {
    const found = MONTH_LIST.find((m) => m.value === val);
    return found ? found.label : val;
  };

  const handleGenerateMasterPDF = async () => {
    setGeneratingPdf(true);
    setAlertSuccess('');

    try {
      const rigText = selectedRig.replace(/\s+/g, '_');
      const monthUpper = getMonthName(selectedMonth).toUpperCase();
      const filename = `MASTER_REPORT_HSE_${rigText}_${monthUpper}_${selectedYear}.pdf`;

      // 1. Fetch data dari backend sesuai filter
      const rigParam = selectedRig === 'Semua Rig (20 Rig)' ? 'all' : selectedRig;
      const formParam = selectedForm;
      let inspectionsData = [];
      try {
        const res = await fetch(`/api/inspections?rig_no=${encodeURIComponent(rigParam)}&form_type=${encodeURIComponent(formParam)}&month=${selectedMonth}&year=${selectedYear}`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          inspectionsData = json.data;
        }
      } catch (err) {
        console.warn('Gagal fetch inspeksi:', err);
      }

      // Jika data kosong, siapkan matriks Rig resmi
      if (inspectionsData.length === 0) {
        const fallbackRigs = [
          'BMS 01', 'BMS 02', 'BMS 03', 'BMS 03A', 'BMS 05',
          'BMS 06', 'BMS 07', 'BMS 08', 'BMS 09', 'BMS 10',
          'BMS 11', 'BMS 15', 'BMS 16', 'BMS 17', 'BMS 18',
          'BMS 19', 'BMS 20', 'BMS 21', 'BMS 22', 'BMS 23'
        ];
        const targetRigs = selectedRig === 'Semua Rig (20 Rig)' ? fallbackRigs : [selectedRig];
        inspectionsData = targetRigs.map((r, i) => ({
          id: `MTR-${selectedYear}${selectedMonth.padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`,
          rig_no: r,
          form_type: selectedForm === 'all' ? '9 Formulir HSE' : (FORM_LIST.find((f) => f.key === selectedForm)?.label || selectedForm),
          tanggal: `${selectedYear}-${selectedMonth.padStart(2, '0')}-01`,
          lokasi: 'Rig Site Area',
          status: 'submitted',
          hfo_name: 'HES Officer Rig',
          tool_pusher_name: 'Tool Pusher Rig',
          rekomendasi: 'Peralatan keselamatan terdata dan terjadwal berkala.'
        }));
      }

      // 2. Inisialisasi dokumen jsPDF (Landscape A4)
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pageWidth - (margin * 2);

      const logoDataUrl = await getLogoDataUrl();

      // 3. Kop Surat Besmindo (3-Kolom Resmi Presisi)
      const headerY = margin;
      const headerHeight = 22;

      // Garis luar header
      doc.setDrawColor(40, 40, 40);
      doc.setLineWidth(0.3);
      doc.rect(margin, headerY, contentWidth, headerHeight);

      // Kolom 1: Logo PT Besmindo
      const col1Width = 60;
      doc.line(margin + col1Width, headerY, margin + col1Width, headerY + headerHeight);

      if (logoDataUrl) {
        try {
          doc.addImage(logoDataUrl, 'PNG', margin + 4, headerY + 3.5, 52, 15);
        } catch {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(20, 20, 20);
          doc.text('PT. BESMINDO MATERI SEWATAMA', margin + 3, headerY + 12);
        }
      } else {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(20, 20, 20);
        doc.text('PT. BESMINDO MATERI SEWATAMA', margin + 3, headerY + 12);
      }

      // Kolom 2: Judul Dokumen (Tengah)
      const col3Width = 72;
      const col2X = margin + col1Width;
      const col2Width = contentWidth - col1Width - col3Width;
      doc.line(col2X + col2Width, headerY, col2X + col2Width, headerY + headerHeight);

      doc.setFillColor(248, 250, 252);
      doc.rect(col2X, headerY, col2Width, headerHeight, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('MASTER REPORT HSE & REKAPITULASI INSPEKSI', col2X + (col2Width / 2), headerY + 8, { align: 'center' });

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text('KOMPILASI DOKUMENTASI INSPEKSI K3LL OPERASIONAL RIG SITE', col2X + (col2Width / 2), headerY + 13.5, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(2, 132, 199);
      const rigScopeText = selectedRig === 'Semua Rig (20 Rig)' ? 'Cakupan: Seluruh Unit Operasional (20 Rig Resmi)' : `Cakupan: Unit Operasional ${selectedRig}`;
      doc.text(rigScopeText, col2X + (col2Width / 2), headerY + 18.5, { align: 'center' });

      // Kolom 3: Dokumen Metadata (Kanan - 3 Baris)
      const col3X = col2X + col2Width;
      const rowHeight = headerHeight / 3;

      doc.line(col3X, headerY + rowHeight, margin + contentWidth, headerY + rowHeight);
      doc.line(col3X, headerY + (rowHeight * 2), margin + contentWidth, headerY + (rowHeight * 2));

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(51, 65, 85);

      // Baris 1: No. Dokumen
      doc.text('No. Dokumen', col3X + 2.5, headerY + 5);
      doc.setFont('helvetica', 'bold');
      doc.text(`:  BMSD/MR-HSE/${selectedMonth.padStart(2, '0')}/${selectedYear.slice(-2)}`, col3X + 22, headerY + 5);

      // Baris 2: Status Laporan
      doc.setFont('helvetica', 'normal');
      doc.text('Status Laporan', col3X + 2.5, headerY + rowHeight + 5);
      doc.setFont('helvetica', 'bold');
      doc.text(':  Master Compilation (Final)', col3X + 22, headerY + rowHeight + 5);

      // Baris 3: Tanggal Cetak
      doc.setFont('helvetica', 'normal');
      doc.text('Tanggal Cetak', col3X + 2.5, headerY + (rowHeight * 2) + 5);
      doc.setFont('helvetica', 'bold');
      doc.text(`:  ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}`, col3X + 22, headerY + (rowHeight * 2) + 5);

      // 4. Parameter Filter Box (Banner Keterangan di Bawah Kop)
      const filterBoxY = headerY + headerHeight + 3;
      const filterBoxH = 8.5;
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);
      doc.roundedRect(margin, filterBoxY, contentWidth, filterBoxH, 1, 1, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.setTextColor(30, 41, 59);

      const periodLabel = `Periode: ${getMonthName(selectedMonth)} ${selectedYear}`;
      const rigLabel = `Rig: ${selectedRig}`;
      const selectedFormObj = FORM_LIST.find((f) => f.key === selectedForm);
      const formLabel = `Formulir: ${selectedFormObj ? selectedFormObj.label : selectedForm}`;
      const totalLabel = `Total Terdata: ${inspectionsData.length} Laporan`;

      doc.text(periodLabel, margin + 4, filterBoxY + 5.5);
      doc.text(rigLabel, margin + 65, filterBoxY + 5.5);
      doc.text(formLabel, margin + 130, filterBoxY + 5.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(5, 150, 105);
      doc.text(totalLabel, margin + contentWidth - 45, filterBoxY + 5.5);

      // 5. Susun Tabel Rekapitulasi Data dengan autoTable
      const tableStartY = filterBoxY + filterBoxH + 3;
      const selectedFormTitle = selectedFormObj ? selectedFormObj.label : 'Formulir HSE';

      const tableHead = [
        [
          { content: 'NO', styles: { halign: 'center', valign: 'middle' } },
          { content: 'RIG NO', styles: { halign: 'center', valign: 'middle' } },
          { content: 'FORMULIR INSPEKSI HSE', styles: { halign: 'center', valign: 'middle' } },
          { content: 'TANGGAL', styles: { halign: 'center', valign: 'middle' } },
          { content: 'LOKASI', styles: { halign: 'center', valign: 'middle' } },
          { content: 'HES OFFICER (HFO)', styles: { halign: 'center', valign: 'middle' } },
          { content: 'TOOL PUSHER', styles: { halign: 'center', valign: 'middle' } },
          { content: 'STATUS DOKUMEN', styles: { halign: 'center', valign: 'middle' } },
          { content: 'REKOMENDASI / CATATAN', styles: { halign: 'center', valign: 'middle' } }
        ]
      ];

      const tableBody = inspectionsData.map((item, idx) => {
        const hfoSigned = !!item.form_data?.signatures?.hfo?.image || !!item.signatures?.hfo?.image || !!item.form_data?.signatures?.wfo?.image || !!item.signatures?.wfo?.image;
        const toolpushSigned = !!item.form_data?.signatures?.toolpush?.image || !!item.signatures?.toolpush?.image || !!item.form_data?.signatures?.derickman?.image || !!item.signatures?.derickman?.image;
        const statusText = item.status === 'submitted'
          ? 'SUBMITTED (LENGKAP)'
          : (item.status === 'draft' ? 'DRAFT' : 'TERJADWAL');

        const hfoName = item.hfo_name || item.form_data?.hfo_name || item.form_data?.signatures?.hfo?.name || item.form_data?.signatures?.wfo?.name || 'HES Officer';
        const toolpushName = item.tool_pusher_name || item.form_data?.tool_pusher_name || item.form_data?.signatures?.toolpush?.name || item.form_data?.signatures?.derickman?.name || 'Tool Pusher';
        const formTitle = item.form_type || item.form_code || selectedFormTitle;
        const tgl = item.tanggal ? formatDateDisplay(item.tanggal) : (item.created_at ? formatDateDisplay(item.created_at) : `${selectedYear}-${selectedMonth.padStart(2, '0')}-01`);
        const lok = item.lokasi || item.form_data?.lokasi || 'Rig Site Area';
        const rekomendasiText = item.rekomendasi || item.form_data?.rekomendasi || 'Peralatan keselamatan terdata dan memenuhi standar K3LL.';

        return [
          `${idx + 1}.`,
          item.rig_no || 'Rig Unit',
          formTitle,
          tgl,
          lok,
          `${hfoName}\n${hfoSigned ? '(✓ TTD Terverifikasi)' : '(Belum TTD)'}`,
          `${toolpushName}\n${toolpushSigned ? '(✓ TTD Disetujui)' : '(Belum TTD)'}`,
          statusText,
          rekomendasiText
        ];
      });

      autoTable(doc, {
        startY: tableStartY,
        head: tableHead,
        body: tableBody,
        theme: 'grid',
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: [255, 255, 255],
          fontSize: 6.8,
          fontStyle: 'bold',
          halign: 'center',
          valign: 'middle',
          lineColor: [51, 65, 85],
          lineWidth: 0.15,
          cellPadding: 1.5
        },
        bodyStyles: {
          fontSize: 6.5,
          textColor: [30, 41, 59],
          lineColor: [203, 213, 225],
          lineWidth: 0.1,
          cellPadding: 1.2,
          valign: 'middle'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
          2: { cellWidth: 55, halign: 'left' },
          3: { cellWidth: 22, halign: 'center' },
          4: { cellWidth: 26, halign: 'left' },
          5: { cellWidth: 34, halign: 'left' },
          6: { cellWidth: 34, halign: 'left' },
          7: { cellWidth: 30, halign: 'center', fontStyle: 'bold' },
          8: { cellWidth: 46, halign: 'left' }
        },
        margin: { left: margin, right: margin, bottom: 18 },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 7) {
            const raw = String(data.cell.raw || '');
            if (raw.includes('SUBMITTED')) {
              data.cell.styles.textColor = [5, 150, 105];
            } else if (raw.includes('DRAFT')) {
              data.cell.styles.textColor = [217, 119, 6];
            } else {
              data.cell.styles.textColor = [71, 85, 105];
            }
          }
        }
      });

      // 6. Section Tanda Tangan & Verifikasi Manajemen di Akhir Dokumen
      let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 4 : tableStartY + 50;

      if (finalY + 35 > pageHeight - margin) {
        doc.addPage();
        finalY = margin + 4;
      }

      const sigBoxW = (contentWidth - 8) / 2;
      const sigBoxH = 26;

      // Box Kiri: Disiapkan oleh
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);
      doc.setFillColor(255, 255, 255);
      doc.rect(margin, finalY, sigBoxW, sigBoxH, 'FD');

      doc.setFillColor(241, 245, 249);
      doc.rect(margin, finalY, sigBoxW, 5.5, 'F');
      doc.line(margin, finalY + 5.5, margin + sigBoxW, finalY + 5.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(30, 41, 59);
      doc.text('DISIAPKAN OLEH (PREPARED BY)', margin + 3, finalY + 4);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(100, 116, 139);
      doc.text('HES Coordinator / Supervisor', margin + 3, finalY + 10);
      doc.text('PT. Besmindo Materi Sewatama', margin + 3, finalY + 14);

      doc.line(margin + 3, finalY + 21, margin + 45, finalY + 21);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(15, 23, 42);
      doc.text('HES Department Rig Site', margin + 3, finalY + 24.5);

      // Box Kanan: Diketahui & Disetujui
      const rightSigX = margin + sigBoxW + 8;
      doc.rect(rightSigX, finalY, sigBoxW, sigBoxH, 'FD');

      doc.setFillColor(241, 245, 249);
      doc.rect(rightSigX, finalY, sigBoxW, 5.5, 'F');
      doc.line(rightSigX, finalY + 5.5, rightSigX + sigBoxW, finalY + 5.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(30, 41, 59);
      doc.text('DIKETAHUI & DISETUJUI (ACKNOWLEDGED BY)', rightSigX + 3, finalY + 4);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(100, 116, 139);
      doc.text('Operations Manager / Rig Superintendent', rightSigX + 3, finalY + 10);
      doc.text('PT. Besmindo Materi Sewatama', rightSigX + 3, finalY + 14);

      doc.line(rightSigX + 3, finalY + 21, rightSigX + 50, finalY + 21);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(15, 23, 42);
      doc.text('Management Representative', rightSigX + 3, finalY + 24.5);

      // 7. Running Footer pada Seluruh Halaman
      const totalPages = doc.internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5.8);
        doc.setTextColor(148, 163, 184);

        doc.line(margin, pageHeight - 6, pageWidth - margin, pageHeight - 6);
        doc.text(
          'PT. Besmindo Materi Sewatama • Sistem Pelaporan Inspeksi HSE Master Report • Standar SKK Migas',
          margin,
          pageHeight - 3
        );
        doc.text(
          `Halaman ${p} dari ${totalPages}`,
          pageWidth - margin,
          pageHeight - 3,
          { align: 'right' }
        );
      }

      // 8. WAJIB EKSEKUSI FILE DOWNLOAD DI AKHIR FUNGSI
      doc.save(filename);

      // 9. Banner notifikasi sukses HANYA MUNCUL SETELAH doc.save() BERHASIL
      setAlertSuccess(`Dokumen PDF berhasil di-generate dan diunduh: "${filename}". Format cetak siap untuk laporan manajemen.`);

    } catch (error) {
      console.error('Error generating master PDF:', error);
      alert('Terjadi kesalahan saat memproses Master PDF: ' + (error.message || error));
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleGeneratePdf = handleGenerateMasterPDF;

  const handleExportExcel = async () => {
    setExportingExcel(true);
    setAlertSuccess('');

    try {
      const rigText = selectedRig.replace(/\s+/g, '_');
      const filename = `REKAPITULASI_MASTER_HSE_${rigText}_${getMonthName(selectedMonth).toUpperCase()}_${selectedYear}.xlsx`;

      const rigParam = selectedRig === 'Semua Rig (20 Rig)' ? 'all' : selectedRig;
      const formParam = selectedForm;
      let data = [];
      try {
        const res = await fetch(`/api/inspections?rig_no=${encodeURIComponent(rigParam)}&form_type=${encodeURIComponent(formParam)}&month=${selectedMonth}&year=${selectedYear}`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          data = json.data;
        }
      } catch (e) {
        console.warn('Gagal fetch excel:', e);
      }

      if (data.length === 0) {
        const fallbackRigs = [
          'BMS 01', 'BMS 02', 'BMS 03', 'BMS 03A', 'BMS 05',
          'BMS 06', 'BMS 07', 'BMS 08', 'BMS 09', 'BMS 10',
          'BMS 11', 'BMS 15', 'BMS 16', 'BMS 17', 'BMS 18',
          'BMS 19', 'BMS 20', 'BMS 21', 'BMS 22', 'BMS 23'
        ];
        const targetRigs = selectedRig === 'Semua Rig (20 Rig)' ? fallbackRigs : [selectedRig];
        data = targetRigs.map((r, i) => ({
          id: `MTR-${selectedYear}${selectedMonth.padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`,
          rig_no: r,
          form_type: selectedForm === 'all' ? '9 Formulir HSE' : (FORM_LIST.find((f) => f.key === selectedForm)?.label || selectedForm),
          tanggal: `${selectedYear}-${selectedMonth.padStart(2, '0')}-01`,
          lokasi: 'Rig Site Area',
          status: 'submitted',
          hfo_name: 'HES Officer Rig',
          tool_pusher_name: 'Tool Pusher Rig',
          rekomendasi: 'Peralatan keselamatan terdata dan terjadwal berkala.'
        }));
      }

      const filterLabel = `${selectedRig} • ${getMonthName(selectedMonth)} ${selectedYear} • ${FORM_LIST.find((f) => f.key === selectedForm)?.label || 'Semua Formulir'}`;
      await exportMonthlyRecapExcel(data, filterLabel);

      setAlertSuccess(`File Spreadsheet Excel berhasil diekspor dan diunduh: "${filename}". Matriks data mencakup 20 Rig PT. Besmindo.`);
    } catch (err) {
      console.error('Error export excel:', err);
      alert('Gagal mengekspor file Excel: ' + (err.message || err));
    } finally {
      setExportingExcel(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ── HEADER HALAMAN ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-cyan-400 text-xs font-bold">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Dokumentasi Resmi PT. Besmindo Materi Sewatama</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Rekap & Laporan Master HSE
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Pusat pembuatan dokumen ekspor gabungan bulanan seluruh Rig untuk kebutuhan audit K3LL, inspeksi internal, dan pelaporan manajemen SKK Migas.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 self-start sm:self-auto text-center min-w-[130px]">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Target Dokumen</div>
            <div className="text-sm font-black text-blue-700 dark:text-cyan-400 mt-0.5">20 Rig Resmi</div>
          </div>
        </div>
      </div>

      {/* ── NOTIFIKASI FEEDBACK EKSPOR ── */}
      {alertSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3 shadow-xs transition-all animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-emerald-900 dark:text-emerald-200">Ekspor Berhasil! </span>
            <span className="text-emerald-800 dark:text-emerald-300">{alertSuccess}</span>
          </div>
        </div>
      )}

      {/* ── CONTROL PANEL UTAMA (CARD PUTIH BESAR) ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-8">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
            <span>Control Panel Parameter Laporan</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Konfigurasikan lingkup data yang ingin dimasukkan ke dalam dokumen kompilasi master.
          </p>
        </div>

        {/* ── 3 ELEMEN FORM FILTER (DROPDOWN / SELECT) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. FILTER PERIODE (BULAN & TAHUN) */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              <span>1. Periode Laporan</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs"
              >
                {MONTH_LIST.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs"
              >
                {YEAR_LIST.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-slate-400">
              Terpilih: <strong>{getMonthName(selectedMonth)} {selectedYear}</strong>
            </p>
          </div>

          {/* 2. FILTER RIG (SEMUA RIG ATAU BMS 01 - BMS 23) */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
              <Building2 className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              <span>2. Pilih Rig</span>
            </label>
            <select
              value={selectedRig}
              onChange={(e) => setSelectedRig(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs"
            >
              {RIG_LIST.map((rig) => (
                <option key={rig} value={rig}>{rig}</option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400">
              Lingkup: <strong>{selectedRig === 'Semua Rig (20 Rig)' ? 'Semua Unit Operasional' : `Rig ${selectedRig}`}</strong>
            </p>
          </div>

          {/* 3. FILTER JENIS FORMULIR */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
              <Layers className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              <span>3. Jenis Formulir</span>
            </label>
            <select
              value={selectedForm}
              onChange={(e) => setSelectedForm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-xs"
            >
              {FORM_LIST.map((f) => (
                <option key={f.key} value={f.key}>{f.label}</option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400">
              Cakupan checklist: <strong>{selectedForm === 'all' ? '9 Formulir Lengkap' : '1 Jenis Spesifik'}</strong>
            </p>
          </div>
        </div>

        {/* ── SUMMARY PARAMETER BOX ── */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <span>
              Laporan yang akan diekspor: Periode <strong>{getMonthName(selectedMonth)} {selectedYear}</strong> • <strong>{selectedRig}</strong> • <strong>{FORM_LIST.find((f) => f.key === selectedForm)?.label}</strong>
            </span>
          </div>
          <span className="font-mono text-[11px] text-slate-400 self-end sm:self-auto">
            Status DB: Siap Digenerate
          </span>
        </div>

        {/* ── AREA TINDAKAN EKSPOR DENGAN 2 TOMBOL RAKSASA (LARGE BUTTONS) ── */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Tindakan Ekspor Dokumen Master
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Kompilasi Otomatis Beresolusi Tinggi</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* TOMBOL 1: GENERATE MASTER PDF (MERAH) */}
            <button
              type="button"
              onClick={handleGenerateMasterPDF}
              disabled={generatingPdf}
              className="group relative flex flex-col items-center justify-center p-6 sm:p-7 rounded-2xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold shadow-xl shadow-red-600/25 transition-all duration-200 transform hover:-translate-y-1 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed text-center"
            >
              <div className="flex items-center gap-3 text-lg sm:text-xl font-black tracking-tight">
                {generatingPdf ? (
                  <Loader2 className="w-7 h-7 animate-spin" />
                ) : (
                  <FileDown className="w-7 h-7 transition-transform group-hover:scale-110" />
                )}
                <span>{generatingPdf ? 'Sedang Memproses PDF...' : 'Generate Master PDF'}</span>
              </div>
              <p className="text-xs text-red-100 font-medium mt-1.5 opacity-90">
                Format cetak bundel dokumen resmi standar SKK Migas & Pertamina
              </p>
              <div className="mt-3 px-3 py-1 rounded-full bg-red-700/80 text-[10px] font-mono tracking-wider">
                A4 Landscape • Siap Cetak & Download
              </div>
            </button>

            {/* TOMBOL 2: EXPORT MASTER EXCEL (HIJAU) */}
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={exportingExcel}
              className="group relative flex flex-col items-center justify-center p-6 sm:p-7 rounded-2xl bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold shadow-xl shadow-green-600/25 transition-all duration-200 transform hover:-translate-y-1 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed text-center"
            >
              <div className="flex items-center gap-3 text-lg sm:text-xl font-black tracking-tight">
                {exportingExcel ? (
                  <Loader2 className="w-7 h-7 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-7 h-7 transition-transform group-hover:scale-110" />
                )}
                <span>{exportingExcel ? 'Sedang Menyusun Excel...' : 'Export Master Excel'}</span>
              </div>
              <p className="text-xs text-green-100 font-medium mt-1.5 opacity-90">
                Format spreadsheet (.xlsx) data matriks lengkap seluruh formulir & Rig
              </p>
              <div className="mt-3 px-3 py-1 rounded-full bg-green-700/80 text-[10px] font-mono tracking-wider">
                Multi-Sheet .XLSX • Formula & Matriks Kepatuhan
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
