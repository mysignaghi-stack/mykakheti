'use client';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { Ad } from '../../lib/types';
import { LOCATIONS } from '../../lib/constants';

interface HeroSectionProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredAds: Ad[];
  selectedLocations: string[];
  setSelectedLocations: React.Dispatch<React.SetStateAction<string[]>>;
  isLocOpen: boolean;
  setIsLocOpen: (v: boolean) => void;
  locRef: React.RefObject<HTMLDivElement>;
}

export default function HeroSection({
  searchTerm, setSearchTerm, filteredAds, 
  selectedLocations, setSelectedLocations, 
  isLocOpen, setIsLocOpen, 
  locRef
}: HeroSectionProps) {
  const [mounted, setMounted] = useState(false);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isLocOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (locRef.current && !locRef.current.contains(e.target as Node)) {
        setIsLocOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isLocOpen, locRef, setIsLocOpen]);

  const handleToggleLocation = (loc: string) => {
    if (loc === 'ყველა კახეთი') {
      setSelectedLocations(['ყველა კახეთი']);
      return;
    }

    setSelectedLocations((prev) => {
      const withoutAll = prev.filter((item) => item !== 'ყველა კახეთი');
      const exists = withoutAll.includes(loc);
      const next = exists ? withoutAll.filter((item) => item !== loc) : [...withoutAll, loc];
      return next.length === 0 ? ['ყველა კახეთი'] : next;
    });
  };

  const locationLabel = (() => {
    if (selectedLocations.includes('ყველა კახეთი')) return 'ყველა კახეთი';
    if (selectedLocations.length === 1) return selectedLocations[0];
    return `${selectedLocations.length} ლოკაცია`;
  })();

  return (
    <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in duration-1000 w-full relative z-[50]">
      {/* სათაური */}
      <div className="space-y-4 px-2">
        <p className="text-amber-500/60 font-black text-[clamp(10px,1.4vw,13px)] uppercase italic tracking-[0.2em] sm:tracking-[0.3em] text-center">
          იპოვე, გაყიდე და განავითარე საქმიანობა კახეთში
        </p>
      </div>

      {/* საძიებო ბლოკი */}
      <div className="w-full max-w-3xl bg-white/[0.03] backdrop-blur-2xl rounded-[30px] sm:rounded-[40px] p-1.5 md:p-2 border border-white/10 shadow-2xl relative group/searchBox z-[60]">
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
                          <Image src={ad.image_url} alt="" width={64} height={64} className="w-full h-full object-cover" />
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
            <div className="md:flex-[2] relative" ref={locRef}>
              <button onClick={() => setIsLocOpen(true)} className="w-full py-3 sm:py-4 px-6 sm:px-8 flex justify-between items-center bg-white/[0.03] backdrop-blur-2xl rounded-[20px] sm:rounded-[25px] border border-white/10 hover:bg-white/[0.05] hover:border-amber-500/30 transition-all font-black text-[10px] sm:text-[11px] uppercase italic tracking-widest text-left shadow-lg">
                <span className="text-white/80">{locationLabel}</span><span className="text-amber-500/60">▼</span>
              </button>
            </div>
            <button className="md:flex-none md:px-8 py-3 sm:py-4 bg-amber-600 rounded-[20px] sm:rounded-[25px] font-black uppercase italic text-[12px] hover:bg-amber-500 hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all active:scale-95 shadow-lg border border-amber-400/20">ძიება</button>
          </div>
        </div>
      </div>

      {isLocOpen && mounted && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center"
          onClick={() => setIsLocOpen(false)}
        >
          <div
            className="relative max-w-4xl w-[calc(100%-2.5rem)] bg-[#0b0b15]/90 border border-white/10 rounded-[28px] p-6 md:p-10 shadow-[0_20px_80px_rgba(0,0,0,0.6)] animate-in zoom-in-95 fade-in duration-300 max-h-[75vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-widest">ქალაქები და სოფლები</h3>
                <p className="text-white/50 text-sm mt-1">აირჩიე მდებარეობა</p>
              </div>
              <button
                type="button"
                onClick={() => setIsLocOpen(false)}
                className="text-white/40 hover:text-white transition text-sm font-black uppercase"
              >
                დახურვა ✕
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <button
                type="button"
                onClick={() => handleToggleLocation('ყველა კახეთი')}
                className={`px-4 py-3 rounded-2xl border text-xs font-black uppercase tracking-[0.2em] transition text-center ${
                  selectedLocations.includes('ყველა კახეთი')
                    ? 'border-amber-300/50 bg-amber-500/20 text-amber-200'
                    : 'border-white/10 bg-white/5 text-white/80 hover:border-white/30 hover:text-white'
                }`}
              >
                ყველა კახეთი
              </button>

              {LOCATIONS.map((municipality, idx) => {
                if (typeof municipality === 'string') {
                  return (
                    <div key={`loc-${idx}`} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      <button
                        type="button"
                        onClick={() => handleToggleLocation(municipality)}
                        className={`w-full text-left px-4 py-2 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition ${
                          selectedLocations.includes(municipality)
                            ? 'border border-amber-300/50 bg-amber-500/20 text-amber-200'
                            : 'border border-white/10 bg-white/5 text-white/80 hover:border-white/30 hover:text-white'
                        }`}
                      >
                        {municipality}
                      </button>
                    </div>
                  );
                }

                return (
                  <div key={municipality.municipality ?? idx} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-3">
                      {municipality.municipality}
                    </div>
                    <div className="space-y-4">
                      {(municipality.cities ?? []).map((city, cIdx) => {
                        if (typeof city === 'string') {
                          return (
                            <button
                              key={`${municipality.municipality}-${city}-${cIdx}`}
                              type="button"
                              onClick={() => handleToggleLocation(city)}
                              className={`w-full text-left px-4 py-2 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition ${
                                selectedLocations.includes(city)
                                  ? 'border border-amber-300/50 bg-amber-500/20 text-amber-200'
                                  : 'border border-white/10 bg-white/5 text-white/80 hover:border-white/30 hover:text-white'
                              }`}
                            >
                              {city}
                            </button>
                          );
                        }

                        return (
                          <div key={`${municipality.municipality}-${city.name}-${cIdx}`} className="space-y-2">
                            <button
                              type="button"
                              onClick={() => handleToggleLocation(city.name)}
                              className={`w-full text-left px-4 py-2 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition ${
                                selectedLocations.includes(city.name)
                                  ? 'border border-amber-300/50 bg-amber-500/20 text-amber-200'
                                  : 'border border-white/10 bg-white/5 text-white/80 hover:border-white/30 hover:text-white'
                              }`}
                            >
                              {city.name}
                            </button>
                            {Array.isArray(city.villages) && city.villages.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {city.villages.map((village) => (
                                  <button
                                    key={`${city.name}-${village}`}
                                    type="button"
                                    onClick={() => handleToggleLocation(village)}
                                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition ${
                                      selectedLocations.includes(village)
                                        ? 'border border-amber-300/50 bg-amber-500/20 text-amber-200'
                                        : 'border border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:text-white'
                                    }`}
                                  >
                                    {village}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}