'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import MasterCard from '../../components/community/MasterCard';
import type { Database } from '../../../types/supabase';

type Master = Database['public']['Tables']['masters']['Row'];

export default function MastersPage() {
  const [items, setItems] = useState<Master[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from('masters')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
      setItems((data || []) as Master[]);
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <main className="min-h-screen bg-[#050510] p-6 md:p-10 text-white">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <Link href="/" className="text-[11px] font-black uppercase italic text-white/50 hover:text-white transition">← მთავარი გვერდი</Link>
          <Link href="/community/masters/submit" className="bg-amber-500/20 text-amber-400 px-4 py-2 rounded-xl text-[11px] font-black uppercase hover:bg-amber-500 hover:text-black transition">
            დამატება
          </Link>
        </div>
        <h1 className="text-2xl font-black text-amber-500 uppercase italic mb-6">ოსტატების ბაზა</h1>
        <h2 className="text-xl font-black text-amber-500 uppercase italic mb-4">Announcement Feed</h2>
        {loading ? (
          <div className="opacity-50">იტვირთება...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map(m => (
              <Link key={m.id} href={`/community/masters/${m.id}`} className="block">
                <MasterCard master={m} />
              </Link>
            ))}
            {items.length === 0 && (
              <div className="opacity-20 italic">შესაბამისი ოსტატი ვერ მოიძებნა</div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
