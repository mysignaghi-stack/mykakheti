'use client';

import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function ChallengeCreator() {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [loading, setLoading] = useState(false);

  const createChallenge = async () => {
    const cleanTitle = title.trim();
    const cleanDesc = desc.trim();
    if (!cleanTitle || !cleanDesc) {
      alert('სათაური და აღწერა აუცილებელია.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await (supabase as any).from('challenges').insert({
        title: cleanTitle,
        description: cleanDesc,
        start_at: start || null,
        end_at: end || null,
        status: 'draft'
      });
      if (error) throw error;
      alert('ჩელენჯი შექმნილია!');
      setTitle(''); setDesc(''); setStart(''); setEnd('');
    } catch (e) {
      console.error(e);
      alert('შეცდომა ჩელენჯის შექმნისას.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/[0.03] p-6 rounded-[32px] border border-white/10 shadow-2xl">
      <h3 className="text-lg font-black text-blue-500 uppercase italic mb-4">ახალგაზრდული ჩელენჯი</h3>
      <div className="space-y-3">
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="სათაური" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" />
        <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="აღწერა" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-blue-500 outline-none min-h-24" />
        <div className="grid grid-cols-2 gap-3">
          <input type="datetime-local" value={start} onChange={e => setStart(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" />
          <input type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" />
        </div>
        <div className="flex justify-end">
          <button onClick={createChallenge} disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-5 py-2 font-bold">
            {loading ? 'იტვირთება...' : 'შექმნა'}
          </button>
        </div>
      </div>
    </div>
  );
}
