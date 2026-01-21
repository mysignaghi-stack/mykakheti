'use client';

import { useEffect, useState, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../../types/supabase';
import { useSearchParams } from 'next/navigation';

type Obituary = Database['public']['Tables']['obituaries']['Row'];

function ObituariesPageContent() {
  const [items, setItems] = useState<Obituary[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('selectedId');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from('obituaries')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
      setItems((data || []) as Obituary[]);
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedId) {
      const element = document.getElementById(`obituary-${selectedId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedId]);

  return (
    <main className="min-h-screen bg-[#050510] p-6 md:p-10 text-white">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <Link href="/" className="text-[11px] font-black uppercase italic text-white/50 hover:text-white transition">← მთავარი გვერდი</Link>
          <Link href="/community/obituaries/submit" className="bg-amber-500/20 text-amber-400 px-4 py-2 rounded-xl text-[11px] font-black uppercase hover:bg-amber-500 hover:text-black transition">
            დამატება
          </Link>
        </div>
        <h1 className="text-2xl font-black text-amber-500 uppercase italic mb-6">სამძიმარი და ჭირისუფალი</h1>
        <h2 className="text-xl font-black text-amber-500 uppercase italic mb-4">Announcement Feed</h2>
        {loading ? (
          <div className="opacity-50">იტვირთება...</div>
        ) : (
          <div className="space-y-4">
            {items.map(item => (
              <div
                key={item.id}
                id={`obituary-${item.id}`}
                className={item.id === selectedId ? 'highlight-class' : ''}
              >
                <Link href={`/community/obituaries/${item.id}`} className="block p-5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition">
                  <div className="flex gap-4 items-start">
                    {item.image_url && (
                      <Image src={item.image_url} alt="" width={80} height={80} className="rounded-2xl object-contain shadow-lg ring-1 ring-amber-400/20" />
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
                </Link>
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

export default function ObituariesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ObituariesPageContent />
    </Suspense>
  );
}
