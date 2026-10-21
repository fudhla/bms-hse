import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { exportToPdf, exportToExcel } from '../utils/exportUtils';
import { API_BASE_URL } from '../constants/periodConstants';

/**
 * useInspectionForm
 * ─────────────────────────────────────────────────────────────────────────────
 * Hook utama untuk:
 *  - Memuat data inspeksi dari MySQL (submitted atau draft) berdasarkan rigNo + bulan + tahun
 *  - Role-Based Access Control (RBAC):
 *      - User Rig: Terkunci (read-only) jika status = 'submitted'
 *      - Admin: Memiliki hak istimewa untuk mengedit & memperbarui form yang sudah 'submitted'
 *  - Auto-save debounced 1.2 detik (untuk draft maupun admin edit)
 *  - Final submit & Update Data (Admin)
 *  - Export PDF / Excel
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function useInspectionForm({
  formId,
  formType,
  formCode,
  rigNo,
  meta,
  setMeta,
  items,
  setItems,
  extraPayload = {},
  overrideRigNo = null,
  viewMonth = null,
  viewYear = null,
}) {
  const { user, token } = useAuth();
  const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('bms_token') : null);
  const isAdmin = user?.role === 'admin' || user?.username === 'admin_besmindo';

  const [recordId, setRecordId]         = useState(null);
  const [status, setStatus]             = useState('draft'); // 'draft' | 'submitted'
  const [isLocked, setIsLocked]         = useState(false);
  const [adminEditMode, setAdminEditMode] = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [saveState, setSaveState]       = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [message, setMessage]           = useState({ type: '', text: '' });
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [initialData, setInitialData]   = useState(null);

  const debounceTimerRef = useRef(null);
  const isFirstRender    = useRef(true);

  // RigNo efektif: prioritas URL param > prop rigNo dari form
  const effectiveRigNo = overrideRigNo || rigNo;

  // Periode efektif
  const now            = new Date();
  const effectiveMonth = viewMonth || (now.getMonth() + 1);
  const effectiveYear  = viewYear  || now.getFullYear();

  // ─── 1. Muat data dari MySQL saat form dibuka ───────────────────────────────
  useEffect(() => {
    let isMounted = true;

    async function loadLatestInspection() {
      if (!effectiveRigNo) return;
      try {
        const url = `${API_BASE_URL}/api/inspections/latest`
          + `?rig_no=${encodeURIComponent(effectiveRigNo)}`
          + `&form_id=${formId}`
          + `&month=${effectiveMonth}`
          + `&year=${effectiveYear}`;

        const res    = await fetch(url, {
          headers: {
            ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
          }
        });
        const result = await res.json();

        if (isMounted && result.success && result.data) {
          const row   = result.data;
          setInitialData(row);
          const isSub = row.status === 'submitted';

          setRecordId(row.id);
          setStatus(row.status || 'draft');

          // RBAC Logic: Jika submitted, terkunci HANYA untuk User biasa (bukan Admin)
          if (isSub) {
            if (isAdmin) {
              setIsLocked(false);
              setAdminEditMode(true);
            } else {
              setIsLocked(true);
              setAdminEditMode(false);
            }
          } else {
            setIsLocked(false);
            setAdminEditMode(false);
          }

          // ── Restore meta ────────────────────────────────────────────────────
          if (row.form_data?.meta) {
            const savedMeta = row.form_data.meta;
            const hfo = savedMeta.inspectedBy || savedMeta.hfoName || savedMeta.hfo_name || row.hfo_name || '';
            const tp = savedMeta.acknowledgedBy || savedMeta.toolPusherName || savedMeta.tool_pusher_name || row.tool_pusher_name || '';
            setMeta(prev => ({
              ...prev,
              ...savedMeta,
              inspectedBy: hfo,
              acknowledgedBy: tp,
              hfoName: hfo,
              toolPusherName: tp,
              rigNo: effectiveRigNo || prev.rigNo,
            }));
          } else if (row.tanggal) {
            const hfo = row.hfo_name || '';
            const tp = row.tool_pusher_name || '';
            setMeta(prev => ({
              ...prev,
              tanggal:        row.tanggal            || prev.tanggal,
              lokasi:         row.lokasi             || prev.lokasi,
              statusRig:      row.status_rig         || prev.statusRig,
              rekomendasi:    row.rekomendasi        || prev.rekomendasi,
              hfoName:        hfo,
              toolPusherName: tp,
              inspectedBy:    hfo,
              acknowledgedBy: tp,
              rigNo:          effectiveRigNo         || prev.rigNo,
            }));
          }

          // ── Restore items ───────────────────────────────────────────────────
          const savedItems =
            row.form_data?.items ||
            row.form_data?.units_data ||
            row.form_data?.karyawan_data ||
            row.form_data?.rows;

          if (savedItems && Array.isArray(savedItems) && savedItems.length > 0) {
            setItems(savedItems);
          }

          // ── Pesan status ────────────────────────────────────────────────────
          if (isSub) {
            if (isAdmin) {
              setMessage({
                type: 'info',
                text: `👑 Mode Edit Admin Aktif: Data Rig ${effectiveRigNo} (${effectiveMonth}/${effectiveYear}) berstatus Submitted. Anda dapat mengubah dan menyimpan pembaruan kapan saja.`,
              });
            } else {
              setMessage({
                type: 'success',
                text: `✓ Formulir Rig ${effectiveRigNo} periode ${effectiveMonth}/${effectiveYear} telah disubmit & terkunci (Read-Only).`,
              });
            }
          } else {
            setMessage({
              type: 'info',
              text: 'Draft tersimpan sebelumnya otomatis dimuat kembali.',
            });
          }
        }
      } catch (err) {
        console.error('Error loading inspection:', err);
      } finally {
        if (isMounted) setInitialLoaded(true);
      }
    }

    // Reset state saat rig/periode berubah (misal Admin buka rig berbeda)
    setInitialLoaded(false);
    setRecordId(null);
    setStatus('draft');
    setIsLocked(false);
    setAdminEditMode(false);
    setMessage({ type: '', text: '' });
    isFirstRender.current = true;

    loadLatestInspection();
    return () => { isMounted = false; };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveRigNo, formId, effectiveMonth, effectiveYear, isAdmin]);

  // ─── 2. Simpan ke Backend ───────────────────────────────────────────────────
  const saveToBackend = useCallback(async (customStatus = 'draft') => {
    // Jika User biasa terkunci, jangan simpan
    if (isLocked && !isAdmin) return;

    try {
      if (customStatus === 'submitted' || adminEditMode) {
        setSubmitting(true);
      } else {
        setSaveState('saving');
      }

      // Tentukan status yang dikirim: jika admin mengedit submitted form, status tetap 'submitted'
      const statusToSend = (status === 'submitted' || customStatus === 'submitted') ? 'submitted' : customStatus;
      const hfo = meta.hfoName || meta.inspectedBy || meta.hfo_name || '';
      const tp = meta.toolPusherName || meta.acknowledgedBy || meta.tool_pusher_name || '';

      const payload = {
        id:               recordId,
        form_type:        formType,
        form_code:        formCode,
        rig_no:           effectiveRigNo || meta.rigNo || rigNo,
        tanggal:          meta.tanggal || meta.inspectionDate || new Date().toISOString().split('T')[0],
        lokasi:           meta.lokasi           || '',
        status_rig:       meta.statusRig        || '',
        rekomendasi:      meta.rekomendasi || meta.remarks || '',
        hfo_name:         hfo,
        tool_pusher_name: tp,
        status:           statusToSend,
        user_role:        user?.role || (isAdmin ? 'admin' : 'karyawan'),
        updated_by:       user?.username || (isAdmin ? 'admin_besmindo' : 'karyawan'),
        meta: {
          ...meta,
          inspectedBy:    hfo,
          acknowledgedBy: tp,
          hfoName:        hfo,
          toolPusherName: tp
        },
        items,
        ...extraPayload,
      };

      const res  = await fetch(`${API_BASE_URL}/api/inspections`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.success) throw new Error(data.message || 'Gagal menyimpan ke server');

      if (data.id) setRecordId(data.id);

      if (customStatus === 'submitted' || (isAdmin && status === 'submitted')) {
        setStatus('submitted');
        if (isAdmin) {
          setIsLocked(false);
          setAdminEditMode(true);
          setMessage({
            type: 'success',
            text: '✓ Pembaruan data inspeksi berhasil disimpan oleh Admin ke database MySQL!',
          });
        } else {
          setIsLocked(true);
          setAdminEditMode(false);
          setMessage({
            type: 'success',
            text: '✓ Inspeksi berhasil disimpan final dan resmi terkirim ke Admin!',
          });
        }
      } else {
        setSaveState('saved');
      }
      return true;
    } catch (err) {
      console.error('Save error:', err);
      if (customStatus === 'submitted' || adminEditMode) {
        setMessage({ type: 'error', text: 'Gagal menyimpan pembaruan: ' + err.message });
      } else {
        setSaveState('error');
      }
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [recordId, isLocked, isAdmin, adminEditMode, status, formType, formCode, effectiveRigNo, rigNo, meta, items, extraPayload, user, authToken]);

  // ─── 3. Debounced Auto-Save ─────────────────────────────────────────────────
  useEffect(() => {
    if (!initialLoaded) return;
    if (isLocked && !isAdmin) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setSaveState('saving');
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      saveToBackend(status === 'submitted' ? 'submitted' : 'draft');
    }, 1200);

    return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current); };
  }, [meta, items, initialLoaded, isLocked, isAdmin, status, saveToBackend]);

  // ─── 4. Pre-submit Validation Helper (Global) ───────────────────────────────
  const validateBeforeSubmit = useCallback(() => {
    // 1. Validasi Tanggal Inspeksi
    const tgl = meta?.tanggal || meta?.inspectionDate || meta?.period;
    const isTanggalValid = tgl && String(tgl).trim().length >= 4;

    // 2. Validasi Safety Officer / HFO / Inspector
    const safetyOfficer = 
      meta?.hfo_name ||
      meta?.hfoName ||
      meta?.inspectedBy ||
      meta?.inspectedByName ||
      meta?.hesOfficerName ||
      meta?.hesFieldOfficer ||
      meta?.wsrName ||
      meta?.derrickmanName ||
      meta?.signatures?.hfo?.name ||
      meta?.signatures?.wfo?.name ||
      meta?.signatures?.user?.name;
    const isSafetyOfficerValid = safetyOfficer && String(safetyOfficer).trim().length > 0;

    // 3. Validasi Tool Pusher / Supervisor
    const toolPusher = 
      meta?.tool_pusher_name ||
      meta?.toolPusherName ||
      meta?.toolPusher ||
      meta?.acknowledgedBy ||
      meta?.acknowledgedByName ||
      meta?.hesCoordinatorName ||
      meta?.signatures?.toolpush?.name;
    const isToolPusherValid = toolPusher && String(toolPusher).trim().length > 0;

    if (!isTanggalValid || !isSafetyOfficerValid || !isToolPusherValid) {
      const errorMsg = 'Gagal: Harap lengkapi Tanggal Inspeksi dan Nama Penanggung Jawab (HSE/Tool Pusher) sebelum mengunci laporan.';
      setMessage({
        type: 'error',
        text: errorMsg
      });
      return {
        isValid: false,
        message: errorMsg,
        missing: {
          tanggal: !isTanggalValid,
          safetyOfficer: !isSafetyOfficerValid,
          toolPusher: !isToolPusherValid
        }
      };
    }

    return { isValid: true };
  }, [meta]);

  // ─── 5. Final Submit / Update Perubahan Admin ───────────────────────────────
  const handleFinalSubmit = useCallback(async () => {
    const check = validateBeforeSubmit();
    if (!check.isValid) return false;
    return await saveToBackend('submitted');
  }, [validateBeforeSubmit, saveToBackend]);

  // ─── 6. Export ──────────────────────────────────────────────────────────────
  const buildExportPayload = useCallback(() => ({
    form_id:          formId,
    formId:           formId,
    form_type:        formType,
    form_code:        formCode,
    rig_no:           effectiveRigNo || meta.rigNo || rigNo,
    tanggal:          meta.tanggal || meta.inspectionDate,
    lokasi:           meta.lokasi,
    status_rig:       meta.statusRig,
    rekomendasi:      meta.rekomendasi || meta.remarks,
    hfo_name:         meta.hfoName || meta.inspectedBy || meta.wsrName,
    derrickman_name:  meta.derrickmanName || meta.userName,
    tool_pusher_name: meta.toolPusherName || meta.acknowledgedBy,
    signatures:       meta.signatures,
    meta,
    items,
    ...extraPayload,
  }), [formId, formType, formCode, effectiveRigNo, rigNo, meta, items, extraPayload]);

  const handleExportPdf   = useCallback(async () => {
    try {
      await exportToPdf(buildExportPayload());
    } catch (err) {
      console.error('Error during PDF export:', err);
    }
  }, [buildExportPayload]);

  const handleExportExcel = useCallback(async () => {
    try {
      await exportToExcel(buildExportPayload());
    } catch (err) {
      console.error('Error during Excel export:', err);
    }
  }, [buildExportPayload]);

  return {
    recordId,
    status,
    isLocked,
    isAdmin,
    adminEditMode,
    submitting,
    saveState,
    message,
    setMessage,
    effectiveRigNo,
    validateBeforeSubmit,
    handleFinalSubmit,
    handleExportPdf,
    handleExportExcel,
    buildExportPayload,
    saveDraftImmediately: () => saveToBackend(status === 'submitted' ? 'submitted' : 'draft'),
    initialData,
    initialLoaded,
  };
}
