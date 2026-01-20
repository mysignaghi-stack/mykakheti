import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../../types/supabase';

type KakhetiHeritageRow = Database['public']['Tables']['kakheti_heritage']['Row'];

const fetchKakhetiHeritage = async (): Promise<KakhetiHeritageRow[]> => {
  const { data, error } = await (supabase as any)
    .from('kakheti_heritage')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching heritage data:', error);
    return [];
  }

  return data || [];
};

interface ServiceWidgetsProps {
  onMapSearch: (service: string) => void;
}

export default function ServiceWidgets({ onMapSearch }: ServiceWidgetsProps) {
  const [kakhetiPlaces, setKakhetiPlaces] = useState<KakhetiHeritageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPlaceIndex, setCurrentPlaceIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  useEffect(() => {
    const fetchPlaces = async () => {
      setLoading(true);
      const data = await fetchKakhetiHeritage();
      console.log('Fetched heritage data:', data?.length || 0, 'items');
      setKakhetiPlaces(data);
      setLoading(false);
    };

    fetchPlaces();
  }, []);

  // Filter places by selected category
  const filteredPlaces = selectedCategory === 'all' 
    ? kakhetiPlaces 
    : kakhetiPlaces.filter(place => place.category === selectedCategory);

  // Reset current place index when category changes
  useEffect(() => {
    setCurrentPlaceIndex(0);
  }, [selectedCategory]);

  // Auto-rotate places every 8 seconds (only for filtered places)
  useEffect(() => {
    if (filteredPlaces.length > 0) {
      const interval = setInterval(() => {
        setCurrentPlaceIndex((prev) => (prev + 1) % filteredPlaces.length);
      }, 8000);

      return () => clearInterval(interval);
    }
  }, [filteredPlaces.length]);

  const getPlaceIcon = (place: KakhetiHeritageRow) => {
    const categoryIcons: Record<string, string> = {
      'ისტორია': '🏰',
      'ბუნება': '🏞️',
      'ღვინის კულტურა': '🍷',
      'ცნობილი ადამიანები': '👤',
      'ლეგენდები': '📖'
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
            {['ისტორია', 'ბუნება', 'ღვინის კულტურა', 'ცნობილი ადამიანები', 'ლეგენდები'].map((category) => (
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
              <div className="bg-white/5 p-6 rounded-2xl border border-white/5 hover:bg-cyan-500/10 transition-all duration-500 group/place">
                <div className="flex flex-col space-y-4">
                  {/* Image display */}
                  {filteredPlaces[currentPlaceIndex]?.image_url && (
                    <div className="w-full h-48 rounded-lg overflow-hidden border border-white/10">
                      <img
                        src={filteredPlaces[currentPlaceIndex].image_url}
                        alt={filteredPlaces[currentPlaceIndex]?.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          // Hide image if it fails to load
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  <div className="flex items-start space-x-4">
                    <div className="text-4xl flex-shrink-0">
                      {getPlaceIcon(filteredPlaces[currentPlaceIndex])}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold text-white leading-tight">
                          {filteredPlaces[currentPlaceIndex]?.title}
                        </h3>
                        {filteredPlaces[currentPlaceIndex]?.category && (
                          <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded-full border border-cyan-500/30">
                            {filteredPlaces[currentPlaceIndex].category}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-white/80 leading-relaxed line-clamp-4 mb-3">
                        {filteredPlaces[currentPlaceIndex]?.description}
                      </p>
                      {filteredPlaces[currentPlaceIndex]?.fun_fact && (
                        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 mb-3">
                          <div className="text-xs font-medium text-cyan-300 mb-1">იცოდით თუ არა?</div>
                          <div className="text-sm text-white/90 italic">
                            {filteredPlaces[currentPlaceIndex]?.fun_fact}
                          </div>
                        </div>
                      )}
                      {filteredPlaces[currentPlaceIndex]?.location_name && (
                        <div className="text-xs text-white/60">
                          📍 {filteredPlaces[currentPlaceIndex]?.location_name}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onMapSearch(filteredPlaces[currentPlaceIndex]?.title)}
                    className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-medium rounded-lg transition-all duration-200 border border-cyan-500/30"
                  >
                    რუკაზე ნახვა 🗺️
                  </button>
                </div>
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
    </div>
  );
}