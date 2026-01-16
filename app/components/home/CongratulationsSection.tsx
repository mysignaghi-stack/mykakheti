'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

interface Congratulations {
  id: string;
  sender_name: string | null;
  receiver_name: string;
  message: string;
  category: string;
  theme: string;
  image_url?: string | null;
  created_at: string | null;
}

const OCCASIONS = ['ყველა', 'დაბადების დღე', 'ქორწილი', 'დამთავრება', 'შობა', 'სხვა'];

export default function CongratulationsSection() {
  const [items, setItems] = useState<Congratulations[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOccasion, setSelectedOccasion] = useState('ყველა');

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from('congratulations')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(10); // მეტი მისალოცი

      setItems((data || []) as Congratulations[]);
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredItems = selectedOccasion === 'ყველა' 
    ? items 
    : items.filter(item => item.category === selectedOccasion);

  if (loading || items.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="bg-gradient-to-r from-amber-600/10 to-amber-500/10 rounded-[20px] p-4 md:p-6 border border-amber-600/20">
        <div className="text-center mb-4">
          <h2 className="text-xl md:text-2xl font-black text-amber-500 uppercase italic mb-2">
            🎉 მისალოცი ბარათები
          </h2>
          <p className="text-white/70 font-bold text-xs">
            გაუზიარეთ სიხარული თქვენს მეგობრებს და ნათესავებს
          </p>
        </div>

        {/* Occasion Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {OCCASIONS.map(occasion => (
            <button
              key={occasion}
              onClick={() => setSelectedOccasion(occasion)}
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase transition-all ${
                selectedOccasion === occasion
                  ? 'bg-amber-500 text-white shadow-lg'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {occasion}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.slice(0, 4).map(item => (
            <div key={item.id} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-amber-500/50 transition-all">
              <div className="flex items-start gap-3">
                {item.image_url && (
                  <Image
                    src={item.image_url}
                    width={48}
                    height={48}
                    className="rounded-lg object-cover flex-shrink-0"
                    alt="მისალოცი სურათი"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-black text-white text-xs italic truncate">
                      {item.sender_name || 'ანონიმი'} → {item.receiver_name}
                    </div>
                    <span className="text-amber-400 text-xs font-bold uppercase bg-amber-600/20 px-2 py-0.5 rounded-full flex-shrink-0 ml-2">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-white/80 text-xs leading-relaxed line-clamp-2">
                    {item.message}
                  </p>
                  <div className="text-white/40 text-xs mt-1">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString('ka-GE') : ''}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-4">
          <Link
            href="/community/congratulations"
            className="inline-block bg-amber-600 text-white px-6 py-2 rounded-full font-black text-xs uppercase italic tracking-widest hover:bg-amber-500 transition-all shadow-lg hover:shadow-amber-500/25"
          >
            ყველა მისალოცი ბარათი →
          </Link>
        </div>
      </div>
    </section>
  );
}