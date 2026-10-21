import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useInspectionForm } from '../../hooks/useInspectionForm';
import { generateScbaPDF, generateScbaExcel } from '../../utils/exportUtils';
import FormActionHeader from './FormActionHeader';
import FormSubmitFooter from './FormSubmitFooter';
import DigitalSignatureSection from './DigitalSignatureSection';

const INITIAL_WEEKS = [1, 2, 3, 4].map((minggu) => ({
  minggu,
  items: [
    {
      id: `w${minggu}_scba_1`,
      category: 'SCBA SPERIAN 30 MNT',
      no: 1,
      sn: '',
      penempatan: '',
      pressure: '', // 'Good' | 'Bad'
      hose: '',     // 'Good' | 'Bad'
      cert: '',     // 'Berlaku' | 'Expire'
      rubber: '',   // 'Good' | 'Bad'
      valve: '',    // 'Good' | 'Bad'
      whistle: '',  // 'Good' | 'Bad'
      tabung: '',   // 'Good' | 'Bad'
      rekomendasi: ''
    },
    {
      id: `w${minggu}_scba_2`,
      category: 'SCBA SPERIAN 30 MNT',
      no: 2,
      sn: '',
      penempatan: '',
      pressure: '',
      hose: '',
      cert: '',
      rubber: '',
      valve: '',
      whistle: '',
      tabung: '',
      rekomendasi: ''
    },
    {
      id: `w${minggu}_elsa_1`,
      category: 'ELSA 10 Menit',
      no: 1,
      sn: '',
      penempatan: '',
      pressure: '',
      hose: '',
      cert: '',
      rubber: '',
      valve: '',
      whistle: 'N/A', // Whistle di-block hitam untuk ELSA
      tabung: '',
      rekomendasi: '',
      isElsa: true
    }
  ]
}));

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

  const [weeksData, setWeeksData] = useState(INITIAL_WEEKS);

  // Flattened items untuk export table (preserves all inspection fields)
  const allScbaItems = weeksData.flatMap(w => 
    w.items.map(it => ({
      ...it,
      week: w.minggu,
      item: `${it.category} (Minggu ${w.minggu})`,
      lokasi: it.penempatan || `Rig Unit ${it.no}`,
      sn: it.sn,
      status: it.pressure === 'Good' ? '✓ Baik' : (it.pressure || 'Normal'),
      remarks: it.rekomendasi || it.cert || '-'
    }))
  );

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
    buildExportPayload
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
    items: allScbaItems,
    setItems: () => {},
    extraPayload: { inspection_details: weeksData }
  });

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

  const handleItemChange = (weekIdx, itemIdx, field, value) => {
    if (isLocked) return;
    const updated = [...weeksData];
    updated[weekIdx].items[itemIdx][field] = value;
    setWeeksData(updated);
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
        <div className="border-2 border-slate-800 text-slate-900">
          <div className="grid grid-cols-12 divide-x-2 divide-y-2 sm:divide-y-0 divide-slate-800 items-center">
            {/* Logo Section */}
            <div className="col-span-12 sm:col-span-3 p-2.5 flex items-center justify-center bg-white">
              <img 
                src="/logo-baru.png" 
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
          <div className="border-t-2 border-slate-800 p-2 bg-slate-50 grid grid-cols-1 md:grid-cols-3 gap-4 font-bold text-xs">
            <div className="flex items-center space-x-2">
              <label className="w-48 text-[11px]">Inspection date / tanggal pemeriksaan</label>
              <span>:</span>
              <input
                type="date"
                name="inspectionDate"
                value={meta.inspectionDate}
                onChange={handleMetaChange}
                className="w-full border-b border-slate-400 bg-transparent px-1 py-0.5 font-bold focus:outline-none"
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="w-56 text-[11px]">Last Inspection Date / Tanggal Pemeriksaan Terakhir</label>
              <span>:</span>
              <input
                type="date"
                name="lastInspectionDate"
                value={meta.lastInspectionDate}
                onChange={handleMetaChange}
                className="w-full border-b border-slate-400 bg-transparent px-1 py-0.5 font-bold focus:outline-none"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="w-32 text-[11px]">Rig No / Nomor rig</label>
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

        {/* TABEL INSPEKSI MINGGUAN (MINGGU 1 - 4) */}
        <div className="overflow-x-auto border-2 border-slate-800">
          <table className="w-full border-collapse text-[10px] text-slate-900 min-w-[1300px]">
            <thead>
              {/* Header Row 1 */}
              <tr className="bg-slate-300 text-slate-900 font-bold text-center border-b border-slate-800">
                <th rowSpan={3} className="border-r border-slate-800 p-1 w-12">MINGGU</th>
                <th rowSpan={3} className="border-r border-slate-800 p-1 w-8">NO</th>
                <th rowSpan={3} className="border-r border-slate-800 p-2 w-48">MERK, TYPE / SERIAL NO</th>
                <th rowSpan={3} className="border-r border-slate-800 p-2 w-28">PENEMPATAN</th>
                <th colSpan={14} className="border-r border-slate-800 p-1 text-sm tracking-widest bg-slate-300 font-black">
                  C O N D I T I O N
                </th>
                <th rowSpan={3} className="p-2 w-40">REKOMENDATION</th>
              </tr>

              {/* Header Row 2 */}
              <tr className="bg-slate-200 font-bold text-center border-b border-slate-800 text-[9px]">
                <th colSpan={2} className="border-r border-slate-800 p-1">PRESSURE VOLUME (Psi)</th>
                <th colSpan={2} className="border-r border-slate-800 p-1">HOSE</th>
                <th colSpan={2} className="border-r border-slate-800 p-1">CERTIFICATE</th>
                <th colSpan={2} className="border-r border-slate-800 p-1">RUBBER MASKER & TAIL</th>
                <th colSpan={2} className="border-r border-slate-800 p-1">VALVE & connection</th>
                <th colSpan={2} className="border-r border-slate-800 p-1">WISTLE (BUNYI PLUIT)</th>
                <th colSpan={2} className="border-r border-slate-800 p-1">TABUNG</th>
              </tr>

              {/* Header Row 3 */}
              <tr className="bg-slate-100 font-bold text-center border-b-2 border-slate-800 text-[9px]">
                <th className="border-r border-slate-400 p-0.5 w-8 bg-emerald-50 text-emerald-700 font-black text-xs" title="Good / Ceklis">✓</th>
                <th className="border-r border-slate-800 p-0.5 w-8 bg-rose-50 text-rose-700 font-black text-xs" title="Bad / Silang">✗</th>

                <th className="border-r border-slate-400 p-0.5 w-8 bg-emerald-50 text-emerald-700 font-black text-xs" title="Good / Ceklis">✓</th>
                <th className="border-r border-slate-800 p-0.5 w-8 bg-rose-50 text-rose-700 font-black text-xs" title="Bad / Silang">✗</th>

                <th className="border-r border-slate-400 p-0.5 w-10 bg-emerald-50 text-emerald-700 font-black text-xs" title="Berlaku / Ceklis">✓</th>
                <th className="border-r border-slate-800 p-0.5 w-10 bg-rose-50 text-rose-700 font-black text-xs" title="Expire / Silang">✗</th>

                <th className="border-r border-slate-400 p-0.5 w-8 bg-emerald-50 text-emerald-700 font-black text-xs" title="Good / Ceklis">✓</th>
                <th className="border-r border-slate-800 p-0.5 w-8 bg-rose-50 text-rose-700 font-black text-xs" title="Bad / Silang">✗</th>

                <th className="border-r border-slate-400 p-0.5 w-8 bg-emerald-50 text-emerald-700 font-black text-xs" title="Good / Ceklis">✓</th>
                <th className="border-r border-slate-800 p-0.5 w-8 bg-rose-50 text-rose-700 font-black text-xs" title="Bad / Silang">✗</th>

                <th className="border-r border-slate-400 p-0.5 w-8 bg-emerald-50 text-emerald-700 font-black text-xs" title="Good / Ceklis">✓</th>
                <th className="border-r border-slate-800 p-0.5 w-8 bg-rose-50 text-rose-700 font-black text-xs" title="Bad / Silang">✗</th>

                <th className="border-r border-slate-400 p-0.5 w-8 bg-emerald-50 text-emerald-700 font-black text-xs" title="Good / Ceklis">✓</th>
                <th className="border-r border-slate-800 p-0.5 w-8 bg-rose-50 text-rose-700 font-black text-xs" title="Bad / Silang">✗</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800 font-medium">
              {weeksData.map((week, wIdx) => (
                <React.Fragment key={week.minggu}>
                  {week.items.map((item, iIdx) => {
                    const isFirstOfCategory = iIdx === 0 || (iIdx === 2 && item.isElsa);

                    return (
                      <tr key={item.id} className="hover:bg-blue-50/40 transition">
                        {/* Kolom MINGGU (RowSpan 3 untuk setiap Minggu) */}
                        {iIdx === 0 && (
                          <td
                            rowSpan={3}
                            className="border-r-2 border-slate-800 text-center font-black text-base bg-slate-100 p-1"
                          >
                            {week.minggu}
                          </td>
                        )}

                        {/* NO */}
                        <td className="border-r border-slate-800 p-1 text-center font-bold bg-slate-50">
                          {item.no}
                        </td>

                        {/* MERK, TYPE / SERIAL NO */}
                        <td className="border-r border-slate-800 p-1.5">
                          {isFirstOfCategory && (
                            <div className="font-extrabold text-slate-900 border-b border-slate-200 pb-0.5 mb-1">
                              {item.category} :
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <span className="font-bold text-slate-600">S/N:</span>
                            <input
                              type="text"
                              value={item.sn}
                              onChange={(e) => handleItemChange(wIdx, iIdx, 'sn', e.target.value)}
                              placeholder="Nomor Seri"
                              className="w-full bg-transparent border-b border-slate-300 focus:outline-none font-semibold text-blue-900 px-1"
                            />
                          </div>
                        </td>

                        {/* PENEMPATAN */}
                        <td className="border-r border-slate-800 p-1">
                          <input
                            type="text"
                            value={item.penempatan}
                            onChange={(e) => handleItemChange(wIdx, iIdx, 'penempatan', e.target.value)}
                            placeholder="Lokasi / Area"
                            className="w-full bg-transparent px-1 py-0.5 focus:outline-none"
                          />
                        </td>

                        {/* CONDITION: PRESSURE VOLUME (Psi) */}
                        <td className="border-r border-slate-400 p-0.5 text-center">
                          <input
                            type="radio"
                            name={`pres_${item.id}`}
                            checked={item.pressure === 'Good'}
                            onChange={() => handleItemChange(wIdx, iIdx, 'pressure', 'Good')}
                            title="✓ (Good / Ceklis)"
                            className="w-3.5 h-3.5 text-emerald-600 accent-emerald-600 focus:ring-0 cursor-pointer"
                          />
                        </td>
                        <td className="border-r border-slate-800 p-0.5 text-center bg-slate-50/50">
                          <input
                            type="radio"
                            name={`pres_${item.id}`}
                            checked={item.pressure === 'Bad'}
                            onChange={() => handleItemChange(wIdx, iIdx, 'pressure', 'Bad')}
                            title="✗ (Bad / Silang)"
                            className="w-3.5 h-3.5 text-rose-600 accent-rose-600 focus:ring-0 cursor-pointer"
                          />
                        </td>

                        {/* CONDITION: HOSE */}
                        <td className="border-r border-slate-400 p-0.5 text-center">
                          <input
                            type="radio"
                            name={`hose_${item.id}`}
                            checked={item.hose === 'Good'}
                            onChange={() => handleItemChange(wIdx, iIdx, 'hose', 'Good')}
                            title="✓ (Good / Ceklis)"
                            className="w-3.5 h-3.5 text-emerald-600 accent-emerald-600 focus:ring-0 cursor-pointer"
                          />
                        </td>
                        <td className="border-r border-slate-800 p-0.5 text-center bg-slate-50/50">
                          <input
                            type="radio"
                            name={`hose_${item.id}`}
                            checked={item.hose === 'Bad'}
                            onChange={() => handleItemChange(wIdx, iIdx, 'hose', 'Bad')}
                            title="✗ (Bad / Silang)"
                            className="w-3.5 h-3.5 text-rose-600 accent-rose-600 focus:ring-0 cursor-pointer"
                          />
                        </td>

                        {/* CONDITION: CERTIFICATE (Berlaku / Expire) */}
                        <td className="border-r border-slate-400 p-0.5 text-center">
                          <input
                            type="radio"
                            name={`cert_${item.id}`}
                            checked={item.cert === 'Berlaku'}
                            onChange={() => handleItemChange(wIdx, iIdx, 'cert', 'Berlaku')}
                            title="✓ (Berlaku / Ceklis)"
                            className="w-3.5 h-3.5 text-emerald-600 accent-emerald-600 focus:ring-0 cursor-pointer"
                          />
                        </td>
                        <td className="border-r border-slate-800 p-0.5 text-center bg-slate-50/50">
                          <input
                            type="radio"
                            name={`cert_${item.id}`}
                            checked={item.cert === 'Expire'}
                            onChange={() => handleItemChange(wIdx, iIdx, 'cert', 'Expire')}
                            title="✗ (Expire / Silang)"
                            className="w-3.5 h-3.5 text-rose-600 accent-rose-600 focus:ring-0 cursor-pointer"
                          />
                        </td>

                        {/* CONDITION: RUBBER MASKER & TAIL */}
                        <td className="border-r border-slate-400 p-0.5 text-center">
                          <input
                            type="radio"
                            name={`rubber_${item.id}`}
                            checked={item.rubber === 'Good'}
                            onChange={() => handleItemChange(wIdx, iIdx, 'rubber', 'Good')}
                            title="✓ (Good / Ceklis)"
                            className="w-3.5 h-3.5 text-emerald-600 accent-emerald-600 focus:ring-0 cursor-pointer"
                          />
                        </td>
                        <td className="border-r border-slate-800 p-0.5 text-center bg-slate-50/50">
                          <input
                            type="radio"
                            name={`rubber_${item.id}`}
                            checked={item.rubber === 'Bad'}
                            onChange={() => handleItemChange(wIdx, iIdx, 'rubber', 'Bad')}
                            title="✗ (Bad / Silang)"
                            className="w-3.5 h-3.5 text-rose-600 accent-rose-600 focus:ring-0 cursor-pointer"
                          />
                        </td>

                        {/* CONDITION: VALVE & CONNECTION */}
                        <td className="border-r border-slate-400 p-0.5 text-center">
                          <input
                            type="radio"
                            name={`valve_${item.id}`}
                            checked={item.valve === 'Good'}
                            onChange={() => handleItemChange(wIdx, iIdx, 'valve', 'Good')}
                            title="✓ (Good / Ceklis)"
                            className="w-3.5 h-3.5 text-emerald-600 accent-emerald-600 focus:ring-0 cursor-pointer"
                          />
                        </td>
                        <td className="border-r border-slate-800 p-0.5 text-center bg-slate-50/50">
                          <input
                            type="radio"
                            name={`valve_${item.id}`}
                            checked={item.valve === 'Bad'}
                            onChange={() => handleItemChange(wIdx, iIdx, 'valve', 'Bad')}
                            title="✗ (Bad / Silang)"
                            className="w-3.5 h-3.5 text-rose-600 accent-rose-600 focus:ring-0 cursor-pointer"
                          />
                        </td>

                        {/* CONDITION: WISTLE (BUNYI PLUIT) -> Blocked Black for ELSA */}
                        {item.isElsa ? (
                          <td colSpan={2} className="border-r border-slate-800 bg-black p-0 text-center text-black select-none">
                            N/A
                          </td>
                        ) : (
                          <>
                            <td className="border-r border-slate-400 p-0.5 text-center">
                              <input
                                type="radio"
                                name={`whistle_${item.id}`}
                                checked={item.whistle === 'Good'}
                                onChange={() => handleItemChange(wIdx, iIdx, 'whistle', 'Good')}
                                title="✓ (Good / Ceklis)"
                                className="w-3.5 h-3.5 text-emerald-600 accent-emerald-600 focus:ring-0 cursor-pointer"
                              />
                            </td>
                            <td className="border-r border-slate-800 p-0.5 text-center bg-slate-50/50">
                              <input
                                type="radio"
                                name={`whistle_${item.id}`}
                                checked={item.whistle === 'Bad'}
                                onChange={() => handleItemChange(wIdx, iIdx, 'whistle', 'Bad')}
                                title="✗ (Bad / Silang)"
                                className="w-3.5 h-3.5 text-rose-600 accent-rose-600 focus:ring-0 cursor-pointer"
                              />
                            </td>
                          </>
                        )}

                        {/* CONDITION: TABUNG */}
                        <td className="border-r border-slate-400 p-0.5 text-center">
                          <input
                            type="radio"
                            name={`tabung_${item.id}`}
                            checked={item.tabung === 'Good'}
                            onChange={() => handleItemChange(wIdx, iIdx, 'tabung', 'Good')}
                            title="✓ (Good / Ceklis)"
                            className="w-3.5 h-3.5 text-emerald-600 accent-emerald-600 focus:ring-0 cursor-pointer"
                          />
                        </td>
                        <td className="border-r border-slate-800 p-0.5 text-center bg-slate-50/50">
                          <input
                            type="radio"
                            name={`tabung_${item.id}`}
                            checked={item.tabung === 'Bad'}
                            onChange={() => handleItemChange(wIdx, iIdx, 'tabung', 'Bad')}
                            title="✗ (Bad / Silang)"
                            className="w-3.5 h-3.5 text-rose-600 accent-rose-600 focus:ring-0 cursor-pointer"
                          />
                        </td>

                        {/* REKOMENDATION */}
                        <td className="p-1 border-r border-slate-800">
                          <input
                            type="text"
                            value={item.rekomendasi}
                            onChange={(e) => handleItemChange(wIdx, iIdx, 'rekomendasi', e.target.value)}
                            placeholder="Catatan..."
                            className="w-full bg-transparent px-1 py-0.5 focus:outline-none"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
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