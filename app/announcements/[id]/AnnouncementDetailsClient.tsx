'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { Database } from '../../types/supabase';
import { supabase } from '../../lib/supabase';
import ClientButtons from './ClientButtons';

type Announcement = Database['public']['Tables']['announcements']['Row'];

export default function AnnouncementDetailsClient({ initialAd }: { initialAd: Announcement | null }) {
  const { id } = useParams<{ id: string }>();
  const [ad, setAd] = useState<Announcement | null>(initialAd);
  const [activeImg, setActiveImg] = useState<string | null>(initialAd?.image_url || initialAd?.all_images?.[0] || null);
  const [shareUrl, setShareUrl] = useState('');

  // Share URL-ის დაყენება კლიენტის მხარეს
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(window.location.href);
    }
  }, []);

  useEffect(() => {
    if (!initialAd) {
      const fetchAd = async () => {
        const { data } = await supabase.from('announcements').select('*').eq('id', id).single();
        if (data) {
          setAd(data);
          setActiveImg(data.image_url || data.all_images?.[0] || null);
        }
      };
      fetchAd();
    }
  }, [id, initialAd]);

  if (!ad) return (
    <div className="min-h-screen bg-[#050510] flex items-center justify-center text-white font-black italic uppercase tracking-widest">
      იტვირთება...
    </div>
  );

  return (
    <main className="min-h-screen bg-[#050510] text-white font-sans pb-24 relative overflow-x-hidden">
      {/* 🏔️ Background FX */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a1f] via-[#050510] to-[#050510]" />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
      </div>

      {/* 🧭 Header */}
      <nav className="px-6 md:px-10 py-6 md:py-8 border-b border-white/5 flex justify-between items-center bg-slate-950/60 backdrop-blur-3xl sticky top-0 z-[100]">
        <Link href="/" className="text-xl md:text-2xl font-black italic tracking-tighter">
          mykakheti<span className="text-amber-500">.ge</span>
        </Link>

        <div className="hidden md:block">
          <p className="text-red-500 font-black uppercase italic text-[10px] md:text-[14px] tracking-[0.3em] animate-pulse drop-shadow-[0_0_15px_rgba(220,38,38,1)]">
            საიტი მუშაობს სატესტო რეჟიმში
          </p>
        </div>

        <Link href="/" className="bg-white/5 border border-white/10 px-6 py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase italic hover:bg-white hover:text-black transition-all">
          ← უკან
        </Link>
      </nav>

      {/* მობილური სატესტო წარწერა */}
      <div className="block md:hidden text-center py-4 relative z-10">
         <p className="text-red-500 font-black uppercase italic text-[9px] tracking-[0.2em] animate-pulse">საიტი მუშაობს სატესტო რეჟიმში</p>
      </div>

      <div className="max-w-7xl mx-auto mt-8 md:mt-12 px-4 md:px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 relative z-10">
        
        {/* 📸 Gallery Section */}
        <div className="space-y-6">
          <div className="aspect-[4/3] rounded-[30px] md:rounded-[50px] overflow-hidden border border-white/10 shadow-2xl bg-black/40 group relative">
            {activeImg ? (
                <Image
                  src={activeImg}
                  alt={ad.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 700px"
                  className="object-cover transition-all duration-700 group-hover:scale-105"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white/20 font-black uppercase italic">ფოტო არ არის</div>
            )}
          </div>
          
          {ad.all_images && ad.all_images.length > 0 && (
            <div className="flex gap-4 overflow-x-auto custom-scrollbar py-2 px-2">
                {/* მთავარი ფოტოც რომ იყოს არჩევაში */}
                {ad.image_url && (
                    <button onClick={() => setActiveImg(ad.image_url)} className={`w-20 h-20 md:w-24 md:h-24 rounded-[22px] overflow-hidden border-2 shrink-0 transition-all duration-300 ${activeImg === ad.image_url ? 'border-amber-500 scale-105' : 'border-white/10 opacity-60'}`}>
                    <Image src={ad.image_url} alt="Main" width={96} height={96} className="w-full h-full object-cover" />
                    </button>
                )}
                {ad.all_images.map((img: string, i: number) => (
                <button 
                    key={i} 
                    onClick={() => setActiveImg(img)} 
                    className={`w-20 h-20 md:w-24 md:h-24 rounded-[22px] overflow-hidden border-2 shrink-0 transition-all duration-300 ${
                    activeImg === img ? 'border-amber-500 scale-105 shadow-lg shadow-amber-500/20' : 'border-white/10 opacity-60 hover:opacity-100'
                    }`}
                >
                  <Image src={img} alt="" width={96} height={96} className="w-full h-full object-cover" />
                </button>
                ))}
            </div>
          )}
        </div>

        {/* 📝 Content Block */}
        <div className="flex flex-col h-full">
          <div className="bg-gradient-to-br from-blue-900/40 via-slate-950/50 to-blue-950/40 backdrop-blur-3xl p-6 md:p-14 rounded-[40px] md:rounded-[50px] border border-white/10 shadow-2xl flex-grow relative overflow-hidden">
            
            <div className="flex justify-between items-start mb-8 md:mb-10 relative z-10">
              <span className="bg-amber-600 text-white px-4 md:px-6 py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase italic tracking-widest shadow-xl">
                {ad.category}
              </span>
              <span className="text-amber-500 font-black uppercase italic text-[10px] md:text-xs tracking-wider drop-shadow-md">
                {ad.location}
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black uppercase italic leading-tight mb-4 md:mb-6 relative z-10 drop-shadow-2xl">
              {ad.title}
            </h1>
            
            <div className="text-4xl md:text-5xl font-black text-amber-500 italic mb-8 md:mb-12 relative z-10 tracking-tighter drop-shadow-xl">
              {ad.price} {ad.currency === 'USD' ? '$' : '₾'}
            </div>
            
            <p className="text-white/80 leading-relaxed italic text-sm md:text-lg mb-10 md:mb-14 whitespace-pre-wrap relative z-10 font-medium">
              {ad.description}
            </p>
            
            {/* ✅ აქ ვიყენებთ ClientButtons კომპონენტს, რომელსაც უკვე გადავეცით დიზაინი */}
            <ClientButtons ad={ad} shareUrl={shareUrl} />

          </div>
        </div>
      </div>
    </main>
  );
}