import React from 'react';
import { BarChart3, Construction } from 'lucide-react';

export default function AdminAnalyticsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-400/30">
        <BarChart3 className="w-12 h-12 text-indigo-400" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">Analitik & Grafik HSE</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Visualisasi tren kepatuhan inspeksi, statistik temuan rusak, dan grafik per periode.
        </p>
        <div className="mt-4 inline-flex items-center space-x-2 text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 px-4 py-2 rounded-full">
          <Construction className="w-3.5 h-3.5" />
          <span>Fitur sedang dalam pengembangan</span>
        </div>
      </div>
    </div>
  );
}
