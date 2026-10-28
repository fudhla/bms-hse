import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Trash2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useInspectionForm } from '../../hooks/useInspectionForm';
import { generateSpillKitPDF, generateSpillKitExcel } from '../../utils/exportUtils';
import FormActionHeader from './FormActionHeader';
import FormSubmitFooter from './FormSubmitFooter';
import DigitalSignatureSection from './DigitalSignatureSection';

// Daftar item bawaan sesuai formulir fisik
const DEFAULT_ITEMS = [
  { id: 1, daftarIsi: 'Box / Tempat / Wadah', jumlah: '1', kondisi: '-', temuan: '' },
  { id: 2, daftarIsi: 'Absorber Spill', jumlah: '1', kondisi: '-', temuan: '' },
  { id: 3, daftarIsi: 'Plastik Besar', jumlah: '1', kondisi: '-', temuan: '' },
  { id: 4, daftarIsi: 'Serbuk Kayu', jumlah: '1', kondisi: '-', temuan: '' },
  { id: 5, daftarIsi: 'Kain Pel / Kain Kanebo Besar', jumlah: '1', kondisi: '-', temuan: '' },
  { id: 6, daftarIsi: 'Sarung Tangan', jumlah: '1', kondisi: '-', temuan: '' },
  { id: 7, daftarIsi: 'Appron', jumlah: '1', kondisi: '-', temuan: '' }
];

export default function SpillKitForm({ onBack, currentUser, overrideRigNo = null, viewMonth = null, viewYear = null }) {
  const { user: authUser } = useAuth();
  const user = currentUser || authUser;
  const isKaryawan = user?.role === 'karyawan';
  const assignedRig = user?.rig_name || '';

  // Metadata Utama Formulir
  const [meta, setMeta] = useState({
    inspectionDate: new Date().toISOString().split('T')[0],
    lastInspectionDate: '',
    rigNoDept: overrideRigNo || (isKaryawan && assignedRig ? assignedRig : ''),
    inspectedBy: '',
    acknowledgedBy: '',
    userName: '',
    signatures: {}
  });

  // Sinkronisasi rigNo: URL override > assigned rig
  useEffect(() => {
    if (overrideRigNo) {
      setMeta(prev => ({ ...prev, rigNoDept: overrideRigNo }));
    } else if (isKaryawan && assignedRig) {
      setMeta(prev => ({ ...prev, rigNoDept: assignedRig }));
    }
  }, [overrideRigNo, isKaryawan, assignedRig]);

  // Items State
  const [items, setItems] = useState(DEFAULT_ITEMS);

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
    formId: 'spillkit',
    formType: 'Spill Kit Inspection Form',
    formCode: 'BMSD/48/FO/HSE/09/21',
    rigNo: meta.rigNoDept,
    overrideRigNo,
    viewMonth,
    viewYear,
    meta: { ...meta, rigNo: meta.rigNoDept, hfoName: meta.inspectedBy, toolPusherName: meta.acknowledgedBy },
    setMeta: (updater) => {
      setMeta(prev => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        return {
          ...next,
          rigNoDept: next.rigNo || next.rigNoDept,
          inspectedBy: next.hfoName || next.inspectedBy,
          acknowledgedBy: next.toolPusherName || next.acknowledgedBy
        };
      });
    },
    items,
    setItems
  });

  const handleExportSpillKitPdf = async () => {
    try {
      const payload = buildExportPayload();
      await generateSpillKitPDF(payload);
    } catch (err) {
      console.error('Error generating Spill Kit PDF:', err);
    }
  };

  const handleExportSpillKitExcel = async () => {
    try {
      const payload = buildExportPayload();
      await generateSpillKitExcel(payload);
    } catch (err) {
      console.error('Error generating Spill Kit Excel:', err);
    }
  };

  const handleMetaChange = (e) => {
    if (isLocked) return;
    setMeta({ ...meta, [e.target.name]: e.target.value });
  };

  const handleItemChange = (index, field, value) => {
    if (isLocked) return;
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const handleAddRow = () => {
    if (isLocked) return;
    setItems([
      ...items,
      { id: Date.now(), daftarIsi: '', jumlah: '1', kondisi: '-', temuan: '' }
    ]);
  };

  const handleRemoveRow = (index) => {
    if (isLocked) return;
    if (items.length <= 1) {
      alert('Minimal harus ada 1 baris item pemeriksaan.');
      return;
    }
    const updated = items.filter((_, i) => i !== index);
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
    <div className="form-sheet rounded-xl border border-slate-300 shadow-md p-4 sm:p-6 max-w-[1100px] mx-auto text-xs font-sans">
      {/* Navigation Header & Auto-Save / Export */}
      <FormActionHeader
        onBack={onBack}
        docNo="BMSD/48/FO/HSE/09/21"
        status={status}
        saveState={saveState}
        isLocked={isLocked}
        isAdmin={isAdmin}
        adminEditMode={adminEditMode}
        onExportPdf={handleExportSpillKitPdf}
        onExportExcel={handleExportSpillKitExcel}
      />

      {/* Alert Notification */}
      {message.text && (
        <div className={`p-3 rounded-lg mb-4 flex items-center space-x-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          <span className="font-semibold">{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* HEADER FORMULIR FISIK */}
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
              <p className="font-bold text-xs sm:text-sm text-slate-800">
                Spill Kit Inspection Form
              </p>
              <p className="font-semibold text-[10px] sm:text-[11px] text-slate-600 italic">
                Lembar Pemeriksaan Kelengkapan Pencegahan Tumpahan Minyak/Oli/dll
              </p>
            </div>

            {/* Document Metadata Section */}
            <div className="col-span-12 sm:col-span-3 text-[10px] font-semibold divide-y divide-slate-800">
              <div className="flex justify-between p-1">
                <span>No Formulir</span>
                <span className="font-mono font-bold">: BMSD/48/FO/HSE/09/21</span>
              </div>
              <div className="flex justify-between p-1">
                <span>No. Revisi</span>
                <span className="font-mono font-bold">: 00</span>
              </div>
              <div className="flex justify-between p-1">
                <span>Tanggal Efektif</span>
                <span className="font-mono font-bold">: 25 September 2021</span>
              </div>
            </div>
          </div>

          {/* Sub Header Information */}
          <div className="border-t-2 border-slate-800 p-3 bg-slate-50 space-y-2 text-xs font-bold">
            <div className="flex items-center space-x-2 max-w-md">
              <label className="w-56 text-[11px]">Date of Inspection / Tgl Pemeriksaan</label>
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
            <div className="flex items-center space-x-2 max-w-md">
              <label className="w-56 text-[11px]">Last Inspection / Pemeriksaan Terakhir</label>
              <span>:</span>
              <input
                type="date"
                name="lastInspectionDate"
                value={meta.lastInspectionDate}
                onChange={handleMetaChange}
                className="w-full border-b border-slate-400 bg-transparent px-1 py-0.5 focus:outline-none"
              />
            </div>
            <div className="flex items-center space-x-2 max-w-md">
              <label className="w-56 text-[11px]">Rig No / Dept.</label>
              <span>:</span>
              <input
                type="text"
                name="rigNoDept"
                value={meta.rigNoDept}
                onChange={handleMetaChange}
                readOnly={isKaryawan}
                placeholder="Nomor Rig / Departemen"
                className={`w-full border-b border-slate-400 bg-transparent px-1 py-0.5 font-bold text-blue-900 focus:outline-none ${
                  isKaryawan ? 'bg-slate-100 cursor-not-allowed text-slate-700' : ''
                }`}
                required
              />
            </div>

            {/* Legend / Keterangan Simbol */}
            <div className="pt-2 flex items-center space-x-6 text-[11px]">
              <div className="flex items-center border border-slate-800 bg-white">
                <span className="px-3 py-0.5 border-r border-slate-800 font-black text-emerald-700 bg-emerald-50">✓</span>
                <span className="px-2 py-0.5 font-semibold text-slate-700">Kondisi Bagus</span>
              </div>
              <div className="flex items-center border border-slate-800 bg-white">
                <span className="px-3 py-0.5 border-r border-slate-800 font-black text-rose-600 bg-rose-50">✕</span>
                <span className="px-2 py-0.5 font-semibold text-slate-700">Kondisi Rusak / Kurang</span>
              </div>
              <div className="flex items-center border border-slate-800 bg-white">
                <span className="px-3 py-0.5 border-r border-slate-800 font-black text-slate-600 bg-slate-100">N/A</span>
                <span className="px-2 py-0.5 font-semibold text-slate-700">Tidak Ada / Tidak Berlaku</span>
              </div>
            </div>
          </div>
        </div>

        {/* TABEL PEMERIKSAAN SPILL KIT */}
        <div className="overflow-x-auto border-2 border-slate-800">
          <table className="w-full border-collapse text-[11px] text-slate-900 min-w-[700px]">
            <thead>
              <tr className="bg-slate-200 font-bold text-center border-b-2 border-slate-800 uppercase">
                <th className="border-r border-slate-800 p-2 w-12">NO.</th>
                <th className="border-r border-slate-800 p-2 min-w-[220px] text-left">Daftar Isi</th>
                <th className="border-r border-slate-800 p-2 w-28">Jumlah</th>
                <th className="border-r border-slate-800 p-2 w-32">Kondisi</th>
                <th className="p-2 min-w-[200px] text-left">Temuan</th>
                <th className="p-1 w-8 bg-slate-100 border-l border-slate-800">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium">
              {items.map((row, index) => (
                <tr key={row.id} className="hover:bg-blue-50/40 transition">
                  {/* NO. */}
                  <td className="border-r border-slate-800 text-center font-bold bg-slate-50 p-2">{index + 1}</td>

                  {/* Daftar Isi */}
                  <td className="border-r border-slate-800 p-2">
                    <input
                      type="text"
                      value={row.daftarIsi}
                      onChange={(e) => handleItemChange(index, 'daftarIsi', e.target.value)}
                      placeholder="Nama item..."
                      className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-600 focus:outline-none font-semibold text-slate-800"
                      required
                    />
                  </td>

                  {/* Jumlah */}
                  <td className="border-r border-slate-800 p-2 text-center">
                    <input
                      type="text"
                      value={row.jumlah}
                      onChange={(e) => handleItemChange(index, 'jumlah', e.target.value)}
                      placeholder="Qty"
                      className="w-full text-center bg-transparent border-b border-slate-300 focus:outline-none focus:border-blue-600 font-bold"
                    />
                  </td>

                  {/* Kondisi (✓ / ✕ / N/A) */}
                  <td className="border-r border-slate-800 p-1 text-center">
                    <select
                      value={row.kondisi}
                      onChange={(e) => handleItemChange(index, 'kondisi', e.target.value)}
                      className={`w-full font-black text-center text-xs py-1 rounded focus:outline-none cursor-pointer transition ${
                        row.kondisi === '✓' || row.kondisi === '√' ? 'bg-emerald-100 text-emerald-800 font-extrabold' : 
                        row.kondisi === '✕' || row.kondisi === 'X' || row.kondisi === '✗' ? 'bg-rose-100 text-rose-800 font-extrabold' : 
                        row.kondisi === 'N/A' ? 'bg-slate-200 text-slate-700' : 'bg-transparent text-slate-400 font-normal'
                      }`}
                    >
                      <option value="-">-</option>
                      <option value="✓">✓</option>
                      <option value="✕">✕</option>
                      <option value="N/A">N/A</option>
                    </select>
                  </td>

                  {/* Temuan */}
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.temuan}
                      onChange={(e) => handleItemChange(index, 'temuan', e.target.value)}
                      placeholder="Catatan temuan..."
                      className="w-full bg-transparent border-b border-slate-300 focus:outline-none focus:border-blue-600"
                    />
                  </td>

                  {/* Action Remove */}
                  <td className="p-1 text-center bg-slate-50 border-l border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(index)}
                      className="text-rose-500 hover:text-rose-700 p-1 transition"
                      title="Hapus Baris"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Note / Catatan Kaki */}
        <div className="flex justify-between items-center text-[10px] text-slate-600 italic">
          <span>Note : List dapat disesuaikan dengan kontrak pelanggan</span>
          <button
            type="button"
            onClick={handleAddRow}
            className="flex items-center space-x-1 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg font-bold not-italic hover:bg-blue-100 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Baris Item</span>
          </button>
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
          onExportPdf={handleExportSpillKitPdf}
          onExportExcel={handleExportSpillKitExcel}
          saveState={saveState}
        />
      </form>
    </div>
  );
}