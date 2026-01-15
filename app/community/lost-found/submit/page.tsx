'use client';

import { useState, type FormEvent } from 'react';
import { supabase } from '../../../lib/supabase';

export default function LostFoundSubmit() {
  const [kind, setKind] = useState<'lost'|'found'>('lost');
  const [category, setCategory] = useState<'document'|'pet'|'keys_items'|'other'>('other');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [event_date, setEventDate] = useState('');
  const [contact, setContact] = useState('');
  const [reward, setReward] = useState(false);
  const [reward_note, setRewardNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const KIND_LABELS: Record<'lost'|'found', string> = {
    lost: 'დაკარგული',
    found: 'ნაპოვნი',
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title) return alert('სათაური აუცილებელია');
    const { error } = await supabase.from('lost_found').insert({
      kind, title, category,
      description: description||null,
      location: location||null,
      event_date: event_date||null,
      contact: contact||null,
      reward,
      reward_note: reward ? (reward_note||null) : null,
      is_approved: false
    });
    if (error) return alert('შეცდომა: '+error.message);
    setSubmitted(true);
  };

  if (submitted) return (
    <main className="min-h-screen bg-[#050510] p-6 md:p-10 text-white">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-2xl font-black text-amber-500 uppercase italic mb-4">გმადლობთ!</h1>
        <p className="text-white/80">ჩანაწერი გაიგზავნა მოდერაციაზე და გამოჩნდება დამტკიცების შემდეგ.</p>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-[#050510] p-6 md:p-10 text-white">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-black text-amber-500 uppercase italic mb-6">დაკარგული/ნაპოვნის გამოქვეყნება</h1>
        <form className="space-y-3" onSubmit={submit}>
          <div className="flex gap-2">
            {(['lost','found'] as const).map(k => (
              <button key={k} onClick={()=>setKind(k)} type="button" className={`px-3 py-2 rounded-xl text-xs border ${kind===k?'bg-green-600 text-white border-green-600':'bg-white/5 text-white border-white/10'}`}>{KIND_LABELS[k]}</button>
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
            <input value={contact} onChange={e=>setContact(e.target.value)} placeholder="კონტაქტი" className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
          </div>
          {kind==='lost' && (
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-white/80"><input type="checkbox" checked={reward} onChange={e=>setReward(e.target.checked)} /> მპოვნელს დავასაჩუქრებ</label>
              {reward && (
                <input value={reward_note} onChange={e=>setRewardNote(e.target.value)} placeholder="დეტალი (სურვილისამებრ)" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
              )}
            </div>
          )}
          <div className="flex justify-end"><button type="submit" className="bg-green-600 hover:bg-green-500 text-white rounded-xl px-5 py-2 font-bold">გაგზავნა</button></div>
        </form>
      </div>
    </main>
  );
}
