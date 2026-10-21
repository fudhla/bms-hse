import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Upload, 
  ZoomIn, 
  X, 
  RotateCcw, 
  Image as ImageIcon 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useInspectionForm } from '../../hooks/useInspectionForm';
import { generateHarnessPDF, generateHarnessExcel } from '../../utils/exportUtils';
import FormActionHeader from './FormActionHeader';
import FormSubmitFooter from './FormSubmitFooter';
import DigitalSignatureSection, { HARNESS_SIGNATURE_ROLES } from './DigitalSignatureSection';

const CHECKLIST_SECTIONS = [
  {
    id: 1,
    komponen: 'WEBBING',
    items: [
      'Terpotong atau Sobek',
      'Berubah bentuk / Abrasi karena bergesekan',
      'Keregangan yang berlebihan',
      'Rusak karena panas, korosi atau zat kimia'
    ]
  },
  {
    id: 2,
    komponen: 'SNAP HOOKS & KARABINER',
    items: [
      'Distorsi ( berubah bentuk )',
      'Keretakan',
      'Beban berlebih',
      'Safety Lock berfungsi dengan baik',
      'Kondisi pegas Safety Lock yang melemah',
      'Safety Lock yang tidak presisi',
      'Korosi / keropos',
      'Bebas dari kotoran dan penyumbatan'
    ]
  },
  {
    id: 3,
    komponen: 'D - RINGS',
    items: [
      'D - Ring bergerak baik pada Roller',
      'Keretakan atau memipih',
      'Distorsi ( berubah bentuk ) atau aus',
      'Korosi / keropos',
      'Beban berlebih'
    ]
  },
  {
    id: 4,
    komponen: 'BUCKLETS & ADJUSTERS\n(Kancing Sabuk Pengaman)',
    items: [
      'Distorsi ( berubah bentuk ) atau aus',
      'Keretakan atau memipih',
      'Korosi / keropos',
      'Bengkok',
      'Open Rollers'
    ]
  },
  {
    id: 5,
    komponen: 'SEWING\n(Jahitan)',
    items: [
      'Putus atau sobek',
      'Benang melapuk karena panas, karat, jamur',
      'Perbaikan sendiri / tanpa lisensi'
    ]
  },
  {
    id: 6,
    komponen: 'ROPE (Tali)',
    items: [
      'Putus',
      'Tegangan yang berlebih',
      'Pelapukan karena zat kimia',
      'Pelapukan karena panas, karat, sinar matahari',
      'Kerusakan atau retak pada thimbles'
    ]
  },
  {
    id: 7,
    komponen: 'ENERGY ABSORBER\n(Peredam Kejut)',
    items: [
      'Peredam kejut belum mengalami peregangan',
      'Perbaikan tanpa lisensi'
    ]
  },
  {
    id: 8,
    komponen: 'BLOOD SUSPENSION TRAUMA',
    isBlue: true,
    items: [
      'Putus atau robek',
      'Kantong tidak ada',
      'Strap atau restleting rusak'
    ]
  },
  {
    id: 9,
    komponen: 'LABELLING\n(Sertifikasi)',
    items: [
      'Tercantum nomor seri dan mudah dibaca',
      'Label produksi',
      'Keterangan alat dan petunjuk pemakaian',
      'Tanggal produksi'
    ]
  }
];

export default function HarnessForm({ onBack, currentUser, overrideRigNo = null, viewMonth = null, viewYear = null }) {
  const { user: authUser } = useAuth();
  const user = currentUser || authUser;
  const isKaryawan = user?.role === 'karyawan';
  const assignedRig = user?.rig_name || '';

  // Metadata Utama
  const [meta, setMeta] = useState({
    rigNo: overrideRigNo || (isKaryawan && assignedRig ? assignedRig : ''),
    jenisAlat: 'Full Body Harnesses',
    derrickmanName: '',
    toolPusherName: '',
    wsrName: '',
    remark: '',
    userName: '',
    signatures: {}
  });

  // State Foto Komponen (Dictionary: { [sectionId]: base64DataUrl })
  const [componentPhotos, setComponentPhotos] = useState({});

  // State Modal Zoom Foto
  const [zoomModal, setZoomModal] = useState({
    isOpen: false,
    imageSrc: '',
    title: ''
  });

  // Sinkronisasi rigNo: URL override > assigned rig
  useEffect(() => {
    if (overrideRigNo) {
      setMeta(prev => ({ ...prev, rigNo: overrideRigNo }));
    } else if (isKaryawan && assignedRig) {
      setMeta(prev => ({ ...prev, rigNo: assignedRig }));
    }
  }, [overrideRigNo, isKaryawan, assignedRig]);

  // State Unit (S/N) - Default 6 kolom inspeksi berdampingan
  const [units, setUnits] = useState([
    { sn: '', lokasi: '', tanggal: new Date().toISOString().split('T')[0], checks: {} },
    { sn: '', lokasi: '', tanggal: new Date().toISOString().split('T')[0], checks: {} },
    { sn: '', lokasi: '', tanggal: new Date().toISOString().split('T')[0], checks: {} },
    { sn: '', lokasi: '', tanggal: new Date().toISOString().split('T')[0], checks: {} },
    { sn: '', lokasi: '', tanggal: new Date().toISOString().split('T')[0], checks: {} },
    { sn: '', lokasi: '', tanggal: new Date().toISOString().split('T')[0], checks: {} }
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
    buildExportPayload,
    initialData,
    initialLoaded
  } = useInspectionForm({
    formId: 'harness',
    formType: 'Full Body Harness & Lanyard',
    formCode: 'BMSD/17/FO/HSE/08/26',
    rigNo: meta.rigNo,
    overrideRigNo,
    viewMonth,
    viewYear,
    meta: { ...meta, hfoName: meta.derrickmanName, toolPusherName: meta.toolPusherName || meta.wsrName, rekomendasi: meta.remark },
    setMeta: (updater) => {
      setMeta(prev => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        return {
          ...next,
          derrickmanName: next.hfoName || next.derrickmanName,
          toolPusherName: next.toolPusherName || next.toolPusherName,
          remark: next.rekomendasi || next.remark
        };
      });
    },
    items: units,
    setItems: setUnits,
    extraPayload: { 
      units_data: units,
      component_photos: componentPhotos,
      wsr_name: meta.wsrName
    }
  });

  const handleExportHarnessPdf = async () => {
    try {
      const payload = {
        ...buildExportPayload(),
        component_photos: componentPhotos,
        componentPhotos: componentPhotos,
        hfo_name: meta.wsrName || meta.hfoName || meta.signatures?.hfo?.name || meta.signatures?.wfo?.name,
        derrickman_name: meta.derrickmanName || meta.userName || meta.signatures?.derickman?.name || meta.signatures?.toolpush?.name
      };
      await generateHarnessPDF(payload);
    } catch (err) {
      console.error('Error generating Harness PDF:', err);
    }
  };

  const handleExportHarnessExcel = async () => {
    try {
      const payload = {
        ...buildExportPayload(),
        component_photos: componentPhotos,
        componentPhotos: componentPhotos
      };
      await generateHarnessExcel(payload);
    } catch (err) {
      console.error('Error generating Harness Excel:', err);
    }
  };

  // Restore foto komponen dari database saat data awal selesai dimuat
  useEffect(() => {
    if (initialLoaded && initialData) {
      const savedPhotos = initialData.form_data?.component_photos || initialData.form_data?.componentPhotos;
      if (savedPhotos && typeof savedPhotos === 'object') {
        setComponentPhotos(savedPhotos);
      }
    }
  }, [initialLoaded, initialData]);

  const handleMetaChange = (e) => {
    if (isLocked) return;
    setMeta({ ...meta, [e.target.name]: e.target.value });
  };

  const handleUnitMetaChange = (unitIdx, field, value) => {
    if (isLocked) return;
    const updated = [...units];
    updated[unitIdx][field] = value;
    setUnits(updated);
  };

  const handleCheckChange = (unitIdx, itemKey, status) => {
    if (isLocked) return;
    const updated = [...units];
    updated[unitIdx].checks = {
      ...updated[unitIdx].checks,
      [itemKey]: status
    };
    setUnits(updated);
  };

  const addUnitColumn = () => {
    if (isLocked) return;
    setUnits([
      ...units,
      { sn: '', lokasi: '', tanggal: new Date().toISOString().split('T')[0], checks: {} }
    ]);
  };

  const removeUnitColumn = (index) => {
    if (isLocked) return;
    if (units.length <= 1) return;
    setUnits(units.filter((_, idx) => idx !== index));
  };

  // Handler Upload Foto Komponen (Kompresi ke Base64 dengan batas ukuran proporsional)
  const handlePhotoUpload = (sectionId, file) => {
    if (isLocked) return;
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar (JPG, PNG, WebP)!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Kompresi gambar ke canvas (max dimensi 800px untuk performa responsif & hemat penyimpanan)
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 800;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82);

        setComponentPhotos(prev => ({
          ...prev,
          [sectionId]: compressedBase64
        }));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Handler Reset / Hapus Foto
  const handleResetPhoto = (sectionId, e) => {
    e.stopPropagation();
    if (isLocked) return;
    if (window.confirm('Hapus foto komponen ini dan kembalikan ke default?')) {
      setComponentPhotos(prev => {
        const copy = { ...prev };
        delete copy[sectionId];
        return copy;
      });
    }
  };

  // Buka Modal Zoom
  const openZoomModal = (imgSrc, title) => {
    setZoomModal({
      isOpen: true,
      imageSrc: imgSrc,
      title: title || 'Detail Foto Komponen Harness'
    });
  };

  const closeZoomModal = () => {
    setZoomModal({
      isOpen: false,
      imageSrc: '',
      title: ''
    });
  };

  const handleSignatureChange = (roleKey, sigData) => {
    if (isLocked && !isAdmin) return;
    setMeta(prev => {
      const newSignatures = { ...(prev.signatures || {}) };
      if (sigData) {
        newSignatures[roleKey] = sigData;
        if (roleKey === 'hfo') newSignatures.wfo = sigData;
        if (roleKey === 'derickman') newSignatures.toolpush = sigData;
      } else {
        delete newSignatures[roleKey];
        if (roleKey === 'hfo') delete newSignatures.wfo;
        if (roleKey === 'derickman') delete newSignatures.toolpush;
      }
      const next = { ...prev, signatures: newSignatures };
      if (sigData?.name) {
        if (roleKey === 'hfo' || roleKey === 'wfo') {
          next.wsrName = sigData.name;
          next.hfoName = sigData.name;
        } else if (roleKey === 'derickman' || roleKey === 'user' || roleKey === 'toolpush') {
          next.derrickmanName = sigData.name;
          next.userName = sigData.name;
          next.toolPusherName = sigData.name;
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
        docNo="BMSD/17/FO/HSE/08/26"
        status={status}
        saveState={saveState}
        isLocked={isLocked}
        isAdmin={isAdmin}
        adminEditMode={adminEditMode}
        onExportPdf={handleExportHarnessPdf}
        onExportExcel={handleExportHarnessExcel}
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
          <div className="grid grid-cols-12 divide-x-2 divide-y-2 sm:divide-y-0 divide-slate-800">
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
              <h1 className="font-extrabold text-xs sm:text-sm text-slate-900 underline">
                Form Inspeksi Alat Untuk Bekerja Diketinggian
              </h1>
              <p className="font-bold text-xs text-slate-800 mt-0.5">
                ( Harnesses & Lanyards CAMP )
              </p>
            </div>

            {/* Meta Document Section */}
            <div className="col-span-12 sm:col-span-3 text-[10px] font-semibold divide-y divide-slate-800">
              <div className="flex justify-between p-1">
                <span>No. Fomulir</span>
                <span className="font-mono font-bold">: BMSD/17/FO/HSE/08/26</span>
              </div>
              <div className="flex justify-between p-1">
                <span>No. Revisi</span>
                <span className="font-mono font-bold">: # 06</span>
              </div>
              <div className="flex justify-between p-1">
                <span>Tanggal Efektif</span>
                <span className="font-mono font-bold">: 7 Agustus 2026</span>
              </div>
            </div>
          </div>

          {/* Sub Header (Rig & Jenis Alat) */}
          <div className="border-t-2 border-slate-800 p-2 bg-slate-50 grid grid-cols-1 sm:grid-cols-2 gap-4 font-bold text-xs">
            <div className="flex items-center space-x-2">
              <label className="w-20">Rig</label>
              <span>:</span>
              <input
                type="text"
                name="rigNo"
                value={meta.rigNo}
                onChange={handleMetaChange}
                readOnly={isKaryawan}
                placeholder="Rig No"
                className={`border-b border-slate-400 bg-transparent px-1 py-0.5 font-bold text-blue-900 focus:outline-none ${
                  isKaryawan ? 'bg-slate-100 cursor-not-allowed text-slate-700' : ''
                }`}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="w-20">Jenis Alat</label>
              <span>:</span>
              <input
                type="text"
                name="jenisAlat"
                value={meta.jenisAlat}
                onChange={handleMetaChange}
                placeholder="Full Body Harnesses"
                className="border-b border-slate-400 bg-transparent px-1 py-0.5 font-bold focus:outline-none"
                required
              />
            </div>
          </div>
        </div>

        {/* Tombol Tambah Kolom S/N */}
        <div className="flex justify-between items-center">
          <p className="text-[11px] text-slate-500 italic">
            * Geser tabel ke kanan jika menginspeksi banyak unit secara bersamaan. Klik pada gambar untuk zoom.
          </p>
          <button
            type="button"
            onClick={addUnitColumn}
            className="flex items-center space-x-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Kolom S/N Unit</span>
          </button>
        </div>

        {/* TABEL CHECKLIST INSPEKSI FISIK MULTI-S/N */}
        <div className="overflow-x-auto border-2 border-slate-800 shadow-sm rounded-sm">
          <table className="w-full border-collapse text-[10px] text-slate-900">
            <thead>
              {/* Row 1: Header S/N */}
              <tr className="bg-emerald-700 text-white font-bold text-center border-b border-slate-800">
                <th rowSpan={4} className="border-r border-slate-800 p-1 w-6 bg-slate-200 text-slate-900">No</th>
                <th rowSpan={4} className="border-r border-slate-800 p-1 w-32 bg-slate-200 text-slate-900">Komponen</th>
                <th rowSpan={4} className="border-r border-slate-800 p-1 w-44 bg-slate-200 text-slate-900">Jenis Kerusakan</th>
                <th rowSpan={4} className="border-r border-slate-800 p-1 w-28 bg-slate-200 text-slate-900">Gambar / Foto</th>
                
                {/* Dynamically Render S/N Columns Header */}
                {units.map((unit, uIdx) => (
                  <th key={uIdx} colSpan={2} className="border-r border-slate-800 p-1 bg-emerald-700 relative">
                    <div className="flex justify-between items-center px-1">
                      <span>S/N</span>
                      {units.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeUnitColumn(uIdx)}
                          className="text-emerald-200 hover:text-white"
                          title="Hapus Kolom S/N Ini"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>

              {/* Row 2: Input S/N Value */}
              <tr className="bg-emerald-50 border-b border-slate-800">
                {units.map((unit, uIdx) => (
                  <td key={uIdx} colSpan={2} className="border-r border-slate-800 p-1">
                    <input
                      type="text"
                      value={unit.sn}
                      onChange={(e) => handleUnitMetaChange(uIdx, 'sn', e.target.value)}
                      placeholder={`S/N ${uIdx + 1}`}
                      className="w-full text-center font-bold text-emerald-900 bg-white border border-emerald-300 rounded px-1 py-0.5 focus:outline-none"
                    />
                  </td>
                ))}
              </tr>

              {/* Row 3: Input Lokasi */}
              <tr className="bg-slate-100 border-b border-slate-800 text-center font-bold">
                {units.map((unit, uIdx) => (
                  <React.Fragment key={uIdx}>
                    <td className="border-r border-slate-300 p-1 w-12 bg-slate-200">Lokasi</td>
                    <td className="border-r border-slate-800 p-1 w-16">
                      <input
                        type="text"
                        value={unit.lokasi}
                        onChange={(e) => handleUnitMetaChange(uIdx, 'lokasi', e.target.value)}
                        placeholder="Lokasi"
                        className="w-full text-center bg-transparent border-b border-slate-300 focus:outline-none font-semibold"
                      />
                    </td>
                  </React.Fragment>
                ))}
              </tr>

              {/* Row 4: Input Tanggal & Kondisi OK/BAD */}
              <tr className="bg-slate-100 border-b-2 border-slate-800 text-center font-bold">
                {units.map((unit, uIdx) => (
                  <React.Fragment key={uIdx}>
                    <td className="border-r border-slate-300 p-1 bg-slate-200">Tanggal</td>
                    <td className="border-r border-slate-800 p-1">
                      <input
                        type="date"
                        value={unit.tanggal}
                        onChange={(e) => handleUnitMetaChange(uIdx, 'tanggal', e.target.value)}
                        className="w-full text-[9px] bg-transparent border-b border-slate-300 focus:outline-none"
                      />
                    </td>
                  </React.Fragment>
                ))}
              </tr>

              {/* Sub Header Row 5: OK / BAD Label */}
              <tr className="bg-slate-200 border-b-2 border-slate-800 font-bold text-center">
                <td colSpan={4} className="p-1 border-r border-slate-800 text-right pr-4 uppercase tracking-wider text-[9px]">
                  Kondisi Peralatan
                </td>
                {units.map((_, uIdx) => (
                  <React.Fragment key={uIdx}>
                    <th className="border-r border-slate-400 p-0.5 w-7 bg-emerald-100 text-emerald-800 font-black text-xs" title="OK / Ceklis">✓</th>
                    <th className="border-r border-slate-800 p-0.5 w-7 bg-rose-100 text-rose-800 font-black text-xs" title="BAD / Silang">✗</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800 font-medium">
              {CHECKLIST_SECTIONS.map((sec) => (
                <React.Fragment key={sec.id}>
                  {sec.items.map((item, itemIdx) => {
                    const itemKey = `sec_${sec.id}_item_${itemIdx}`;
                    const currentPhoto = componentPhotos[sec.id];

                    return (
                      <tr key={itemKey} className="hover:bg-blue-50/50 transition">
                        {/* NO (Hanya di baris pertama section) */}
                        {itemIdx === 0 && (
                          <td
                            rowSpan={sec.items.length}
                            className="border-r border-slate-800 font-bold p-1 text-center bg-slate-100 align-top"
                          >
                            {sec.id}
                          </td>
                        )}

                        {/* KOMPONEN (Hanya di baris pertama section) */}
                        {itemIdx === 0 && (
                          <td
                            rowSpan={sec.items.length}
                            className={`border-r border-slate-800 font-bold p-1.5 align-top whitespace-pre-line ${
                              sec.isBlue ? 'text-blue-600 font-extrabold' : 'text-slate-900'
                            }`}
                          >
                            {sec.komponen}
                          </td>
                        )}

                        {/* JENIS KERUSAKAN */}
                        <td className={`border-r border-slate-800 p-1.5 leading-snug ${sec.isBlue ? 'text-blue-700 font-semibold' : ''}`}>
                          {item}
                        </td>

                        {/* GAMBAR / FOTO KOMPONEN DENGAN UPLOAD & ZOOM (Hanya di baris pertama section) */}
                        {itemIdx === 0 && (
                          <td
                            rowSpan={sec.items.length}
                            className="border-r border-slate-800 p-1.5 text-center align-middle bg-slate-50"
                          >
                            <div className="flex flex-col items-center justify-center space-y-1">
                              {currentPhoto ? (
                                <div className="relative group w-20 h-16 rounded border border-slate-300 bg-white shadow-xs overflow-hidden flex items-center justify-center">
                                  <img 
                                    src={currentPhoto} 
                                    alt={`Komponen ${sec.id} - ${sec.komponen}`}
                                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition"
                                    onClick={() => openZoomModal(currentPhoto, `${sec.id}. ${sec.komponen}`)}
                                  />
                                  {/* Overlay Aksi Zoom & Reset */}
                                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-1.5">
                                    <button
                                      type="button"
                                      onClick={() => openZoomModal(currentPhoto, `${sec.id}. ${sec.komponen}`)}
                                      className="p-1 rounded bg-blue-600 hover:bg-blue-700 text-white"
                                      title="Perbesar Foto"
                                    >
                                      <ZoomIn className="w-3.5 h-3.5" />
                                    </button>
                                    {!isLocked && (
                                      <button
                                        type="button"
                                        onClick={(e) => handleResetPhoto(sec.id, e)}
                                        className="p-1 rounded bg-rose-600 hover:bg-rose-700 text-white"
                                        title="Hapus / Reset Foto"
                                      >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div 
                                  onClick={() => {
                                    if (!isLocked) {
                                      document.getElementById(`file_input_sec_${sec.id}`)?.click();
                                    }
                                  }}
                                  className={`w-20 h-14 border border-dashed border-slate-300 rounded bg-slate-100 flex flex-col items-center justify-center transition p-1 ${
                                    isLocked ? 'cursor-default opacity-60' : 'cursor-pointer hover:bg-blue-50 hover:border-blue-400'
                                  }`}
                                  title={isLocked ? 'Tidak ada foto diunggah' : 'Klik untuk unggah foto'}
                                >
                                  <ImageIcon className="w-4 h-4 text-slate-400 mb-0.5" />
                                  <span className="text-[7.5px] font-bold text-slate-500 uppercase leading-none">
                                    {sec.komponen.split('\n')[0].slice(0, 10)}
                                  </span>
                                </div>
                              )}

                              {/* Input File Hidden & Tombol Aksi Upload/Ganti */}
                              {!isLocked && (
                                <>
                                  <input 
                                    type="file" 
                                    id={`file_input_sec_${sec.id}`}
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files[0]) {
                                        handlePhotoUpload(sec.id, e.target.files[0]);
                                      }
                                    }}
                                  />
                                  <label 
                                    htmlFor={`file_input_sec_${sec.id}`}
                                    className="inline-flex items-center space-x-1 text-[8.5px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-1.5 py-0.5 rounded cursor-pointer transition shadow-2xs"
                                    title={currentPhoto ? 'Ganti Foto' : 'Unggah Foto'}
                                  >
                                    <Upload className="w-2.5 h-2.5" />
                                    <span>{currentPhoto ? 'Ganti' : 'Upload'}</span>
                                  </label>
                                </>
                              )}
                            </div>
                          </td>
                        )}

                        {/* RADIO TOGGLE OK / BAD UNTUK SETIAP S/N UNIT */}
                        {units.map((unit, uIdx) => {
                          const currentStatus = unit.checks[itemKey];

                          return (
                            <React.Fragment key={uIdx}>
                              <td className="border-r border-slate-400 p-0.5 text-center">
                                <input
                                  type="radio"
                                  name={`check_${uIdx}_${itemKey}`}
                                  checked={currentStatus === 'OK'}
                                  onChange={() => handleCheckChange(uIdx, itemKey, 'OK')}
                                  title="✓ (OK / Ceklis)"
                                  className="w-3.5 h-3.5 text-emerald-600 accent-emerald-600 focus:ring-0 cursor-pointer"
                                />
                              </td>
                              <td className="border-r border-slate-800 p-0.5 text-center bg-slate-50/50">
                                <input
                                  type="radio"
                                  name={`check_${uIdx}_${itemKey}`}
                                  checked={currentStatus === 'BAD'}
                                  onChange={() => handleCheckChange(uIdx, itemKey, 'BAD')}
                                  title="✗ (BAD / Silang)"
                                  className="w-3.5 h-3.5 text-rose-600 accent-rose-600 focus:ring-0 cursor-pointer"
                                />
                              </td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Remark Area */}
        <div className="border-2 border-slate-800 p-3 bg-slate-50 rounded-lg">
          <label className="font-bold text-slate-800 block mb-1">Remark / Catatan Tambahan:</label>
          <textarea
            name="remark"
            rows={3}
            value={meta.remark}
            onChange={handleMetaChange}
            placeholder="Tuliskan catatan khusus atau temuan kerusakan jika ada..."
            className="w-full p-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 bg-white"
          />
        </div>

        {/* Tanda Tangan Digital 2 Pihak (HFO & DERICKMAN) */}
        <DigitalSignatureSection
          signatures={meta.signatures || {}}
          onSignatureChange={handleSignatureChange}
          isLocked={isLocked}
          isAdmin={isAdmin}
          adminEditMode={adminEditMode}
          roles={HARNESS_SIGNATURE_ROLES}
          instructionText="Wajib ditandatangani oleh HFO (HES Field Officer) dan Derickman."
          defaultSignerNames={{
            hfo: meta.wsrName || meta.hfoName,
            wfo: meta.wsrName || meta.hfoName,
            derickman: meta.derrickmanName || meta.userName || user?.username,
            toolpush: meta.derrickmanName || meta.toolPusherName || meta.userName
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
          onExportPdf={handleExportHarnessPdf}
          onExportExcel={handleExportHarnessExcel}
          saveState={saveState}
        />
      </form>

      {/* MODAL ZOOM / LIGHTBOX GAMBAR KOMPONEN */}
      {zoomModal.isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={closeZoomModal}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full border border-slate-300 shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="font-black text-sm text-slate-900 flex items-center space-x-2">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <span>{zoomModal.title}</span>
              </h3>
              <button
                type="button"
                onClick={closeZoomModal}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Image Body */}
            <div className="p-4 flex items-center justify-center bg-slate-950 min-h-[300px] max-h-[70vh] overflow-auto">
              <img 
                src={zoomModal.imageSrc} 
                alt={zoomModal.title}
                className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-md"
              />
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
              <span className="text-slate-500 text-[11px]">
                Rig: <strong className="text-slate-800">{meta.rigNo}</strong> &bull; Form No: BMSD/17/FO/HSE/08/26
              </span>
              <button
                type="button"
                onClick={closeZoomModal}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold transition text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}