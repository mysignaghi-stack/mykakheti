'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import MasterCard from '../../components/community/MasterCard';
import type { Database } from '../../../types/supabase';
import { useSearchParams } from 'next/navigation';

type Master = Database['public']['Tables']['masters']['Row'];

function MastersPageContent() {
  const [items, setItems] = useState<Master[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('selectedId');

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

  useEffect(() => {
    if (selectedId) {
      const element = document.getElementById(`master-${selectedId}`);
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
          <Link href="/community/masters/submit" className="bg-amber-500/20 text-amber-400 px-4 py-2 rounded-xl text-[11px] font-black uppercase hover:bg-amber-500 hover:text-black transition">
            დამატება
          </Link>
        </div>
        <h1 className="text-2xl font-black text-amber-500 uppercase italic mb-6">ოსტატების/სპეციალისტების ბაზა</h1>
        {loading ? (
          <div className="opacity-50">იტვირთება...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map(m => (
              <div
                key={m.id}
                id={`master-${m.id}`}
                className={m.id === selectedId ? 'highlight-class' : ''}
              >
                <Link href={`/community/masters/${m.id}`} className="block">
                  <MasterCard master={m} />
                </Link>
              </div>
            ))}
            {items.length === 0 && (
              <div className="opacity-20 italic">შესაბამისი ოსტატი/სპეციალისტი ვერ მოიძებნა</div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function MastersPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MastersPageContent />
    </Suspense>
  );
}
