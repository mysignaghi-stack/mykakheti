"use client";

import React from 'react';
import AdminNav from '../../components/admin/AdminNav';
import AdminAgroPanel from '../AdminAgroPanel';

export default function AdminAgroPage() {
  return (
    <main className="min-h-screen bg-[#050510] p-6 md:p-10 font-sans text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-600/5 rounded-full blur-[120px] -z-10" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 bg-white/[0.03] backdrop-blur-3xl p-8 rounded-[40px] border border-white/10 shadow-2xl gap-6">
          <div>
            <h1 className="text-3xl font-black text-amber-500 uppercase italic tracking-tighter leading-none">აგრო-ბირჟა</h1>
            <p className="text-white/30 font-bold text-[10px] mt-2 uppercase tracking-[0.2em] italic">აგრო ბაზრის მართვა</p>
          </div>
          <AdminNav />
        </div>

        <div className="grid gap-8">
          <AdminAgroPanel showCategory="grape" />
        </div>
      </div>
    </main>
  );
}
