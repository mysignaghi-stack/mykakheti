'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

interface Obituary {
  id: string;
  full_name: string;
  date_of_death: string | null;
  funeral_at: string | null;
  funeral_place: string | null;
  contacts: string | null;
  notes: string | null;
  image_url?: string | null;
}

export default function ObituariesPage() {
  const [items, setItems] = useState<Obituary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('obituaries')
        .select('*')
        .eq('is_approved', true)
        .order('funeral_at', { ascending: false });
      setItems((data || []) as Obituary[]);
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
        <h1 className="text-2xl font-black text-amber-500 uppercase italic mb-6">სამძიმარი და ჭირისუფალი</h1>
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
                    <h3 className="font-black text-white text-lg italic">{item.full_name}</h3>
                    <div className="text-[12px] text-white/60">
                      {item.date_of_death && (<p>გარდაცვალება: {new Date(item.date_of_death).toLocaleDateString()}</p>)}
                      {item.funeral_at && (<p>გასვენება: {new Date(item.funeral_at).toLocaleString()}</p>)}
                      {item.funeral_place && (<p>ადგილი: {item.funeral_place}</p>)}
                      {item.contacts && (<p>კონტაქტი: {item.contacts}</p>)}
                    </div>
                    {item.notes && (<p className="mt-2 text-sm text-white/80">{item.notes}</p>)}
                  </div>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="opacity-20 italic">ჩანაწერები არ არსებობს</div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
