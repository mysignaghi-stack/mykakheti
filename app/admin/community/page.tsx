'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const [tab, setTab] = useState<CommunityTab>('obituaries');
  const [pending, setPending] = useState<PendingState>({ type: '', items: [] });
  const [approved, setApproved] = useState<PendingState>({ type: '', items: [] });

  /**
   * 2. მონაცემების ჩატვირთვა (გასწორებულია ტიპების "დაკარგვა")
   */
  const loadData = useCallback(async (t: CommunityTab) => {
    const table = getTableName(t);

    const { data: pData, error: pError } = await supabase
      .from(table)
      .select('*')
      .eq('is_approved', false)
      .order('created_at', { ascending: false });

    if (!pError) {
      setPending({ type: t, items: (pData as CommunityItem[]) ?? [] });
    }

    const { data: aData, error: aError } = await supabase
      .from(table)
      .select('*')
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (!aError) {
      setApproved({ type: t, items: (aData as CommunityItem[]) ?? [] });
    }
  }, []);

  useEffect(() => {
    loadData(tab);
  }, [tab, loadData]);

  return (
    <main className="min-h-screen bg-[#050510] p-6 md:p-10 text-white font-sans">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-black italic uppercase mb-8 border-l-4 border-amber-600 pl-4">ქომუნითი მართვა</h1>

        {/* ტაბები */}
        <div className="flex gap-2 mb-8 bg-white/5 p-1 rounded-2xl border border-white/10 w-fit">
          {(['obituaries', 'lostfound', 'masters'] as const).map(key => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${tab === key ? 'bg-amber-600 text-white shadow-lg' : 'text-white/50 hover:text-white'}`}
            >
              {key === 'obituaries' ? 'სამძიმარი' : key === 'lostfound' ? 'დაკარგული' : 'ოსტატები'}
            </button>
          ))}
        </div>

        {/* ფორმები */}
        <div className="bg-white/5 p-6 rounded-3xl border border-white/10 mb-10">
          {tab === 'obituaries' && <ObituariesForm onAdded={() => loadData(tab)} />}
          {tab === 'lostfound' && <LostFoundForm onAdded={() => loadData(tab)} />}
          {tab === 'masters' && <MastersForm onAdded={() => loadData(tab)} />}
        </div>

        {/* დასამტკიცებელი სექცია */}
        <section className="mb-10">
          <h3 className="text-sm font-black uppercase text-white/40 mb-4 tracking-widest">დასამტკიცებელი ({pending.items.length})</h3>
          <div className="grid gap-3">
            {pending.items.map((it) => (
              <div key={it.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 flex justify-between items-center group">
                <div>
                  <div className="font-bold text-sm">{getItemLabel(it)}</div>
                </div>
                <button
                  onClick={async () => {
                    if (!pending.type) return;
                    await (supabase as any).from(getTableName(pending.type)).update({ is_approved: true }).eq('id', it.id);
                    loadData(pending.type);
                  }}
                  className="bg-green-600 text-white text-[10px] font-bold px-4 py-2 rounded-xl"
                >
                  დამტკიცება
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
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
      <input value={name} onChange={e => setName(e.target.value)} placeholder="ოსტატის სახელი" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-blue-600 outline-none" />
      <button onClick={submit} className="bg-blue-600 px-6 py-2 rounded-xl text-xs font-black uppercase">დამატება</button>
    </div>
  );
}