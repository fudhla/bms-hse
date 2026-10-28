import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useInspectionForm } from '../../hooks/useInspectionForm';
import { generateScbaPDF, generateScbaExcel } from '../../utils/exportUtils';
import FormActionHeader from './FormActionHeader';
import FormSubmitFooter from './FormSubmitFooter';
import DigitalSignatureSection from './DigitalSignatureSection';

// Helper pembuat baris awal SCBA & ELSA
const createScbaRow = (id = Date.now()) => ({
  id: `scba_${id}`,
  category: 'SCBA SPERIAN 30 MNT',
  sn: '',
  penempatan: '',
  pressure: '',
  hose: '',
  cert: '',
  certValidDate: '',
  certExpireDate: '',
  certDate: '',
  rubber: '',
  valve: '',
  whistle: '',
  tabung: '',
  rekomendasi: '',
  isElsa: false
});

const createElsaRow = (id = Date.now()) => ({
  id: `elsa_${id}`,
  category: 'ELSA 10 Menit',
  sn: '',
  penempatan: '',
  pressure: '',
  hose: '',
  cert: '',
  certValidDate: '',
  certExpireDate: '',
  certDate: '',
  rubber: '',
  valve: '',
  whistle: 'N/A',
  tabung: '',
  rekomendasi: '',
  isElsa: true
});

const INITIAL_SCBA_ITEMS = [
  createScbaRow('1'),
  createScbaRow('2'),
  createScbaRow('3'),
  createScbaRow('4'),
  createScbaRow('5')
];

const INITIAL_ELSA_ITEMS = [
  createElsaRow('1'),
  createElsaRow('2')
];

const isConditionOk = (val) => val === '✓' || val === 'Good' || val === 'OK' || val === 'ok';
const isConditionBad = (val) => val === '✕' || val === 'Bad' || val === 'X' || val === 'x' || val === '✗';

const getSafeDateValue = (val) => {
  if (!val || typeof val !== 'string') return '';
  const trimmed = val.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }
  return '';
};

export default function ScbaForm({ onBack, currentUser, overrideRigNo = null, viewMonth = null, viewYear = null }) {
  const { user: authUser } = useAuth();
  const user = currentUser || authUser;
  const isKaryawan = user?.role === 'karyawan';
  const assignedRig = user?.rig_name || '';

  // Metadata Utama
  const [meta, setMeta] = useState({
    inspectionDate: new Date().toISOString().split('T')[0],
    lastInspectionDate: '',
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

  // Dua state dinamis terpisah: SCBA (default 5 unit) & ELSA (default 2 unit)
  const [scbaItems, setScbaItems] = useState(INITIAL_SCBA_ITEMS);
  const [elsaItems, setElsaItems] = useState(INITIAL_ELSA_ITEMS);

  const combinedItems = [...scbaItems, ...elsaItems];

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
    initialData
  } = useInspectionForm({
    formId: 'scba',
    formType: 'SCBA Monthly Inspection Form',
    formCode: 'BMSD/43/FO/HSE/06/25',
    rigNo: meta.rigNo,
    overrideRigNo,
    viewMonth,
    viewYear,
    meta: { ...meta, hfoName: meta.hesOfficerName, toolPusherName: meta.toolPusherName },
    setMeta: (updater) => {
      setMeta(prev => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        return {
          ...next,
          hesOfficerName: next.hfoName || next.hesOfficerName,
          toolPusherName: next.toolPusherName || next.toolPusherName
        };
      });
    },
    items: combinedItems,
    setItems: (newItems) => {
      if (Array.isArray(newItems) && newItems.length > 0) {
        const scba = newItems.filter(it => !it.isElsa && !String(it.category || '').toLowerCase().includes('elsa'));
        const elsa = newItems.filter(it => it.isElsa || String(it.category || '').toLowerCase().includes('elsa'));
        if (scba.length > 0) setScbaItems(scba);
        if (elsa.length > 0) setElsaItems(elsa);
      }
    },
    extraPayload: { 
      scba_items: scbaItems,
      elsa_items: elsaItems,
      items: combinedItems
    }
  });

  // Pulihkan data dari backend jika ada
  useEffect(() => {
    if (!initialData) return;
    const formData = initialData.form_data || initialData;

    const normalizeRow = (it) => {
      const safeExpire = getSafeDateValue(it.certExpireDate) || getSafeDateValue(it.certDate) || getSafeDateValue(it.cert);
      const safeValid = getSafeDateValue(it.certValidDate) || getSafeDateValue(it.certStartDate);
      return {
        ...it,
        certValidDate: safeValid,
        certExpireDate: safeExpire,
        certDate: safeExpire || it.certDate || '',
        cert: safeExpire || it.cert || ''
      };
    };

    // 1. Skema terpisah baru: scba_items dan elsa_items
    if (Array.isArray(formData.scba_items) && formData.scba_items.length > 0) {
      setScbaItems(formData.scba_items.map(normalizeRow));
    }
    if (Array.isArray(formData.elsa_items) && formData.elsa_items.length > 0) {
      setElsaItems(formData.elsa_items.map(normalizeRow));
    }

    // 2. Skema gabungan array items
    const loadedItems = formData.items || formData.rows;
    if (Array.isArray(loadedItems) && loadedItems.length > 0 && (!formData.scba_items || !formData.elsa_items)) {
      const scba = loadedItems.filter(it => !it.isElsa && !String(it.category || '').toLowerCase().includes('elsa'));
      const elsa = loadedItems.filter(it => it.isElsa || String(it.category || '').toLowerCase().includes('elsa'));
      if (scba.length > 0) setScbaItems(scba.map(normalizeRow));
      if (elsa.length > 0) setElsaItems(elsa.map(normalizeRow));
    }

    // 3. Fallback jika data legacy (weeks format)
    if (Array.isArray(formData.inspection_details) && formData.inspection_details.length > 0 && !formData.scba_items) {
      const firstWeekItems = formData.inspection_details[0]?.items || [];
      const scba = firstWeekItems.filter(it => !it.isElsa && !String(it.category || '').toLowerCase().includes('elsa'));
      const elsa = firstWeekItems.filter(it => it.isElsa || String(it.category || '').toLowerCase().includes('elsa'));
      if (scba.length > 0) setScbaItems(scba.map(normalizeRow));
      if (elsa.length > 0) setElsaItems(elsa.map(normalizeRow));
    }

    setMeta(prev => ({
      ...prev,
      inspectionDate: initialData.tanggal || formData.inspectionDate || prev.inspectionDate,
      lastInspectionDate: formData.lastInspectionDate || prev.lastInspectionDate,
      rigNo: initialData.rig_no || formData.rigNo || prev.rigNo,
      hesOfficerName: formData.hesOfficerName || formData.hfoName || initialData.hfo_name || prev.hesOfficerName,
      toolPusherName: formData.toolPusherName || initialData.tool_pusher_name || prev.toolPusherName,
      userName: formData.userName || prev.userName,
      signatures: initialData.signatures || formData.signatures || prev.signatures || {}
    }));
  }, [initialData]);

  const handleExportScbaPdf = async () => {
    try {
      const payload = buildExportPayload();
      await generateScbaPDF(payload);
    } catch (err) {
      console.error('Error generating SCBA PDF:', err);
    }
  };

  const handleExportScbaExcel = async () => {
    try {
      const payload = buildExportPayload();
      await generateScbaExcel(payload);
    } catch (err) {
      console.error('Error generating SCBA Excel:', err);
    }
  };

  const handleMetaChange = (e) => {
    if (isLocked) return;
    setMeta({ ...meta, [e.target.name]: e.target.value });
  };

  // Handler SCBA
  const handleAddScbaRow = () => {
    if (isLocked) return;
    setScbaItems(prev => [
      ...prev,
      createScbaRow(Date.now())
    ]);
  };

  const handleRemoveScbaRow = (index) => {
    if (isLocked) return;
    if (scbaItems.length <= 1) {
      alert('Minimal harus ada 1 baris SCBA.');
      return;
    }
    setScbaItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleScbaChange = (index, field, value) => {
    if (isLocked) return;
    setScbaItems(prev => {
      const updated = [...prev];
      const nextRow = { ...updated[index], [field]: value };
      if (field === 'certExpireDate') {
        nextRow.certDate = value;
        nextRow.cert = value;
      } else if (field === 'certValidDate') {
        nextRow.certStartDate = value;
      }
      updated[index] = nextRow;
      return updated;
    });
  };

  // Handler ELSA
  const handleAddElsaRow = () => {
    if (isLocked) return;
    setElsaItems(prev => [
      ...prev,
      createElsaRow(Date.now())
    ]);
  };

  const handleRemoveElsaRow = (index) => {
    if (isLocked) return;
    if (elsaItems.length <= 1) {
      alert('Minimal harus ada 1 baris ELSA.');
      return;
    }
    setElsaItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleElsaChange = (index, field, value) => {
    if (isLocked) return;
    setElsaItems(prev => {
      const updated = [...prev];
      const nextRow = { ...updated[index], [field]: value };
      if (field === 'certExpireDate') {
        nextRow.certDate = value;
        nextRow.cert = value;
      } else if (field === 'certValidDate') {
        nextRow.certStartDate = value;
      }
      updated[index] = nextRow;
      return updated;
    });
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

  // Helper render 2 radio button bersimbol murni ✓ dan ✕
  const renderConditionRadio = (item, field, onChange) => {
    const currentVal = item[field];
    const checkedOk = isConditionOk(currentVal);
    const checkedBad = isConditionBad(currentVal);

    const handleToggle = (choice) => {
      if (isLocked) return;
      if (choice === 'ok') {
        onChange(checkedOk ? '' : '✓');
      } else if (choice === 'bad') {
        onChange(checkedBad ? '' : '✕');
      }
    };

    return (
      <React.Fragment key={field}>
        <td
          onClick={() => handleToggle('ok')}
          className={`border-r border-slate-300 p-0.5 text-center cursor-pointer transition select-none ${
            checkedOk ? 'bg-emerald-100/70' : 'hover:bg-emerald-50/50'
          }`}
        >
          <input
            type="radio"
            name={`${field}_${item.id}`}
            checked={checkedOk}
            onChange={() => {}}
            onClick={(e) => {
              e.stopPropagation();
              handleToggle('ok');
            }}
            disabled={isLocked}
            title="✓ (Bagus / Normal)"
            className="w-4 h-4 text-emerald-600 accent-emerald-600 focus:ring-0 cursor-pointer"
          />
        </td>
        <td
          onClick={() => handleToggle('bad')}
          className={`border-r border-slate-800 p-0.5 text-center cursor-pointer transition select-none ${
            checkedBad ? 'bg-rose-100/70' : 'bg-slate-50/40 hover:bg-rose-50/50'
          }`}
        >
          <input
            type="radio"
            name={`${field}_${item.id}`}
            checked={checkedBad}
            onChange={() => {}}
            onClick={(e) => {
              e.stopPropagation();
              handleToggle('bad');
            }}
            disabled={isLocked}
            title="✕ (Rusak / Tidak Normal)"
            className="w-4 h-4 text-rose-600 accent-rose-600 focus:ring-0 cursor-pointer"
          />
        </td>
      </React.Fragment>
    );
  };

  return (
    <div className="form-sheet rounded-xl border border-slate-300 shadow-md p-4 sm:p-6 max-w-[1600px] mx-auto text-xs font-sans">
      {/* Header Bar Kontrol & Auto-Save / Export */}
      <FormActionHeader
        onBack={onBack}
        docNo="BMSD/43/FO/HSE/06/25"
        status={status}
        saveState={saveState}
        isLocked={isLocked}
        isAdmin={isAdmin}
        adminEditMode={adminEditMode}
        onExportPdf={handleExportScbaPdf}
        onExportExcel={handleExportScbaExcel}
      />

      {/* Alert Status */}
      {message.text && (
        <div className={`p-3 rounded-lg mb-4 flex items-center space-x-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          <span className="font-semibold">{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* KOP FORMULIR FISIK */}
        <div className="border-2 border-slate-800 text-slate-900 bg-white">
          <div className="grid grid-cols-12 divide-x-2 divide-y-2 sm:divide-y-0 divide-slate-800 items-center">
            {/* Logo Section */}
            <div className="col-span-12 sm:col-span-3 p-2.5 flex items-center justify-center bg-white">
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
            <div className="col-span-12 sm:col-span-6 p-2 text-center flex flex-col justify-center bg-slate-50">
              <h1 className="font-extrabold text-sm sm:text-base text-slate-900 uppercase">
                PT. Besmindo Materi Sewatama
              </h1>
              <p className="font-bold text-xs text-slate-800">
                SCBA Monthly Inspection Form
              </p>
              <p className="font-semibold text-[11px] text-slate-600 italic">
                Lembar Pemeriksaan Bulanan Alat Pasok Pernafasan
              </p>
            </div>

            {/* Meta Document Section */}
            <div className="col-span-12 sm:col-span-3 text-[10px] font-semibold divide-y divide-slate-800">
              <div className="flex justify-between p-1">
                <span>No Formulir</span>
                <span className="font-mono font-bold">: BMSD/43/FO/HSE/06/25</span>
              </div>
              <div className="flex justify-between p-1">
                <span>No. Revisi</span>
                <span className="font-mono font-bold">: 01</span>
              </div>
              <div className="flex justify-between p-1">
                <span>Tanggal Efektif</span>
                <span className="font-mono font-bold">: 24 Juni 2025</span>
              </div>
            </div>
          </div>

          {/* Sub Header (Tanggal & Rig) */}
          <div className="border-t-2 border-slate-800 p-2.5 bg-slate-50 grid grid-cols-1 md:grid-cols-3 gap-4 font-bold text-xs">
            <div className="flex items-center space-x-2">
              <label className="w-48 text-[11px] text-slate-700">Inspection date / tanggal pemeriksaan</label>
              <span>:</span>
              <input
                type="date"
                name="inspectionDate"
                value={meta.inspectionDate}
                onChange={handleMetaChange}
                disabled={isLocked}
                className="w-full border-b border-slate-400 bg-transparent px-1 py-0.5 font-bold focus:outline-none focus:border-blue-600"
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="w-56 text-[11px] text-slate-700">Last Inspection Date / Tanggal Terakhir</label>
              <span>:</span>
              <input
                type="date"
                name="lastInspectionDate"
                value={meta.lastInspectionDate}
                onChange={handleMetaChange}
                disabled={isLocked}
                className="w-full border-b border-slate-400 bg-transparent px-1 py-0.5 font-bold focus:outline-none focus:border-blue-600"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="w-32 text-[11px] text-slate-700">Rig No / Nomor rig</label>
              <span>:</span>
              <input
                type="text"
                name="rigNo"
                value={meta.rigNo}
                onChange={handleMetaChange}
                readOnly={isKaryawan}
                placeholder="Rig No"
                className={`w-full border-b border-slate-400 bg-transparent px-1 py-0.5 font-bold text-blue-900 focus:outline-none ${
                  isKaryawan ? 'bg-slate-100 cursor-not-allowed text-slate-700' : ''
                }`}
                required
              />
            </div>
          </div>
        </div>

        {/* KETERANGAN SIMBOL / PETUNJUK */}
        <div className="bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-[11px] text-slate-700 flex flex-wrap items-center gap-4">
          <span className="font-bold uppercase tracking-wider text-slate-900">Petunjuk Pengisian:</span>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center w-5 h-5 bg-emerald-100 text-emerald-800 font-black rounded">✓</span>
            <span>= Kondisi Bagus / Normal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center w-5 h-5 bg-rose-100 text-rose-800 font-black rounded">✕</span>
            <span>= Rusak / Tidak Normal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center px-1.5 py-0.5 bg-blue-100 text-blue-800 font-bold rounded text-[10px]">Tgl</span>
            <span>= Berlaku & Expire Sertifikat Diisi Tanggal (Date Picker)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center w-6 h-5 bg-black text-white font-bold rounded text-[9px]">■</span>
            <span>= N/A (Khusus Whistle Unit ELSA)</span>
          </div>
        </div>

        {/* TABEL INSPEKSI SCBA BULANAN */}
        <div className="overflow-x-auto border-2 border-slate-800 bg-white">
          <table className="w-full border-collapse text-[10px] text-slate-900 min-w-[1300px]">
            <thead>
              {/* Header Row 1 */}
              <tr className="bg-slate-200 text-slate-900 font-bold text-center border-b border-slate-800 text-[11px]">
                <th rowSpan={3} className="border-r border-slate-800 p-2 w-10">NO</th>
                <th rowSpan={3} className="border-r border-slate-800 p-2 min-w-[200px]">MERK, TYPE / SERIAL NO</th>
                <th rowSpan={3} className="border-r border-slate-800 p-2 min-w-[140px]">PENEMPATAN</th>
                <th colSpan={14} className="border-r border-slate-800 p-1.5 text-xs tracking-widest bg-slate-300 font-black uppercase">
                  C O N D I T I O N
                </th>
                <th rowSpan={3} className="border-r border-slate-800 p-2 min-w-[160px]">REKOMENDASI (Catatan)</th>
                <th rowSpan={3} className="p-2 w-12 bg-slate-100 text-center">ACTION</th>
              </tr>

              {/* Header Row 2 */}
              <tr className="bg-slate-100 font-bold text-center border-b border-slate-800 text-[10px] text-slate-800">
                <th colSpan={2} className="border-r border-slate-800 p-1">PRESSURE VOLUME</th>
                <th colSpan={2} className="border-r border-slate-800 p-1">HOSE</th>
                <th colSpan={2} className="border-r border-slate-800 p-1">CERTIFICATE</th>
                <th colSpan={2} className="border-r border-slate-800 p-1">RUBBER MASKER & TAIL</th>
                <th colSpan={2} className="border-r border-slate-800 p-1">VALVE & connection</th>
                <th colSpan={2} className="border-r border-slate-800 p-1">WISTLE</th>
                <th colSpan={2} className="border-r border-slate-800 p-1">TABUNG</th>
              </tr>

              {/* Header Row 3: Sub-kolom murni ✓ dan ✕ */}
              <tr className="bg-white font-bold text-center border-b-2 border-slate-800 text-[11px]">
                {/* Pressure Volume */}
                <th className="border-r border-slate-300 p-1 w-8 bg-emerald-50 text-emerald-700 font-black">✓</th>
                <th className="border-r border-slate-800 p-1 w-8 bg-rose-50 text-rose-700 font-black">✕</th>

                {/* Hose */}
                <th className="border-r border-slate-300 p-1 w-8 bg-emerald-50 text-emerald-700 font-black">✓</th>
                <th className="border-r border-slate-800 p-1 w-8 bg-rose-50 text-rose-700 font-black">✕</th>

                {/* Certificate */}
                <th className="border-r border-slate-300 p-1 px-1.5 min-w-[105px] w-28 bg-emerald-50 text-emerald-800 font-bold text-[10px] text-center">Berlaku</th>
                <th className="border-r border-slate-800 p-1 px-1.5 min-w-[105px] w-28 bg-rose-50 text-rose-800 font-bold text-[10px] text-center">Expire</th>

                {/* Rubber Masker & Tail */}
                <th className="border-r border-slate-300 p-1 w-8 bg-emerald-50 text-emerald-700 font-black">✓</th>
                <th className="border-r border-slate-800 p-1 w-8 bg-rose-50 text-rose-700 font-black">✕</th>

                {/* Valve & Connection */}
                <th className="border-r border-slate-300 p-1 w-8 bg-emerald-50 text-emerald-700 font-black">✓</th>
                <th className="border-r border-slate-800 p-1 w-8 bg-rose-50 text-rose-700 font-black">✕</th>

                {/* Wistle */}
                <th className="border-r border-slate-300 p-1 w-8 bg-emerald-50 text-emerald-700 font-black">✓</th>
                <th className="border-r border-slate-800 p-1 w-8 bg-rose-50 text-rose-700 font-black">✕</th>

                {/* Tabung */}
                <th className="border-r border-slate-300 p-1 w-8 bg-emerald-50 text-emerald-700 font-black">✓</th>
                <th className="border-r border-slate-800 p-1 w-8 bg-rose-50 text-rose-700 font-black">✕</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800 font-medium">
              {/* ── BARIS PEMBATAS GRUP 1: SCBA ── */}
              <tr className="bg-slate-200/90 font-extrabold text-slate-900 border-y-2 border-slate-800">
                <td colSpan={19} className="px-3 py-1.5 bg-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs uppercase tracking-wider text-slate-900">
                      SCBA SPERIAN 30 MNT :
                    </span>
                    <button
                      type="button"
                      onClick={handleAddScbaRow}
                      disabled={isLocked}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded shadow-xs transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Baris SCBA</span>
                    </button>
                  </div>
                </td>
              </tr>

              {/* MAPPING SCBA ITEMS */}
              {scbaItems.map((item, idx) => (
                <tr key={item.id} className="hover:bg-blue-50/40 transition">
                  {/* NO */}
                  <td className="border-r border-slate-800 text-center font-bold bg-slate-50 p-1 text-xs">
                    {idx + 1}
                  </td>

                  {/* MERK, TYPE / SERIAL NO */}
                  <td className="border-r border-slate-800 p-1">
                    <input
                      type="text"
                      value={item.sn}
                      onChange={(e) => handleScbaChange(idx, 'sn', e.target.value)}
                      placeholder="Merk / S/N Unit SCBA..."
                      disabled={isLocked}
                      className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-600 focus:outline-none font-semibold text-slate-800 px-1 py-0.5"
                    />
                  </td>

                  {/* PENEMPATAN */}
                  <td className="border-r border-slate-800 p-1">
                    <input
                      type="text"
                      value={item.penempatan}
                      onChange={(e) => handleScbaChange(idx, 'penempatan', e.target.value)}
                      placeholder="Lokasi / Area..."
                      disabled={isLocked}
                      className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-600 focus:outline-none px-1 py-0.5"
                    />
                  </td>

                  {/* CONDITION: PRESSURE VOLUME */}
                  {renderConditionRadio(item, 'pressure', (val) => handleScbaChange(idx, 'pressure', val))}

                  {/* CONDITION: HOSE */}
                  {renderConditionRadio(item, 'hose', (val) => handleScbaChange(idx, 'hose', val))}

                  {/* CONDITION: CERTIFICATE (Berlaku & Expire - TANGGAL) */}
                  <td className="border-r border-slate-300 p-1 text-center bg-white min-w-[105px]">
                    <input
                      type="date"
                      value={getSafeDateValue(item.certValidDate || item.certStartDate)}
                      onChange={(e) => handleScbaChange(idx, 'certValidDate', e.target.value)}
                      disabled={isLocked}
                      title="Tanggal Berlaku Sertifikat"
                      className="w-full text-[10px] font-medium text-slate-800 bg-slate-50 border border-slate-300 rounded px-1 py-0.5 focus:border-blue-600 focus:bg-white focus:outline-none transition disabled:opacity-75 disabled:bg-slate-100 cursor-pointer"
                    />
                  </td>
                  <td className="border-r border-slate-800 p-1 text-center bg-white min-w-[105px]">
                    <input
                      type="date"
                      value={getSafeDateValue(item.certExpireDate || item.certDate || (getSafeDateValue(item.cert)))}
                      onChange={(e) => handleScbaChange(idx, 'certExpireDate', e.target.value)}
                      disabled={isLocked}
                      title="Tanggal Expire Sertifikat"
                      className="w-full text-[10px] font-medium text-slate-800 bg-slate-50 border border-slate-300 rounded px-1 py-0.5 focus:border-blue-600 focus:bg-white focus:outline-none transition disabled:opacity-75 disabled:bg-slate-100 cursor-pointer"
                    />
                  </td>

                  {/* CONDITION: RUBBER MASKER & TAIL */}
                  {renderConditionRadio(item, 'rubber', (val) => handleScbaChange(idx, 'rubber', val))}

                  {/* CONDITION: VALVE & CONNECTION */}
                  {renderConditionRadio(item, 'valve', (val) => handleScbaChange(idx, 'valve', val))}

                  {/* CONDITION: WISTLE */}
                  {renderConditionRadio(item, 'whistle', (val) => handleScbaChange(idx, 'whistle', val))}

                  {/* CONDITION: TABUNG */}
                  {renderConditionRadio(item, 'tabung', (val) => handleScbaChange(idx, 'tabung', val))}

                  {/* REKOMENDASI */}
                  <td className="border-r border-slate-800 p-1">
                    <input
                      type="text"
                      value={item.rekomendasi}
                      onChange={(e) => handleScbaChange(idx, 'rekomendasi', e.target.value)}
                      placeholder="Catatan..."
                      disabled={isLocked}
                      className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-600 focus:outline-none px-1 py-0.5"
                    />
                  </td>

                  {/* ACTION */}
                  <td className="p-1 text-center bg-slate-50">
                    <button
                      type="button"
                      onClick={() => handleRemoveScbaRow(idx)}
                      disabled={isLocked || scbaItems.length <= 1}
                      className={`p-1 text-slate-400 hover:text-rose-600 transition rounded ${
                        scbaItems.length <= 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                      title="Hapus Baris"
                    >
                      <Trash2 className="w-4 h-4 mx-auto" />
                    </button>
                  </td>
                </tr>
              ))}

              {/* ── BARIS PEMBATAS GRUP 2: ELSA ── */}
              <tr className="bg-slate-200/90 font-extrabold text-slate-900 border-y-2 border-slate-800">
                <td colSpan={19} className="px-3 py-1.5 bg-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs uppercase tracking-wider text-slate-900">
                      ELSA 10 Menit :
                    </span>
                    <button
                      type="button"
                      onClick={handleAddElsaRow}
                      disabled={isLocked}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded shadow-xs transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Baris ELSA</span>
                    </button>
                  </div>
                </td>
              </tr>

              {/* MAPPING ELSA ITEMS */}
              {elsaItems.map((item, idx) => (
                <tr key={item.id} className="hover:bg-purple-50/30 transition">
                  {/* NO */}
                  <td className="border-r border-slate-800 text-center font-bold bg-slate-50 p-1 text-xs">
                    {idx + 1}
                  </td>

                  {/* MERK, TYPE / SERIAL NO */}
                  <td className="border-r border-slate-800 p-1">
                    <input
                      type="text"
                      value={item.sn}
                      onChange={(e) => handleElsaChange(idx, 'sn', e.target.value)}
                      placeholder="Merk / S/N Unit ELSA..."
                      disabled={isLocked}
                      className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-purple-600 focus:outline-none font-semibold text-slate-800 px-1 py-0.5"
                    />
                  </td>

                  {/* PENEMPATAN */}
                  <td className="border-r border-slate-800 p-1">
                    <input
                      type="text"
                      value={item.penempatan}
                      onChange={(e) => handleElsaChange(idx, 'penempatan', e.target.value)}
                      placeholder="Lokasi / Area..."
                      disabled={isLocked}
                      className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-purple-600 focus:outline-none px-1 py-0.5"
                    />
                  </td>

                  {/* CONDITION: PRESSURE VOLUME */}
                  {renderConditionRadio(item, 'pressure', (val) => handleElsaChange(idx, 'pressure', val))}

                  {/* CONDITION: HOSE */}
                  {renderConditionRadio(item, 'hose', (val) => handleElsaChange(idx, 'hose', val))}

                  {/* CONDITION: CERTIFICATE (Berlaku & Expire - TANGGAL) */}
                  <td className="border-r border-slate-300 p-1 text-center bg-white min-w-[105px]">
                    <input
                      type="date"
                      value={getSafeDateValue(item.certValidDate || item.certStartDate)}
                      onChange={(e) => handleElsaChange(idx, 'certValidDate', e.target.value)}
                      disabled={isLocked}
                      title="Tanggal Berlaku Sertifikat"
                      className="w-full text-[10px] font-medium text-slate-800 bg-slate-50 border border-purple-300 rounded px-1 py-0.5 focus:border-purple-600 focus:bg-white focus:outline-none transition disabled:opacity-75 disabled:bg-slate-100 cursor-pointer"
                    />
                  </td>
                  <td className="border-r border-slate-800 p-1 text-center bg-white min-w-[105px]">
                    <input
                      type="date"
                      value={getSafeDateValue(item.certExpireDate || item.certDate || (getSafeDateValue(item.cert)))}
                      onChange={(e) => handleElsaChange(idx, 'certExpireDate', e.target.value)}
                      disabled={isLocked}
                      title="Tanggal Expire Sertifikat"
                      className="w-full text-[10px] font-medium text-slate-800 bg-slate-50 border border-purple-300 rounded px-1 py-0.5 focus:border-purple-600 focus:bg-white focus:outline-none transition disabled:opacity-75 disabled:bg-slate-100 cursor-pointer"
                    />
                  </td>

                  {/* CONDITION: RUBBER MASKER & TAIL */}
                  {renderConditionRadio(item, 'rubber', (val) => handleElsaChange(idx, 'rubber', val))}

                  {/* CONDITION: VALVE & CONNECTION */}
                  {renderConditionRadio(item, 'valve', (val) => handleElsaChange(idx, 'valve', val))}

                  {/* CONDITION: WISTLE -> BLOK HITAM KHUSUS ELSA */}
                  <td colSpan={2} className="border-r border-slate-800 bg-black text-center text-slate-500 font-black text-[10px] select-none py-1">
                    N/A
                  </td>

                  {/* CONDITION: TABUNG */}
                  {renderConditionRadio(item, 'tabung', (val) => handleElsaChange(idx, 'tabung', val))}

                  {/* REKOMENDASI */}
                  <td className="border-r border-slate-800 p-1">
                    <input
                      type="text"
                      value={item.rekomendasi}
                      onChange={(e) => handleElsaChange(idx, 'rekomendasi', e.target.value)}
                      placeholder="Catatan..."
                      disabled={isLocked}
                      className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-purple-600 focus:outline-none px-1 py-0.5"
                    />
                  </td>

                  {/* ACTION */}
                  <td className="p-1 text-center bg-slate-50">
                    <button
                      type="button"
                      onClick={() => handleRemoveElsaRow(idx)}
                      disabled={isLocked || elsaItems.length <= 1}
                      className={`p-1 text-slate-400 hover:text-rose-600 transition rounded ${
                        elsaItems.length <= 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                      title="Hapus Baris"
                    >
                      <Trash2 className="w-4 h-4 mx-auto" />
                    </button>
                  </td>
                </tr>
              ))}
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
          onExportPdf={handleExportScbaPdf}
          onExportExcel={handleExportScbaExcel}
          saveState={saveState}
        />
      </form>
    </div>
  );
}
