'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';
import imageCompression from 'browser-image-compression';
import SubmissionAuthGate from '../../../components/auth/SubmissionAuthGate';

export default function LostFoundSubmit() {
  const [kind, setKind] = useState<'lost'|'found'>('lost');
  const [category, setCategory] = useState<'personal_documents_wallet'|'electronics_gadgets'|'accessories_jewelry'|'bags_luggage'|'clothing_footwear'|'pet'|'tools_agricultural'|'children_items'|'transport_sports'|'person'|'other'>('other');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [event_date, setEventDate] = useState('');
  const [contact, setContact] = useState('');
  const [reward, setReward] = useState(false);
  const [reward_note, setRewardNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const KIND_LABELS: Record<'lost'|'found', string> = {
    lost: 'დაკარგული',
    found: 'ნაპოვნი',
  };

  const getErrorMessage = (err: unknown) => {
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    if (err && typeof err === 'object' && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
      return (err as { message: string }).message;
    }
    try {
      return JSON.stringify(err);
    } catch {
      return 'უცნობი შეცდომა';
    }
  };

  const handleFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(event.target.files || []);
    if (files.length + incoming.length > 3) {
      alert('მაქსიმუმ 3 ფოტოს ატვირთვა შეიძლება.');
      return;
    }
    const nextFiles: File[] = [];
    const nextPreviews: string[] = [];
    incoming.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      nextFiles.push(file);
      nextPreviews.push(URL.createObjectURL(file));
    });
    setFiles((prev) => [...prev, ...nextFiles]);
    setPreviews((prev) => [...prev, ...nextPreviews]);
  };

  const removeFile = (index: number) => {
    const nextFiles = [...files];
    const nextPreviews = [...previews];
    const removed = nextPreviews[index];
    if (removed) URL.revokeObjectURL(removed);
    nextFiles.splice(index, 1);
    nextPreviews.splice(index, 1);
    setFiles(nextFiles);
    setPreviews(nextPreviews);
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title) return alert('სათაური აუცილებელია');
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert('განცხადების დასამატებლად საჭიროა სწრაფი რეგისტრაცია ან ავტორიზაცია.');
      setLoading(false);
      return;
    }

    try {
      let imageUrl: string | null = null;
      let imageUrls: string[] = [];

      if (files.length > 0) {
        const uploads: string[] = [];
        for (const file of files) {
          const compressed = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: true });
          const fileName = `lost-found-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
          const formData = new FormData();
          formData.append('file', compressed, fileName);
          formData.append('fileName', fileName);
          formData.append('bucket', 'lost_found');

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          const result = await response.json();
          if (!response.ok) {
            throw new Error(result?.error || 'Storage upload failed');
          }

          uploads.push(result.urls[0] as string);
        }
        imageUrls = uploads;
        imageUrl = uploads[0] ?? null;
      }

      const response = await fetch('/api/community/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'lost_found',
          values: {
            kind,
            title,
            category,
            description: description || null,
            location: location || null,
            event_date: event_date || null,
            contact: contact || null,
            reward,
            reward_note: reward ? (reward_note || null) : null,
            image_url: imageUrl,
            all_images: imageUrls.length > 0 ? imageUrls : null,
            is_approved: false,
          },
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error ?? 'უცნობი შეცდომა');
      }
      setSubmitted(true);
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      console.error('Lost found submit error:', error);
      alert('შეცდომა: ' + message);
    } finally {
      setLoading(false);
    }
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
        <div className="flex justify-start mb-4">
          <Link href="/" className="text-[11px] font-black uppercase italic text-white/50 hover:text-white transition">← მთავარი გვერდი</Link>
        </div>
        <h1 className="text-2xl font-black text-amber-500 uppercase italic mb-6">დაკარგული/ნაპოვნის გამოქვეყნება</h1>
        <SubmissionAuthGate redirectPath="/community/lost-found/submit" heading="განცხადებების გამოქვეყნება შესაძლებელია გამარტივებული ავტორიზაციის დასრულების შემდეგ.">
          {() => (
            <form className="space-y-3" onSubmit={submit}>
              <div className="flex gap-2">
                {(['lost','found'] as const).map(k => (
                  <button key={k} onClick={()=>setKind(k)} type="button" className={`px-3 py-2 rounded-xl text-xs border ${kind===k?'bg-green-600 text-white border-green-600':'bg-white/5 text-white border-white/10'}`}>{KIND_LABELS[k]}</button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select value={category} onChange={e=>setCategory(e.target.value as 'personal_documents_wallet'|'electronics_gadgets'|'accessories_jewelry'|'bags_luggage'|'clothing_footwear'|'pet'|'tools_agricultural'|'children_items'|'transport_sports'|'person'|'other')} className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white">
                  <option value="personal_documents_wallet">პირადი დოკუმენტები და საფულე</option>
                  <option value="electronics_gadgets">ელექტრონიკა და გაჯეტები</option>
                  <option value="accessories_jewelry">აქსესუარები და სამკაულები</option>
                  <option value="bags_luggage">ჩანთები და ბარგი</option>
                  <option value="clothing_footwear">ტანსაცმელი და ფეხსაცმელი</option>
                  <option value="pet">შინაური ცხოველები</option>
                  <option value="tools_agricultural">პირუტყვი და სასოფლო-სამეურნეო ინვენტარი</option>
                  <option value="children_items">საბავშვო ნივთები</option>
                  <option value="transport_sports">ტრანსპორტი და სპორტი</option>
                  <option value="person">ადამიანი</option>
                  <option value="other">სხვადასხვა</option>
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
              <div className="space-y-3">
                <label className="block text-white/60 font-bold text-sm text-center">
                  ფოტოები (მაქსიმუმ 3)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {previews.map((src, idx) => (
                    <div key={src} className="relative aspect-square rounded-2xl overflow-hidden border border-white/10">
                      <img src={src} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="absolute inset-0 bg-red-600/70 opacity-0 hover:opacity-100 transition-opacity text-[10px] font-black uppercase"
                      >
                        წაშლა
                      </button>
                    </div>
                  ))}
                  {files.length < 3 && (
                    <label className="aspect-square rounded-2xl border border-dashed border-white/20 bg-white/5 flex items-center justify-center text-white/40 text-2xl cursor-pointer hover:border-amber-500 hover:text-amber-400 transition">
                      +
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFilesChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <p className="text-[11px] text-white/40 text-center">ფოტოები ავტომატურად კომპრესდება მაქს. 500KB-მდე.</p>
              </div>
              <div className="flex justify-end"><button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-500 text-white rounded-xl px-5 py-2 font-bold disabled:opacity-50 disabled:cursor-not-allowed">{loading ? 'იგზავნება...' : 'გაგზავნა'}</button></div>
            </form>
          )}
        </SubmissionAuthGate>
      </div>
    </main>
  );
}
