'use client';
import React from 'react';
import { AgroItem } from '../../lib/types';

interface ServiceWidgetsProps {
  agroData: AgroItem[];
  isAdmin: boolean;
  onEditAgro: (item: AgroItem) => void;
  onSelectAgro: (item: AgroItem) => void;
  onMapSearch: (service: string) => void;
}

export default function ServiceWidgets({ agroData, isAdmin, onEditAgro, onSelectAgro, onMapSearch }: ServiceWidgetsProps) {
  
  // 👇 მთავარი ცვლილება GRID-ში:
  // grid-cols-1 (მობილური) -> 1 სვეტი
  // md:grid-cols-2 (პლანშეტი) -> 2 სვეტი (როცა სიგანე იძლევა საშუალებას)
  // lg:grid-cols-3 (პატარა ლეპტოპი) -> 3 სვეტი (სანამ "სენდვიჩი" ჩაირთვება)
  // xl:grid-cols-1 (დიდი ეკრანი/სენდვიჩი) -> ისევ 1 სვეტი (რადგან შუაში ვიწროვდება)
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-1 gap-5 w-full relative z-0 text-left">
      
      {/* 🍇 აგრო-ბირჟა */}
      <div className="bg-white/[0.03] backdrop-blur-3xl rounded-[30px] border border-white/10 p-5 flex flex-col items-center group relative overflow-hidden transition-all hover:border-purple-500/30 shadow-xl h-full">
        <div className="flex justify-between w-full items-center mb-4">
          <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.4em]">🍇 აგრო-ბირჟა</h4>
          {isAdmin && <span className="text-[9px] bg-red-500/20 text-red-400 px-2 py-1 rounded">Edit</span>}
        </div>
        <p className="w-full text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] mb-3 leading-tight">საორიენტაციო ფასები · დააჭირე პროდუქტს რომ ნახო მიმღები ობიექტები</p>
        <div className="w-full space-y-2">
          {agroData.filter(i => i.category === 'grape').map(item => (
            <button key={item.id} onClick={() => isAdmin ? onEditAgro(item) : onSelectAgro(item)} className={`w-full flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5 transition-all group/item hover:bg-white/5 ${isAdmin ? 'hover:border-amber-500' : ''}`}>
              <span className="text-xs font-black uppercase text-purple-300 flex gap-2">{item.name} {isAdmin && '✏️'}</span>
              <span className="text-sm font-black italic">{item.price}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 🌾 მარცვლეული */}
      <div className="bg-white/[0.03] backdrop-blur-3xl rounded-[30px] border border-white/10 p-5 flex flex-col items-center group relative overflow-hidden transition-all hover:border-yellow-500/30 shadow-xl h-full">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 to-transparent opacity-30" />
        <h4 className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.4em] mb-4 w-full text-left">🌾 მარცვლეული</h4>
        <p className="w-full text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] mb-3 leading-tight">საორიენტაციო ფასები · დააჭირე პროდუქტს რომ ნახო მიმღები ობიექტები</p>
        <div className="w-full space-y-2">
          {agroData.filter(i => i.category === 'grain').map(item => (
            <button key={item.id} onClick={() => isAdmin ? onEditAgro(item) : onSelectAgro(item)} className={`w-full flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5 transition-all group/item hover:bg-white/5 ${isAdmin ? 'hover:border-amber-500' : ''}`}>
              <span className="text-xs font-black uppercase text-yellow-500 flex gap-2">{item.name} {isAdmin && '✏️'}</span>
              <span className="text-sm font-black italic">{item.price}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 📍 გზამკვლევი */}
      {/* sm:col-span-2 -> პლანშეტზე მთლიან სიგანეზე გაიშალოს */}
      {/* lg:col-span-1 -> ლეპტოპზე 1 სვეტში ჩაჯდეს */}
      {/* xl:col-span-1 -> სენდვიჩშიც 1 სვეტში */}
      <div className="bg-white/[0.03] backdrop-blur-3xl rounded-[30px] border border-white/10 p-5 flex flex-col items-center group relative overflow-hidden transition-all hover:border-cyan-500/30 shadow-xl sm:col-span-2 lg:col-span-1 xl:col-span-1 h-full">
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