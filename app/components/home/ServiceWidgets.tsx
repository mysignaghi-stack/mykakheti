"use client";

import React, { useState, useEffect } from 'react';
import { KAKHETI_FACTS } from '../../lib/constants';
import { debugError, debugLog, debugWarn } from '../../lib/debug';

type KakhetiHeritageRow = any;

type HeritageResponse = {
  places?: KakhetiHeritageRow[];
  categories?: string[];
};

const fetchKakhetiHeritage = async (signal?: AbortSignal): Promise<HeritageResponse> => {
  try {
    debugLog('kakheti-places fetch start');
    const res = await fetch('/api/kakheti-places', { cache: 'no-store', signal });
    if (!res.ok) {
      debugWarn('kakheti-places fetch non-200', res.status);
      return { places: [], categories: [] };
    }
    const data = (await res.json()) as HeritageResponse;
    debugLog('kakheti-places fetch ok', {
      places: data?.places?.length ?? 0,
      categories: data?.categories?.length ?? 0,
    });
    return { places: data.places ?? [], categories: data.categories ?? [] };
  } catch (err) {
    if ((err as { name?: string }).name !== 'AbortError') {
      debugError('kakheti-places fetch error', err);
    }
    return { places: [], categories: [] };
  }
};

const buildFallbackPlaces = (): KakhetiHeritageRow[] =>
  KAKHETI_FACTS.map((fact, index) => ({
    id: `fact-${index}`,
    fun_fact: fact,
    category: 'ისტორია',
  }));

interface ServiceWidgetsProps {
  onMapSearch: (service: string) => void;
}

export function GuideWidget({ onMapSearch }: ServiceWidgetsProps) {
  return (
    <div className="bg-white/[0.03] backdrop-blur-3xl rounded-[30px] border border-white/10 p-5 flex flex-col items-center group relative overflow-hidden transition-all hover:border-cyan-500/30 shadow-xl h-[230px]">
      <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em] mb-4 w-full text-left">📍 გზამკვლევი</h4>
      <div className="grid grid-cols-2 gap-2 w-full">
        {[{ label: 'ბანკომატი', icon: '🏦', k: 'ბანკომატი' }, { label: 'სადგური', icon: '⛽', k: 'ავტოგასამართი სადგური' }, { label: 'აფთიაქი', icon: '💊', k: 'აფთიაქი' }, { label: 'სამრეცხაო', icon: '🚿', k: 'ავტოსამრეცხაო' }].map((btn) => (
          <button key={btn.label} onClick={() => onMapSearch(btn.k)} className="bg-white/5 p-3 rounded-2xl flex flex-col items-center hover:bg-cyan-500/20 transition-all border border-white/5">
            <span className="text-xl mb-1">{btn.icon}</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-center whitespace-nowrap truncate w-full">{btn.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function HeritageWidget() {
  const [kakhetiPlaces, setKakhetiPlaces] = useState<KakhetiHeritageRow[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPlaceIndex, setCurrentPlaceIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeDetail, setActiveDetail] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlaces = async () => {
      setLoading(true);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      try {
        const data = await fetchKakhetiHeritage(controller.signal);
        console.log('Fetched heritage data:', data?.places?.length || 0, 'items');
        const places = data?.places ?? [];
        if (places.length === 0) {
          setKakhetiPlaces(buildFallbackPlaces());
          setCategories(['ისტორია']);
        } else {
          setKakhetiPlaces(places);
          setCategories(data?.categories ?? []);
        }
      } finally {
        clearTimeout(timeout);
        setLoading(false);
      }
    };

    fetchPlaces();

    return () => undefined;
  }, []);

  const filteredPlaces = selectedCategory === 'all'
    ? kakhetiPlaces
    : kakhetiPlaces.filter(place => place.category === selectedCategory);

  const currentDetail = filteredPlaces[currentPlaceIndex]?.fun_fact || filteredPlaces[currentPlaceIndex]?.title || '';

  useEffect(() => {
    setCurrentPlaceIndex(0);
  }, [selectedCategory]);

  useEffect(() => {
    if (filteredPlaces.length > 0) {
      const interval = setInterval(() => {
        setCurrentPlaceIndex((prev) => (prev + 1) % filteredPlaces.length);
      }, 8000);

      return () => clearInterval(interval);
    }
  }, [filteredPlaces.length]);

  return (
    <div className="bg-white/[0.03] backdrop-blur-3xl rounded-[30px] border border-white/10 p-4 flex flex-col items-center group relative overflow-hidden transition-all hover:border-cyan-500/30 shadow-xl h-[230px]">
        <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em] mb-4 w-full text-left">🏛️ კახეთის ღირსშესანიშნაობები</h4>
        
        {/* Category filters removed */}

        {loading ? (
          <div className="flex items-center justify-center w-full flex-1">
            <div className="text-white/60 text-sm">იტვირთება...</div>
          </div>
        ) : filteredPlaces.length > 0 ? (
          <div className="w-full flex-1 flex flex-col min-h-0">
            {/* Main place display */}
            <div className="flex-1 flex flex-col justify-center min-h-0">
              <div className="flex flex-col space-y-3">
                {filteredPlaces[currentPlaceIndex]?.fun_fact ? (
                  <button
                    type="button"
                    onClick={() => setActiveDetail(currentDetail)}
                    className="text-left bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 hover:border-cyan-400/40 transition"
                  >
                    <div className="text-[11px] font-medium text-cyan-300 mb-1">იცოდით თუ არა?</div>
                    <div className="text-[11px] text-white/90 italic line-clamp-3">
                      {filteredPlaces[currentPlaceIndex]?.fun_fact}
                    </div>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveDetail(currentDetail)}
                    className="text-[11px] text-white/60 text-center line-clamp-2 hover:text-white transition"
                  >
                    {filteredPlaces[currentPlaceIndex]?.title ?? 'ინფორმაცია არ არის ხელმისაწვდომი'}
                  </button>
                )}
              </div>
            </div>

            {/* Navigation dots */}
            <div className="flex justify-center space-x-1.5 mt-2">
              {filteredPlaces.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPlaceIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentPlaceIndex
                      ? 'bg-cyan-400 scale-125'
                      : 'bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center w-full h-32">
            <div className="text-white/60 text-sm">
              {selectedCategory === 'all' ? 'ინფორმაცია არ მოიძებნა' : `არ მოიძებნა ${selectedCategory} კატეგორიაში`}
            </div>
          </div>
        )}

        {activeDetail && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl border border-cyan-500/30 bg-[#0b0b15]/95 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-300">სრული ტექსტი</span>
                <button
                  type="button"
                  onClick={() => setActiveDetail(null)}
                  className="text-white/50 hover:text-white text-xs font-black"
                >
                  ✕
                </button>
              </div>
              <p className="text-[12px] text-white/90 leading-relaxed">{activeDetail}</p>
            </div>
          </div>
        )}
      </div>
  );
}

export default function ServiceWidgets({ onMapSearch }: ServiceWidgetsProps) {
  return (
    <div className="grid grid-cols-1 gap-5 w-full relative z-0 text-left">
      <GuideWidget onMapSearch={onMapSearch} />
      <HeritageWidget />
    </div>
  );
}