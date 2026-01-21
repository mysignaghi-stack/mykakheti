'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// ხაზი 4: ვიყენებთ ალიასს (@), რომ თავიდან ავიცილოთ გზის შეცდომა
import type { Database } from '@/types/supabase'; 
import { supabase } from '@/app/lib/supabase'; // დარწმუნდით, რომ გზა ზუსტია

/**
 * 1. ტიპების განსაზღვრა (აშორებს "Unexpected any" შეცდომებს)
 */
type CommunityTab = 'obituaries' | 'lostfound' | 'masters';
type ObituaryRow = Database['public']['Tables']['obituaries']['Row'];
type LostFoundRow = Database['public']['Tables']['lost_found']['Row'];
type MasterRow = Database['public']['Tables']['masters']['Row'];
type CommunityItem = ObituaryRow | LostFoundRow | MasterRow;

type PendingState = { 
  type: CommunityTab | ''; 
  items: CommunityItem[] 
};

interface FormProps {
  onAdded: () => void;
}

const getTableName = (t: CommunityTab): 'obituaries' | 'lost_found' | 'masters' => {
  if (t === 'lostfound') return 'lost_found';
  return t;
};

const getItemLabel = (item: CommunityItem): string => {
  if ('title' in item && item.title) return item.title;
  if ('full_name' in item && item.full_name) return item.full_name;
  if ('profession' in item && item.profession) return item.profession;
  return String(item.id);
};

export default function AdminCommunityPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  return (
    <main className="min-h-screen bg-[#050510] p-6 md:p-10 text-white font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black italic uppercase border-l-4 border-amber-600 pl-4">ქომუნითი მოდერაცია</h1>
          <div className="flex gap-3">
            <Link href="/admin" className="bg-white/5 px-4 py-2 rounded-xl text-xs font-black uppercase">← ადმინ ჰაბი</Link>
            <button onClick={() => router.back()} className="bg-white/5 px-4 py-2 rounded-xl text-xs font-black uppercase">უკან</button>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'congratulations', label: 'მისალოცი' },
              { key: 'obituaries', label: 'სამძიმარი' },
              { key: 'lost_found', label: 'დაკარგული/პოვნილი' },
              { key: 'masters', label: 'ოსტატები/სპეციალისტები' },
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
          <ModerationPanel table="congratulations" title="მისალოცი ბარათები" highlight={selectedCategory === 'congratulations'} renderItem={(item: any) => (
            <>
              <div className="font-black text-white text-lg italic">{item.sender_name} → {item.receiver_name}</div>
              <div className="text-amber-400 text-sm font-bold uppercase bg-amber-600/20 px-2 py-1 rounded-full inline-block mb-2">{item.category}</div>
              <p className="text-white/80 italic leading-relaxed">{item.message}</p>
            </>
          )} />

          <ModerationPanel table="obituaries" title="სამძიმარი" highlight={selectedCategory === 'obituaries'} renderItem={(item: any) => (
            <>
              <div className="font-black text-white text-lg italic">{item.full_name}</div>
              <p className="text-white/80 italic leading-relaxed">{item.note ?? ''}</p>
            </>
          )} />

          <ModerationPanel table="lost_found" title="დაკარგული/პოვნილი" highlight={selectedCategory === 'lost_found'} renderItem={(item: any) => (
            <>
              <div className="font-black text-white text-lg italic">{item.title}</div>
              <p className="text-white/80 italic leading-relaxed">{item.location ?? ''}</p>
            </>
          )} />

          <ModerationPanel table="masters" title="ოსტატები/სპეციალისტები" highlight={selectedCategory === 'masters'} renderItem={(item: any) => (
            <>
              <div className="font-black text-white text-lg italic">{item.full_name} — {item.category || 'ოსტატი'} - {item.profession}</div>
              <p className="text-white/80 italic leading-relaxed">{item.location ?? ''}</p>
            </>
          )} />
        </div>
      </div>
    </main>
  );
}

function CongratulationsInline() {
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [approvedItems, setApprovedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data: pending, error: pendingError } = await supabase
      .from('congratulations')
      .select('*')
      .eq('is_approved', false)
      .order('created_at', { ascending: false });

    const { data: approved, error: approvedError } = await supabase
      .from('congratulations')
      .select('*')
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (pendingError) console.error('Pending fetch error:', pendingError);
    if (approvedError) console.error('Approved fetch error:', approvedError);

    setPendingItems(pending || []);
    setApprovedItems(approved || []);
    setLoading(false);
  };

  const approveItem = async (id: string) => {
    const { error } = await (supabase.from('congratulations' as any) as any)
      .update({ is_approved: true })
      .eq('id', id);

    if (!error) fetchItems();
    else alert(`დადასტურება ვერ მოხერხდა: ${error.message}`);
  };

  const rejectItem = async (id: string) => {
    if (!confirm('ნამდვილად გსურთ წაშლა?')) return;
    const { error } = await supabase.from('congratulations').delete().eq('id', id);
    if (!error) fetchItems(); else alert(`წაშლა ვერ მოხერხდა: ${error.message}`);
  };

  const unapproveItem = async (id: string) => {
    const { error } = await (supabase.from('congratulations' as any) as any)
      .update({ is_approved: false })
      .eq('id', id);

    if (!error) fetchItems(); else alert(`გაუქმება ვერ მოხერხდა: ${error.message}`);
  };

  const items = activeTab === 'pending' ? pendingItems : approvedItems;

  return (
    <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
      <h2 className="text-2xl font-black text-amber-500 mb-4">მისალოცი ბარათები</h2>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setActiveTab('pending')} className={`px-4 py-2 rounded-xl ${activeTab === 'pending' ? 'bg-amber-600 text-white' : 'bg-white/5 text-white/60'}`}>დასადასტურებელი ({pendingItems.length})</button>
        <button onClick={() => setActiveTab('approved')} className={`px-4 py-2 rounded-xl ${activeTab === 'approved' ? 'bg-amber-600 text-white' : 'bg-white/5 text-white/60'}`}>დადასტურებული ({approvedItems.length})</button>
      </div>

      {loading ? (
        <div className="text-white/60">იტვირთება...</div>
      ) : (
        <div className="space-y-4">
          {items.map(item => (
            <div key={item.id} className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="flex gap-4 items-start">
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-black text-white text-lg italic">{item.sender_name} → {item.receiver_name}</div>
                    <div className="flex gap-2">
                      {activeTab === 'pending' ? (
                        <>
                          <button onClick={() => approveItem(item.id)} className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold text-sm">✓ დადასტურება</button>
                          <button onClick={() => rejectItem(item.id)} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm">✕ წაშლა</button>
                        </>
                      ) : (
                        <button onClick={() => unapproveItem(item.id)} className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-bold text-sm">↶ დაბრუნება</button>
                      )}
                    </div>
                  </div>
                  <div className="text-amber-400 text-sm font-bold uppercase bg-amber-600/20 px-2 py-1 rounded-full inline-block mb-2">{item.category}</div>
                  <p className="text-white/80 italic leading-relaxed">{item.message}</p>
                  <div className="text-white/40 text-xs mt-2">{item.created_at ? new Date(item.created_at).toLocaleDateString('ka-GE') : ''}</div>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="text-center py-12 text-white/40">{activeTab === 'pending' ? 'დასადასტურებელი მისალოცი ბარათები არ არის' : 'დადასტურებული მასალები არ არის'}</div>}
        </div>
      )}
    </div>
  );
}

/**
 * 4. ფორმების კომპონენტები (გასწორებულია props ტიპიზაცია)
 */
function ObituariesForm({ onAdded }: FormProps) {
  const [name, setName] = useState('');
  const submit = async () => {
    if (!name) return;
    const { error } = await (supabase as any).from('obituaries').insert({ full_name: name });
    if (!error) { setName(''); onAdded(); }
  };
  return (
    <div className="flex gap-3">
      <input value={name} onChange={e => setName(e.target.value)} placeholder="სრული სახელი" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-amber-600 outline-none" />
      <button onClick={submit} className="bg-amber-600 px-6 py-2 rounded-xl text-xs font-black uppercase">დამატება</button>
    </div>
  );
}

function ModerationPanel({ table, title, renderItem, highlight }: { table: string; title: string; renderItem: (item: any) => React.ReactNode; highlight?: boolean }) {
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [approvedItems, setApprovedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');

  const fetchItems = async () => {
    setLoading(true);
    const { data: pending, error: pendErr } = await (supabase as any).from(table).select('*').eq('is_approved', false).order('created_at', { ascending: false });
    const { data: approved, error: appErr } = await (supabase as any).from(table).select('*').eq('is_approved', true).order('created_at', { ascending: false });
    if (pendErr) console.error(table, 'pending fetch', pendErr);
    if (appErr) console.error(table, 'approved fetch', appErr);
    setPendingItems(pending || []);
    setApprovedItems(approved || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [table]);

  const approve = async (id: string) => {
    const { error } = await (supabase as any).from(table).update({ is_approved: true }).eq('id', id);
    if (error) return alert('დადასტურება ვერ მოხერხდა');
    fetchItems();
  };

  const remove = async (id: string) => {
    if (!confirm('ნამდვილად გსურთ წაშლა?')) return;
    const { error } = await (supabase as any).from(table).delete().eq('id', id);
    if (error) return alert('წაშლა ვერ მოხერხდა');
    fetchItems();
  };

  const unapprove = async (id: string) => {
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

function LostFoundForm({ onAdded }: FormProps) {
  const [title, setTitle] = useState('');
  const submit = async () => {
    if (!title) return;
    const { error } = await (supabase as any).from('lost_found').insert({ title, kind: 'lost', category: 'other' });
    if (!error) { setTitle(''); onAdded(); }
  };
  return (
    <div className="flex gap-3">
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="სათაური" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-green-600 outline-none" />
      <button onClick={submit} className="bg-green-600 px-6 py-2 rounded-xl text-xs font-black uppercase">დამატება</button>
    </div>
  );
}

function MastersForm({ onAdded }: FormProps) {
  const [name, setName] = useState('');
  const submit = async () => {
    if (!name) return;
    const { error } = await (supabase as any).from('masters').insert({ full_name: name, profession: 'ოსტატი' });
    if (!error) { setName(''); onAdded(); }
  };
  return (
    <div className="flex gap-3">
      <input value={name} onChange={e => setName(e.target.value)} placeholder="ოსტატის/სპეციალისტის სახელი" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-blue-600 outline-none" />
      <button onClick={submit} className="bg-blue-600 px-6 py-2 rounded-xl text-xs font-black uppercase">დამატება</button>
    </div>
  );
}