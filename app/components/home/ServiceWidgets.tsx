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
    <div className="bg-white/[0.03] backdrop-blur-3xl rounded-[30px] border border-white/10 p-5 flex flex-col items-center group relative overflow-hidden transition-all hover:border-cyan-500/30 shadow-xl h-[280px]">
      <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em] mb-4 w-full text-left">📍 გზამკვლევი</h4>
      <div className="grid grid-cols-2 gap-2 w-full">
        {[{ label: 'ბანკომატი', icon: '🏦', k: 'ბანკომატი' }, { label: 'სადგური', icon: '⛽', k: 'ავტოგასამართი სადგური' }, { label: 'აფთიაქი', icon: '💊', k: 'აფთიაქი' }, { label: 'სამრეცხაო', icon: '🚿', k: 'ავტოსამრეცხაო' }].map((btn) => (
          <button key={btn.label} onClick={() => onMapSearch(btn.k)} className="bg-white/5 p-4 rounded-2xl flex flex-col items-center hover:bg-cyan-500/20 transition-all border border-white/5">
            <span className="text-2xl mb-1">{btn.icon}</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-center">{btn.label}</span>
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
    <div className="bg-white/[0.03] backdrop-blur-3xl rounded-[30px] border border-white/10 p-5 flex flex-col items-center group relative overflow-hidden transition-all hover:border-cyan-500/30 shadow-xl h-80">
        <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em] mb-4 w-full text-left">🏛️ კახეთის ღირსშესანიშნაობები</h4>
        
        {/* Category filters */}
        {!loading && kakhetiPlaces.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4 w-full justify-center">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 text-xs rounded-full border transition-all ${
                selectedCategory === 'all'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                  : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
              }`}
            >
              ყველა
            </button>
            {(categories.length > 0 ? categories : ['ისტორია', 'ბუნება', 'ღვინო', 'პერსონაჟი', 'ლეგენდა']).map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 text-xs rounded-full border transition-all ${
                  selectedCategory === category
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                    : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center w-full h-32">
            <div className="text-white/60 text-sm">იტვირთება...</div>
          </div>
        ) : filteredPlaces.length > 0 ? (
          <div className="w-full h-full flex flex-col">
            {/* Main place display */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="flex flex-col space-y-4">
                {filteredPlaces[currentPlaceIndex]?.fun_fact ? (
                  <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
                    <div className="text-sm font-medium text-cyan-300 mb-2">იცოდით თუ არა?</div>
                    <div className="text-sm text-white/90 italic">
                      {filteredPlaces[currentPlaceIndex]?.fun_fact}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-white/60 text-center">
                    {filteredPlaces[currentPlaceIndex]?.title ?? 'ინფორმაცია არ არის ხელმისაწვდომი'}
                  </div>
                )}
              </div>
            </div>

            {/* Navigation dots */}
            <div className="flex justify-center space-x-2 mt-4">
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