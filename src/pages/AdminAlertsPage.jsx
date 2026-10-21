import React from 'react';
import { AlertTriangle, Construction } from 'lucide-react';

export default function AdminAlertsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-400/30">
        <AlertTriangle className="w-12 h-12 text-amber-400" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">Alert Temuan Rusak</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Halaman ini akan menampilkan notifikasi item rusak / bermasalah dari seluruh Rig.
        </p>
        <div className="mt-4 inline-flex items-center space-x-2 text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-4 py-2 rounded-full">
          <Construction className="w-3.5 h-3.5" />
          <span>Fitur sedang dalam pengembangan</span>
        </div>
      </div>
    </div>
  );
}
