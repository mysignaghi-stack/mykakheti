'use client';

import { useEffect, useState, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../../types/supabase';
import { useSearchParams } from 'next/navigation';

type Congratulations = Database['public']['Tables']['congratulations']['Row'];

function CongratulationsPageContent() {
  const [items, setItems] = useState<Congratulations[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('selectedId');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from('congratulations')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
      setItems((data || []) as Congratulations[]);
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedId) {
      const element = document.getElementById(`congrats-${selectedId}`);
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
          <Link href="/community/congratulations/submit" className="bg-amber-500/20 text-amber-400 px-4 py-2 rounded-xl text-[11px] font-black uppercase hover:bg-amber-500 hover:text-black transition">
            დამატება
          </Link>
        </div>
        <h1 className="text-2xl font-black text-amber-500 uppercase italic mb-6">მისალოცი ბარათები</h1>
        <h2 className="text-xl font-black text-amber-500 uppercase italic mb-4">Announcement Feed</h2>
        {loading ? (
          <div className="opacity-50">იტვირთება...</div>
        ) : (
          <div className="space-y-4">
            {items.map(item => (
              <Link key={item.id} href={`/community/congratulations/${item.id}`} className="block p-5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition">
                <div className="flex gap-4 items-start">
                  {item.image_url && (
                    <Image src={item.image_url} alt="" width={80} height={80} className="rounded-2xl object-contain shadow-lg ring-1 ring-amber-400/20" />
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-black text-white text-lg italic">
                        {item.sender_name} → {item.recipient_name}
                      </h3>
                      <span className="text-amber-500 text-sm font-bold uppercase">
                        {item.occasion}
                      </span>
                    </div>
                    <p className="text-white/80 italic leading-relaxed">{item.message}</p>
                    <div className="text-white/40 text-xs mt-2">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString('ka-GE') : ''}
                    </div>
                  </div>
                </div>
              </Link>
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

export default function CongratulationsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CongratulationsPageContent />
    </Suspense>
  );
}