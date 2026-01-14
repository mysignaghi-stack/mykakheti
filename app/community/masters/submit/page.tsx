'use client';

import { useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function MastersSubmit() {
  const [full_name, setFullName] = useState('');
  const [profession, setProfession] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [photo_url, setPhotoUrl] = useState('');
  const [service_area, setServiceArea] = useState('');
  const [price_note, setPriceNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submit = async (e: any) => {
    e.preventDefault();
    if (!full_name || !profession) return alert('სახელი და პროფესიას აუცილებელია');
    const { error } = await supabase.from('masters').insert({
      full_name, profession,
      phone: phone||null, location: location||null, description: description||null,
      photo_url: photo_url||null, service_area: service_area||null, price_note: price_note||null,
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
        <h1 className="text-2xl font-black text-amber-500 uppercase italic mb-6">ოსტატის პროფილის გამოქვეყნება</h1>
        <form className="space-y-3" onSubmit={submit}>
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
          <div className="flex justify-end"><button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-5 py-2 font-bold">გაგზავნა</button></div>
        </form>
      </div>
    </main>
  );
}
