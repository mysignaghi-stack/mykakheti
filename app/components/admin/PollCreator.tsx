'use client';

import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function PollCreator() {
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [loading, setLoading] = useState(false);

  const addOption = () => setOptions(prev => [...prev, '']);
  const removeOption = (i: number) => setOptions(prev => prev.filter((_, idx) => idx !== i));
  const updateOption = (i: number, val: string) => setOptions(prev => prev.map((o, idx) => (idx === i ? val : o)));

  const createPoll = async () => {
    const cleanTitle = title.trim();
    const cleanOptions = options.map(o => o.trim()).filter(o => o.length > 0);
    if (!cleanTitle || cleanOptions.length < 2) {
      alert('სათაური და მინიმუმ 2 ოპცია აუცილებელია.');
      return;
    }
    setLoading(true);
    try {
      const { data: poll, error: pollErr } = await supabase
        .from('polls')
        .insert({ title: cleanTitle, status: 'draft' })
        .select()
        .single();
      if (pollErr) throw pollErr;
      const pollId = poll.id;
      const rows = cleanOptions.map(text => ({ poll_id: pollId, text }));
      const { error: optsErr } = await supabase.from('poll_options').insert(rows);
      if (optsErr) throw optsErr;
      alert('კითხვა შექმნილია!');
      setTitle('');
      setOptions(['', '']);
    } catch (e) {
      console.error(e);
      alert('შეცდომა კითხვის შექმნისას.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/[0.03] p-6 rounded-[32px] border border-white/10 shadow-2xl">
      <h3 className="text-lg font-black text-amber-500 uppercase italic mb-4">ახალგაზრდების გამოკითხვა</h3>
      <div className="space-y-3">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="კითხვა (სათაური)"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
        />
        <div className="space-y-2">
          {options.map((opt, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={opt}
                onChange={e => updateOption(i, e.target.value)}
                placeholder={`옵ცია ${i + 1}`}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
              />
              <button onClick={() => removeOption(i)} className="bg-red-600/20 text-red-400 px-3 rounded-xl hover:bg-red-600 hover:text-white">წაშლა</button>
            </div>
          ))}
          <button onClick={addOption} className="bg-white/5 text-white px-4 py-2 rounded-xl border border-white/10 hover:bg-white hover:text-black">+ ოპცია</button>
        </div>
        <div className="flex justify-end">
          <button onClick={createPoll} disabled={loading} className="bg-amber-600 hover:bg-amber-500 text-white rounded-xl px-5 py-2 font-bold">
            {loading ? 'იტვირთება...' : 'შექმნა'}
          </button>
        </div>
      </div>
    </div>
  );
}
