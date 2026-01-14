'use client';
import React from 'react';
// 👇 შესწორებულია: ../../
import { WeatherItem } from '../../lib/types';

interface RightSidebarProps {
  weatherData: WeatherItem[];
  seasonal: { tag: string; text: string; icon: string };
  fact: string;
  onShowTransport: () => void;
}

export default function RightSidebar({ weatherData, seasonal, fact, onShowTransport }: RightSidebarProps) {
  return (
    <div className="bg-slate-950/60 backdrop-blur-3xl rounded-[40px] border border-amber-500/20 overflow-hidden flex flex-col h-[550px] shadow-2xl relative">
      <div className="absolute top-0 right-0 w-full h-1 bg-amber-600/50" />
      <div className="flex-grow overflow-y-auto p-7 space-y-7 custom-scrollbar text-left">
        <section>
          <h3 className="font-black uppercase italic text-xs tracking-widest mb-6 border-b border-white/10 pb-4">სასარგებლო ჰაბი 🛠️</h3>
          <h4 className="text-amber-500 font-black uppercase italic text-[10px] tracking-widest mb-3">🚨 ცხელი ხაზი</h4>
          <ul className="space-y-2.5 text-[11px] font-bold italic text-left">
            <li className="flex justify-between border-b border-white/5 pb-1">პოლიცია / სასწრაფო: <span className="text-amber-400">112</span></li>
            <li className="flex justify-between border-b border-white/5 pb-1">სახანძრო: <span className="text-amber-400">112</span></li>
            <li className="flex justify-between border-b border-white/5 pb-1">ენერგო-პრო: <span className="text-white/60">032 2 47 17 07</span></li>
            <li className="flex justify-between border-b border-white/5 pb-1">სოკარ გაზი: <span className="text-white/60">16 114</span></li>
            <li className="flex justify-between">წყალმომარაგება: <span className="text-white/60">1494</span></li>
          </ul>
        </section>

        <section className="p-6 bg-white/5 rounded-3xl border border-white/5 mt-4">
          <h4 className="text-amber-500 font-black uppercase italic text-[10px] tracking-widest mb-4 text-left">🚌 ტრანსპორტი</h4>
          <button onClick={onShowTransport} className="w-full py-3 bg-amber-600/20 border border-amber-500/50 rounded-xl text-[11px] font-bold text-white hover:bg-amber-600 transition-all flex items-center justify-center gap-2">
            <span>განრიგის ნახვა</span>
            <span className="text-lg">📅</span>
          </button>
        </section>

        <div className="p-6 bg-white/5 rounded-3xl border border-white/5 text-left mt-4">
          <h4 className="text-amber-500 font-black uppercase italic text-[10px] tracking-widest mb-2 text-left">💡 სეზონური რჩევა</h4>
          <p className="text-[13px] text-white/90 italic leading-relaxed text-left">{seasonal.text}</p>
        </div>

        <section className="p-6 bg-white/5 rounded-3xl border border-white/5 mt-4">
          <h4 className="text-amber-500 font-black uppercase italic text-[10px] tracking-widest mb-4 text-left">⛅ ამინდი კახეთში</h4>
          <div className="grid grid-cols-2 gap-3">
            {weatherData.map(w => (
              <div key={w.name} className="flex flex-col items-center bg-black/20 p-3 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-all">
                <span className="text-[8px] font-black text-white/40 uppercase mb-1">{w.name}</span>
                <span className="text-2xl mb-1">{w.icon}</span>
                <span className="text-[11px] font-black text-amber-500 italic">{w.temp}°</span>
              </div>
            ))}
          </div>
        </section>

        <section className="text-left px-1 mt-4">
          <h4 className="text-amber-500 font-black uppercase italic text-[10px] tracking-widest mb-2 text-left">📊 რეგიონი</h4>
          <p className="text-[12px] text-white/40 italic leading-relaxed animate-in fade-in duration-1000 text-left">{fact}</p>
        </section>
      </div>
    </div>
  );
}