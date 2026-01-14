'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import MasterCard from '../../components/community/MasterCard';

interface Master {
  id: string;
  full_name: string;
  profession: string;
  phone?: string | null;
  location?: string | null;
  description?: string | null;
  rating_avg: number;
  ratings_count: number;
}

export default function MastersPage() {
  const [items, setItems] = useState<Master[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [profession, setProfession] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      let q = supabase.from('masters').select('*').eq('is_approved', true).order('rating_avg', { ascending: false });
      const { data } = await q;
      setItems((data || []) as Master[]);
      setLoading(false);
    };
    fetchData();
  }, []);

  const filtered = items.filter(m => (
    (!query || m.full_name.toLowerCase().includes(query.toLowerCase())) &&
    (!profession || m.profession.toLowerCase().includes(profession.toLowerCase()))
  ));

  return (
    <main className="min-h-screen bg-[#050510] p-6 md:p-10 text-white">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-black text-amber-500 uppercase italic mb-6">ოსტატების ბაზა</h1>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="სახელი" className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none" />
          <input value={profession} onChange={e => setProfession(e.target.value)} placeholder="პროფესია (სანტექნიკოსი, ელექტრიკოსი...)" className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none" />
        </div>
        {loading ? (
          <div className="opacity-50">იტვირთება...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map(m => (
              <MasterCard key={m.id} master={m} />
            ))}
            {filtered.length === 0 && (
              <div className="opacity-20 italic">შესაბამისი ოსტატი ვერ მოიძებნა</div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
