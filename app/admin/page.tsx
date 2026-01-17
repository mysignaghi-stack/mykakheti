'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import type { Database } from '../../types/supabase';

type Announcement = Database['public']['Tables']['announcements']['Row'];
type SiteSettingValue = Pick<Database['public']['Tables']['site_settings']['Row'], 'value'>;

export default function HomePage() {
  const [ads, setAds] = useState<Announcement[]>([]);
  const [weather, setWeather] = useState<{ name: string; temp: number; icon: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ყველა');
  const [bgImage, setBgImage] = useState('https://i.ibb.co/N2L6XvX/image.jpg');

  useEffect(() => {
    async function fetchData() {
      // 1. ფონის წამოღება ბაზიდან
      const { data: settings } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'background_url')
        .single<SiteSettingValue>();
      if (settings?.value) setBgImage(settings.value);

      // 2. განცხადებები
      const { data: adsData } = await supabase.from('announcements').select('*').eq('is_approved', true).order('created_at', { ascending: false });
      if (adsData) setAds(adsData);

      // 3. ამინდი
      const weatherPoints = [{ name: 'თელავი', lat: 41.91, lon: 45.47 }, { name: 'სიღნაღი', lat: 41.61, lon: 45.92 }];
      const results = await Promise.all(weatherPoints.map(async (city) => {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current_weather=true`);
        const d = await res.json();
        return { name: city.name, temp: Math.round(d.current_weather.temperature), icon: d.current_weather.weathercode > 40 ? '☁️' : '☀️' };
      }));
      setWeather(results);
    }
    fetchData();
  }, []);

  const categories = [
    { name: 'ყველა', icon: '🧭' }, { name: 'უძრავი ქონება', icon: '🏡' },
    { name: 'მარნები', icon: '🍷' }, { name: 'სასტუმროები', icon: '🏨' },
    { name: 'რესტორნები', icon: '🍽️' }, { name: 'ვაკანსიები', icon: '💼' }
  ];

  const filteredAds = ads.filter(ad => (selectedCategory === 'ყველა' || ad.category === selectedCategory) && (ad.title || '').toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <main className="min-h-screen relative flex flex-col bg-[#050510]">
      <div className="fixed inset-0 z-0">
        <Image src={bgImage} className="w-full h-full object-cover transition-opacity duration-1000" alt="საიტის ფონის ფოტო" fill />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a1f]/85 via-transparent to-[#050510]/95 backdrop-blur-[4px]" />
      </div>

      <header className="relative z-20 pt-20 pb-8 px-6 text-center">
        <nav className="absolute top-0 left-0 right-0 px-10 py-6 flex justify-between items-center bg-black/20 backdrop-blur-2xl border-b border-white/5">
          <a href="/" className="text-2xl font-black italic text-white tracking-tighter">mykakheti<span className="text-amber-500">.ge</span></a>
          <a href="/add" className="bg-amber-600 text-white px-8 py-2 rounded-xl font-black uppercase text-[10px] italic shadow-2xl">განცხადება +</a>
        </nav>

        <div className="mt-16">
          <div className="flex justify-center gap-3 mb-10 overflow-x-auto no-scrollbar px-4 pb-2">
            {weather.map(w => (
              <div key={w.name} className="bg-white/10 backdrop-blur-3xl border border-white/10 px-5 py-3 rounded-[28px] min-w-[95px]">
                <span className="text-[8px] font-black text-amber-200 uppercase mb-1.5 block">{w.name}</span>
                <span className="text-2xl">{w.icon}</span>
                <span className="text-base font-black text-white italic block">{w.temp}°</span>
              </div>
            ))}
          </div>
          <h1 className="text-[32px] md:text-[52px] font-black text-white uppercase italic tracking-tighter drop-shadow-2xl px-4 leading-none">კახეთის <span className="text-amber-500">ერთიანი</span> პლატფორმა</h1>
          <div className="max-w-3xl w-full mx-auto mt-10 bg-white rounded-[35px] shadow-2xl flex p-2 gap-2 border-[6px] border-white/5">
            <input type="text" placeholder="რას ეძებთ კახეთში?" className="w-full px-6 py-4 outline-none font-bold text-lg italic text-blue-950 bg-transparent" onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>
      </header>

      <section className="relative z-10 max-w-[1200px] mx-auto px-10 py-12 grid grid-cols-3 md:grid-cols-6 gap-4">
        {categories.map(cat => (
          <button key={cat.name} onClick={() => setSelectedCategory(cat.name)} className={`flex flex-col items-center justify-center p-6 rounded-[35px] border-2 transition-all ${selectedCategory === cat.name ? 'bg-amber-600 text-white border-amber-400 scale-105' : 'bg-white/10 text-white/40 border-white/10 hover:border-amber-500'}`}>
            <span className="text-3xl mb-2">{cat.icon}</span>
            <span className="text-[10px] font-black uppercase italic text-center leading-tight">{cat.name}</span>
          </button>
        ))}
      </section>

      <section className="relative z-10 max-w-7xl mx-auto px-10 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {filteredAds.map(ad => (
          <div key={ad.id} className="bg-white/[0.06] backdrop-blur-3xl rounded-[45px] overflow-hidden flex flex-col group border border-white/10 shadow-2xl">
            <Link href={`/announcements/${ad.id}`} className="block relative h-full">
              <div className="h-60 bg-black/20 overflow-hidden relative">
                {ad.image_url ? (
                  <Image
                    src={ad.image_url}
                    alt={`განცხადება: ${ad.title ?? 'უცნობი სათაური'}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    fill
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-white/5 text-4xl font-black">MYK</div>
                )}
                <div className="absolute top-5 left-5 bg-white text-slate-950 px-4 py-1.5 rounded-2xl text-[9px] font-black uppercase italic z-30 shadow-lg">{ad.category}</div>
              </div>
              <div className="p-8 pb-10">
                <h3 className="text-xs font-black text-white uppercase italic line-clamp-2 mb-4 leading-relaxed">{ad.title}</h3>
                <div className="text-xl font-black text-amber-500 italic tracking-tight">{ad.price} ₾</div>
              </div>
            </Link>
          </div>
        ))}
      </section>
      
      <footer className="relative z-10 mt-20 py-10 text-center opacity-20 border-t border-white/5">
         <p className="text-[10px] font-black text-white uppercase tracking-widest">© 2026 MYKAKHETI.GE</p>
      </footer>
    </main>
  );
}