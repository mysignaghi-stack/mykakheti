'use client';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { LOCATIONS } from '../../lib/constants';

interface HeroSectionProps {
  selectedLocations: string[];
  setSelectedLocations: React.Dispatch<React.SetStateAction<string[]>>;
  isLocOpen: boolean;
  setIsLocOpen: (v: boolean) => void;
  locRef: React.RefObject<HTMLDivElement>;
}

export default function HeroSection({
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
    <div className="flex flex-col items-center text-center animate-in fade-in duration-1000 w-full relative z-[50]">
      {/* ლოკაციის არჩევა და ღილაკი */}
      <div className="w-full max-w-3xl bg-white/[0.03] backdrop-blur-2xl rounded-[24px] p-1.5 border border-white/10 shadow-xl">
        <div className="flex flex-col md:flex-row gap-2 p-1">
            <div className="md:flex-[2] relative" ref={locRef}>
              <button onClick={() => setIsLocOpen(true)} className="w-full py-3 sm:py-4 px-6 sm:px-8 flex justify-between items-center bg-white/[0.03] backdrop-blur-2xl rounded-[20px] sm:rounded-[25px] border border-white/10 hover:bg-white/[0.05] hover:border-amber-500/30 transition-all font-black text-[10px] sm:text-[11px] uppercase italic tracking-widest text-left shadow-lg">
                <span className="text-white/80">{locationLabel}</span><span className="text-amber-500/60">▼</span>
              </button>
            </div>
            <button className="md:flex-none md:px-8 py-3 sm:py-4 bg-amber-600 rounded-[20px] sm:rounded-[25px] font-black uppercase italic text-[12px] hover:bg-amber-500 hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all active:scale-95 shadow-lg border border-amber-400/20">ძიება</button>
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