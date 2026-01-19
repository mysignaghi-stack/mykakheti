'use client';
import React from 'react';

interface ServiceWidgetsProps {
  onMapSearch: (service: string) => void;
}

export default function ServiceWidgets({ onMapSearch }: ServiceWidgetsProps) {
  
  // 👇 მთავარი ცვლილება GRID-ში:
  // grid-cols-1 (მობილური) -> 1 სვეტი
  // md:grid-cols-2 (პლანშეტი) -> 2 სვეტი (როცა სიგანე იძლევა საშუალებას)
  // lg:grid-cols-3 (პატარა ლეპტოპი) -> 3 სვეტი (სანამ "სენდვიჩი" ჩაირთვება)
  // xl:grid-cols-1 (დიდი ეკრანი/სენდვიჩი) -> ისევ 1 სვეტი (რადგან შუაში ვიწროვდება)
  
  return (
    <div className="grid grid-cols-1 gap-5 w-full relative z-0 text-left">
      
      {/* 📍 გზამკვლევი */}
      <div className="bg-white/[0.03] backdrop-blur-3xl rounded-[30px] border border-white/10 p-5 flex flex-col items-center group relative overflow-hidden transition-all hover:border-cyan-500/30 shadow-xl h-full">
        <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em] mb-4 w-full text-left">📍 გზამკვლევი</h4>
        <div className="grid grid-cols-2 gap-2 w-full">
          {[{ label: 'ბანკომატი', icon: '🏦', k: 'ბანკომატი' }, { label: 'სადგური', icon: '⛽', k: 'ავტოგასამართი სადგური' }, { label: 'აფთიაქი', icon: '💊', k: 'აფთიაქი' }, { label: 'სამრეცხაო', icon: '🚿', k: 'ავტოსამრეცხაო' }].map((btn) => (
            <button key={btn.label} onClick={() => onMapSearch(btn.k)} className="bg-white/5 p-3 rounded-2xl flex flex-col items-center hover:bg-cyan-500/20 transition-all border border-white/5">
              <span className="text-xl mb-1">{btn.icon}</span>
              <span className="text-[9px] font-black uppercase tracking-widest text-center">{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* სათემო ბლოკი გადატანილია ჰედერში */}
    </div>
  );
}