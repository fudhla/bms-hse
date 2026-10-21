import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Eye, Layers, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useInspectionForm } from '../../hooks/useInspectionForm';
import { generateEyewashPDF, generateEyewashExcel } from '../../utils/exportUtils';
import FormActionHeader from './FormActionHeader';
import FormSubmitFooter from './FormSubmitFooter';
import DigitalSignatureSection from './DigitalSignatureSection';

// ── 1. INISIALISASI DATA DEFAULT CHECKLIST (IDENTIK UNTUK STANDAR & HYBRID) ──
// Sesuai mandat: ISI TABEL TETAP SAMA untuk kedua tab (tidak digandakan).
export const INITIAL_SHOWER_ROWS = [
  { id: 'shower_1', no: 1, week: 'I', date: '', penempatan: '', waterTank: '', waterSupply: '', waterLine: '', shower: '', cleanness: '', pump: '', remarks: '' },
  { id: 'shower_2', no: 2, week: 'II', date: '', penempatan: '', waterTank: '', waterSupply: '', waterLine: '', shower: '', cleanness: '', pump: '', remarks: '' },
  { id: 'shower_3', no: 3, week: 'III', date: '', penempatan: '', waterTank: '', waterSupply: '', waterLine: '', shower: '', cleanness: '', pump: '', remarks: '' },
  { id: 'shower_4', no: 4, week: 'IV', date: '', penempatan: '', waterTank: '', waterSupply: '', waterLine: '', shower: '', cleanness: '', pump: '', remarks: '' },
];

export const INITIAL_EYEWASH_ROWS = [
  { id: 'ew_1', no: 1, week: 'I', date: '', penempatan: 'Rig office', waterTank: '', shower: '', adhesive: '', waterSupply: '', closed: '', cover: '', remarks: '' },
  { id: 'ew_2', no: 2, week: 'I', date: '', penempatan: 'Tanki', waterTank: '', shower: '', adhesive: '', waterSupply: '', closed: '', cover: '', remarks: '' },
  { id: 'ew_3', no: 3, week: 'II', date: '', penempatan: 'Rig office', waterTank: '', shower: '', adhesive: '', waterSupply: '', closed: '', cover: '', remarks: '' },
  { id: 'ew_4', no: 4, week: 'II', date: '', penempatan: 'Tanki', waterTank: '', shower: '', adhesive: '', waterSupply: '', closed: '', cover: '', remarks: '' },
  { id: 'ew_5', no: 5, week: 'III', date: '', penempatan: 'Rig office', waterTank: '', shower: '', adhesive: '', waterSupply: '', closed: '', cover: '', remarks: '' },
  { id: 'ew_6', no: 6, week: 'III', date: '', penempatan: 'Tanki', waterTank: '', shower: '', adhesive: '', waterSupply: '', closed: '', cover: '', remarks: '' },
  { id: 'ew_7', no: 7, week: 'IV', date: '', penempatan: 'Rig office', waterTank: '', shower: '', adhesive: '', waterSupply: '', closed: '', cover: '', remarks: '' },
  { id: 'ew_8', no: 8, week: 'IV', date: '', penempatan: 'Tanki', waterTank: '', shower: '', adhesive: '', waterSupply: '', closed: '', cover: '', remarks: '' },
];

// ── 2. KOMPONEN PANEL TAB INDEPENDEN (ISOLASI TOTAL STATE & DATA) ──────────
function EyewashTabPanel({
  subType,
  label,
  docSubtitle,
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

  // Metadata Utama Independen
  const [meta, setMeta] = useState({
    period: new Date().toISOString().slice(0, 7),
    rigNo: overrideRigNo || (isKaryawan && assignedRig ? assignedRig : ''),
    hesOfficerName: '',
    toolPusherName: '',
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

  const [showerData, setShowerData] = useState(() => INITIAL_SHOWER_ROWS.map(r => ({ ...r })));
  const [eyewashData, setEyewashData] = useState(() => INITIAL_EYEWASH_ROWS.map(r => ({ ...r })));

  const formId = `eyewash_${subType}`;
  const formType = `eyewash_${subType}`;

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
    formCode: 'BMSD/44/FO/HSE/12/25',
    rigNo: meta.rigNo,
    overrideRigNo,
    viewMonth,
    viewYear,
    meta,
    setMeta,
    items: [...showerData, ...eyewashData],
    setItems: (combined) => {
      if (Array.isArray(combined) && combined.length >= 12) {
        setShowerData(combined.slice(0, 4));
        setEyewashData(combined.slice(4));
      }
    },
    extraPayload: { 
      shower_inspections: showerData, 
      eyewash_inspections: eyewashData,
      eyewash_sub_type: subType 
    }
  });

  const handleExportEyewashPdf = async () => {
    try {
      const payload = buildExportPayload();
      await generateEyewashPDF(payload, `eyewash_${subType}`);
    } catch (err) {
      console.error('Error generating Eyewash PDF:', err);
    }
  };

  const handleExportEyewashExcel = async () => {
    try {
      const payload = buildExportPayload();
      await generateEyewashExcel(payload, `eyewash_${subType}`);
    } catch (err) {
      console.error('Error generating Eyewash Excel:', err);
    }
  };

  // Pulihkan data dari database jika ada catatan tersimpan sebelumnya
  useEffect(() => {
    if (!initialData) return;
    const formData = initialData.form_data || initialData;

    if (formData.shower_inspections && Array.isArray(formData.shower_inspections) && formData.shower_inspections.length > 0) {
      setShowerData(formData.shower_inspections);
    }
    if (formData.eyewash_inspections && Array.isArray(formData.eyewash_inspections) && formData.eyewash_inspections.length > 0) {
      setEyewashData(formData.eyewash_inspections);
    }

    const savedItems = formData.items || formData.rows;
    if (savedItems && Array.isArray(savedItems) && savedItems.length >= 12 && (!formData.shower_inspections || !formData.eyewash_inspections)) {
      setShowerData(savedItems.slice(0, 4));
      setEyewashData(savedItems.slice(4));
    }

    setMeta(prev => ({
      ...prev,
      period: formData.period || initialData.tanggal?.slice(0, 7) || prev.period,
      tanggal: initialData.tanggal || formData.tanggal || formData.inspectionDate || prev.tanggal,
      rigNo: initialData.rig_no || formData.rigNo || formData.rig_no || prev.rigNo,
      hesOfficerName: formData.hesOfficerName || formData.hfo_name || formData.inspectedBy || prev.hesOfficerName,
      toolPusherName: formData.toolPusherName || formData.tool_pusher_name || formData.acknowledgedBy || prev.toolPusherName,
      userName: formData.userName || prev.userName,
      signatures: initialData.signatures || formData.signatures || prev.signatures || {}
    }));
  }, [initialData]);

  const handleMetaChange = (e) => {
    if (isLocked) return;
    setMeta({ ...meta, [e.target.name]: e.target.value });
  };

  const handleShowerChange = (index, field, value) => {
    if (isLocked) return;
    const updated = [...showerData];
    updated[index][field] = value;
    setShowerData(updated);
  };

  const handleEyewashChange = (index, field, value) => {
    if (isLocked) return;
    const updated = [...eyewashData];
    updated[index][field] = value;
    setEyewashData(updated);
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
          next.hesOfficerName = sigData.name;
          next.hfoName = sigData.name;
        } else if (roleKey === 'toolpush') {
          next.toolPusherName = sigData.name;
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
    <div className="form-sheet bg-white border border-slate-300 shadow-md rounded-2xl p-4 sm:p-6 max-w-[1600px] mx-auto text-xs font-sans">
      {/* Header Bar Kontrol & Auto-Save / Export */}
      <FormActionHeader
        onBack={onBack}
        docNo="BMSD/44/FO/HSE/12/25"
        status={status}
        saveState={saveState}
        isLocked={isLocked}
        isAdmin={isAdmin}
        adminEditMode={adminEditMode}
        onExportPdf={handleExportEyewashPdf}
        onExportExcel={handleExportEyewashExcel}
      />

      {/* Alert Status */}
      {message.text && (
        <div className={`p-3 rounded-xl mb-4 flex items-center space-x-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : message.type === 'info' ? 'bg-blue-50 text-blue-800 border border-blue-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          <span className="font-semibold">{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* KOP FORMULIR FISIK (Clean Paper Document Surfaces & Borders) */}
        <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs text-slate-900 bg-white">
          <div className="grid grid-cols-12 divide-x divide-y sm:divide-y-0 divide-slate-300 items-center">
            {/* Logo Section */}
            <div className="col-span-12 sm:col-span-4 p-3 flex items-center justify-start bg-white">
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

            {/* Judul Formulir di KOP Fisik */}
            <div className="col-span-12 sm:col-span-4 p-3 text-center bg-slate-50 border-t sm:border-t-0 border-slate-300">
              <h1 className="text-xs sm:text-sm font-black uppercase text-slate-900 tracking-wider">
                EYE WASH & SHOWER INSPECTION FORM
              </h1>
              <p className="text-[11px] font-bold text-cyan-700 uppercase mt-0.5">
                ({label})
              </p>
              <p className="text-[9px] text-slate-500 font-medium">
                Safety Shower & Eyewash Station Monthly Inspection
              </p>
            </div>

            {/* Meta Document Section */}
            <div className="col-span-12 sm:col-span-4 text-[10px] font-semibold divide-y divide-slate-300 border-t sm:border-t-0 border-slate-300 bg-white">
              <div className="flex justify-between p-2">
                <span className="text-slate-500">No Formulir</span>
                <span className="font-mono font-bold text-slate-800">: BMSD/44/FO/HSE/12/25</span>
              </div>
              <div className="flex justify-between p-2">
                <span className="text-slate-500">No. Revisi</span>
                <span className="font-mono font-bold text-slate-800">: 04</span>
              </div>
              <div className="flex justify-between p-2">
                <span className="text-slate-500">Tanggal Efektif</span>
                <span className="font-mono font-bold text-slate-800">: 29 Dec 2025</span>
              </div>
            </div>
          </div>

          {/* Metadata Bar (Period, Inspected by, Rig No) */}
          <div className="border-t border-slate-300 p-3.5 bg-slate-50/70 space-y-2.5 text-xs font-bold">
            <div className="flex items-center space-x-2 max-w-md">
              <label className="w-40 text-[11px] text-slate-700">Period</label>
              <span className="text-slate-400">:</span>
              <input
                type="text"
                name="period"
                value={meta.period}
                onChange={handleMetaChange}
                placeholder="Bulan / Tahun (misal: September 2026)"
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex items-center space-x-2 max-w-md">
              <label className="w-40 text-[11px] text-slate-700">Inspected by / Diperiksa oleh</label>
              <span className="text-slate-400">:</span>
              <input
                type="text"
                name="hesOfficerName"
                value={meta.hesOfficerName}
                onChange={handleMetaChange}
                placeholder="Nama HES Field Officer"
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex items-center space-x-2 max-w-md">
              <label className="w-40 text-[11px] text-slate-700">Rig No.</label>
              <span className="text-slate-400">:</span>
              <input
                type="text"
                name="rigNo"
                value={meta.rigNo}
                onChange={handleMetaChange}
                readOnly={isKaryawan}
                placeholder="Nomor Rig"
                className={`w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isKaryawan ? 'bg-slate-100 cursor-not-allowed opacity-90' : ''
                }`}
                required
              />
            </div>
          </div>
        </div>

        {/* SECTION 1: SHOWER */}
        <div className="space-y-2">
          <div className="flex items-center justify-between border-b-2 border-slate-300 pb-1">
            <h2 className="text-base sm:text-lg font-black tracking-wider text-slate-900 uppercase">
              1. SHOWER
            </h2>
            <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              Pemeriksaan Mingguan (4 Minggu)
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-300 rounded-xl shadow-xs bg-white">
            <table className="w-full border-collapse text-[10px] text-slate-900 min-w-[1200px]">
              <thead>
                <tr className="bg-slate-100 font-bold text-center border-b border-slate-300 text-slate-800">
                  <th rowSpan={2} className="border-r border-slate-300 p-1 w-8">No</th>
                  <th rowSpan={2} className="border-r border-slate-300 p-1 w-16">Week / Minggu</th>
                  <th rowSpan={2} className="border-r border-slate-300 p-1 w-28">Date / Tanggal</th>
                  <th rowSpan={2} className="border-r border-slate-300 p-2 w-40">Posisi/Area Penempatan</th>
                  <th colSpan={12} className="border-r border-slate-300 p-1 bg-slate-200 font-black">
                    Condition / Keadaan
                  </th>
                  <th rowSpan={2} className="p-2 w-48">Remarks / Keterangan</th>
                </tr>
                <tr className="bg-slate-50 font-bold text-center border-b border-slate-300 text-slate-700">
                  <th colSpan={2} className="border-r border-slate-300 p-1">Water Tank / Tangki Air</th>
                  <th colSpan={2} className="border-r border-slate-300 p-1">Water Suply / Persediaan Air</th>
                  <th colSpan={2} className="border-r border-slate-300 p-1">Water line & valve / Keran & saluran air</th>
                  <th colSpan={2} className="border-r border-slate-300 p-1">Shower / Pancuran</th>
                  <th colSpan={2} className="border-r border-slate-300 p-1">Cleanness of water & tank / Kebersihan Air & Tangki</th>
                  <th colSpan={2} className="border-r border-slate-300 p-1">Elect Motor Pump / Pompa Air Listrik</th>
                </tr>
                {/* Good/Bad Indicators */}
                <tr className="bg-slate-100/60 font-bold text-center border-b border-slate-300 text-[9px]">
                  <th colSpan={4} className="border-r border-slate-300"></th>
                  <th className="border-r border-slate-200 p-0.5 w-8 bg-emerald-50 text-emerald-700 font-black text-xs" title="Good / Ceklis">✓</th>
                  <th className="border-r border-slate-300 p-0.5 w-8 bg-rose-50 text-rose-700 font-black text-xs" title="Bad / Silang">✗</th>

                  <th className="border-r border-slate-200 p-0.5 w-8 bg-emerald-50 text-emerald-700 font-black text-xs" title="Good / Ceklis">✓</th>
                  <th className="border-r border-slate-300 p-0.5 w-8 bg-rose-50 text-rose-700 font-black text-xs" title="Bad / Silang">✗</th>

                  <th className="border-r border-slate-200 p-0.5 w-8 bg-emerald-50 text-emerald-700 font-black text-xs" title="Good / Ceklis">✓</th>
                  <th className="border-r border-slate-300 p-0.5 w-8 bg-rose-50 text-rose-700 font-black text-xs" title="Bad / Silang">✗</th>

                  <th className="border-r border-slate-200 p-0.5 w-8 bg-emerald-50 text-emerald-700 font-black text-xs" title="Good / Ceklis">✓</th>
                  <th className="border-r border-slate-300 p-0.5 w-8 bg-rose-50 text-rose-700 font-black text-xs" title="Bad / Silang">✗</th>

                  <th className="border-r border-slate-200 p-0.5 w-8 bg-emerald-50 text-emerald-700 font-black text-xs" title="Good / Ceklis">✓</th>
                  <th className="border-r border-slate-300 p-0.5 w-8 bg-rose-50 text-rose-700 font-black text-xs" title="Bad / Silang">✗</th>

                  <th className="border-r border-slate-200 p-0.5 w-8 bg-emerald-50 text-emerald-700 font-black text-xs" title="Good / Ceklis">✓</th>
                  <th className="border-r border-slate-300 p-0.5 w-8 bg-rose-50 text-rose-700 font-black text-xs" title="Bad / Silang">✗</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {showerData.map((row, idx) => (
                  <tr key={row.id} className="bg-white even:bg-slate-50/70 hover:bg-blue-50/50 transition-colors">
                    <td className="border-r border-slate-200 text-center font-bold text-slate-700 bg-slate-50/60 p-1">{row.no}</td>
                    <td className="border-r border-slate-200 text-center font-bold text-slate-700 bg-slate-100/60 p-1">{row.week}</td>
                    <td className="border-r border-slate-200 p-1">
                      <input
                        type="date"
                        value={row.date}
                        onChange={(e) => handleShowerChange(idx, 'date', e.target.value)}
                        className="w-full bg-transparent border-b border-dashed border-slate-300 focus:outline-none focus:border-blue-500 text-slate-800"
                      />
                    </td>
                    <td className="border-r border-slate-200 p-1">
                      <input
                        type="text"
                        value={row.penempatan}
                        onChange={(e) => handleShowerChange(idx, 'penempatan', e.target.value)}
                        placeholder="Posisi / Area"
                        className="w-full bg-transparent border-b border-dashed border-slate-300 focus:outline-none focus:border-blue-500 text-slate-800 px-1"
                      />
                    </td>

                    {/* Water Tank */}
                    <td className="border-r border-slate-200 text-center p-1">
                      <input type="radio" name={`s_wt_${subType}_${row.id}`} checked={row.waterTank === 'Good'} onChange={() => handleShowerChange(idx, 'waterTank', 'Good')} title="✓ (Good / Ceklis)" className="w-3.5 h-3.5 text-emerald-600 accent-emerald-600 focus:ring-0 cursor-pointer" />
                    </td>
                    <td className="border-r border-slate-300 text-center p-1 bg-slate-50/50">
                      <input type="radio" name={`s_wt_${subType}_${row.id}`} checked={row.waterTank === 'Bad'} onChange={() => handleShowerChange(idx, 'waterTank', 'Bad')} title="✗ (Bad / Silang)" className="w-3.5 h-3.5 text-rose-600 accent-rose-600 focus:ring-0 cursor-pointer" />
                    </td>

                    {/* Water Supply */}
                    <td className="border-r border-slate-200 text-center p-1">
                      <input type="radio" name={`s_ws_${subType}_${row.id}`} checked={row.waterSupply === 'Good'} onChange={() => handleShowerChange(idx, 'waterSupply', 'Good')} title="✓ (Good / Ceklis)" className="w-3.5 h-3.5 text-emerald-600 accent-emerald-600 focus:ring-0 cursor-pointer" />
                    </td>
                    <td className="border-r border-slate-300 text-center p-1 bg-slate-50/50">
                      <input type="radio" name={`s_ws_${subType}_${row.id}`} checked={row.waterSupply === 'Bad'} onChange={() => handleShowerChange(idx, 'waterSupply', 'Bad')} title="✗ (Bad / Silang)" className="w-3.5 h-3.5 text-rose-600 accent-rose-600 focus:ring-0 cursor-pointer" />
                    </td>

                    {/* Water Line & Valve */}
                    <td className="border-r border-slate-200 text-center p-1">
                      <input type="radio" name={`s_wl_${subType}_${row.id}`} checked={row.waterLine === 'Good'} onChange={() => handleShowerChange(idx, 'waterLine', 'Good')} title="✓ (Good / Ceklis)" className="w-3.5 h-3.5 text-emerald-600 accent-emerald-600 focus:ring-0 cursor-pointer" />
                    </td>
                    <td className="border-r border-slate-300 text-center p-1 bg-slate-50/50">
                      <input type="radio" name={`s_wl_${subType}_${row.id}`} checked={row.waterLine === 'Bad'} onChange={() => handleShowerChange(idx, 'waterLine', 'Bad')} title="✗ (Bad / Silang)" className="w-3.5 h-3.5 text-rose-600 accent-rose-600 focus:ring-0 cursor-pointer" />
                    </td>

                    {/* Shower */}
                    <td className="border-r border-slate-200 text-center p-1">
                      <input type="radio" name={`s_sh_${subType}_${row.id}`} checked={row.shower === 'Good'} onChange={() => handleShowerChange(idx, 'shower', 'Good')} title="✓ (Good / Ceklis)" className="w-3.5 h-3.5 text-emerald-600 accent-emerald-600 focus:ring-0 cursor-pointer" />
                    </td>
                    <td className="border-r border-slate-300 text-center p-1 bg-slate-50/50">
                      <input type="radio" name={`s_sh_${subType}_${row.id}`} checked={row.shower === 'Bad'} onChange={() => handleShowerChange(idx, 'shower', 'Bad')} title="✗ (Bad / Silang)" className="w-3.5 h-3.5 text-rose-600 accent-rose-600 focus:ring-0 cursor-pointer" />
                    </td>

                    {/* Cleanness */}
                    <td className="border-r border-slate-200 text-center p-1">
                      <input type="radio" name={`s_cl_${subType}_${row.id}`} checked={row.cleanness === 'Good'} onChange={() => handleShowerChange(idx, 'cleanness', 'Good')} title="✓ (Good / Ceklis)" className="w-3.5 h-3.5 text-emerald-600 accent-emerald-600 focus:ring-0 cursor-pointer" />
                    </td>
                    <td className="border-r border-slate-300 text-center p-1 bg-slate-50/50">
                      <input type="radio" name={`s_cl_${subType}_${row.id}`} checked={row.cleanness === 'Bad'} onChange={() => handleShowerChange(idx, 'cleanness', 'Bad')} title="✗ (Bad / Silang)" className="w-3.5 h-3.5 text-rose-600 accent-rose-600 focus:ring-0 cursor-pointer" />
                    </td>

                    {/* Elect Motor Pump */}
                    <td className="border-r border-slate-200 text-center p-1">
                      <input type="radio" name={`s_pm_${subType}_${row.id}`} checked={row.pump === 'Good'} onChange={() => handleShowerChange(idx, 'pump', 'Good')} title="✓ (Good / Ceklis)" className="w-3.5 h-3.5 text-emerald-600 accent-emerald-600 focus:ring-0 cursor-pointer" />
                    </td>
                    <td className="border-r border-slate-300 text-center p-1 bg-slate-50/50">
                      <input type="radio" name={`s_pm_${subType}_${row.id}`} checked={row.pump === 'Bad'} onChange={() => handleShowerChange(idx, 'pump', 'Bad')} title="✗ (Bad / Silang)" className="w-3.5 h-3.5 text-rose-600 accent-rose-600 focus:ring-0 cursor-pointer" />
                    </td>

                    {/* Remarks */}
                    <td className="p-1">
                      <input
                        type="text"
                        value={row.remarks}
                        onChange={(e) => handleShowerChange(idx, 'remarks', e.target.value)}
                        placeholder="Keterangan..."
                        className="w-full bg-transparent border-b border-dashed border-slate-300 focus:outline-none focus:border-blue-500 text-slate-800 px-1"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 2: EYE WASH */}
        <div className="space-y-2 pt-4">
          <div className="flex items-center justify-between border-b-2 border-slate-300 pb-1">
            <h2 className="text-base sm:text-lg font-black tracking-wider text-slate-900 uppercase">
              2. EYE WASH
            </h2>
            <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              Pemeriksaan Mingguan (Rig Office & Tanki)
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-300 rounded-xl shadow-xs bg-white">
            <table className="w-full border-collapse text-[10px] text-slate-900 min-w-[1200px]">
              <thead>
                <tr className="bg-slate-100 font-bold text-center border-b border-slate-300 text-slate-800">
                  <th rowSpan={2} className="border-r border-slate-300 p-1 w-8">No</th>
                  <th rowSpan={2} className="border-r border-slate-300 p-1 w-16">Week / Minggu</th>
                  <th rowSpan={2} className="border-r border-slate-300 p-1 w-28">Date / Tanggal</th>
                  <th rowSpan={2} className="border-r border-slate-300 p-2 w-40">Posisi / Area Penempatan</th>
                  <th colSpan={12} className="border-r border-slate-300 p-1 bg-slate-200 font-black">
                    Condition / Keadaan
                  </th>
                  <th rowSpan={2} className="p-2 w-48">Remarks / Keterangan</th>
                </tr>
                <tr className="bg-slate-50 font-bold text-center border-b border-slate-300 text-slate-700">
                  <th colSpan={2} className="border-r border-slate-300 p-1">Water Tank / Tangki Air</th>
                  <th colSpan={2} className="border-r border-slate-300 p-1">Shower / Pancuran</th>
                  <th colSpan={2} className="border-r border-slate-300 p-1">Adhesive / Perekat</th>
                  <th colSpan={2} className="border-r border-slate-300 p-1">Water Suply / Isi Air</th>
                  <th colSpan={2} className="border-r border-slate-300 p-1">Closed / Tutup</th>
                  <th colSpan={2} className="border-r border-slate-300 p-1">Cover / Pelindung</th>
                </tr>
                {/* Good/Bad Indicators */}
                <tr className="bg-slate-100/60 font-bold text-center border-b border-slate-300 text-[9px]">
                  <th colSpan={4} className="border-r border-slate-300"></th>
                  <th className="border-r border-slate-200 p-0.5 w-8 bg-emerald-50 text-emerald-700 font-black text-xs" title="Good / Ceklis">✓</th>
                  <th className="border-r border-slate-300 p-0.5 w-8 bg-rose-50 text-rose-700 font-black text-xs" title="Bad / Silang">✗</th>

                  <th className="border-r border-slate-200 p-0.5 w-8 bg-emerald-50 text-emerald-700 font-black text-xs" title="Good / Ceklis">✓</th>
                  <th className="border-r border-slate-300 p-0.5 w-8 bg-rose-50 text-rose-700 font-black text-xs" title="Bad / Silang">✗</th>

                  <th className="border-r border-slate-200 p-0.5 w-8 bg-emerald-50 text-emerald-700 font-black text-xs" title="Good / Ceklis">✓</th>
                  <th className="border-r border-slate-300 p-0.5 w-8 bg-rose-50 text-rose-700 font-black text-xs" title="Bad / Silang">✗</th>

                  <th className="border-r border-slate-200 p-0.5 w-8 bg-emerald-50 text-emerald-700 font-black text-xs" title="Good / Ceklis">✓</th>
                  <th className="border-r border-slate-300 p-0.5 w-8 bg-rose-50 text-rose-700 font-black text-xs" title="Bad / Silang">✗</th>

                  <th className="border-r border-slate-200 p-0.5 w-8 bg-emerald-50 text-emerald-700 font-black text-xs" title="Good / Ceklis">✓</th>
                  <th className="border-r border-slate-300 p-0.5 w-8 bg-rose-50 text-rose-700 font-black text-xs" title="Bad / Silang">✗</th>

                  <th className="border-r border-slate-200 p-0.5 w-8 bg-emerald-50 text-emerald-700 font-black text-xs" title="Good / Ceklis">✓</th>
                  <th className="border-r border-slate-300 p-0.5 w-8 bg-rose-50 text-rose-700 font-black text-xs" title="Bad / Silang">✗</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {eyewashData.map((row, idx) => {
                  const isFirstOfWeek = idx % 2 === 0;

                  return (
                    <tr key={row.id} className="bg-white even:bg-slate-50/70 hover:bg-blue-50/50 transition-colors">
                      <td className="border-r border-slate-200 text-center font-bold text-slate-700 bg-slate-50/60 p-1">{row.no}</td>

                      {/* RowSpan untuk Minggu (2 baris per minggu) */}
                      {isFirstOfWeek ? (
                        <td rowSpan={2} className="border-r border-slate-200 text-center font-bold text-slate-700 bg-slate-100/60 p-1 align-middle">
                          {row.week}
                        </td>
                      ) : null}

                      <td className="border-r border-slate-200 p-1">
                        <input
                          type="date"
                          value={row.date}
                          onChange={(e) => handleEyewashChange(idx, 'date', e.target.value)}
                          className="w-full bg-transparent border-b border-dashed border-slate-300 focus:outline-none focus:border-blue-500 text-slate-800"
                        />
                      </td>

                      <td className="border-r border-slate-200 p-1 font-semibold text-slate-800">
                        <input
                          type="text"
                          value={row.penempatan}
                          onChange={(e) => handleEyewashChange(idx, 'penempatan', e.target.value)}
                          className="w-full bg-transparent border-b border-dashed border-slate-300 focus:outline-none focus:border-blue-500 text-slate-800 px-1"
                        />
                      </td>

                      {/* Water Tank */}
                      <td className="border-r border-slate-200 text-center p-1">
                        <input type="radio" name={`ew_wt_${subType}_${row.id}`} checked={row.waterTank === 'Good'} onChange={() => handleEyewashChange(idx, 'waterTank', 'Good')} title="✓ (Good / Ceklis)" className="w-3.5 h-3.5 text-emerald-600 accent-emerald-600 focus:ring-0 cursor-pointer" />
                      </td>
                      <td className="border-r border-slate-300 text-center p-1 bg-slate-50/50">
                        <input type="radio" name={`ew_wt_${subType}_${row.id}`} checked={row.waterTank === 'Bad'} onChange={() => handleEyewashChange(idx, 'waterTank', 'Bad')} title="✗ (Bad / Silang)" className="w-3.5 h-3.5 text-rose-600 accent-rose-600 focus:ring-0 cursor-pointer" />
                      </td>

                      {/* Shower */}
                      <td className="border-r border-slate-200 text-center p-1">
                        <input type="radio" name={`ew_sh_${subType}_${row.id}`} checked={row.shower === 'Good'} onChange={() => handleEyewashChange(idx, 'shower', 'Good')} title="✓ (Good / Ceklis)" className="w-3.5 h-3.5 text-emerald-600 accent-emerald-600 focus:ring-0 cursor-pointer" />
                      </td>
                      <td className="border-r border-slate-300 text-center p-1 bg-slate-50/50">
                        <input type="radio" name={`ew_sh_${subType}_${row.id}`} checked={row.shower === 'Bad'} onChange={() => handleEyewashChange(idx, 'shower', 'Bad')} title="✗ (Bad / Silang)" className="w-3.5 h-3.5 text-rose-600 accent-rose-600 focus:ring-0 cursor-pointer" />
                      </td>

                      {/* Adhesive */}
                      <td className="border-r border-slate-200 text-center p-1">
                        <input type="radio" name={`ew_ad_${subType}_${row.id}`} checked={row.adhesive === 'Good'} onChange={() => handleEyewashChange(idx, 'adhesive', 'Good')} title="✓ (Good / Ceklis)" className="w-3.5 h-3.5 text-emerald-600 accent-emerald-600 focus:ring-0 cursor-pointer" />
                      </td>
                      <td className="border-r border-slate-300 text-center p-1 bg-slate-50/50">
                        <input type="radio" name={`ew_ad_${subType}_${row.id}`} checked={row.adhesive === 'Bad'} onChange={() => handleEyewashChange(idx, 'adhesive', 'Bad')} title="✗ (Bad / Silang)" className="w-3.5 h-3.5 text-rose-600 accent-rose-600 focus:ring-0 cursor-pointer" />
                      </td>

                      {/* Water Supply */}
                      <td className="border-r border-slate-200 text-center p-1">
                        <input type="radio" name={`ew_ws_${subType}_${row.id}`} checked={row.waterSupply === 'Good'} onChange={() => handleEyewashChange(idx, 'waterSupply', 'Good')} title="✓ (Good / Ceklis)" className="w-3.5 h-3.5 text-emerald-600 accent-emerald-600 focus:ring-0 cursor-pointer" />
                      </td>
                      <td className="border-r border-slate-300 text-center p-1 bg-slate-50/50">
                        <input type="radio" name={`ew_ws_${subType}_${row.id}`} checked={row.waterSupply === 'Bad'} onChange={() => handleEyewashChange(idx, 'waterSupply', 'Bad')} title="✗ (Bad / Silang)" className="w-3.5 h-3.5 text-rose-600 accent-rose-600 focus:ring-0 cursor-pointer" />
                      </td>

                      {/* Closed */}
                      <td className="border-r border-slate-200 text-center p-1">
                        <input type="radio" name={`ew_cl_${subType}_${row.id}`} checked={row.closed === 'Good'} onChange={() => handleEyewashChange(idx, 'closed', 'Good')} title="✓ (Good / Ceklis)" className="w-3.5 h-3.5 text-emerald-600 accent-emerald-600 focus:ring-0 cursor-pointer" />
                      </td>
                      <td className="border-r border-slate-300 text-center p-1 bg-slate-50/50">
                        <input type="radio" name={`ew_cl_${subType}_${row.id}`} checked={row.closed === 'Bad'} onChange={() => handleEyewashChange(idx, 'closed', 'Bad')} title="✗ (Bad / Silang)" className="w-3.5 h-3.5 text-rose-600 accent-rose-600 focus:ring-0 cursor-pointer" />
                      </td>

                      {/* Cover */}
                      <td className="border-r border-slate-200 text-center p-1">
                        <input type="radio" name={`ew_cv_${subType}_${row.id}`} checked={row.cover === 'Good'} onChange={() => handleEyewashChange(idx, 'cover', 'Good')} title="✓ (Good / Ceklis)" className="w-3.5 h-3.5 text-emerald-600 accent-emerald-600 focus:ring-0 cursor-pointer" />
                      </td>
                      <td className="border-r border-slate-300 text-center p-1 bg-slate-50/50">
                        <input type="radio" name={`ew_cv_${subType}_${row.id}`} checked={row.cover === 'Bad'} onChange={() => handleEyewashChange(idx, 'cover', 'Bad')} title="✗ (Bad / Silang)" className="w-3.5 h-3.5 text-rose-600 accent-rose-600 focus:ring-0 cursor-pointer" />
                      </td>

                      {/* Remarks */}
                      <td className="p-1">
                        <input
                          type="text"
                          value={row.remarks}
                          onChange={(e) => handleEyewashChange(idx, 'remarks', e.target.value)}
                          placeholder="Keterangan..."
                          className="w-full bg-transparent border-b border-dashed border-slate-300 focus:outline-none focus:border-blue-500 text-slate-800 px-1"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
            hfo: meta.hesOfficerName,
            wfo: meta.hesOfficerName,
            toolpush: meta.toolPusherName
          }}
        />

        {/* Action Buttons & Status Footer */}
        <FormSubmitFooter
          onBack={onBack}
          onSubmitFinal={handleFinalSubmit}
          onValidate={validateBeforeSubmit}
          meta={meta}
          submitting={submitting}
          isLocked={isLocked}
          isAdmin={isAdmin}
          adminEditMode={adminEditMode}
          onExportPdf={handleExportEyewashPdf}
          onExportExcel={handleExportEyewashExcel}
          saveState={saveState}
        />
      </form>
    </div>
  );
}

// ── 3. KOMPONEN UTAMA DENGAN TAB NAVIGASI (STANDAR & HYBRID) ───────────────
export default function EyewashForm(props) {
  const [activeTab, setActiveTab] = useState('standar'); // 'standar' | 'hybrid'

  return (
    <div className="space-y-4">
      {/* ── Tab Switcher Bar ── */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-xl">
            <Eye className="w-5 h-5 flex-shrink-0" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
              Eye Wash &amp; Shower Inspection Form
            </h2>
            <p className="text-[11px] text-slate-500">
              Pilih tipe formulir inspeksi: Standar atau Hybrid
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-xl w-full sm:w-auto">
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
            <span>Standar</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
              activeTab === 'standar'
                ? 'bg-white/20 text-white'
                : 'bg-slate-200 text-slate-700'
            }`}>
              Checklist
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
            <span>Hybrid</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
              activeTab === 'hybrid'
                ? 'bg-white/20 text-white'
                : 'bg-slate-200 text-slate-700'
            }`}>
              Checklist
            </span>
          </button>
        </div>
      </div>

      {/* Konten Form Tab 1: Standar */}
      <div className={activeTab === 'standar' ? 'block' : 'hidden'}>
        <EyewashTabPanel
          subType="standar"
          label="Standar"
          docSubtitle="Eye Wash & Shower Inspection Form (Standar)"
          {...props}
        />
      </div>

      {/* Konten Form Tab 2: Hybrid */}
      <div className={activeTab === 'hybrid' ? 'block' : 'hidden'}>
        <EyewashTabPanel
          subType="hybrid"
          label="Hybrid"
          docSubtitle="Eye Wash & Shower Inspection Form (Hybrid)"
          {...props}
        />
      </div>
    </div>
  );
}