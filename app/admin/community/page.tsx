'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase'; // დარწმუნდით, რომ გზა ზუსტია
import AdminNav from '../../components/admin/AdminNav';

export default function AdminCommunityPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  return (
    <main className="min-h-screen bg-[#050510] p-6 md:p-10 text-white font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black italic uppercase border-l-4 border-amber-600 pl-4">ქომუნითი მოდერაცია</h1>
          <AdminNav />
        </div>

        <div className="mb-6">
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'lost_found', label: 'დაკარგული/ნაპონის რეესტრი' },
              { key: 'masters', label: 'სერვისები / მომსახურების მიმწოდებლები' },
            ].map(c => (
              <button
                key={c.key}
                onClick={() => setSelectedCategory(selectedCategory === c.key ? '' : c.key)}
                className={`px-4 py-2 rounded-xl text-sm font-bold ${selectedCategory === c.key ? 'bg-amber-600 text-white' : 'bg-white/5 text-white/60'}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ModerationPanel table="lost_found" title="დაკარგული/პოვნილი" highlight={selectedCategory === 'lost_found'} renderItem={(item: any) => (
            <>
              <div className="font-black text-white text-lg italic">{item.title}</div>
              <p className="text-white/80 italic leading-relaxed">{item.location ?? ''}</p>
            </>
          )} />

          <ModerationPanel table="masters" title="სერვისები / მომსახურების მიმწოდებლები" highlight={selectedCategory === 'masters'} renderItem={(item: any) => (
            <>
              <div className="font-black text-white text-lg italic">{item.full_name} — {item.category || 'სერვისი'} - {item.profession}</div>
              <p className="text-white/80 italic leading-relaxed">{item.location ?? ''}</p>
            </>
          )} />
        </div>

        <MasterRatingsPanel />
      </div>
    </main>
  );
}

function MasterRatingsPanel() {
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRatings = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('master_ratings')
        .select('id, master_id, stars, comment, created_at, masters(full_name, profession)')
        .not('comment', 'is', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRatings(data ?? []);
    } catch (error) {
      console.error('ratings fetch', error);
      setRatings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRatings(); }, []);

  const removeRating = async (id: string) => {
    if (!confirm('ნამდვილად გსურთ ამ კომენტარის/შეფასების წაშლა?')) return;
    const response = await fetch('/api/admin/master-ratings/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return alert(payload?.error || 'წაშლა ვერ მოხერხდა');
    fetchRatings();
  };

  return (
    <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-black text-amber-400">სერვისების კომენტარები და შეფასებები</h3>
          <p className="text-xs text-white/45">საჭიროების შემთხვევაში ადმინისტრატორს შეუძლია კომენტარის/შეფასების წაშლა.</p>
        </div>
        <button onClick={fetchRatings} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase text-white/65 hover:text-white">
          განახლება
        </button>
      </div>

      {loading ? <div className="text-white/60">იტვირთება...</div> : (
        <div className="space-y-3">
          {ratings.map((rating) => {
            const master = Array.isArray(rating.masters) ? rating.masters[0] : rating.masters;
            return (
              <div key={rating.id} className="rounded-2xl border border-white/10 bg-black/40 p-3">
                <div className="mb-2 flex flex-col gap-1 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-sm font-black text-white">{master?.full_name || 'სერვისი'} — {master?.profession || ''}</div>
                    <div className="text-[10px] font-black text-amber-300">{'★'.repeat(rating.stars)}{'☆'.repeat(5 - rating.stars)}</div>
                  </div>
                  <div className="text-[10px] text-white/35">{rating.created_at ? new Date(rating.created_at).toLocaleString('ka-GE') : ''}</div>
                </div>
                <p className="mb-3 whitespace-pre-line text-sm leading-relaxed text-white/70">{rating.comment}</p>
                <div className="flex gap-2">
                  <a href={`/community/masters/${rating.master_id}`} target="_blank" rel="noreferrer" className="flex-1 rounded-xl bg-white/5 py-2 text-center text-xs font-black uppercase text-white/65 hover:text-white">
                    სერვისის ნახვა
                  </a>
                  <button onClick={() => removeRating(rating.id)} className="flex-1 rounded-xl bg-red-600 py-2 text-xs font-black uppercase text-white">
                    წაშლა
                  </button>
                </div>
              </div>
            );
          })}
          {ratings.length === 0 && <div className="py-6 text-center text-white/40">კომენტარები ჯერ არ არის</div>}
        </div>
      )}
    </section>
  );
}

function ModerationPanel({ table, title, renderItem, highlight }: { table: string; title: string; renderItem: (item: any) => React.ReactNode; highlight?: boolean }) {
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [approvedItems, setApprovedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');

  const fetchItems = async () => {
    setLoading(true);
    try {
      // Fetch pending via API
      const pendingResponse = await fetch(`/api/admin/${table}/pending`);
      if (!pendingResponse.ok) throw new Error('Failed to fetch pending');
      const pendingResult = await pendingResponse.json();
      setPendingItems(pendingResult || []);
    } catch (pendErr) {
      console.error(table, 'pending fetch', pendErr);
      setPendingItems([]);
    }

    try {
      // Fetch approved via client (for now)
      const { data: approved, error: appErr } = await (supabase as any).from(table).select('*').eq('is_approved', true).order('created_at', { ascending: false });
      if (appErr) console.error(table, 'approved fetch', appErr);
      setApprovedItems(approved || []);
    } catch (appErr) {
      console.error(table, 'approved fetch', appErr);
      setApprovedItems([]);
    }

    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [table]);

  const approve = async (id: string) => {
    const response = await fetch('/api/admin/community/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, id }),
    });
    if (!response.ok) return alert('დადასტურება ვერ მოხერხდა');
    fetchItems();
  };

  const remove = async (id: string) => {
    if (!confirm('ნამდვილად გსურთ წაშლა?')) return;
    const response = await fetch('/api/admin/community/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, id }),
    });
    if (!response.ok) return alert('წაშლა ვერ მოხერხდა');
    fetchItems();
  };

  const unapprove = async (id: string) => {
    // For unapprove, we'll use client-side since it's less critical
    const { error } = await (supabase as any).from(table).update({ is_approved: false }).eq('id', id);
    if (error) return alert('გაუქმება ვერ მოხერხდა');
    fetchItems();
  };

  const items = activeTab === 'pending' ? pendingItems : approvedItems;

  return (
    <div className={`bg-white/5 rounded-3xl border border-white/10 p-4 ${highlight ? 'ring-2 ring-amber-500' : ''}`}>
      <h3 className="text-lg font-black text-amber-400 mb-3">{title}</h3>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setActiveTab('pending')} className={`px-3 py-1 rounded-xl ${activeTab === 'pending' ? 'bg-amber-600 text-white' : 'bg-white/5 text-white/60'}`}>დასადასტურებელი ({pendingItems.length})</button>
        <button onClick={() => setActiveTab('approved')} className={`px-3 py-1 rounded-xl ${activeTab === 'approved' ? 'bg-amber-600 text-white' : 'bg-white/5 text-white/60'}`}>დადასტურებული ({approvedItems.length})</button>
      </div>

      {loading ? <div className="text-white/60">იტვირთება...</div> : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="bg-black/40 rounded-2xl p-3 border border-white/10">
              <div className="mb-2">{renderItem(item)}</div>
              <div className="flex gap-2">
                {activeTab === 'pending' ? (
                  <>
                    <button onClick={() => approve(item.id)} className="flex-1 bg-green-600 py-2 rounded-xl text-xs font-black uppercase">დამტკიცება</button>
                    <button onClick={() => remove(item.id)} className="flex-1 bg-red-600 py-2 rounded-xl text-xs font-black uppercase">წაშლა</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => unapprove(item.id)} className="flex-1 bg-yellow-600 py-2 rounded-xl text-xs font-black uppercase">↶ დაბრუნება</button>
                    <button onClick={() => remove(item.id)} className="flex-1 bg-red-600 py-2 rounded-xl text-xs font-black uppercase">წაშლა</button>
                  </>
                )}
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="text-white/40 text-center py-6">{activeTab === 'pending' ? 'ჩანაწერები არ არის' : 'დადასტურებული ჩანაწერები არ არის'}</div>}
        </div>
      )}
    </div>
  );
}
