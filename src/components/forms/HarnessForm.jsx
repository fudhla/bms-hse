import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Upload, 
  Image as ImageIcon,
  ZoomIn
} from 'lucide-react';
import { useInspectionForm } from '../../hooks/useInspectionForm';
import { useAuth } from '../../context/AuthContext';
import { generateHarnessPDF, generateHarnessExcel } from '../../utils/exportUtils';
import FormActionHeader from './FormActionHeader';
import FormSubmitFooter from './FormSubmitFooter';
import DigitalSignatureSection, { HARNESS_SIGNATURE_ROLES } from './DigitalSignatureSection';

// 9 GAMBAR REFERENSI BAWAAN GLOBAL (STATIC ASSETS DI /public/images/harness/)
export const defaultHarnessImages = {
  1: '/images/harness/webbing.png',
  2: '/images/harness/snap-hooks.png',
  3: '/images/harness/d-rings.png',
  4: '/images/harness/buckles.png',
  5: '/images/harness/sewing.png',
  6: '/images/harness/rope.png',
  7: '/images/harness/energy-absorber.png',
  8: '/images/harness/trauma-strap.png',
  9: '/images/harness/labelling.png'
};

export const CHECKLIST_SECTIONS = [
  {
    id: 1,
    komponen: 'WEBBING',
    image: defaultHarnessImages[1],
    items: [
      'Ada yang terpotong / sobek / terurai',
      'Terkena panas / percikan api las',
      'Ada bekas bahan kimia / asam / pelarut',
      'Terdapat modifikasi yang tidak standar'
    ]
  },
  {
    id: 2,
    komponen: 'SNAP HOOKS & KARABINER',
    image: defaultHarnessImages[2],
    items: [
      'Ada bengkok / retak / korosi',
      'Penguncian tidak bekerja dengan baik',
      'Kait pengaman (keeper) longgar / rusak',
      'Karat berlebih'
    ]
  },
  {
    id: 3,
    komponen: 'D - RINGS',
    image: defaultHarnessImages[3],
    items: [
      'Bengkok / retak / aus',
      'Berkarat berlebihan',
      'Posisi bergeser tidak normal'
    ]
  },
  {
    id: 4,
    komponen: 'BUCKLETS & ADJUSTERS\n(Kancing Sabuk Pengaman)',
    image: defaultHarnessImages[4],
    items: [
      'Bengkok / retak / aus',
      'Mekanisme penguncian aus / longgar',
      'Bagian kancing hilang'
    ]
  },
  {
    id: 5,
    komponen: 'SEWING\n(Jahitan)',
    image: defaultHarnessImages[5],
    items: [
      'Jahitan putus / robek / terlepas',
      'Benang lapuk / aus'
    ]
  },
  {
    id: 6,
    komponen: 'ROPE\n(Tali)',
    image: defaultHarnessImages[6],
    items: [
      'Serat putus / terkikis',
      'Diameter tali mengecil / gepeng',
      'Kaku karena zat kimia / panas'
    ]
  },
  {
    id: 7,
    komponen: 'ENERGY ABSORBER\n(Peredam Kejut)',
    image: defaultHarnessImages[7],
    items: [
      'Telah terbuka / pernah menahan jatuh',
      'Sobek / basah / lapuk',
      'Cover pelindung hilang / rusak'
    ]
  },
  {
    id: 8,
    komponen: 'BLOOD SUSPENSION TRAUMA',
    image: defaultHarnessImages[8],
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
    image: defaultHarnessImages[9],
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
    tanggal: new Date().toISOString().split('T')[0],
    jenisAlat: 'Full Body Harnesses',
    derrickmanName: '',
    toolPusherName: '',
    wsrName: '',
    remark: '',
    userName: '',
    signatures: {}
  });

  // State Foto Hasil Upload Pengguna: { [sectionId]: base64DataUrl }
  const [userUploads, setUserUploads] = useState({});

  // Helper Foto Aktif (Menimpa default dengan upload user)
  const getActivePhotos = () => ({
    1: userUploads[1] || defaultHarnessImages[1],
    2: userUploads[2] || defaultHarnessImages[2],
    3: userUploads[3] || defaultHarnessImages[3],
    4: userUploads[4] || defaultHarnessImages[4],
    5: userUploads[5] || defaultHarnessImages[5],
    6: userUploads[6] || defaultHarnessImages[6],
    7: userUploads[7] || defaultHarnessImages[7],
    8: userUploads[8] || defaultHarnessImages[8],
    9: userUploads[9] || defaultHarnessImages[9]
  });

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

  // State Unit (S/N) - Inisialisasi 2 unit inspeksi awal agar pas di layar tanpa horizontal scrollbar
  const [units, setUnits] = useState([
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
    meta: { 
      ...meta, 
      hfoName: meta.wsrName || meta.hfoName, 
      toolPusherName: meta.toolPusherName, 
      rekomendasi: meta.remark 
    },
    setMeta: (updater) => {
      setMeta(prev => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        return {
          ...next,
          derrickmanName: next.derrickmanName || prev.derrickmanName,
          toolPusherName: next.toolPusherName || prev.toolPusherName,
          wsrName: next.hfoName || next.wsrName || prev.wsrName,
          remark: next.rekomendasi || next.remark || prev.remark
        };
      });
    },
    items: units,
    setItems: setUnits,
    extraPayload: { 
      units_data: units,
      component_photos: getActivePhotos(),
      user_uploads: userUploads,
      wsr_name: meta.wsrName
    }
  });

  const handleExportHarnessPdf = async () => {
    try {
      const photos = getActivePhotos();
      const payload = {
        ...buildExportPayload(),
        component_photos: photos,
        componentPhotos: photos,
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
      const photos = getActivePhotos();
      const payload = {
        ...buildExportPayload(),
        component_photos: photos,
        componentPhotos: photos
      };
      await generateHarnessExcel(payload);
    } catch (err) {
      console.error('Error generating Harness Excel:', err);
    }
  };

  // Restore foto komponen dari database saat data awal selesai dimuat
  useEffect(() => {
    if (initialLoaded && initialData) {
      const savedPhotos = initialData.form_data?.component_photos || initialData.form_data?.componentPhotos || initialData.form_data?.user_uploads;
      if (savedPhotos && typeof savedPhotos === 'object') {
        setUserUploads(savedPhotos);
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

  // Handler Upload Foto Komponen (Menimpa default dengan Base64 terkompresi)
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
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);

        // Menimpa (override) gambar default khusus untuk baris ini
        setUserUploads(prev => ({
          ...prev,
          [sectionId]: compressedBase64
        }));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
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
      const currentSignatures = prev.signatures || {};
      const currentSigForRole = currentSignatures[roleKey] || {};
      
      return {
        ...prev,
        signatures: {
          ...currentSignatures,
          [roleKey]: {
            ...currentSigForRole,
            ...sigData,
            signedAt: sigData.image ? (currentSigForRole.signedAt || new Date().toISOString()) : null
          }
        }
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleFinalSubmit();
  };

  return (
    <div className="form-sheet rounded-xl border border-slate-300 shadow-md p-4 sm:p-6 max-w-[1400px] mx-auto text-xs font-sans bg-white">
      {/* Header Bar Kontrol & Auto-Save / Export */}
      <FormActionHeader
        title="Formulir Inspeksi Full Body Harness & Lanyard"
        docNo="BMSD/17/FO/HSE/08/26"
        status={status}
        saveState={saveState}
        isLocked={isLocked}
        isAdmin={isAdmin}
        adminEditMode={adminEditMode}
        onBack={onBack}
        onExportPdf={handleExportHarnessPdf}
        onExportExcel={handleExportHarnessExcel}
      />

      {/* Alert Status Banner */}
      {message && message.text && (
        <div className={`p-3 rounded-lg mb-4 flex items-center space-x-2 ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          <span className="font-semibold">{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* KOP FORMULIR FISIK (STANDAR ENTERPRISE PT BESMINDO) */}
        <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs text-slate-900 bg-white">
          <div className="grid grid-cols-12 divide-x divide-y sm:divide-y-0 divide-slate-300 items-center">
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
            <div className="col-span-12 sm:col-span-6 p-3 text-center flex flex-col justify-center bg-slate-50/80">
              <h1 className="font-extrabold text-sm sm:text-base text-slate-900 uppercase tracking-wide">
                PT. BESMINDO MATERI SEWATAMA
              </h1>
              <p className="font-bold text-xs text-blue-700 uppercase mt-0.5">
                INSPEKSI/V&V FULL BODY HARNESS & LANYARD
              </p>
              <p className="font-semibold text-xs text-slate-600 italic">
                SAFETY HARNESS & LANYARD MONTHLY INSPECTION FORM
              </p>
            </div>

            {/* Meta Document Section */}
            <div className="col-span-12 sm:col-span-3 text-[10px] font-semibold divide-y divide-slate-300 bg-white">
              <div className="flex justify-between p-2">
                <span className="text-slate-500">No Formulir</span>
                <span className="font-mono font-bold text-slate-800">: BMSD/17/FO/HSE/08/26</span>
              </div>
              <div className="flex justify-between p-2">
                <span className="text-slate-500">No. Revisi</span>
                <span className="font-mono font-bold text-slate-800">: 01</span>
              </div>
              <div className="flex justify-between p-2">
                <span className="text-slate-500">Tanggal Efektif</span>
                <span className="font-mono font-bold text-slate-800">: 15 Agustus 2026</span>
              </div>
            </div>
          </div>

          {/* Sub Header (Rig, Tanggal, Derrickman, Toolpusher) */}
          <div className="border-t border-slate-300 p-3.5 bg-slate-50/70 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Rig No</label>
              <input
                type="text"
                name="rigNo"
                value={meta.rigNo}
                onChange={handleMetaChange}
                readOnly={isKaryawan}
                placeholder="Rig No"
                className={`w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-blue-700 bg-white focus:ring-2 focus:ring-blue-500 transition-colors ${
                  isKaryawan ? 'bg-slate-100 cursor-not-allowed opacity-90' : ''
                }`}
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Tanggal Pemeriksaan</label>
              <input
                type="date"
                name="tanggal"
                value={meta.tanggal}
                onChange={handleMetaChange}
                disabled={isLocked}
                className="w-full border border-slate-300 bg-white text-slate-900 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Derrickman</label>
              <input
                type="text"
                name="derrickmanName"
                value={meta.derrickmanName}
                onChange={handleMetaChange}
                disabled={isLocked}
                placeholder="Nama Derrickman"
                className="w-full border border-slate-300 bg-white text-slate-900 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Toolpusher</label>
              <input
                type="text"
                name="toolPusherName"
                value={meta.toolPusherName}
                onChange={handleMetaChange}
                disabled={isLocked}
                placeholder="Nama Toolpusher"
                className="w-full border border-slate-300 bg-white text-slate-900 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500 transition-colors"
                required
              />
            </div>
          </div>

          {/* Sub Header Tambahan: HFO & Catatan Rekomendasi */}
          <div className="border-t border-slate-200 p-3 bg-slate-50/50 grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
            <div className="md:col-span-4">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">HFO (HES Field Officer)</label>
              <input
                type="text"
                name="wsrName"
                value={meta.wsrName}
                onChange={handleMetaChange}
                disabled={isLocked}
                placeholder="Nama HES Field Officer..."
                className="w-full border border-slate-300 bg-white text-slate-900 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500 transition-colors"
              />
            </div>
            <div className="md:col-span-8">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Catatan / Rekomendasi</label>
              <input
                type="text"
                name="remark"
                value={meta.remark}
                onChange={handleMetaChange}
                disabled={isLocked}
                placeholder="Tuliskan catatan hasil inspeksi atau tindakan perbaikan jika ada..."
                className="w-full border border-slate-300 bg-white text-slate-900 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:ring-2 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Legend Banner Keterangan Symbol */}
          <div className="border-t border-slate-200 p-2.5 bg-slate-100/70 text-center text-xs font-medium text-slate-700 flex flex-wrap items-center justify-center gap-3">
            <span className="font-bold text-slate-800">Keterangan:</span>
            <span className="inline-flex items-center space-x-1.5 text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              <span className="font-black text-emerald-600 text-sm">✓</span>
              <span>= Kondisi baik dan sesuai standar</span>
            </span>
            <span className="inline-flex items-center space-x-1.5 text-rose-800 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
              <span className="font-black text-rose-600 text-sm">✕</span>
              <span>= Rusak / perlu perbaikan</span>
            </span>
          </div>
        </div>

        {/* Action Bar Header Tabel (Tambah Unit) */}
        <div className="flex justify-between items-center py-2">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-700 text-xs">Daftar Unit Inspeksi Full Body Harness</span>
            <span className="text-[11px] text-slate-500">({units.length} Unit)</span>
          </div>
          {!isLocked && (
            <button
              type="button"
              onClick={addUnitColumn}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Unit (S/N)</span>
            </button>
          )}
        </div>

        {/* TABEL CHECKLIST INSPEKSI HARNESS (Clean Modern Table - Tanpa Scrollbar Horizontal) */}
        <div className="rounded-xl border border-slate-300 shadow-xs bg-white overflow-hidden">
          <table className="w-full text-slate-700 border-collapse table-auto text-xs">
            <thead>
              {/* Header Baris 1: Kolom Utama & Kolom Unit */}
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] tracking-wider border-b border-slate-300 text-center">
                <th rowSpan={2} className="border-r border-slate-200 px-2 py-3 w-10">NO</th>
                <th rowSpan={2} className="border-r border-slate-200 px-3 py-3 w-40 text-left">KOMPONEN</th>
                <th rowSpan={2} className="border-r border-slate-200 px-3 py-3 text-left">
                  JENIS KERUSAKAN / ITEM CHECKLIST
                </th>
                <th rowSpan={2} className="border-r border-slate-200 px-2 py-3 w-36 min-w-[130px] text-center bg-slate-50/80">
                  GAMBAR / FOTO
                </th>
                {units.map((unit, uIdx) => (
                  <th
                    key={uIdx}
                    colSpan={2}
                    className="border-r border-slate-200 px-2 py-2 bg-blue-50/60"
                  >
                    <div className="flex items-center justify-between px-1 mb-1">
                      <span className="font-extrabold text-[11px] text-blue-900">Unit #{uIdx + 1}</span>
                      {!isLocked && units.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeUnitColumn(uIdx)}
                          className="p-1 rounded text-rose-500 hover:bg-rose-100 hover:text-rose-700 transition"
                          title="Hapus Kolom Unit Ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-1 font-normal text-[11px]">
                      <input
                        type="text"
                        placeholder="S/N Unit..."
                        value={unit.sn}
                        onChange={(e) => handleUnitMetaChange(uIdx, 'sn', e.target.value)}
                        disabled={isLocked}
                        className="w-full px-2 py-1 border border-slate-300 rounded bg-white text-slate-800 disabled:bg-slate-100 font-bold text-center text-xs focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Lokasi..."
                        value={unit.lokasi}
                        onChange={(e) => handleUnitMetaChange(uIdx, 'lokasi', e.target.value)}
                        disabled={isLocked}
                        className="w-full px-2 py-1 border border-slate-300 rounded bg-white text-slate-800 disabled:bg-slate-100 text-center text-xs focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </th>
                ))}
              </tr>

              {/* Header Baris 2: Sub-Kolom Centang / Silang */}
              <tr className="bg-slate-50 border-b border-slate-300 font-bold text-center text-xs">
                {units.map((_, uIdx) => (
                  <React.Fragment key={uIdx}>
                    <th className="border-r border-slate-200 py-1.5 w-10 text-emerald-700 bg-emerald-50/80 font-mono text-sm font-black">✓</th>
                    <th className="border-r border-slate-200 py-1.5 w-10 text-rose-700 bg-rose-50/80 font-mono text-sm font-black">✕</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {CHECKLIST_SECTIONS.map((sec) => (
                <React.Fragment key={sec.id}>
                  {sec.items.map((item, itemIdx) => {
                    const itemKey = `sec_${sec.id}_item_${itemIdx}`;

                    return (
                      <tr key={itemKey} className="hover:bg-blue-50/30 transition">
                        {/* NO (Hanya baris pertama) */}
                        {itemIdx === 0 && (
                          <td
                            rowSpan={sec.items.length}
                            className="border-r border-slate-200 font-bold px-2 py-2.5 text-center bg-slate-50/50 align-top text-xs text-slate-700"
                          >
                            {sec.id}
                          </td>
                        )}

                        {/* KOMPONEN (Hanya baris pertama) */}
                        {itemIdx === 0 && (
                          <td
                            rowSpan={sec.items.length}
                            className={`border-r border-slate-200 font-bold px-3 py-2.5 align-top whitespace-pre-line text-xs ${
                              sec.isBlue ? 'text-blue-700 font-extrabold' : 'text-slate-900'
                            }`}
                          >
                            {sec.komponen}
                          </td>
                        )}

                        {/* JENIS KERUSAKAN */}
                        <td className={`border-r border-slate-200 px-3 py-2 text-xs leading-relaxed ${
                          sec.isBlue ? 'text-blue-800 font-medium' : 'text-slate-700'
                        }`}>
                          {item}
                        </td>

                        {/* GAMBAR / FOTO KOMPONEN */}
                        {itemIdx === 0 && (() => {
                          const displayImage = userUploads[sec.id] || defaultHarnessImages[sec.id];

                          return (
                            <td
                              rowSpan={sec.items.length}
                              className="border-r border-slate-200 px-2 py-3 text-center align-middle bg-slate-50/40"
                            >
                              <div className="flex flex-col items-center justify-center">
                                {/* Frame Container Gambar (HD Fit & Hover Zoom) */}
                                <div 
                                  onClick={() => openZoomModal(displayImage, `${sec.id}. ${sec.komponen.replace('\n', ' ')}`)}
                                  className="w-28 h-20 bg-slate-50 border border-slate-200 rounded-lg p-1 overflow-hidden flex items-center justify-center shadow-xs cursor-pointer hover:border-blue-400 hover:shadow-md transition relative group"
                                  title="Arahkan kursor untuk zoom detail, klik untuk perbesar penuh"
                                >
                                  <img 
                                    src={displayImage} 
                                    alt={`Komponen ${sec.id} - ${sec.komponen}`}
                                    className="w-full h-full object-contain transition-transform duration-300 hover:scale-150 cursor-zoom-in origin-center z-10 hover:shadow-lg hover:rounded-md select-none"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      e.currentTarget.parentElement?.querySelector('.fb-icon')?.classList.remove('hidden');
                                    }}
                                  />
                                  <div className="fb-icon hidden flex flex-col items-center justify-center text-slate-400">
                                    <ImageIcon className="w-6 h-6 mb-1 text-slate-400" />
                                    <span className="text-[8px] uppercase font-bold text-slate-500 text-center leading-tight">
                                      {sec.komponen.split('\n')[0].slice(0, 12)}
                                    </span>
                                  </div>
                                </div>

                                {/* Tombol Ganti Foto */}
                                {!isLocked && (
                                  <div className="mt-2">
                                    <input 
                                      type="file" 
                                      id={`file_input_sec_${sec.id}`}
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                          handlePhotoUpload(sec.id, e.target.files[0]);
                                          e.target.value = '';
                                        }
                                      }}
                                    />
                                    <label 
                                      htmlFor={`file_input_sec_${sec.id}`}
                                      className="inline-flex items-center space-x-1.5 text-[10px] font-semibold text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-50 border border-slate-300 hover:border-blue-300 px-2.5 py-1 rounded-md cursor-pointer transition shadow-2xs"
                                      title="Ganti foto dengan foto baru"
                                    >
                                      <Upload className="w-3 h-3 text-blue-600" />
                                      <span>Ganti</span>
                                    </label>
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        })()}

                        {/* RADIO TOGGLE OK / BAD UNTUK SETIAP S/N UNIT */}
                        {units.map((unit, uIdx) => {
                          const currentStatus = unit.checks[itemKey];

                          return (
                            <React.Fragment key={uIdx}>
                              <td className="border-r border-slate-200 p-2 text-center align-middle bg-white hover:bg-emerald-50/20 transition">
                                <input
                                  type="radio"
                                  name={`check_${uIdx}_${itemKey}`}
                                  checked={currentStatus === 'OK'}
                                  onChange={() => handleCheckChange(uIdx, itemKey, 'OK')}
                                  title="✓"
                                  className="w-4 h-4 text-emerald-600 bg-gray-50 border-gray-300 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                                />
                              </td>
                              <td className="border-r border-slate-200 p-2 text-center align-middle bg-white hover:bg-rose-50/20 transition">
                                <input
                                  type="radio"
                                  name={`check_${uIdx}_${itemKey}`}
                                  checked={currentStatus === 'Bad'}
                                  onChange={() => handleCheckChange(uIdx, itemKey, 'Bad')}
                                  title="✕"
                                  className="w-4 h-4 text-rose-600 bg-gray-50 border-gray-300 focus:ring-rose-500 cursor-pointer accent-rose-600"
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

        {/* TANDA TANGAN DIGITAL DUA KOTAK (HFO & DERICKMAN) */}
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

        {/* FOOTER TOMBOL SUBMIT & EXPORT */}
        <FormSubmitFooter
          onBack={onBack}
          onSubmitFinal={handleFinalSubmit}
          onValidate={validateBeforeSubmit}
          meta={meta}
          submitting={submitting}
          isLocked={isLocked}
          isAdmin={isAdmin}
          adminEditMode={adminEditMode}
          status={status}
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
            className="bg-white rounded-2xl max-w-2xl w-full border border-slate-300 shadow-2xl overflow-hidden flex items-center flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 w-full">
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
            <div className="p-4 flex items-center justify-center bg-slate-950 min-h-[300px] max-h-[70vh] w-full overflow-auto">
              <img 
                src={zoomModal.imageSrc} 
                alt={zoomModal.title}
                className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-md"
              />
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs w-full">
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
