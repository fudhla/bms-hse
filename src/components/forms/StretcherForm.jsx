import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useInspectionForm } from '../../hooks/useInspectionForm';
import { generateStretcherPDF, generateStretcherExcel } from '../../utils/exportUtils';
import FormActionHeader from './FormActionHeader';
import FormSubmitFooter from './FormSubmitFooter';
import DigitalSignatureSection from './DigitalSignatureSection';

const INITIAL_CHECKLIST = [
  { id: 1, text: 'Apakah access penempatan stretcher bebas dari penghalang ?', condition: '', remarks: '' },
  { id: 2, text: 'Apakah lokasi penyimpanan stretcher terhindar dari sinar matahari / hujan ?', condition: '', remarks: '' },
  { id: 3, text: 'Apakah kebersihan strecther selalu terjaga dengan baik ?', condition: '', remarks: '' },
  { id: 4, text: 'Apakah Buckle strap tersedia dan dalam kondisi baik ?', condition: '', remarks: '' },
  { id: 5, text: 'Apakah Straps Buckle tersedia dan dalam kondisi baik', condition: '', remarks: '' },
  { id: 6, text: 'Apakah pole / frame strechter dalam kondisi baik dan tidak ada mengalami kerusakan / berkarat ?', condition: '', remarks: '' },
  { id: 7, text: 'Apakah kondisi canvas / scope dalam baik ?', condition: '', remarks: '' },
  { id: 8, text: 'Apakah plungers pada sisi kepala dan kaki terpasang dan bisa terkunci dengan baik ?', condition: '', remarks: '' },
  { id: 9, text: 'Apakah carrying handle / pegangan baik pada posisi kaki / kepala dalam kondisi baik ?', condition: '', remarks: '' }
];

export default function StretcherForm({ onBack, currentUser, overrideRigNo = null, viewMonth = null, viewYear = null }) {
  const { user: authUser } = useAuth();
  const user = currentUser || authUser;
  const isKaryawan = user?.role === 'karyawan';
  const assignedRig = user?.rig_name || '';

  // Metadata Utama
  const [meta, setMeta] = useState({
    rigNo: overrideRigNo || (isKaryawan && assignedRig ? assignedRig : ''),
    rigLocation: '',
    inspectionDate: new Date().toISOString().split('T')[0],
    hesOfficerName: '',
    hesCoordinatorName: '',
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

  const [items, setItems] = useState(INITIAL_CHECKLIST);

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
    formId: 'stretcher',
    formType: 'Monthly Stretcher Inspection Form',
    formCode: 'BMSD/45/FO/HSE/06/20',
    rigNo: meta.rigNo,
    overrideRigNo,
    viewMonth,
    viewYear,
    meta: { ...meta, lokasi: meta.rigLocation, hfoName: meta.hesOfficerName, toolPusherName: meta.hesCoordinatorName },
    setMeta: (updater) => {
      setMeta(prev => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        return {
          ...next,
          rigLocation: next.lokasi || next.rigLocation,
          hesOfficerName: next.hfoName || next.hesOfficerName,
          hesCoordinatorName: next.toolPusherName || next.hesCoordinatorName
        };
      });
    },
    items,
    setItems
  });

  const handleExportStretcherPdf = async () => {
    try {
      const payload = buildExportPayload();
      await generateStretcherPDF(payload);
    } catch (err) {
      console.error('Error generating Stretcher PDF:', err);
    }
  };

  const handleExportStretcherExcel = async () => {
    try {
      const payload = buildExportPayload();
      await generateStretcherExcel(payload);
    } catch (err) {
      console.error('Error generating Stretcher Excel:', err);
    }
  };

  const handleMetaChange = (e) => {
    if (isLocked) return;
    setMeta({ ...meta, [e.target.name]: e.target.value });
  };

  const handleItemConditionChange = (id, value) => {
    if (isLocked) return;
    setItems(items.map(item => item.id === id ? { ...item, condition: value } : item));
  };

  const handleItemRemarksChange = (id, value) => {
    if (isLocked) return;
    setItems(items.map(item => item.id === id ? { ...item, remarks: value } : item));
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
          next.hesCoordinatorName = sigData.name;
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
    <div className="form-sheet rounded-xl border border-slate-300 shadow-md p-4 sm:p-6 max-w-[1200px] mx-auto text-xs font-sans">
      {/* Header Bar Kontrol & Auto-Save / Export */}
      <FormActionHeader
        onBack={onBack}
        docNo="BMSD/45/FO/HSE/06/20"
        status={status}
        saveState={saveState}
        isLocked={isLocked}
        isAdmin={isAdmin}
        adminEditMode={adminEditMode}
        onExportPdf={handleExportStretcherPdf}
        onExportExcel={handleExportStretcherExcel}
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
                Monthly Stretcher Inspection form
              </p>
              <p className="font-semibold text-[11px] text-slate-600 italic">
                Lembar Pemeriksaan Bulanan Tandu
              </p>
            </div>

            {/* Meta Document Section */}
            <div className="col-span-12 sm:col-span-3 text-[10px] font-semibold divide-y divide-slate-800">
              <div className="flex justify-between p-1">
                <span>No Formulir</span>
                <span className="font-mono font-bold">: BMSD/45/FO/HSE/06/20</span>
              </div>
              <div className="flex justify-between p-1">
                <span>No. Revisi</span>
                <span className="font-mono font-bold">: 00</span>
              </div>
              <div className="flex justify-between p-1">
                <span>Tanggal Efektif</span>
                <span className="font-mono font-bold">: 25 Juni 2020</span>
              </div>
            </div>
          </div>

          {/* Sub Header (Rig No, Location, Inspection Date) */}
          <div className="border-t-2 border-slate-800 p-3 bg-slate-50 space-y-2 text-xs font-bold">
            <div className="flex items-center space-x-2 max-w-md">
              <label className="w-36 text-[11px]">Rig No</label>
              <span>:</span>
              <input
                type="text"
                name="rigNo"
                value={meta.rigNo}
                onChange={handleMetaChange}
                readOnly={isKaryawan}
                placeholder="Nomor Rig"
                className={`w-full border-b border-slate-400 bg-transparent px-1 py-0.5 font-bold text-blue-900 focus:outline-none ${
                  isKaryawan ? 'bg-slate-100 cursor-not-allowed text-slate-700' : ''
                }`}
                required
              />
            </div>
            <div className="flex items-center space-x-2 max-w-md">
              <label className="w-36 text-[11px]">Rig Location</label>
              <span>:</span>
              <input
                type="text"
                name="rigLocation"
                value={meta.rigLocation}
                onChange={handleMetaChange}
                placeholder="Lokasi Rig"
                className="w-full border-b border-slate-400 bg-transparent px-1 py-0.5 focus:outline-none"
                required
              />
            </div>
            <div className="flex items-center space-x-2 max-w-md">
              <label className="w-36 text-[11px]">Date of inspection</label>
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
          </div>
        </div>

        {/* TABEL CHECKLIST ITEM */}
        <div className="overflow-x-auto border-2 border-slate-800">
          <table className="w-full border-collapse text-[11px] text-slate-900 min-w-[700px]">
            <thead>
              <tr className="bg-slate-200 font-bold text-center border-b-2 border-slate-800">
                <th rowSpan={2} className="border-r border-slate-800 p-2 w-10">No</th>
                <th rowSpan={2} className="border-r border-slate-800 p-2 text-left">Item Checklist / Item Pemeriksaan</th>
                <th colSpan={2} className="border-r border-slate-800 p-1 w-44">Condition / Kondisi</th>
                <th rowSpan={2} className="p-2 w-52">Remarks / Keterangan</th>
              </tr>
              <tr className="bg-slate-100 font-bold text-center border-b-2 border-slate-800 text-[10px]">
                <th className="border-r border-slate-400 p-1 w-22 bg-emerald-50 text-emerald-700 font-black text-sm" title="Good / Ceklis">✓</th>
                <th className="border-r border-slate-800 p-1 w-22 bg-rose-50 text-rose-700 font-black text-sm" title="Bad / Silang">✗</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50/40 transition">
                  <td className="border-r border-slate-800 text-center font-bold bg-slate-50 p-2">{item.id}</td>
                  <td className="border-r border-slate-800 p-2 text-slate-800 font-semibold">{item.text}</td>
                  
                  {/* Radio Good / Baik */}
                  <td className="border-r border-slate-400 p-2 text-center">
                    <input
                      type="radio"
                      name={`cond_${item.id}`}
                      checked={item.condition === 'Good' || item.condition === '✓'}
                      onChange={() => handleItemConditionChange(item.id, 'Good')}
                      title="✓ (Good / Ceklis)"
                      className="w-4 h-4 text-emerald-600 accent-emerald-600 focus:ring-0 cursor-pointer"
                    />
                  </td>

                  {/* Radio Bad / Rusak */}
                  <td className="border-r border-slate-800 p-2 text-center bg-slate-50/50">
                    <input
                      type="radio"
                      name={`cond_${item.id}`}
                      checked={item.condition === 'Bad' || item.condition === '✗'}
                      onChange={() => handleItemConditionChange(item.id, 'Bad')}
                      title="✗ (Bad / Silang)"
                      className="w-4 h-4 text-rose-600 accent-rose-600 focus:ring-0 cursor-pointer"
                    />
                  </td>

                  {/* Remarks */}
                  <td className="p-1">
                    <input
                      type="text"
                      value={item.remarks}
                      onChange={(e) => handleItemRemarksChange(item.id, e.target.value)}
                      placeholder="Catatan..."
                      className="w-full bg-transparent focus:outline-none px-1 py-0.5"
                    />
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
            hfo: meta.hesOfficerName || meta.hfoName,
            wfo: meta.hesOfficerName || meta.hfoName,
            toolpush: meta.toolPusherName || meta.hesCoordinatorName
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
          onExportPdf={handleExportStretcherPdf}
          onExportExcel={handleExportStretcherExcel}
          saveState={saveState}
        />
      </form>
    </div>
  );
}