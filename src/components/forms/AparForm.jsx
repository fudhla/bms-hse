import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Flame, Layers, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useInspectionForm } from '../../hooks/useInspectionForm';
import { generateAparPDF, generateAparExcel } from '../../utils/exportUtils';
import FormActionHeader from './FormActionHeader';
import FormSubmitFooter from './FormSubmitFooter';
import DigitalSignatureSection from './DigitalSignatureSection';

// ── 1. TEMPLATE DEFAULT BARIS APAR STANDAR (14 UNIT) ──────────────────────
export const STANDAR_APAR_ITEMS = [
  { no: 1, type: 'Powder 9 Kg ABC', sn: '', tahun: '', penempatan: 'Accumulator', handle: 'Good', hose: 'Good', nozle: 'Good', pengaman: 'Good', pin: 'Good', pressure: 'Good', tabung: 'Good', berat: '', remarks: '' },
  { no: 2, type: 'Powder 9 Kg ABC', sn: '', tahun: '', penempatan: 'Rig Currier', handle: 'Good', hose: 'Good', nozle: 'Good', pengaman: 'Good', pin: 'Good', pressure: 'Good', tabung: 'Good', berat: '', remarks: '' },
  { no: 3, type: 'Powder 9 Kg ABC', sn: '', tahun: '', penempatan: 'Mud Pump', handle: 'Good', hose: 'Good', nozle: 'Good', pengaman: 'Good', pin: 'Good', pressure: 'Good', tabung: 'Good', berat: '', remarks: '' },
  { no: 4, type: 'Powder 9 Kg ABC', sn: '', tahun: '', penempatan: 'Tanki', handle: 'Good', hose: 'Good', nozle: 'Good', pengaman: 'Good', pin: 'Good', pressure: 'Good', tabung: 'Good', berat: '', remarks: '' },
  { no: 5, type: 'CO', sn: '', tahun: '', penempatan: 'Genset', handle: 'Good', hose: 'Good', nozle: 'Good', pengaman: 'Good', pin: 'Good', pressure: 'N/A', tabung: 'Good', berat: '', remarks: '' },
  { no: 6, type: 'CO', sn: '', tahun: '', penempatan: 'Mud Pump', handle: 'Good', hose: 'Good', nozle: 'Good', pengaman: 'Good', pin: 'Good', pressure: 'N/A', tabung: 'Good', berat: '', remarks: '' },
  { no: 7, type: 'CO', sn: '', tahun: '', penempatan: 'Firex Box', handle: 'Good', hose: 'Good', nozle: 'Good', pengaman: 'Good', pin: 'Good', pressure: 'N/A', tabung: 'Good', berat: '', remarks: '' },
  { no: 8, type: 'Powder 150 Found', sn: '', tahun: '', penempatan: 'Firex Box', handle: 'Good', hose: 'Good', nozle: 'Good', pengaman: 'Good', pin: 'Good', pressure: 'Good', tabung: 'Good', berat: '', remarks: '' },
  { no: 9, type: 'Foam 100 ltr', sn: '', tahun: '', penempatan: 'Firex Box', handle: 'Good', hose: 'Good', nozle: 'Good', pengaman: 'Good', pin: 'Good', pressure: 'Good', tabung: 'Good', berat: '', remarks: '' },
  ...Array.from({ length: 5 }, (_, i) => ({
    no: 10 + i, type: '', sn: '', tahun: '', penempatan: '', handle: 'Good', hose: 'Good', nozle: 'Good', pengaman: 'Good', pin: 'Good', pressure: 'Good', tabung: 'Good', berat: '', remarks: ''
  }))
];

// ── 2. TEMPLATE DEFAULT BARIS APAR HYBRID (23 UNIT) ───────────────────────
export const HYBRID_APAR_ITEMS = [
  // 8 Baris Powder 9 Kg ABC
  { no: 1, type: 'Powder 9 Kg ABC', sn: '', tahun: '', penempatan: 'Accumulator', handle: 'Good', hose: 'Good', nozle: 'Good', pengaman: 'Good', pin: 'Good', pressure: 'Good', tabung: 'Good', berat: '', remarks: '' },
  { no: 2, type: 'Powder 9 Kg ABC', sn: '', tahun: '', penempatan: 'Rig Currier', handle: 'Good', hose: 'Good', nozle: 'Good', pengaman: 'Good', pin: 'Good', pressure: 'Good', tabung: 'Good', berat: '', remarks: '' },
  { no: 3, type: 'Powder 9 Kg ABC', sn: '', tahun: '', penempatan: 'Mud Pump 1', handle: 'Good', hose: 'Good', nozle: 'Good', pengaman: 'Good', pin: 'Good', pressure: 'Good', tabung: 'Good', berat: '', remarks: '' },
  { no: 4, type: 'Powder 9 Kg ABC', sn: '', tahun: '', penempatan: 'Mud Pump 2', handle: 'Good', hose: 'Good', nozle: 'Good', pengaman: 'Good', pin: 'Good', pressure: 'Good', tabung: 'Good', berat: '', remarks: '' },
  { no: 5, type: 'Powder 9 Kg ABC', sn: '', tahun: '', penempatan: 'Tanki 1', handle: 'Good', hose: 'Good', nozle: 'Good', pengaman: 'Good', pin: 'Good', pressure: 'Good', tabung: 'Good', berat: '', remarks: '' },
  { no: 6, type: 'Powder 9 Kg ABC', sn: '', tahun: '', penempatan: 'Tanki 2', handle: 'Good', hose: 'Good', nozle: 'Good', pengaman: 'Good', pin: 'Good', pressure: 'Good', tabung: 'Good', berat: '', remarks: '' },
  { no: 7, type: 'Powder 9 Kg ABC', sn: '', tahun: '', penempatan: 'Substructure', handle: 'Good', hose: 'Good', nozle: 'Good', pengaman: 'Good', pin: 'Good', pressure: 'Good', tabung: 'Good', berat: '', remarks: '' },
  { no: 8, type: 'Powder 9 Kg ABC', sn: '', tahun: '', penempatan: 'Doghouse', handle: 'Good', hose: 'Good', nozle: 'Good', pengaman: 'Good', pin: 'Good', pressure: 'Good', tabung: 'Good', berat: '', remarks: '' },
  // 6 Baris CO
  { no: 9, type: 'CO', sn: '', tahun: '', penempatan: 'Genset 1', handle: 'Good', hose: 'Good', nozle: 'Good', pengaman: 'Good', pin: 'Good', pressure: 'N/A', tabung: 'Good', berat: '', remarks: '' },
  { no: 10, type: 'CO', sn: '', tahun: '', penempatan: 'Genset 2', handle: 'Good', hose: 'Good', nozle: 'Good', pengaman: 'Good', pin: 'Good', pressure: 'N/A', tabung: 'Good', berat: '', remarks: '' },
  { no: 11, type: 'CO', sn: '', tahun: '', penempatan: 'Mud Pump', handle: 'Good', hose: 'Good', nozle: 'Good', pengaman: 'Good', pin: 'Good', pressure: 'N/A', tabung: 'Good', berat: '', remarks: '' },
  { no: 12, type: 'CO', sn: '', tahun: '', penempatan: 'Firex Box', handle: 'Good', hose: 'Good', nozle: 'Good', pengaman: 'Good', pin: 'Good', pressure: 'N/A', tabung: 'Good', berat: '', remarks: '' },
  { no: 13, type: 'CO', sn: '', tahun: '', penempatan: 'Electric Room', handle: 'Good', hose: 'Good', nozle: 'Good', pengaman: 'Good', pin: 'Good', pressure: 'N/A', tabung: 'Good', berat: '', remarks: '' },
  { no: 14, type: 'CO', sn: '', tahun: '', penempatan: 'SCR House', handle: 'Good', hose: 'Good', nozle: 'Good', pengaman: 'Good', pin: 'Good', pressure: 'N/A', tabung: 'Good', berat: '', remarks: '' },
  // 2 Baris Powder 150 Found
  { no: 15, type: 'Powder 150 Found', sn: '', tahun: '', penempatan: 'Firex Box 1', handle: 'Good', hose: 'Good', nozle: 'Good', pengaman: 'Good', pin: 'Good', pressure: 'Good', tabung: 'Good', berat: '', remarks: '' },
  { no: 16, type: 'Powder 150 Found', sn: '', tahun: '', penempatan: 'Firex Box 2', handle: 'Good', hose: 'Good', nozle: 'Good', pengaman: 'Good', pin: 'Good', pressure: 'Good', tabung: 'Good', berat: '', remarks: '' },
  // 2 Baris Foam 100 ltr
  { no: 17, type: 'Foam 100 ltr', sn: '', tahun: '', penempatan: 'Firex Box 1', handle: 'Good', hose: 'Good', nozle: 'Good', pengaman: 'Good', pin: 'Good', pressure: 'Good', tabung: 'Good', berat: '', remarks: '' },
  { no: 18, type: 'Foam 100 ltr', sn: '', tahun: '', penempatan: 'Firex Box 2', handle: 'Good', hose: 'Good', nozle: 'Good', pengaman: 'Good', pin: 'Good', pressure: 'Good', tabung: 'Good', berat: '', remarks: '' },
  // 5 Baris Tambahan
  ...Array.from({ length: 5 }, (_, i) => ({
    no: 19 + i, type: '', sn: '', tahun: '', penempatan: '', handle: 'Good', hose: 'Good', nozle: 'Good', pengaman: 'Good', pin: 'Good', pressure: 'Good', tabung: 'Good', berat: '', remarks: ''
  }))
];

// ── 3. KOMPONEN PANEL TAB INDEPENDEN (ISOLASI TOTAL) ──────────────────────
function AparTabPanel({
  subType,
  label,
  docSubtitle,
  docIndo,
  defaultItems,
  onBack,
  currentUser,
  overrideRigNo = null,
  viewMonth = null,
  viewYear = null
}) {
  const { user: authUser } = useAuth();
  const user = currentUser || authUser;
  const isKaryawan = user?.role === 'karyawan';
  const assignedRig = user?.rig_name || '';

  const [meta, setMeta] = useState({
    inspectionDate: new Date().toISOString().split('T')[0],
    lastInspectionDate: '',
    rigNo: overrideRigNo || (isKaryawan && assignedRig ? assignedRig : ''),
    inspectedBy: '',
    acknowledgedBy: '',
    userName: '',
    signatures: {}
  });

  // Sinkronisasi rigNo: URL override > assigned rig
  useEffect(() => {
    if (overrideRigNo) {
      setMeta(prev => ({ ...prev, rigNo: overrideRigNo }));
    } else if (isKaryawan && assignedRig) {
      setMeta(prev => ({ ...prev, rigNo: assignedRig }));
    }
  }, [overrideRigNo, isKaryawan, assignedRig]);

  const [items, setItems] = useState(() => defaultItems.map(it => ({ ...it })));

  const formId = `apar_${subType}`;
  const formType = `apar_${subType}`;

  const {
    status,
    isLocked,
    isAdmin,
    adminEditMode,
    submitting,
    saveState,
    message,
    validateBeforeSubmit,
    handleFinalSubmit,
    buildExportPayload,
    initialData,
    initialLoaded
  } = useInspectionForm({
    formId,
    formType,
    formCode: 'BMSD/13/FO/HSE/12/25',
    rigNo: meta.rigNo,
    overrideRigNo,
    viewMonth,
    viewYear,
    meta,
    setMeta,
    items,
    setItems,
    extraPayload: { apar_sub_type: subType }
  });

  const handleExportAparPdf = async () => {
    try {
      const payload = buildExportPayload();
      await generateAparPDF(payload, `apar_${subType}`);
    } catch (err) {
      console.error('Error generating APAR PDF:', err);
    }
  };

  const handleExportAparExcel = async () => {
    try {
      const payload = buildExportPayload();
      await generateAparExcel(payload, `apar_${subType}`);
    } catch (err) {
      console.error('Error generating APAR Excel:', err);
    }
  };

  // Pulihkan rows dari data database jika ada (selalu pastikan jumlah baris utuh sesuai template)
  useEffect(() => {
    if (!initialData) return;
    const formData = initialData.form_data || initialData;
    const savedItems = formData?.items || formData?.rows;
    if (savedItems && Array.isArray(savedItems) && savedItems.length > 0) {
      if (savedItems.length < defaultItems.length) {
        // Gabungkan baris tersimpan dengan sisa template default agar jumlah baris tetap utuh 14 (Standar) atau 23 (Hybrid)
        const merged = defaultItems.map((defRow, idx) => {
          if (idx < savedItems.length) {
            return { ...defRow, ...savedItems[idx] };
          }
          return { ...defRow };
        });
        setItems(merged);
      } else {
        setItems(savedItems);
      }
    }
  }, [initialData, defaultItems]);

  const handleMetaChange = (e) => {
    if (isLocked) return;
    setMeta({ ...meta, [e.target.name]: e.target.value });
  };

  const handleItemChange = (index, field, value) => {
    if (isLocked && !isAdmin) return;
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleSignatureChange = (roleKey, sigData) => {
    if (isLocked && !isAdmin) return;
    setMeta(prev => {
      const newSignatures = { ...(prev.signatures || {}) };
      if (sigData) {
        newSignatures[roleKey] = sigData;
      } else {
        delete newSignatures[roleKey];
      }
      const next = { ...prev, signatures: newSignatures };
      if (sigData?.name) {
        if (roleKey === 'hfo' || roleKey === 'wfo') {
          next.inspectedBy = sigData.name;
          next.hfoName = sigData.name;
        } else if (roleKey === 'toolpush') {
          next.acknowledgedBy = sigData.name;
        } else if (roleKey === 'user') {
          next.userName = sigData.name;
        }
      }
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleFinalSubmit();
  };

  return (
    <div className="form-sheet bg-white border border-slate-300 shadow-md rounded-2xl p-4 sm:p-6 text-xs font-sans">
      {/* Header Bar Kontrol & Auto-Save / Export */}
      <FormActionHeader
        onBack={onBack}
        docNo="BMSD/ 13/ FO/ HSE/ 12/ 25"
        status={status}
        saveState={saveState}
        isLocked={isLocked}
        isAdmin={isAdmin}
        adminEditMode={adminEditMode}
        onExportPdf={handleExportAparPdf}
        onExportExcel={handleExportAparExcel}
      />

      {/* Alert Status Pesan */}
      {message.text && (
        <div className={`p-3 rounded-xl mb-4 flex items-center space-x-2 ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          <span className="font-semibold">{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* KOP FORMULIR FISIK (Clean Paper Document Border & Surfaces) */}
        <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs text-slate-900 bg-white">
          <div className="grid grid-cols-12 divide-x divide-y sm:divide-y-0 divide-slate-300">
            {/* Logo Section */}
            <div className="col-span-12 sm:col-span-3 p-3 flex items-center justify-center bg-white">
              <img 
                src="/logo-baru.png" 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/besmindo-logo.png';
                }}
                alt="PT. Besmindo Materi Sewatama" 
                className="max-w-full max-h-14 sm:max-h-16 h-auto object-contain"
              />
            </div>

            {/* Title Section */}
            <div className="col-span-12 sm:col-span-5 p-3 text-center flex flex-col justify-center bg-slate-50/80">
              <h1 className="font-extrabold text-sm sm:text-base text-slate-900">PT. Besmindo Materi Sewatama</h1>
              <p className="font-bold text-xs text-slate-800 mt-0.5">{docSubtitle}</p>
              <p className="font-semibold text-xs text-slate-600 italic">{docIndo}</p>
            </div>

            {/* Meta Document Section */}
            <div className="col-span-12 sm:col-span-4 text-[10px] font-semibold divide-y divide-slate-300 bg-white">
              <div className="flex justify-between p-2">
                <span className="text-slate-500">No Formulir</span>
                <span className="font-mono font-bold text-slate-800">: BMSD/ 13/ FO/ HSE/ 12/ 25</span>
              </div>
              <div className="flex justify-between p-2">
                <span className="text-slate-500">No. Revisi</span>
                <span className="font-mono font-bold text-slate-800">: 06</span>
              </div>
              <div className="flex justify-between p-2">
                <span className="text-slate-500">Tanggal Efektif</span>
                <span className="font-mono font-bold text-slate-800">: 29 Desember 2025</span>
              </div>
            </div>
          </div>

          {/* METADATA INPUT FIELD SECTION (Informasi Rig & Pelaksana) */}
          <div className="border-t border-slate-300 grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-300 bg-slate-50/70">
            {/* Field Tanggal & Rig */}
            <div className="md:col-span-7 p-3.5 space-y-2.5">
              <div className="grid grid-cols-12 items-center gap-1">
                <label className="col-span-5 font-bold text-slate-700 text-[11px]">Inspection date / tanggal pemeriksaan</label>
                <span className="col-span-1 text-center font-bold text-slate-400">:</span>
                <input
                  type="date"
                  name="inspectionDate"
                  value={meta.inspectionDate}
                  onChange={handleMetaChange}
                  className="col-span-6 border border-slate-300 bg-white text-slate-900 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 transition-colors"
                  required
                />
              </div>
              <div className="grid grid-cols-12 items-center gap-1">
                <label className="col-span-5 font-bold text-slate-700 text-[11px]">Last Inspection Date / Tgl Terakhir</label>
                <span className="col-span-1 text-center font-bold text-slate-400">:</span>
                <input
                  type="date"
                  name="lastInspectionDate"
                  value={meta.lastInspectionDate}
                  onChange={handleMetaChange}
                  className="col-span-6 border border-slate-300 bg-white text-slate-900 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 transition-colors"
                />
              </div>
              <div className="grid grid-cols-12 items-center gap-1">
                <label className="col-span-5 font-bold text-slate-700 text-[11px]">Rig No</label>
                <span className="col-span-1 text-center font-bold text-slate-400">:</span>
                <input
                  type="text"
                  name="rigNo"
                  value={meta.rigNo}
                  onChange={handleMetaChange}
                  readOnly={isKaryawan}
                  placeholder="Contoh: BMS 10"
                  className={`col-span-6 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-blue-700 bg-white focus:ring-2 focus:ring-blue-500 transition-colors ${
                    isKaryawan ? 'bg-slate-100 cursor-not-allowed opacity-90' : ''
                  }`}
                  required
                />
              </div>
            </div>

            {/* Field Diperiksa & Diketahui */}
            <div className="md:col-span-5 grid grid-cols-2 divide-x divide-slate-300 text-center">
              <div className="p-3 flex flex-col justify-between bg-white/40">
                <span className="font-bold text-[11px] text-slate-700">Inspected by / Diperiksa oleh</span>
                <input
                  type="text"
                  name="inspectedBy"
                  value={meta.inspectedBy || meta.hfoName || ''}
                  onChange={handleMetaChange}
                  readOnly={isLocked}
                  placeholder="Nama HES Field Officer"
                  className={`bg-white border border-slate-300 rounded-lg text-center py-1.5 px-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    isLocked ? 'bg-slate-100 cursor-not-allowed opacity-90' : ''
                  }`}
                  required
                />
                <span className="font-bold text-[10px] text-slate-500 mt-1">HES Field Officer</span>
              </div>
              <div className="p-3 flex flex-col justify-between bg-white/40">
                <span className="font-bold text-[11px] text-slate-700">Acknowledged by / Diketahui Oleh</span>
                <input
                  type="text"
                  name="acknowledgedBy"
                  value={meta.acknowledgedBy || meta.toolPusherName || ''}
                  onChange={handleMetaChange}
                  readOnly={isLocked}
                  placeholder="Nama Tool Pusher"
                  className={`bg-white border border-slate-300 rounded-lg text-center py-1.5 px-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    isLocked ? 'bg-slate-100 cursor-not-allowed opacity-90' : ''
                  }`}
                  required
                />
                <span className="font-bold text-[10px] text-slate-500 mt-1">Tool Pusher</span>
              </div>
            </div>
          </div>
        </div>

        {/* TABEL CHECKLIST INSPEKSI FISIK (Clean Paper Document Table) */}
        <div className="overflow-x-auto border border-slate-300 rounded-xl shadow-xs bg-white">
          <table className="w-full border-collapse text-[10px] text-slate-900">
            <thead>
              {/* BARIS 1: Header Utama */}
              <tr className="bg-slate-100 border-b border-slate-300 font-bold text-center text-slate-800">
                <th rowSpan={4} className="border-r border-slate-300 p-1 w-8">NO</th>
                <th rowSpan={4} className="border-r border-slate-300 p-1 w-40">TYPE / SERIAL NO</th>
                <th rowSpan={4} className="border-r border-slate-300 p-1 w-16">TAHUN</th>
                <th rowSpan={4} className="border-r border-slate-300 p-1 w-32">PENEMPATAN</th>
                <th colSpan={14} className="border-r border-slate-300 p-1.5 bg-slate-200/90 tracking-wide text-slate-900 font-black">Inspeksi Bulanan</th>
                <th rowSpan={2} className="border-r border-slate-300 p-1 w-24 bg-slate-200/90 font-black">Inspeksi 6 Bulan</th>
                <th rowSpan={4} className="p-1 w-40">REMARKS</th>
              </tr>

              {/* BARIS 2: Title CONDITION */}
              <tr className="bg-slate-100 border-b border-slate-300 font-bold text-center">
                <th colSpan={14} className="border-r border-slate-300 p-1 tracking-wider text-xs bg-slate-100 text-slate-800">CONDITION</th>
              </tr>

              {/* BARIS 3: Sub-Header Nama Komponen APAR & BERAT */}
              <tr className="bg-slate-100/90 border-b border-slate-300 font-bold text-center text-[9px] uppercase text-slate-700">
                <th colSpan={2} className="border-r border-slate-300 p-1">HANDLE</th>
                <th colSpan={2} className="border-r border-slate-300 p-1">HOSE</th>
                <th colSpan={2} className="border-r border-slate-300 p-1">NOZLE</th>
                <th colSpan={2} className="border-r border-slate-300 p-1">PENGAMAN TABUNG</th>
                <th colSpan={2} className="border-r border-slate-300 p-1">PIN HANDLE</th>
                <th colSpan={2} className="border-r border-slate-300 p-1">PRESSURE GAUGE</th>
                <th colSpan={2} className="border-r border-slate-300 p-1">TABUNG</th>
                <th rowSpan={2} className="border-r border-slate-300 p-1 bg-slate-100 w-24">BERAT</th>
              </tr>

              {/* BARIS 4: Simbol Good (✓) / Bad (✗) */}
              <tr className="bg-slate-50 border-b border-slate-300 font-bold text-center">
                {/* Handle */}
                <th className="border-r border-slate-200 p-0.5 w-7 text-emerald-700 bg-emerald-50 font-black text-xs" title="Good / Ceklis">✓</th>
                <th className="border-r border-slate-300 p-0.5 w-7 text-rose-700 bg-rose-50 font-black text-xs" title="Bad / Silang">✗</th>
                {/* Hose */}
                <th className="border-r border-slate-200 p-0.5 w-7 text-emerald-700 bg-emerald-50 font-black text-xs" title="Good / Ceklis">✓</th>
                <th className="border-r border-slate-300 p-0.5 w-7 text-rose-700 bg-rose-50 font-black text-xs" title="Bad / Silang">✗</th>
                {/* Nozle */}
                <th className="border-r border-slate-200 p-0.5 w-7 text-emerald-700 bg-emerald-50 font-black text-xs" title="Good / Ceklis">✓</th>
                <th className="border-r border-slate-300 p-0.5 w-7 text-rose-700 bg-rose-50 font-black text-xs" title="Bad / Silang">✗</th>
                {/* Pengaman Tabung */}
                <th className="border-r border-slate-200 p-0.5 w-7 text-emerald-700 bg-emerald-50 font-black text-xs" title="Good / Ceklis">✓</th>
                <th className="border-r border-slate-300 p-0.5 w-7 text-rose-700 bg-rose-50 font-black text-xs" title="Bad / Silang">✗</th>
                {/* Pin Handle */}
                <th className="border-r border-slate-200 p-0.5 w-7 text-emerald-700 bg-emerald-50 font-black text-xs" title="Good / Ceklis">✓</th>
                <th className="border-r border-slate-300 p-0.5 w-7 text-rose-700 bg-rose-50 font-black text-xs" title="Bad / Silang">✗</th>
                {/* Pressure Gauge */}
                <th className="border-r border-slate-200 p-0.5 w-7 text-emerald-700 bg-emerald-50 font-black text-xs" title="Good / Ceklis">✓</th>
                <th className="border-r border-slate-300 p-0.5 w-7 text-rose-700 bg-rose-50 font-black text-xs" title="Bad / Silang">✗</th>
                {/* Tabung */}
                <th className="border-r border-slate-200 p-0.5 w-7 text-emerald-700 bg-emerald-50 font-black text-xs" title="Good / Ceklis">✓</th>
                <th className="border-r border-slate-300 p-0.5 w-7 text-rose-700 bg-rose-50 font-black text-xs" title="Bad / Silang">✗</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {items.map((item, idx) => {
                const isCO2 = String(item.type || '').trim().toUpperCase() === 'CO' || String(item.type || '').trim().toUpperCase().includes('CO2');

                return (
                  <tr 
                    key={idx} 
                    className="bg-white even:bg-slate-50/70 hover:bg-blue-50/50 transition-colors text-center"
                  >
                    {/* NO */}
                    <td className="border-r border-slate-200 font-bold p-1 text-slate-700 bg-slate-50/60">
                      {item.no || idx + 1}
                    </td>

                    {/* TYPE / SERIAL NO */}
                    <td className="border-r border-slate-200 p-1 text-left space-y-1">
                      <input
                        type="text"
                        value={item.type}
                        onChange={(e) => handleItemChange(idx, 'type', e.target.value)}
                        placeholder="Type APAR"
                        className="w-full font-bold text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:border-blue-500 focus:outline-none text-[10px]"
                      />
                      <div className="flex items-center space-x-1">
                        <span className="text-[9px] font-bold text-slate-400">SN:</span>
                        <input
                          type="text"
                          value={item.sn}
                          onChange={(e) => handleItemChange(idx, 'sn', e.target.value)}
                          placeholder="No. Seri"
                          className="w-full text-slate-800 bg-transparent border-b border-dashed border-slate-300 focus:border-blue-500 focus:outline-none text-[10px]"
                        />
                      </div>
                    </td>

                    {/* TAHUN */}
                    <td className="border-r border-slate-200 p-1">
                      <input
                        type="text"
                        value={item.tahun}
                        onChange={(e) => handleItemChange(idx, 'tahun', e.target.value)}
                        placeholder="2025"
                        className="w-full text-center text-slate-800 bg-transparent border-b border-dashed border-slate-300 focus:border-blue-500 focus:outline-none"
                      />
                    </td>

                    {/* PENEMPATAN */}
                    <td className="border-r border-slate-200 p-1 text-left">
                      <input
                        type="text"
                        value={item.penempatan}
                        onChange={(e) => handleItemChange(idx, 'penempatan', e.target.value)}
                        placeholder="Lokasi"
                        className="w-full text-left font-semibold text-slate-800 bg-transparent border-b border-dashed border-slate-300 focus:border-blue-500 focus:outline-none"
                      />
                    </td>

                    {/* CONDITION FIELDS (Good/Bad Radio Toggles) */}
                    {['handle', 'hose', 'nozle', 'pengaman', 'pin'].map((fieldKey) => (
                      <React.Fragment key={fieldKey}>
                        <td className="border-r border-slate-200 p-0.5">
                          <input
                            type="radio"
                            name={`cond_${subType}_${fieldKey}_${idx}`}
                            checked={item[fieldKey] === 'Good'}
                            onChange={() => handleItemChange(idx, fieldKey, 'Good')}
                            title="✓ (Good / Ceklis)"
                            className="w-3.5 h-3.5 text-emerald-600 accent-emerald-600 focus:ring-0 cursor-pointer"
                          />
                        </td>
                        <td className="border-r border-slate-200 p-0.5">
                          <input
                            type="radio"
                            name={`cond_${subType}_${fieldKey}_${idx}`}
                            checked={item[fieldKey] === 'Bad'}
                            onChange={() => handleItemChange(idx, fieldKey, 'Bad')}
                            title="✗ (Bad / Silang)"
                            className="w-3.5 h-3.5 text-rose-600 accent-rose-600 focus:ring-0 cursor-pointer"
                          />
                        </td>
                      </React.Fragment>
                    ))}

                    {/* PRESSURE GAUGE (Blacked out / styled for CO2 rows) */}
                    {isCO2 ? (
                      <td colSpan={2} className="border-r border-slate-200 bg-slate-200/50 text-center text-slate-400 font-mono text-[9px]">
                        N/A (CO2)
                      </td>
                    ) : (
                      <>
                        <td className="border-r border-slate-200 p-0.5">
                          <input
                            type="radio"
                            name={`cond_${subType}_pressure_${idx}`}
                            checked={item.pressure === 'Good'}
                            onChange={() => handleItemChange(idx, 'pressure', 'Good')}
                            title="✓ (Good / Ceklis)"
                            className="w-3.5 h-3.5 text-emerald-600 accent-emerald-600 focus:ring-0 cursor-pointer"
                          />
                        </td>
                        <td className="border-r border-slate-200 p-0.5">
                          <input
                            type="radio"
                            name={`cond_${subType}_pressure_${idx}`}
                            checked={item.pressure === 'Bad'}
                            onChange={() => handleItemChange(idx, 'pressure', 'Bad')}
                            title="✗ (Bad / Silang)"
                            className="w-3.5 h-3.5 text-rose-600 accent-rose-600 focus:ring-0 cursor-pointer"
                          />
                        </td>
                      </>
                    )}

                    {/* TABUNG */}
                    <td className="border-r border-slate-200 p-0.5">
                      <input
                        type="radio"
                        name={`cond_${subType}_tabung_${idx}`}
                        checked={item.tabung === 'Good'}
                        onChange={() => handleItemChange(idx, 'tabung', 'Good')}
                        title="✓ (Good / Ceklis)"
                        className="w-3.5 h-3.5 text-emerald-600 accent-emerald-600 focus:ring-0 cursor-pointer"
                      />
                    </td>
                    <td className="border-r border-slate-200 p-0.5">
                      <input
                        type="radio"
                        name={`cond_${subType}_tabung_${idx}`}
                        checked={item.tabung === 'Bad'}
                        onChange={() => handleItemChange(idx, 'tabung', 'Bad')}
                        title="✗ (Bad / Silang)"
                        className="w-3.5 h-3.5 text-rose-600 accent-rose-600 focus:ring-0 cursor-pointer"
                      />
                    </td>

                    {/* BERAT (Only for CO2 rows; shaded for others) */}
                    {isCO2 ? (
                      <td className="border-r border-slate-200 p-1 bg-amber-50/50">
                        <div className="flex items-center justify-center space-x-1">
                          <input
                            type="text"
                            value={item.berat}
                            onChange={(e) => handleItemChange(idx, 'berat', e.target.value)}
                            placeholder="21"
                            className="w-8 text-center font-bold text-slate-800 bg-transparent border-b border-slate-400 focus:outline-none"
                          />
                          <span className="text-[8px] font-bold text-slate-500 leading-tight">Kg <br />(Min 21Kg)</span>
                        </div>
                      </td>
                    ) : (
                      <td className="border-r border-slate-200 bg-slate-100/60"></td>
                    )}

                    {/* REMARKS */}
                    <td className="p-1">
                      <input
                        type="text"
                        value={item.remarks}
                        onChange={(e) => handleItemChange(idx, 'remarks', e.target.value)}
                        placeholder="Keterangan..."
                        className="w-full text-slate-800 bg-transparent border-b border-dashed border-slate-300 focus:border-blue-500 focus:outline-none text-[10px]"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Tanda Tangan Digital 2 Pihak (HFO & TOOLPUSHER) */}
        <DigitalSignatureSection
          signatures={meta.signatures || {}}
          onSignatureChange={handleSignatureChange}
          isLocked={isLocked}
          isAdmin={isAdmin}
          adminEditMode={adminEditMode}
          defaultSignerNames={{
            user: meta.userName || user?.username,
            hfo: meta.inspectedBy || meta.hfoName,
            wfo: meta.inspectedBy || meta.hfoName,
            toolpush: meta.acknowledgedBy || meta.toolPusherName
          }}
        />

        {/* Action Buttons & Status Footer (Independent per Tab) */}
        <FormSubmitFooter
          onBack={onBack}
          onSubmitFinal={handleFinalSubmit}
          onValidate={validateBeforeSubmit}
          meta={meta}
          submitting={submitting}
          isLocked={isLocked}
          isAdmin={isAdmin}
          adminEditMode={adminEditMode}
          onExportPdf={handleExportAparPdf}
          onExportExcel={handleExportAparExcel}
          saveState={saveState}
        />
      </form>
    </div>
  );
}

// ── 4. KOMPONEN UTAMA APAR FORM DENGAN SISTEM TAB INDEPENDEN ───────────────
export default function AparForm(props) {
  const [activeTab, setActiveTab] = useState('standar'); // 'standar' | 'hybrid'

  return (
    <div className="max-w-[1400px] mx-auto space-y-4">
      {/* Tab Navigasi APAR Standar vs APAR Hybrid */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
            <Flame className="w-5 h-5 flex-shrink-0" />
          </div>
          <div>
            <h2 className="font-extrabold text-sm sm:text-base text-slate-900">
              Formulir Inspeksi APAR Bulanan
            </h2>
            <p className="text-[11px] text-slate-500">
              Pilih tab di bawah untuk mengisi formulir APAR Standar (14 Unit) atau APAR Hybrid (23 Unit) secara terpisah.
            </p>
          </div>
        </div>

        {/* 2 Tab Navigation Buttons */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('standar')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'standar'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>APAR Standar</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
              activeTab === 'standar'
                ? 'bg-white/20 text-white'
                : 'bg-slate-200 text-slate-700'
            }`}>
              14 Unit
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('hybrid')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === 'hybrid'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>APAR Hybrid</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
              activeTab === 'hybrid'
                ? 'bg-white/20 text-white'
                : 'bg-slate-200 text-slate-700'
            }`}>
              23 Unit
            </span>
          </button>
        </div>
      </div>

      {/* Konten Form Tab 1: APAR Standar */}
      <div className={activeTab === 'standar' ? 'block' : 'hidden'}>
        <AparTabPanel
          subType="standar"
          label="APAR Standar"
          docSubtitle="Portable Fire Extinguisher Monthly Inspection Form (Standar)"
          docIndo="Lembar Pemeriksaan Bulanan Alat Pemadam Api Ringan (Standar)"
          defaultItems={STANDAR_APAR_ITEMS}
          {...props}
        />
      </div>

      {/* Konten Form Tab 2: APAR Hybrid */}
      <div className={activeTab === 'hybrid' ? 'block' : 'hidden'}>
        <AparTabPanel
          subType="hybrid"
          label="APAR Hybrid"
          docSubtitle="Portable Fire Extinguisher Monthly Inspection Form (Hybrid)"
          docIndo="Lembar Pemeriksaan Bulanan Alat Pemadam Api Ringan (Hybrid)"
          defaultItems={HYBRID_APAR_ITEMS}
          {...props}
        />
      </div>
    </div>
  );
}