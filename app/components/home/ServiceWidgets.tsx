'use client';
import React, { useState, useEffect } from 'react';

interface ServiceWidgetsProps {
  onMapSearch: (service: string) => void;
}

interface KakhetiPlace {
  name: string;
  title: string;
  description: string;
  fun_fact?: string;
  category?: string;
  location_name?: string;
  thumbnail?: string;
}

export default function ServiceWidgets({ onMapSearch }: ServiceWidgetsProps) {
  const [kakhetiPlaces, setKakhetiPlaces] = useState<KakhetiPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPlaceIndex, setCurrentPlaceIndex] = useState(0);
  
  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const response = await fetch('/api/kakheti-places');
        const data = await response.json();
        setKakhetiPlaces(data.places || []);
      } catch (error) {
        console.error('Error fetching Kakheti places:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaces();
  }, []);

  // Auto-rotate places every 8 seconds
  useEffect(() => {
    if (kakhetiPlaces.length > 0) {
      const interval = setInterval(() => {
        setCurrentPlaceIndex((prev) => (prev + 1) % kakhetiPlaces.length);
      }, 8000);

      return () => clearInterval(interval);
    }
  }, [kakhetiPlaces.length]);

  const getPlaceIcon = (place: KakhetiPlace, index: number) => {
    const categoryIcons: Record<string, string> = {
      'ისტორია': '🏰',
      'ბუნება': '🏞️',
      'ღვინო': '🍷',
      'პერსონაჟი': '👤',
      'ლეგენდა': '📖',
      'კულტურა': '🎭',
      'არქიტექტურა': '🏛️',
      'ტრადიცია': '🎊'
    };

    return categoryIcons[place.category || ''] || '🏛️';
  };
  
  // 👇 მთავარი ცვლილება GRID-ში:
  // grid-cols-1 (ყველა ეკრანზე) -> 1 სვეტი (გზამკვლევი და ღირსშესანიშნაობები ერთმანეთის ქვემოთ)
  
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

      {/* 🏛️ კახეთის ღირსშესანიშნაობები */}
      <div className="bg-white/[0.03] backdrop-blur-3xl rounded-[30px] border border-white/10 p-5 flex flex-col items-center group relative overflow-hidden transition-all hover:border-cyan-500/30 shadow-xl h-full">
        <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em] mb-4 w-full text-left">🏛️ კახეთის ღირსშესანიშნაობები</h4>
        {loading ? (
          <div className="flex items-center justify-center w-full h-32">
            <div className="text-white/60 text-sm">იტვირთება...</div>
          </div>
        ) : kakhetiPlaces.length > 0 ? (
          <div className="w-full h-full flex flex-col">
            {/* Main place display */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="bg-white/5 p-6 rounded-2xl border border-white/5 hover:bg-cyan-500/10 transition-all duration-500 group/place">
                <div className="flex items-start space-x-4">
                  <div className="text-4xl flex-shrink-0">
                    {getPlaceIcon(kakhetiPlaces[currentPlaceIndex], currentPlaceIndex)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-white leading-tight">
                        {kakhetiPlaces[currentPlaceIndex]?.title}
                      </h3>
                      {kakhetiPlaces[currentPlaceIndex]?.category && (
                        <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded-full border border-cyan-500/30">
                          {kakhetiPlaces[currentPlaceIndex].category}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/80 leading-relaxed line-clamp-4 mb-3">
                      {kakhetiPlaces[currentPlaceIndex]?.description}
                    </p>
                    {kakhetiPlaces[currentPlaceIndex]?.fun_fact && (
                      <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 mb-3">
                        <div className="text-xs font-medium text-cyan-300 mb-1">იცოდით თუ არა?</div>
                        <div className="text-sm text-white/90 italic">
                          {kakhetiPlaces[currentPlaceIndex]?.fun_fact}
                        </div>
                      </div>
                    )}
                    {kakhetiPlaces[currentPlaceIndex]?.location_name && (
                      <div className="text-xs text-white/60">
                        📍 {kakhetiPlaces[currentPlaceIndex]?.location_name}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onMapSearch(kakhetiPlaces[currentPlaceIndex]?.title)}
                  className="mt-4 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-medium rounded-lg transition-all duration-200 border border-cyan-500/30"
                >
                  რუკაზე ნახვა 🗺️
                </button>
              </div>
            </div>

            {/* Navigation dots */}
            <div className="flex justify-center space-x-2 mt-4">
              {kakhetiPlaces.map((_, index) => (
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
            <div className="text-white/60 text-sm">ინფორმაცია არ მოიძებნა</div>
          </div>
        )}
      </div>
    </div>
  );
}