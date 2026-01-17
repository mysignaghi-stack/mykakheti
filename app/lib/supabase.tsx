'use client';

import { useState } from 'react';
import type { Database } from '@/types/supabase';
import { supabase } from '../../lib/supabase';

type CommunityTab = 'obituaries' | 'lostfound' | 'masters';
type ObituaryRow = Database['public']['Tables']['obituaries']['Row'];
type LostFoundRow = Database['public']['Tables']['lost_found']['Row'];
type MasterRow = Database['public']['Tables']['masters']['Row'];
type CommunityItem = ObituaryRow | LostFoundRow | MasterRow;
type PendingState = { type: CommunityTab | ''; items: CommunityItem[] };

const getTableName = (t: CommunityTab): 'obituaries' | 'lost_found' | 'masters' => {
  if (t === 'lostfound') return 'lost_found';
  return t;
};

const getItemLabel = (item: CommunityItem) => {
  if ('title' in item && item.title) return item.title;
  if ('full_name' in item && item.full_name) return item.full_name;
  if ('profession' in item && item.profession) return item.profession;
  return String(item.id);
};

export default function AdminCommunityPage() {
  const [tab, setTab] = useState<CommunityTab>('obituaries');
  const [pending, setPending] = useState<PendingState>({ type: '', items: [] });
  const [approved, setApproved] = useState<PendingState>({ type: '', items: [] });

  async function loadPending(t: CommunityTab) {
    if (t === 'lostfound') {
      const { data } = await supabase
        .from('lost_found')
        .select('*')
        .eq('is_approved', false)
        .order('created_at', { ascending: false });
      setPending({ type: t, items: data ?? [] });
      return;
    }
    if (t === 'obituaries') {
      const { data } = await supabase
        .from('obituaries')
        .select('*')
        .eq('is_approved', false)
        .order('created_at', { ascending: false });
      setPending({ type: t, items: data ?? [] });
      return;
    }
    const { data } = await supabase
      .from('masters')
      .select('*')
      .eq('is_approved', false)
      .order('created_at', { ascending: false });
    setPending({ type: t, items: data ?? [] });
  }

  async function loadApproved(t: CommunityTab) {
    if (t === 'lostfound') {
      const { data } = await supabase
        .from('lost_found')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
      setApproved({ type: t, items: data ?? [] });
      return;
    }
    if (t === 'obituaries') {
      const { data } = await supabase
        .from('obituaries')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
      setApproved({ type: t, items: data ?? [] });
      return;
    }
    const { data } = await supabase
      .from('masters')
      .select('*')
      .eq('is_approved', true)
      .order('created_at', { ascending: false });
    setApproved({ type: t, items: data ?? [] });
  }

  return (
    <main className="min-h-screen bg-[#050510] p-6 md:p-10 text-white">
      <div className="max-w-5xl mx-auto">
        <div className="flex gap-2 mb-6">
          {[
            { key: 'obituaries' as const, label: 'სამძიმარი' },
            { key: 'lostfound' as const, label: 'დაკარგული/ნაპოვნი' },
            { key: 'masters' as const, label: 'ოსტატები' }
          ].map(t => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                loadPending(t.key);
                loadApproved(t.key);
              }}
              className={`px-3 py-2 rounded-xl text-xs border ${tab===t.key?'bg-amber-600 text-white border-amber-600':'bg-white/5 text-white border-white/10'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab==='obituaries' && <ObituariesForm />}
        {tab==='lostfound' && <LostFoundForm />}
        {tab==='masters' && <MastersForm />}

        <div className="mt-8">
          <h3 className="text-lg font-black uppercase italic text-white/70">დასამტკიცებელი ({pending.items.length})</h3>
          <div className="space-y-2 mt-2">
            {pending.items.map((it) => (
              <div key={it.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 flex justify-between items-center">
                <div className="text-sm">
                  <div className="font-black">{getItemLabel(it)}</div>
                  {'location' in it && it.location && (<div className="text-[11px] text-white/50">{it.location}</div>)}
                </div>
                <div className="flex gap-2">
                  <button onClick={async () => {
                    if (!pending.type) return;
                    const table = getTableName(pending.type);
                    await supabase.from(table).update({ is_approved: true }).eq('id', it.id);
                    loadPending(pending.type);
                    loadApproved(pending.type);
                  }} className="bg-green-600 text-white px-3 py-1 rounded">დამტკიცება</button>
                  <button onClick={async () => {
                    if (!pending.type) return;
                    const table = getTableName(pending.type);
                    await supabase.from(table).delete().eq('id', it.id);
                    loadPending(pending.type);
                  }} className="bg-red-600/20 text-red-400 px-3 py-1 rounded hover:bg-red-600 hover:text-white">წაშლა</button>
                </div>
              </div>
            ))}
            {pending.items.length === 0 && (<div className="opacity-30 italic">დასამტკიცებელი რეკორდები არ არის</div>)}
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-black uppercase italic text-white/70">დამტკიცებული განცხადებები ({approved.items.length})</h3>
          <div className="space-y-2 mt-2">
            {approved.items.map((it) => (
              <div key={it.id} className="p-4 bg-green-500/5 rounded-2xl border border-green-500/20 flex justify-between items-center">
                <div className="text-sm">
                  <div className="font-black">{getItemLabel(it)}</div>
                  {'location' in it && it.location && (<div className="text-[11px] text-white/50">{it.location}</div>)}
                  <div className="text-[10px] text-green-400 font-bold uppercase">დამტკიცებული</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={async () => { 
                    if (!confirm('ნამდვილად გსურთ წაშლა? ეს ქმედება შეუქცევადია.')) return;
                    if (!approved.type) return;
                    const table = getTableName(approved.type);
                    await supabase.from(table).delete().eq('id', it.id); 
                    loadApproved(approved.type); 
                  }} className="bg-red-600/20 text-red-400 px-3 py-1 rounded hover:bg-red-600 hover:text-white">წაშლა</button>
                  {approved.type === 'lostfound' && (
                    <button onClick={async () => { 
                      await supabase.from('lost_found').update({ resolved: true }).eq('id', it.id); 
                      if (approved.type) loadApproved(approved.type); 
                    }} className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded hover:bg-blue-600 hover:text-white">მონიშნე როგორც გადაწყვეტილი</button>
                  )}
                </div>
              </div>
            ))}
            {approved.items.length === 0 && (<div className="opacity-30 italic">დამტკიცებული რეკორდები არ არის</div>)}
          </div>
        </div>
      </div>
    </main>
  );
}

function ObituariesForm() {
  const [full_name, setFullName] = useState('');
  const [date_of_death, setDOD] = useState('');
  const [funeral_at, setFuneralAt] = useState('');
  const [funeral_place, setPlace] = useState('');
  const [contacts, setContacts] = useState('');
  const [notes, setNotes] = useState('');

  const submit = async () => {
    if (!full_name) return alert('სახელი აუცილებელია');
    const { error } = await supabase.from('obituaries').insert({
      full_name,
      date_of_death: date_of_death || null,
      funeral_at: funeral_at || null,
      funeral_place: funeral_place || null,
      contacts: contacts || null,
      notes: notes || null
    });
    if (error) return alert('შეცდომა: '+error.message);
    alert('დაემატა'); setFullName(''); setDOD(''); setFuneralAt(''); setPlace(''); setContacts(''); setNotes('');
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-black text-amber-500 uppercase italic">სამძიმრის ჩანაწერი</h2>
      <input value={full_name} onChange={e=>setFullName(e.target.value)} placeholder="სრული სახელი" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
      <div className="grid grid-cols-2 gap-3">
        <input type="date" value={date_of_death} onChange={e=>setDOD(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
        <input type="datetime-local" value={funeral_at} onChange={e=>setFuneralAt(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
      </div>
      <input value={funeral_place} onChange={e=>setPlace(e.target.value)} placeholder="გასვენების ადგილი" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
      <input value={contacts} onChange={e=>setContacts(e.target.value)} placeholder="კონტაქტი" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
      <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="შენიშვნები" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white min-h-24" />
      <div className="flex justify-end"><button onClick={submit} className="bg-amber-600 hover:bg-amber-500 text-white rounded-xl px-5 py-2 font-bold">დამატება</button></div>
    </div>
  );
}

function LostFoundForm() {
  const [kind, setKind] = useState<'lost'|'found'>('lost');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [event_date, setEventDate] = useState('');
  const [contact, setContact] = useState('');
  const [category, setCategory] = useState<'document' | 'pet' | 'keys_items' | 'other'>('other');
  const [reward, setReward] = useState(false);
  const [reward_note, setRewardNote] = useState('');
  const [expires_at, setExpiresAt] = useState('');

  const submit = async () => {
    if (!title) return alert('სათაური აუცილებელია');
    const { error } = await supabase.from('lost_found').insert({
      kind, title,
      category,
      description: description||null,
      location: location||null,
      event_date: event_date||null,
      contact: contact||null,
      reward,
      reward_note: reward ? (reward_note||null) : null,
      expires_at: expires_at||null
    });
    if (error) return alert('შეცდომა: '+error.message);
    alert('დაემატა'); setKind('lost'); setTitle(''); setDescription(''); setLocation(''); setEventDate(''); setContact(''); setCategory('other'); setReward(false); setRewardNote(''); setExpiresAt('');
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-black text-green-500 uppercase italic">დაკარგული/ნაპოვნი</h2>
      <div className="flex gap-2">
        {[
          { key: 'lost' as const, label: 'დაკარგული' },
          { key: 'found' as const, label: 'ნაპოვნი' }
        ].map(k => (
          <button key={k.key} onClick={()=>setKind(k.key)} className={`px-3 py-2 rounded-xl text-xs border ${kind===k.key?'bg-green-600 text-white border-green-600':'bg-white/5 text-white border-white/10'}`}>{k.label}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <select value={category} onChange={e=>setCategory(e.target.value as 'document' | 'pet' | 'keys_items' | 'other')} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white">
          <option value="document">პირადი დოკუმენტები</option>
          <option value="pet">შინაური ცხოველები</option>
          <option value="keys_items">გასაღები/ნივთები</option>
          <option value="other">სხვა</option>
        </select>
        <input type="date" value={event_date} onChange={e=>setEventDate(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
      </div>
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="სათაური" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
      <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="აღწერა" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white min-h-24" />
      <div className="grid grid-cols-2 gap-3">
        <input value={location} onChange={e=>setLocation(e.target.value)} placeholder="ლოკაცია" className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
        <input type="datetime-local" value={expires_at} onChange={e=>setExpiresAt(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" placeholder="ვადა (არასავალდებულო)" />
      </div>
      <input value={contact} onChange={e=>setContact(e.target.value)} placeholder="კონტაქტი" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
      {kind==='lost' && (
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-white/80"><input type="checkbox" checked={reward} onChange={e=>setReward(e.target.checked)} /> მპოვნელს დავასაჩუქრებ</label>
          {reward && (
            <input value={reward_note} onChange={e=>setRewardNote(e.target.value)} placeholder="დეტალი (სურვილისამებრ)" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
          )}
        </div>
      )}
      <div className="flex justify-end"><button onClick={submit} className="bg-green-600 hover:bg-green-500 text-white rounded-xl px-5 py-2 font-bold">დამატება</button></div>
    </div>
  );
}

function MastersForm() {
  const [full_name, setFullName] = useState('');
  const [profession, setProfession] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [photo_url, setPhotoUrl] = useState('');
  const [service_area, setServiceArea] = useState('');
  const [price_note, setPriceNote] = useState('');
  const [verified, setVerified] = useState(false);
  const [admin_recommended, setAdminRecommended] = useState(false);
  const [portfolio, setPortfolio] = useState('');

  const submit = async () => {
    if (!full_name || !profession) return alert('სახელი და პროფესიას აუცილებელია');
    const { data, error } = await supabase.from('masters').insert({
      full_name, profession,
      phone: phone||null, location: location||null, description: description||null,
      photo_url: photo_url||null, service_area: service_area||null, price_note: price_note||null,
      verified, admin_recommended
    }).select().single();
    if (error) return alert('შეცდომა: '+error.message);
    const urls = portfolio.split(',').map(s=>s.trim()).filter(Boolean);
    if (data && urls.length>0) {
      await supabase.from('master_portfolio').insert(urls.map(u => ({ master_id: data.id, media_url: u })));
    }
    alert('დაემატა'); setFullName(''); setProfession(''); setPhone(''); setLocation(''); setDescription(''); setPhotoUrl(''); setServiceArea(''); setPriceNote(''); setVerified(false); setAdminRecommended(false); setPortfolio('');
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-black text-blue-500 uppercase italic">ოსტატის დამატება</h2>
      <input value={full_name} onChange={e=>setFullName(e.target.value)} placeholder="სრული სახელი" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
      <input value={profession} onChange={e=>setProfession(e.target.value)} placeholder="პროფესია" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
      <div className="grid grid-cols-2 gap-3">
        <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="ტელეფონი" className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
        <input value={location} onChange={e=>setLocation(e.target.value)} placeholder="ლოკაცია" className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
      </div>
      <input value={service_area} onChange={e=>setServiceArea(e.target.value)} placeholder="სამუშაო არეალი (მაგ. მხოლოდ წნორი/სოფლები)" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
      <input value={price_note} onChange={e=>setPriceNote(e.target.value)} placeholder="ფასი (მაგ. კვადრატული X ლარიდან)" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
      <input value={photo_url} onChange={e=>setPhotoUrl(e.target.value)} placeholder="ფოტოს URL" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
      <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="მოკლე აღწერა" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white min-h-24" />
      <textarea value={portfolio} onChange={e=>setPortfolio(e.target.value)} placeholder="პორტფოლიო სურათების URL-ები (გამოყავით მძიმით)" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white min-h-24" />
      <div className="flex items-center gap-4 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={verified} onChange={e=>setVerified(e.target.checked)} /> შემოწმებული</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={admin_recommended} onChange={e=>setAdminRecommended(e.target.checked)} /> ადმინ რეკომენდაცია</label>
      </div>
      <div className="flex justify-end"><button onClick={submit} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-5 py-2 font-bold">დამატება</button></div>
    </div>
  );
}

export { supabase };