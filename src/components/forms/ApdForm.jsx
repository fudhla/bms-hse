import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, CheckCircle, AlertCircle, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useInspectionForm } from '../../hooks/useInspectionForm';
import { generateApdPDF, generateApdExcel } from '../../utils/exportUtils';
import FormActionHeader from './FormActionHeader';
import FormSubmitFooter from './FormSubmitFooter';
import DigitalSignatureSection from './DigitalSignatureSection';

const APD_COLUMNS = [
  { key: 'topi_topguard', label: 'Top Guard', group: 'Topi keselamatan' },
  { key: 'topi_vguard', label: 'V-Guard', group: 'Topi keselamatan' },
  { key: 'tali_dagu', label: 'Tali Dagu', group: 'Tali Dagu' },
  { key: 'kacamata_standar', label: 'Standar', group: 'kaca Mata Keselamatan' },
  { key: 'kacamata_google', label: 'Safety Google', group: 'kaca Mata Keselamatan' },
  { key: 'kacamata_resep', label: 'Resep', group: 'kaca Mata Keselamatan' },
  { key: 'sumbat_telinga', label: 'Sumbat telinga', group: 'Sumbat telinga' },
  { key: 'rompi', label: 'Rompi', group: 'Rompi' },
  { key: 'sepatu_rubber', label: 'Rubber', group: 'Sepatu keselamatan' },
  { key: 'sepatu_standar', label: 'Standar', group: 'Sepatu keselamatan' },
  { key: 'coverall', label: 'Seragam / Cover all', group: 'Seragam / Cover all' },
  { key: 'sarung_cotton', label: 'Cotton', group: 'Sarung tangan' },
  { key: 'sarung_hdhg', label: 'HDHG', group: 'Sarung tangan' },
  { key: 'sarung_rubber', label: 'Rubber Hand Glove', group: 'Sarung tangan' },
  { key: 'sarung_highvoltage', label: 'Hight Voltage', group: 'Sarung tangan' },
  { key: 'masker_hepa', label: 'HEPA Mask', group: 'Masker' },
  { key: 'masker_organik', label: 'Masker Organik', group: 'Masker' },
  { key: 'jas_hujan', label: 'Jas Hujan', group: 'Jas Hujan' }
];

export default function ApdForm({ onBack, currentUser, overrideRigNo = null, viewMonth = null, viewYear = null }) {
  const { user: authUser } = useAuth();
  const user = currentUser || authUser;
  const isKaryawan = user?.role === 'karyawan';
  const assignedRig = user?.rig_name || '';

  // Metadata Formulir Header
  const [meta, setMeta] = useState({
    rigNo: overrideRigNo || (isKaryawan && assignedRig ? assignedRig : ''),
    tanggal: new Date().toISOString().split('T')[0],
    lokasi: '',
    statusRig: '',
    rekomendasi: '',
    hfoName: '',
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

  // Default 25 Baris Karyawan
  const [rows, setRows] = useState(
    Array.from({ length: 25 }, (_, index) => ({
      id: index + 1,
      nama: '',
      jabatan: '',
      apd: {},
      keterangan: ''
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
    handleExportPdf,
    handleExportExcel
  } = useInspectionForm({
    formId: 'apd',
    formType: 'Inspeksi V&V Alat Pelindung Diri',
    formCode: 'BMSD / 22/ FO/HSE/01/26',
    rigNo: meta.rigNo,
    overrideRigNo,
    viewMonth,
    viewYear,
    meta,
    setMeta,
    items: rows,
    setItems: setRows,
    extraPayload: { karyawan_data: rows }
  });

  const handleMetaChange = (e) => {
    if (isLocked) return;
    setMeta({ ...meta, [e.target.name]: e.target.value });
  };

  const handleRowChange = (index, field, value) => {
    if (isLocked) return;
    const updatedRows = [...rows];
    updatedRows[index][field] = value;
    setRows(updatedRows);
  };

  const handleApdStatusChange = (rowIndex, apdKey, status) => {
    if (isLocked) return;
    const updatedRows = [...rows];
    updatedRows[rowIndex].apd = {
      ...updatedRows[rowIndex].apd,
      [apdKey]: status
    };
    setRows(updatedRows);
  };

  const addRow = () => {
    if (isLocked) return;
    setRows([
      ...rows,
      { id: rows.length + 1, nama: '', jabatan: '', apd: {}, keterangan: '' }
    ]);
  };

  const removeRow = (index) => {
    if (isLocked) return;
    if (rows.length <= 1) return;
    const updated = rows.filter((_, idx) => idx !== index).map((row, idx) => ({
      ...row,
      id: idx + 1
    }));
    setRows(updated);
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

  const handleExportApdPdf = async () => {
    try {
      await generateApdPDF({
        formId: 'apd',
        form_id: 'apd',
        form_type: 'Inspeksi V&V Alat Pelindung Diri',
        form_code: 'BMSD / 22/ FO/HSE/01/26',
        rig_no: meta.rigNo,
        tanggal: meta.tanggal,
        lokasi: meta.lokasi,
        status_rig: meta.statusRig,
        rekomendasi: meta.rekomendasi,
        hfo_name: meta.hfoName,
        tool_pusher_name: meta.toolPusherName,
        signatures: meta.signatures,
        items: rows,
        karyawan_data: rows,
        meta
      });
    } catch (err) {
      console.error('Error generating APD PDF:', err);
    }
  };

  const handleExportApdExcel = async () => {
    try {
      await generateApdExcel({
        formId: 'apd',
        form_id: 'apd',
        form_type: 'Inspeksi V&V Alat Pelindung Diri',
        form_code: 'BMSD / 22/ FO/HSE/01/26',
        rig_no: meta.rigNo,
        tanggal: meta.tanggal,
        lokasi: meta.lokasi,
        status_rig: meta.statusRig,
        rekomendasi: meta.rekomendasi,
        hfo_name: meta.hfoName,
        tool_pusher_name: meta.toolPusherName,
        signatures: meta.signatures,
        items: rows,
        karyawan_data: rows,
        meta
      });
    } catch (err) {
      console.error('Error generating APD Excel:', err);
    }
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
        docNo="BMSD / 22/ FO/HSE/01/26"
        status={status}
        saveState={saveState}
        isLocked={isLocked}
        isAdmin={isAdmin}
        adminEditMode={adminEditMode}
        onExportPdf={handleExportApdPdf}
        onExportExcel={handleExportApdExcel}
      />

      {/* Alert Status */}
      {message.text && (
        <div className={`p-3 rounded-lg mb-4 flex items-center space-x-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          <span className="font-semibold">{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="col-span-12 sm:col-span-6 p-3 text-center flex flex-col justify-center bg-slate-50">
              <h1 className="font-black text-base sm:text-lg text-slate-900 uppercase tracking-wide">
                INSPEKSI/V&V ALAT PELINDUNG DIRI
              </h1>
            </div>

            {/* Meta Document Section */}
            <div className="col-span-12 sm:col-span-3 text-[10px] font-semibold divide-y divide-slate-800">
              <div className="flex justify-between p-1">
                <span>No. Formulir</span>
                <span className="font-mono font-bold">: BMSD / 22/ FO/HSE/01/26</span>
              </div>
              <div className="flex justify-between p-1">
                <span>Revisi</span>
                <span className="font-mono font-bold">: #05</span>
              </div>
              <div className="flex justify-between p-1">
                <span>Tanggal Efektif</span>
                <span className="font-mono font-bold">: 16 Januari 2026</span>
              </div>
            </div>
          </div>

          {/* Sub Header (Rig, Tanggal, Lokasi, Status Rig) */}
          <div className="border-t-2 border-slate-800 p-2 bg-slate-50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-bold text-xs">
            <div className="flex items-center space-x-2">
              <label className="w-16">Rig.</label>
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
            <div className="flex items-center space-x-2">
              <label className="w-16">Tanggal</label>
              <span>:</span>
              <input
                type="date"
                name="tanggal"
                value={meta.tanggal}
                onChange={handleMetaChange}
                className="w-full border-b border-slate-400 bg-transparent px-1 py-0.5 font-bold focus:outline-none"
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="w-16">Lokasi</label>
              <span>:</span>
              <input
                type="text"
                name="lokasi"
                value={meta.lokasi}
                onChange={handleMetaChange}
                placeholder="Lokasi Rig"
                className="w-full border-b border-slate-400 bg-transparent px-1 py-0.5 font-bold focus:outline-none"
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="w-20">Status Rig</label>
              <span>:</span>
              <input
                type="text"
                name="statusRig"
                value={meta.statusRig}
                onChange={handleMetaChange}
                placeholder="Operating / Breakdown"
                className="w-full border-b border-slate-400 bg-transparent px-1 py-0.5 font-bold focus:outline-none"
              />
            </div>
          </div>

          {/* Legend Banner Keterangan Symbol */}
          <div className="border-t-2 border-slate-800 p-1.5 bg-slate-200 text-center text-[10px] font-bold text-slate-800">
            <span className="underline mr-1">Keterangan :</span>
            <span className="font-mono text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 mr-2">✓ = Kondisi baik dan sesuai kontrak</span>
            <span className="font-mono text-rose-800 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-300 mr-2">X = Tidak ada / kondisi perlu penggantian</span>
            <span className="font-mono text-slate-700 bg-slate-300 px-1.5 py-0.5 rounded border border-slate-400">N/A = Tidak tersedia/Tidak dibutuhkan (tidak ada dalam kontrak)</span>
          </div>
        </div>

        {/* Tombol Tambah Baris Karyawan */}
        <div className="flex justify-between items-center pt-2">
          <p className="text-[11px] text-slate-500 italic">
            * Geser tabel ke kanan untuk melihat seluruh item APD.
          </p>
          <button
            type="button"
            onClick={addRow}
            className="flex items-center space-x-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Baris Karyawan</span>
          </button>
        </div>

        {/* TABEL CHECKLIST APD */}
        <div className="overflow-x-auto border-2 border-slate-800">
          <table className="w-full border-collapse text-[10px] text-slate-900 min-w-[1400px]">
            <thead>
              {/* Header Row 1 */}
              <tr className="bg-slate-200 text-slate-900 font-bold text-center border-b border-slate-800">
                <th rowSpan={3} className="border-r border-slate-800 p-1 w-8">No.</th>
                <th rowSpan={3} className="border-r border-slate-800 p-2 w-44">NAMA KARYAWAN</th>
                <th rowSpan={3} className="border-r border-slate-800 p-2 w-36">JABATAN</th>
                <th colSpan={18} className="border-r border-slate-800 p-1 bg-slate-300 uppercase tracking-wider font-extrabold text-xs">
                  ALAT PELINDUNG DIRI
                </th>
                <th rowSpan={3} className="p-2 w-40">KETERANGAN</th>
                <th rowSpan={3} className="p-1 w-8 border-l border-slate-800 bg-slate-100">#</th>
              </tr>

              {/* Header Row 2 */}
              <tr className="bg-slate-100 font-bold text-center border-b border-slate-800">
                <th colSpan={2} className="border-r border-slate-800 p-1">Topi keselamatan</th>
                <th rowSpan={2} className="border-r border-slate-800 p-1 w-12 leading-tight">Tali Dagu</th>
                <th colSpan={3} className="border-r border-slate-800 p-1">kaca Mata Keselamatan</th>
                <th rowSpan={2} className="border-r border-slate-800 p-1 w-12 leading-tight">Sumbat telinga</th>
                <th rowSpan={2} className="border-r border-slate-800 p-1 w-12">Rompi</th>
                <th colSpan={2} className="border-r border-slate-800 p-1">Sepatu keselamatan</th>
                <th rowSpan={2} className="border-r border-slate-800 p-1 w-14 leading-tight">Seragam / Cover all</th>
                <th colSpan={4} className="border-r border-slate-800 p-1">Sarung tangan</th>
                <th colSpan={2} className="border-r border-slate-800 p-1">Masker</th>
                <th rowSpan={2} className="border-r border-slate-800 p-1 w-12 leading-tight">Jas Hujan</th>
              </tr>

              {/* Header Row 3 - Specific Sub items */}
              <tr className="bg-slate-50 font-bold text-center border-b-2 border-slate-800 text-[9px]">
                <th className="border-r border-slate-800 p-1 w-12">Top Guard</th>
                <th className="border-r border-slate-800 p-1 w-12">V-Guard</th>
                <th className="border-r border-slate-800 p-1 w-12">Standar</th>
                <th className="border-r border-slate-800 p-1 w-14">Safety Google</th>
                <th className="border-r border-slate-800 p-1 w-12">Resep</th>
                <th className="border-r border-slate-800 p-1 w-12">Rubber</th>
                <th className="border-r border-slate-800 p-1 w-12">Standar</th>
                <th className="border-r border-slate-800 p-1 w-12">Cotton</th>
                <th className="border-r border-slate-800 p-1 w-12">HDHG</th>
                <th className="border-r border-slate-800 p-1 w-16">Rubber Hand Glove</th>
                <th className="border-r border-slate-800 p-1 w-14">Hight Voltage</th>
                <th className="border-r border-slate-800 p-1 w-14">HEPA Mask</th>
                <th className="border-r border-slate-800 p-1 w-14">Masker Organik</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800 font-medium">
              {rows.map((row, rIdx) => (
                <tr key={row.id} className="hover:bg-blue-50/40 transition">
                  {/* Row Number */}
                  <td className="border-r border-slate-800 p-1 text-center font-bold bg-slate-50">
                    {row.id}.
                  </td>

                  {/* Nama Karyawan */}
                  <td className="border-r border-slate-800 p-1">
                    <input
                      type="text"
                      value={row.nama}
                      onChange={(e) => handleRowChange(rIdx, 'nama', e.target.value)}
                      placeholder="Nama Karyawan"
                      className="w-full bg-transparent px-1 py-0.5 focus:bg-white focus:outline-none font-semibold"
                    />
                  </td>

                  {/* Jabatan */}
                  <td className="border-r border-slate-800 p-1">
                    <input
                      type="text"
                      value={row.jabatan}
                      onChange={(e) => handleRowChange(rIdx, 'jabatan', e.target.value)}
                      placeholder="Jabatan"
                      className="w-full bg-transparent px-1 py-0.5 focus:bg-white focus:outline-none"
                    />
                  </td>

                  {/* Dynamic APD Select Status Cells */}
                  {APD_COLUMNS.map((col) => {
                    const currentVal = row.apd[col.key] || '';
                    return (
                      <td key={col.key} className="border-r border-slate-800 p-0.5 text-center">
                        <select
                          value={currentVal}
                          onChange={(e) => handleApdStatusChange(rIdx, col.key, e.target.value)}
                          className={`w-full text-center font-bold text-[10px] cursor-pointer focus:outline-none rounded py-0.5 ${
                            currentVal === '✓' || currentVal === 'v'
                              ? 'bg-emerald-100 text-emerald-800 font-extrabold'
                              : currentVal === 'X'
                              ? 'bg-rose-100 text-rose-800 font-extrabold'
                              : currentVal === 'N/A'
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
                    );
                  })}

                  {/* Keterangan */}
                  <td className="p-1 border-r border-slate-800">
                    <input
                      type="text"
                      value={row.keterangan}
                      onChange={(e) => handleRowChange(rIdx, 'keterangan', e.target.value)}
                      placeholder="Catatan..."
                      className="w-full bg-transparent px-1 py-0.5 focus:bg-white focus:outline-none"
                    />
                  </td>

                  {/* Delete Action */}
                  <td className="p-1 text-center bg-slate-50">
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(rIdx)}
                        className="text-slate-400 hover:text-rose-600 transition"
                        title="Hapus Baris"
                      >
                        <Trash2 className="w-3.5 h-3.5 mx-auto" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FOOTER REKOMENDASI */}
        <div className="border-2 border-slate-800 p-3 bg-slate-50 rounded-lg">
          <label className="font-bold text-slate-900 block mb-1 uppercase text-[11px]">
            REKOMENDASI = <span className="font-normal italic text-slate-600">(tuliskan jika expire / perlu tindakan perbaikan)</span>
          </label>
          <textarea
            name="rekomendasi"
            rows={3}
            value={meta.rekomendasi}
            onChange={handleMetaChange}
            placeholder="Tuliskan rekomendasi atau APD yang sudah mendekati/melewati tanggal kadaluarsa..."
            className="w-full p-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 bg-white"
          />
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
            hfo: meta.hfoName,
            wfo: meta.hfoName,
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
          onExportPdf={handleExportApdPdf}
          onExportExcel={handleExportApdExcel}
          saveState={saveState}
        />
      </form>
    </div>
  );
}