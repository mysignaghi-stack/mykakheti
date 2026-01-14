'use client';
import React, { useEffect } from 'react';
import Link from 'next/link';
import { Ad } from '../../lib/types';
import { LOCATIONS } from '../../lib/constants';

interface HeroSectionProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredAds: Ad[];
  selectedLocation: string;
  setSelectedLocation: (loc: string) => void;
  isLocOpen: boolean;
  setIsLocOpen: (v: boolean) => void;
  onMapSearch: (service: string) => void;
  locRef: React.RefObject<HTMLDivElement>;
}

export default function HeroSection({
  searchTerm, setSearchTerm, filteredAds, 
  selectedLocation, setSelectedLocation, 
  isLocOpen, setIsLocOpen, 
  onMapSearch, locRef
}: HeroSectionProps) {
  
  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isLocOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (locRef.current && !locRef.current.contains(e.target as Node)) {
        setIsLocOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isLocOpen, locRef, setIsLocOpen]);

  // Flatten locations for dropdown (municipality/city/village names)
  const flatLocations: string[] = React.useMemo(() => {
    const result: string[] = ['ყველა კახეთი'];
    LOCATIONS.forEach(m => {
      if (typeof m === 'string') {
        result.push(m);
      } else if (m.municipality) {
        result.push(String(m.municipality));
        if (Array.isArray(m.cities)) {
          m.cities.forEach(city => {
            if (typeof city === 'string') {
              result.push(city);
            } else if (city.name) {
              result.push(String(city.name));
              if (Array.isArray(city.villages)) {
                city.villages.forEach(v => result.push(String(v)));
              }
            }
          });
        }
      }
    });
    return result;
  }, []);

  return (
    <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in duration-1000 w-full relative z-[50]">
      {/* სათაური */}
      <div className="space-y-4 px-2">
        <h1 className="text-[26px] sm:text-[36px] md:text-[48px] font-black uppercase italic tracking-tighter leading-tight drop-shadow-2xl text-center">
          კახეთის ერთიანი ციფრული პლატფორმა
        </h1>
        <p className="text-amber-500/60 font-black text-[10px] md:text-[13px] uppercase italic tracking-[0.2em] sm:tracking-[0.3em] text-center">
          იპოვე, გაყიდე და განავითარე საქმიანობა კახეთში
        </p>
      </div>

      {/* საძიებო ბლოკი */}
      <div className="w-full bg-white/[0.03] backdrop-blur-2xl rounded-[30px] sm:rounded-[40px] p-1.5 md:p-2 border border-white/10 shadow-2xl relative group/searchBox z-[60]">
        <div className="flex flex-col gap-2">
          {/* Input */}
          <div className="flex items-center px-4 sm:px-6 py-2 border-b border-white/5 text-left">
            <span className="text-xl sm:text-2xl mr-3 sm:mr-4 opacity-100 group-hover/searchBox:scale-110 transition-all duration-300 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">🔍</span>
            <input 
              type="text" 
              placeholder="რას ეძებთ კახეთში?" 
              className="w-full py-3 sm:py-4 outline-none font-black text-md sm:text-lg italic uppercase bg-transparent placeholder:text-white/10" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
          </div>

          {/* ძიების შედეგები (Dropdown) */}
          {searchTerm && (
            <div className="absolute top-full left-0 right-0 mt-4 p-4 bg-[#0a0a1f]/95 backdrop-blur-3xl border border-white/10 rounded-[35px] shadow-[0_30px_90px_rgba(0,0,0,0.9)] max-h-[500px] overflow-y-auto z-[200] animate-in zoom-in-95 duration-200">
              <div className="flex flex-col gap-3 text-white text-left">
                <div className="flex justify-between items-center px-4 mb-2">
                  <span className="text-[10px] font-black uppercase text-white/30 tracking-widest italic">ნაპოვნია {filteredAds.length} შედეგი</span>
                  <button onClick={() => setSearchTerm('')} className="text-[10px] font-black uppercase text-amber-500 hover:text-white transition-colors">✕ დახურვა</button>
                </div>
                {filteredAds.length > 0 ? (
                  filteredAds.map((ad) => (
                    <Link key={ad.id} href={`/announcements/${ad.id}`} className="flex items-center gap-4 p-3 bg-white/5 rounded-[22px] border border-white/5 hover:border-amber-500/30 transition-all group/item">
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                        {ad.image_url ? (
                          <img src={ad.image_url} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full bg-slate-800 flex items-center justify-center p-2 text-center border border-white/5">
                            <span className="text-[7px] font-black uppercase text-white/40 line-clamp-3 leading-tight">{ad.title}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-grow text-left">
                        <h4 className="text-[13px] font-black uppercase italic group-hover/item:text-amber-500 transition-colors line-clamp-1">{ad.title}</h4>
                        <div className="flex gap-3 items-center mt-1">
                          <span className="text-amber-500 font-black text-sm italic">{ad.price} {ad.currency === 'USD' ? '$' : '₾'}</span>
                          <span className="text-[8px] font-black text-white/20 uppercase italic tracking-widest">{ad.location}</span>
                        </div>
                      </div>
                      <span className="text-xl group-hover/item:translate-x-1 transition-transform opacity-30">➔</span>
                    </Link>
                  ))
                ) : (
                  <div className="py-10 opacity-20 italic font-black uppercase text-sm tracking-widest text-center">შედეგი ვერ მოიძებნა</div>
                )}
              </div>
            </div>
          )}

          {/* ლოკაციის არჩევა და ღილაკი */}
          <div className="flex flex-col md:flex-row gap-2 p-1">
            <div className="flex-grow relative" ref={locRef}>
              <button onClick={() => setIsLocOpen(!isLocOpen)} className="w-full py-3 sm:py-4 px-6 sm:px-8 flex justify-between items-center bg-white/[0.03] backdrop-blur-2xl rounded-[20px] sm:rounded-[25px] border border-white/10 hover:bg-white/[0.05] hover:border-amber-500/30 transition-all font-black text-[10px] sm:text-[11px] uppercase italic tracking-widest text-left shadow-lg">
                <span className="text-white/80">{selectedLocation}</span><span className={`transition-transform duration-300 text-amber-500/60 ${isLocOpen ? 'rotate-180' : ''}`}>▼</span>
              </button>
              
              {/* 👇 ლოკაციების ჩამოსაშლელი */}
              {isLocOpen && (
                <div className="absolute top-full left-0 right-0 mt-3 p-3 sm:p-4 bg-[#0a0a1f]/95 backdrop-blur-3xl border border-white/10 rounded-[25px] sm:rounded-[35px] shadow-[0_30px_90px_rgba(0,0,0,0.9)] z-[5000] animate-in zoom-in-95 duration-200">
                  <div className="grid grid-cols-1 gap-1 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                    {flatLocations.map((l, index) => (
                      <button key={l + '-' + index} onClick={() => { setSelectedLocation(l); setIsLocOpen(false); }} className={`w-full text-left py-3 px-6 rounded-xl sm:rounded-2xl font-black text-[10px] uppercase italic transition-all ${selectedLocation === l ? 'bg-amber-600 shadow-lg' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}>{l}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button className="px-12 py-3 sm:py-4 bg-amber-600 rounded-[20px] sm:rounded-[25px] font-black uppercase italic text-[12px] hover:bg-amber-500 hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all active:scale-95 shadow-lg border border-amber-400/20">ძიება</button>
          </div>
        </div>
      </div>
    </div>
  );
}