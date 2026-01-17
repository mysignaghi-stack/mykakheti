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

export default function CongratulationsPage() {
  const [items, setItems] = useState<Congratulations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('congratulations')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
      setItems((data || []) as Congratulations[]);
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <main className="min-h-screen bg-[#050510] p-6 md:p-10 text-white">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-end mb-4">
          <Link href="/community" className="text-[11px] font-black uppercase italic text-white/50 hover:text-white transition">← სათემო სივრცე</Link>
        </div>
        <h1 className="text-2xl font-black text-amber-500 uppercase italic mb-6">მისალოცი ბარათები</h1>
        {loading ? (
          <div className="opacity-50">იტვირთება...</div>
        ) : (
          <div className="space-y-4">
            {items.map(item => (
              <div key={item.id} className="p-5 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex gap-4 items-start">
                  {item.image_url && (
                    <Image src={item.image_url} alt="" width={80} height={80} className="rounded-xl object-cover" />
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-black text-white text-lg italic">
                        {item.sender_name} → {item.receiver_name}
                      </h3>
                      <span className="text-amber-500 text-sm font-bold uppercase">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-white/80 italic leading-relaxed">{item.message}</p>
                    <div className="text-white/40 text-xs mt-2">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString('ka-GE') : ''}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="text-center py-12 text-white/40">
                ჯერ არ არის დადასტურებული მისალოცი ბარათები
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}