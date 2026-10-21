import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Plus, Trash2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useInspectionForm } from '../../hooks/useInspectionForm';
import { generateOxigentPDF, generateOxigentExcel } from '../../utils/exportUtils';
import FormActionHeader from './FormActionHeader';
import FormSubmitFooter from './FormSubmitFooter';
import DigitalSignatureSection from './DigitalSignatureSection';

// Template baris awal
const CREATE_EMPTY_ROW = (id) => ({
  id,
  merkTypeSerial: '',
  penempatan: '',
  pressureVolume: '✓',
  regulator: '✓',
  hydroTest: '✓',
  tabung: '✓',
  valveConnection: '✓',
  rekomendasi: ''
});

export default function OxigentForm({ onBack, currentUser, overrideRigNo = null, viewMonth = null, viewYear = null }) {
  const { user: authUser } = useAuth();
  const user = currentUser || authUser;
  const isKaryawan = user?.role === 'karyawan';
  const assignedRig = user?.rig_name || '';

  // Metadata Utama
  const [meta, setMeta] = useState({
    inspectionDate: new Date().toISOString().split('T')[0],
    lastInspectionDate: '',
    rigNo: overrideRigNo || (isKaryawan && assignedRig ? assignedRig : ''),
    hesFieldOfficer: '',
    toolPusher: '',
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

  // Baris Tabel (Inisialisasi 3 baris awal)
  const [items, setItems] = useState([
    CREATE_EMPTY_ROW(1),
    CREATE_EMPTY_ROW(2),
    CREATE_EMPTY_ROW(3)
  ]);

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
    formId: 'oxigent',
    formType: 'Oxigent Monthly Inspection Form',
    formCode: 'BMSD/47/FO/HSE/08/21',
    rigNo: meta.rigNo,
    overrideRigNo,
    viewMonth,
    viewYear,
    meta: { ...meta, hfoName: meta.hesFieldOfficer, toolPusherName: meta.toolPusher },
    setMeta: (updater) => {
      setMeta(prev => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        return {
          ...next,
          hesFieldOfficer: next.hfoName || next.hesFieldOfficer,
          toolPusher: next.toolPusherName || next.toolPusher
        };
      });
    },
    items,
    setItems
  });

  const handleExportOxigentPdf = async () => {
    try {
      const payload = buildExportPayload();
      await generateOxigentPDF(payload);
    } catch (err) {
      console.error('Error generating Oxigent PDF:', err);
    }
  };

  const handleExportOxigentExcel = async () => {
    try {
      const payload = buildExportPayload();
      await generateOxigentExcel(payload);
    } catch (err) {
      console.error('Error generating Oxigent Excel:', err);
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
    setItems([...items, CREATE_EMPTY_ROW(Date.now())]);
  };

  const handleRemoveRow = (index) => {
    if (isLocked) return;
    if (items.length <= 1) {
      alert('Minimal harus ada 1 baris pemeriksaan.');
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
          next.hesFieldOfficer = sigData.name;
          next.hfoName = sigData.name;
        } else if (roleKey === 'toolpush') {
          next.toolPusher = sigData.name;
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
    <div className="form-sheet rounded-xl border border-slate-300 shadow-md p-4 sm:p-6 max-w-[1200px] mx-auto text-xs font-sans">
      {/* Bar Tombol Kontrol Header & Auto-Save / Export */}
      <FormActionHeader
        onBack={onBack}
        docNo="BMSD/47/FO/HSE/08/21"
        status={status}
        saveState={saveState}
        isLocked={isLocked}
        isAdmin={isAdmin}
        adminEditMode={adminEditMode}
        onExportPdf={handleExportOxigentPdf}
        onExportExcel={handleExportOxigentExcel}
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
                Oxigent Monthly Inspection Form
              </p>
              <p className="font-semibold text-[11px] text-slate-600 italic">
                Lembar Pemeriksaan Bulanan Alat Pasok Pernafasan
              </p>
            </div>

            {/* Meta Document Section */}
            <div className="col-span-12 sm:col-span-3 text-[10px] font-semibold divide-y divide-slate-800">
              <div className="flex justify-between p-1">
                <span>No Formulir</span>
                <span className="font-mono font-bold">: BMSD/47/FO/HSE/08/21</span>
              </div>
              <div className="flex justify-between p-1">
                <span>No. Revisi</span>
                <span className="font-mono font-bold">: 00</span>
              </div>
              <div className="flex justify-between p-1">
                <span>Tanggal Efektif</span>
                <span className="font-mono font-bold">: 03 Agustus 2021</span>
              </div>
            </div>
          </div>

          {/* Sub Header (Inspection date, Last Inspection Date, Rig No) */}
          <div className="border-t-2 border-slate-800 p-3 bg-slate-50 space-y-2 text-xs font-bold">
            <div className="flex items-center space-x-2 max-w-md">
              <label className="w-56 text-[11px]">Inspection date / tanggal pemeriksaan</label>
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
              <label className="w-56 text-[11px]">Last Inspection Date / Tanggal Pemeriksaan Terakhir</label>
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
              <label className="w-56 text-[11px]">Rig No / Nomor rig</label>
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
          </div>
        </div>

        {/* TABEL PEMERIKSAAN OKSIGEN */}
        <div className="overflow-x-auto border-2 border-slate-800">
          <table className="w-full border-collapse text-[10px] text-slate-900 min-w-[950px]">
            <thead>
              <tr className="bg-slate-300 font-bold text-center border-b-2 border-slate-800 uppercase">
                <th rowSpan="2" className="border-r border-slate-800 p-2 w-8">No</th>
                <th rowSpan="2" className="border-r border-slate-800 p-2 min-w-[150px]">MERK, TYPE / SERIAL NO</th>
                <th rowSpan="2" className="border-r border-slate-800 p-2 min-w-[120px]">PENEMPATAN</th>
                <th colSpan="10" className="border-r border-slate-800 p-1 text-base tracking-widest bg-slate-400">
                  CONDITION
                </th>
                <th rowSpan="2" className="p-2 min-w-[140px]">REKOMENDASI</th>
                <th rowSpan="2" className="p-1 w-8 bg-slate-200">Action</th>
              </tr>
              <tr className="bg-slate-200 font-bold text-center border-b-2 border-slate-800 text-[9px]">
                {/* Pressure Volume */}
                <th colSpan="2" className="border-r border-slate-800 p-1">
                  PRESSURE VOLUME (Psi)<br />
                  <span className="font-black text-[9px] text-emerald-700">✓</span> / <span className="font-black text-[9px] text-rose-700">✗</span>
                </th>
                {/* Regulator */}
                <th colSpan="2" className="border-r border-slate-800 p-1">
                  REGURATOR<br />
                  <span className="font-black text-[9px] text-emerald-700">✓</span> / <span className="font-black text-[9px] text-rose-700">✗</span>
                </th>
                {/* Hydro Test */}
                <th colSpan="2" className="border-r border-slate-800 p-1">
                  HYDRO TEST<br />
                  <span className="font-black text-[9px] text-emerald-700">✓</span> / <span className="font-black text-[9px] text-rose-700">✗</span>
                </th>
                {/* Tabung */}
                <th colSpan="2" className="border-r border-slate-800 p-1">
                  TABUNG<br />
                  <span className="font-black text-[9px] text-emerald-700">✓</span> / <span className="font-black text-[9px] text-rose-700">✗</span>
                </th>
                {/* Valve & Connection */}
                <th colSpan="2" className="border-r border-slate-800 p-1">
                  VALVE & connection<br />
                  <span className="font-black text-[9px] text-emerald-700">✓</span> / <span className="font-black text-[9px] text-rose-700">✗</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium">
              {items.map((row, index) => (
                <tr key={row.id} className="hover:bg-blue-50/40 transition">
                  {/* No */}
                  <td className="border-r border-slate-800 text-center font-bold bg-slate-50 p-1">{index + 1}</td>

                  {/* Merk, Type / Serial No */}
                  <td className="border-r border-slate-800 p-1">
                    <input
                      type="text"
                      value={row.merkTypeSerial}
                      onChange={(e) => handleItemChange(index, 'merkTypeSerial', e.target.value)}
                      placeholder="Merk / Type / SN..."
                      className="w-full bg-transparent border-b border-slate-300 focus:outline-none focus:border-blue-600 font-semibold"
                    />
                  </td>

                  {/* Penempatan */}
                  <td className="border-r border-slate-800 p-1">
                    <input
                      type="text"
                      value={row.penempatan}
                      onChange={(e) => handleItemChange(index, 'penempatan', e.target.value)}
                      placeholder="Lokasi penempatan..."
                      className="w-full bg-transparent border-b border-slate-300 focus:outline-none focus:border-blue-600"
                    />
                  </td>

                  {/* Pressure Volume (Psi) */}
                  <td colSpan="2" className="border-r border-slate-800 p-1 text-center">
                    <select
                      value={row.pressureVolume}
                      onChange={(e) => handleItemChange(index, 'pressureVolume', e.target.value)}
                      className={`w-full text-center font-bold text-[10px] cursor-pointer focus:outline-none rounded py-0.5 ${
                        row.pressureVolume === '✓' || row.pressureVolume === 'Good'
                          ? 'bg-emerald-100 text-emerald-800 font-extrabold'
                          : row.pressureVolume === 'X' || row.pressureVolume === 'Bad'
                          ? 'bg-rose-100 text-rose-800 font-extrabold'
                          : row.pressureVolume === 'N/A'
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-transparent text-slate-400'
                      }`}
                    >
                      <option value="✓">✓</option>
                      <option value="X">X</option>
                      <option value="N/A">N/A</option>
                    </select>
                  </td>

                  {/* Regulator */}
                  <td colSpan="2" className="border-r border-slate-800 p-1 text-center">
                    <select
                      value={row.regulator}
                      onChange={(e) => handleItemChange(index, 'regulator', e.target.value)}
                      className={`w-full text-center font-bold text-[10px] cursor-pointer focus:outline-none rounded py-0.5 ${
                        row.regulator === '✓' || row.regulator === 'Good'
                          ? 'bg-emerald-100 text-emerald-800 font-extrabold'
                          : row.regulator === 'X' || row.regulator === 'Bad'
                          ? 'bg-rose-100 text-rose-800 font-extrabold'
                          : row.regulator === 'N/A'
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-transparent text-slate-400'
                      }`}
                    >
                      <option value="✓">✓</option>
                      <option value="X">X</option>
                      <option value="N/A">N/A</option>
                    </select>
                  </td>

                  {/* Hydro Test */}
                  <td colSpan="2" className="border-r border-slate-800 p-1 text-center">
                    <select
                      value={row.hydroTest}
                      onChange={(e) => handleItemChange(index, 'hydroTest', e.target.value)}
                      className={`w-full text-center font-bold text-[10px] cursor-pointer focus:outline-none rounded py-0.5 ${
                        row.hydroTest === '✓' || row.hydroTest === 'Berlaku'
                          ? 'bg-emerald-100 text-emerald-800 font-extrabold'
                          : row.hydroTest === 'X' || row.hydroTest === 'Expire'
                          ? 'bg-rose-100 text-rose-800 font-extrabold'
                          : row.hydroTest === 'N/A'
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-transparent text-slate-400'
                      }`}
                    >
                      <option value="✓">✓</option>
                      <option value="X">X</option>
                      <option value="N/A">N/A</option>
                    </select>
                  </td>

                  {/* Tabung */}
                  <td colSpan="2" className="border-r border-slate-800 p-1 text-center">
                    <select
                      value={row.tabung}
                      onChange={(e) => handleItemChange(index, 'tabung', e.target.value)}
                      className={`w-full text-center font-bold text-[10px] cursor-pointer focus:outline-none rounded py-0.5 ${
                        row.tabung === '✓' || row.tabung === 'Good'
                          ? 'bg-emerald-100 text-emerald-800 font-extrabold'
                          : row.tabung === 'X' || row.tabung === 'Bad'
                          ? 'bg-rose-100 text-rose-800 font-extrabold'
                          : row.tabung === 'N/A'
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-transparent text-slate-400'
                      }`}
                    >
                      <option value="✓">✓</option>
                      <option value="X">X</option>
                      <option value="N/A">N/A</option>
                    </select>
                  </td>

                  {/* Valve & Connection */}
                  <td colSpan="2" className="border-r border-slate-800 p-1 text-center">
                    <select
                      value={row.valveConnection}
                      onChange={(e) => handleItemChange(index, 'valveConnection', e.target.value)}
                      className={`w-full text-center font-bold text-[10px] cursor-pointer focus:outline-none rounded py-0.5 ${
                        row.valveConnection === '✓' || row.valveConnection === 'Good'
                          ? 'bg-emerald-100 text-emerald-800 font-extrabold'
                          : row.valveConnection === 'X' || row.valveConnection === 'Bad'
                          ? 'bg-rose-100 text-rose-800 font-extrabold'
                          : row.valveConnection === 'N/A'
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-transparent text-slate-400'
                      }`}
                    >
                      <option value="✓">✓</option>
                      <option value="X">X</option>
                      <option value="N/A">N/A</option>
                    </select>
                  </td>

                  {/* Rekomendasi */}
                  <td className="border-r border-slate-800 p-1">
                    <input
                      type="text"
                      value={row.rekomendasi}
                      onChange={(e) => handleItemChange(index, 'rekomendasi', e.target.value)}
                      placeholder="Catatan / tindakan..."
                      className="w-full bg-transparent border-b border-slate-300 focus:outline-none"
                    />
                  </td>

                  {/* Action Remove */}
                  <td className="p-1 text-center bg-slate-50">
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

        {/* Tombol Tambah Baris */}
        <div className="flex justify-start">
          <button
            type="button"
            onClick={handleAddRow}
            className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg font-bold hover:bg-blue-100 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Tabung Oksigen</span>
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
            hfo: meta.hesFieldOfficer || meta.hfoName,
            wfo: meta.hesFieldOfficer || meta.hfoName,
            toolpush: meta.toolPusher || meta.toolPusherName
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
          onExportPdf={handleExportOxigentPdf}
          onExportExcel={handleExportOxigentExcel}
          saveState={saveState}
        />
      </form>
    </div>
  );
}