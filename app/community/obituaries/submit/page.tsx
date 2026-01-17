'use client';

import { useState, type FormEvent } from 'react';
import { supabase } from '../../../lib/supabase';
import SubmissionAuthGate from '../../../components/auth/SubmissionAuthGate';

export default function ObituariesSubmit() {
  const [full_name, setFullName] = useState('');
  const [date_of_death, setDOD] = useState('');
  const [funeral_at, setFuneralAt] = useState('');
  const [funeral_place, setPlace] = useState('');
  const [contacts, setContacts] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!full_name) return alert('სახელი აუცილებელია');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert('სამძიმრის დასამატებლად გაიარეთ ავტორიზაცია.');
      return;
    }
    const { error } = await (supabase as any).from('obituaries').insert({
      full_name,
      date_of_death: date_of_death || null,
      funeral_at: funeral_at || null,
      funeral_place: funeral_place || null,
      contacts: contacts || null,
      notes: notes || null,
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
        <h1 className="text-2xl font-black text-amber-500 uppercase italic mb-6">სამძიმრის გამოქვეყნება</h1>
        <SubmissionAuthGate redirectPath="/community/obituaries/submit" heading="ავტორიზაციის შემდეგ შეძლებთ სამძიმრის დამატებას">
          {() => (
            <form className="space-y-3" onSubmit={submit}>
              <input value={full_name} onChange={e=>setFullName(e.target.value)} placeholder="სრული სახელი" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
              <div className="grid grid-cols-2 gap-3">
                <input type="date" value={date_of_death} onChange={e=>setDOD(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
                <input type="datetime-local" value={funeral_at} onChange={e=>setFuneralAt(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
              </div>
              <input value={funeral_place} onChange={e=>setPlace(e.target.value)} placeholder="გასვენების ადგილი" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
              <input value={contacts} onChange={e=>setContacts(e.target.value)} placeholder="კონტაქტი" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
              <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="შენიშვნები" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white min-h-24" />
              <div className="flex justify-end"><button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white rounded-xl px-5 py-2 font-bold">გაგზავნა</button></div>
            </form>
          )}
        </SubmissionAuthGate>
      </div>
    </main>
  );
}
