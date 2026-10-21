import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useInspectionForm } from '../../hooks/useInspectionForm';
import { generateFirstAidPDF, generateFirstAidExcel } from '../../utils/exportUtils';
import FormActionHeader from './FormActionHeader';
import FormSubmitFooter from './FormSubmitFooter';
import DigitalSignatureSection from './DigitalSignatureSection';

// Daftar 21 Item Standar Kotak P3K
const INITIAL_ITEMS = [
  { id: 1, no: 1, jenisObat: 'KASA STERIL TERBUNGKUS', ukuran: '20 EA', jumlah: '', expDate: '', kondisi: '✓', temuan: '' },
  { id: 2, no: 2, jenisObat: 'PERBAN (5 CM)', ukuran: '2 ROLL', jumlah: '', expDate: '', kondisi: '✓', temuan: '' },
  { id: 3, no: 3, jenisObat: 'PERBAN (10 CM)', ukuran: '2 ROLL', jumlah: '', expDate: '', kondisi: '✓', temuan: '' },
  { id: 4, no: 4, jenisObat: 'PLESTER (1,25 CM)', ukuran: '2 ROLL', jumlah: '', expDate: '', kondisi: '✓', temuan: '' },
  { id: 5, no: 5, jenisObat: 'PLESTER CEPAT', ukuran: '10 EA', jumlah: '', expDate: '', kondisi: '✓', temuan: '' },
  { id: 6, no: 6, jenisObat: 'KAPAS (25 GRAM)', ukuran: '1 BKS', jumlah: '', expDate: '', kondisi: '✓', temuan: '' },
  { id: 7, no: 7, jenisObat: 'KAIN SEGITIGA/MITELA', ukuran: '2 EA', jumlah: '', expDate: '', kondisi: '✓', temuan: '' },
  { id: 8, no: 8, jenisObat: 'GUNTING', ukuran: '1 EA', jumlah: '', expDate: '', kondisi: '✓', temuan: '' },
  { id: 9, no: 9, jenisObat: 'PENITI', ukuran: '12 EA', jumlah: '', expDate: '', kondisi: '✓', temuan: '' },
  { id: 10, no: 10, jenisObat: 'SARUNG TANGAN SEKALI PAKAI', ukuran: '2 PSG', jumlah: '', expDate: '', kondisi: '✓', temuan: '' },
  { id: 11, no: 11, jenisObat: 'MASKER', ukuran: '2 EA', jumlah: '', expDate: '', kondisi: '✓', temuan: '' },
  { id: 12, no: 12, jenisObat: 'PINSET', ukuran: '1 EA', jumlah: '', expDate: '', kondisi: '✓', temuan: '' },
  { id: 13, no: 13, jenisObat: 'LAMPU SENTER', ukuran: '1 EA', jumlah: '', expDate: '', kondisi: '✓', temuan: '' },
  { id: 14, no: 14, jenisObat: 'GELAS CUCI MATA', ukuran: '1 EA', jumlah: '', expDate: '', kondisi: '✓', temuan: '' },
  { id: 15, no: 15, jenisObat: 'KANTONG PLASTIK BERSIH', ukuran: '1 EA', jumlah: '', expDate: '', kondisi: '✓', temuan: '' },
  { id: 16, no: 16, jenisObat: 'AQUADES (100 ML LAR. SALINE)', ukuran: '1 BTL', jumlah: '', expDate: '', kondisi: '✓', temuan: '' },
  { id: 17, no: 17, jenisObat: 'POVIDON IODIN (60 ML)', ukuran: '1 BTL', jumlah: '', expDate: '', kondisi: '✓', temuan: '' },
  { id: 18, no: 18, jenisObat: 'ALKOHOL 70 %', ukuran: '1 BTL', jumlah: '', expDate: '', kondisi: '✓', temuan: '' },
  { id: 19, no: 19, jenisObat: 'BUKU PANDUAN P3K', ukuran: '1 EA', jumlah: '', expDate: '', kondisi: '✓', temuan: '' },
  { id: 20, no: 20, jenisObat: 'BUKU CATATAN', ukuran: '1 EA', jumlah: '', expDate: '', kondisi: '✓', temuan: '' },
  { id: 21, no: 21, jenisObat: 'DAFTAR ISI KOTAK', ukuran: '1 EA', jumlah: '', expDate: '', kondisi: '✓', temuan: '' },
];

export default function FirstAidForm({ onBack, currentUser, overrideRigNo = null, viewMonth = null, viewYear = null }) {
  const { user: authUser } = useAuth();
  const user = currentUser || authUser;
  const isKaryawan = user?.role === 'karyawan';
  const assignedRig = user?.rig_name || '';

  // Metadata Utama
  const [meta, setMeta] = useState({
    inspectionDate: new Date().toISOString().split('T')[0],
    lastInspection: '',
    rigNoDept: overrideRigNo || (isKaryawan && assignedRig ? assignedRig : ''),
    inspectedByName: '',
    acknowledgedByName: '',
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

  const [items, setItems] = useState(INITIAL_ITEMS);

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
    formId: 'firstaid',
    formType: 'First Aid Kits Monthly Inspection Form',
    formCode: 'BMSD/46/FO/HSE/04/25',
    rigNo: meta.rigNoDept,
    overrideRigNo,
    viewMonth,
    viewYear,
    meta: { ...meta, rigNo: meta.rigNoDept, hfoName: meta.inspectedByName, toolPusherName: meta.acknowledgedByName },
    setMeta: (updater) => {
      setMeta(prev => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        return {
          ...next,
          rigNoDept: next.rigNo || next.rigNoDept,
          inspectedByName: next.hfoName || next.inspectedByName,
          acknowledgedByName: next.toolPusherName || next.acknowledgedByName
        };
      });
    },
    items,
    setItems
  });

  const handleExportFirstAidPdf = async () => {
    try {
      const payload = buildExportPayload();
      await generateFirstAidPDF(payload);
    } catch (err) {
      console.error('Error generating First Aid PDF:', err);
    }
  };

  const handleExportFirstAidExcel = async () => {
    try {
      const payload = buildExportPayload();
      await generateFirstAidExcel(payload);
    } catch (err) {
      console.error('Error generating First Aid Excel:', err);
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
          next.inspectedByName = sigData.name;
          next.hfoName = sigData.name;
        } else if (roleKey === 'toolpush') {
          next.acknowledgedByName = sigData.name;
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
      {/* Header Bar Kontrol & Auto-Save / Export */}
      <FormActionHeader
        onBack={onBack}
        docNo="BMSD/46/FO/HSE/04/25"
        status={status}
        saveState={saveState}
        isLocked={isLocked}
        isAdmin={isAdmin}
        adminEditMode={adminEditMode}
        onExportPdf={handleExportFirstAidPdf}
        onExportExcel={handleExportFirstAidExcel}
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
                First Aid Kits <span className="text-blue-700">Monthly</span> Inspection Form
              </p>
              <p className="font-semibold text-[11px] text-slate-600 italic">
                Lembar Pemeriksaan Kelengkapan P3K
              </p>
            </div>

            {/* Meta Document Section */}
            <div className="col-span-12 sm:col-span-3 text-[10px] font-semibold divide-y divide-slate-800">
              <div className="flex justify-between p-1">
                <span>No Formulir</span>
                <span className="font-mono font-bold">: BMSD/46/FO/HSE/04/25</span>
              </div>
              <div className="flex justify-between p-1">
                <span>No. Revisi</span>
                <span className="font-mono font-bold">: 01</span>
              </div>
              <div className="flex justify-between p-1">
                <span>Tanggal Efektif</span>
                <span className="font-mono font-bold">: 15 April 25</span>
              </div>
            </div>
          </div>

          {/* Sub Header (Date of Inspection, Last Inspection, Rig No / Dept.) */}
          <div className="border-t-2 border-slate-800 p-3 bg-slate-50 space-y-2 text-xs font-bold">
            <div className="flex items-center space-x-2 max-w-md">
              <label className="w-48 text-[11px]">Date of Inspection / Tgl Pemeriksaan</label>
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
              <label className="w-48 text-[11px]">Last Inspection / Pemeriksaan Terakhir</label>
              <span>:</span>
              <input
                type="date"
                name="lastInspection"
                value={meta.lastInspection}
                onChange={handleMetaChange}
                className="w-full border-b border-slate-400 bg-transparent px-1 py-0.5 focus:outline-none"
              />
            </div>
            <div className="flex items-center space-x-2 max-w-md">
              <label className="w-48 text-[11px]">Rig No / Dept.</label>
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
          </div>
        </div>

        {/* TABEL PEMERIKSAAN P3K */}
        <div className="overflow-x-auto border-2 border-slate-800">
          <table className="w-full border-collapse text-[11px] text-slate-900 min-w-[800px]">
            <thead>
              <tr className="bg-slate-300 font-bold text-center border-b-2 border-slate-800">
                <th className="border-r border-slate-800 p-2 w-10">NO.</th>
                <th className="border-r border-slate-800 p-2 text-left">Jenis Obat</th>
                <th className="border-r border-slate-800 p-2 w-28">Ukuran</th>
                <th className="border-r border-slate-800 p-2 w-20">Jumlah</th>
                <th className="border-r border-slate-800 p-2 w-36">Tanggal Kadaluarsa</th>
                <th className="border-r border-slate-800 p-2 w-28">Kondisi</th>
                <th className="p-2 text-left">Temuan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium">
              {items.map((row, index) => (
                <tr key={row.id} className="hover:bg-blue-50/40 transition">
                  <td className="border-r border-slate-800 text-center font-bold bg-slate-50 p-1.5">{row.no}</td>
                  <td className="border-r border-slate-800 p-1.5 font-semibold text-slate-800">{row.jenisObat}</td>
                  <td className="border-r border-slate-800 p-1.5 text-center font-bold bg-slate-100">{row.ukuran}</td>

                  {/* Jumlah */}
                  <td className="border-r border-slate-800 p-1">
                    <input
                      type="text"
                      value={row.jumlah}
                      onChange={(e) => handleItemChange(index, 'jumlah', e.target.value)}
                      placeholder="Qty"
                      className="w-full text-center bg-transparent border-b border-slate-300 focus:outline-none focus:border-blue-600 font-bold"
                    />
                  </td>

                  {/* Tanggal Kadaluarsa */}
                  <td className="border-r border-slate-800 p-1">
                    <input
                      type="date"
                      value={row.expDate}
                      onChange={(e) => handleItemChange(index, 'expDate', e.target.value)}
                      className="w-full text-center bg-transparent border-b border-slate-300 focus:outline-none"
                    />
                  </td>

                  {/* Kondisi */}
                  <td className="border-r border-slate-800 p-1">
                    <select
                      value={row.kondisi}
                      onChange={(e) => handleItemChange(index, 'kondisi', e.target.value)}
                      className={`w-full text-center font-bold text-[10px] cursor-pointer focus:outline-none rounded py-0.5 ${
                        row.kondisi === '✓' || row.kondisi === 'Baik'
                          ? 'bg-emerald-100 text-emerald-800 font-extrabold'
                          : row.kondisi === 'X' || row.kondisi === 'Rusak' || row.kondisi === 'Kadaluarsa' || row.kondisi === 'Kurang'
                          ? 'bg-rose-100 text-rose-800 font-extrabold'
                          : row.kondisi === 'N/A'
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-transparent text-slate-400'
                      }`}
                    >
                      <option value="">-</option>
                      <option value="✓">✓</option>
                      <option value="X">X</option>
                      <option value="N/A">N/A</option>
                    </select>
                  </td>

                  {/* Temuan */}
                  <td className="p-1">
                    <input
                      type="text"
                      value={row.temuan}
                      onChange={(e) => handleItemChange(index, 'temuan', e.target.value)}
                      placeholder="Catatan temuan..."
                      className="w-full bg-transparent focus:outline-none px-1"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Note kaki tabel */}
        <div className="text-[10px] italic text-slate-600 font-semibold">
          Note : List dapat disesuaikan dengan kontrak pelanggan
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
            hfo: meta.inspectedByName || meta.hfoName,
            wfo: meta.inspectedByName || meta.hfoName,
            toolpush: meta.acknowledgedByName || meta.toolPusherName
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
          onExportPdf={handleExportFirstAidPdf}
          onExportExcel={handleExportFirstAidExcel}
          saveState={saveState}
        />
      </form>
    </div>
  );
}