'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';
import imageCompression from 'browser-image-compression';

const OCCASIONS = [
  'დაბადების დღე',
  'დაქორწინება',
  'შობა',
  'ახალი წელი',
  'სხვა'
];

export default function SubmitCongratulations() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    sender_name: '',
    recipient_name: '',
    message: '',
    occasion: OCCASIONS[0]
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = '';

      if (file) {
        const compressed = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 800 });
        const fileName = `congrats-${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('congratulations')
          .upload(fileName, compressed);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('congratulations')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      const { error } = await (supabase as any).from('congratulations').insert([{
        sender_name: formData.sender_name,
        receiver_name: formData.recipient_name,
        message: formData.message,
        category: formData.occasion,
        theme: formData.occasion,
        image_url: imageUrl || null
      }]);

      if (error) throw error;

      alert('მისალოცი ბარათი გაიგზავნა! ადმინისტრატორის დადასტურების შემდეგ გამოჩნდება საიტზე.');
      router.push('/community/congratulations');

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert('შეცდომა: ' + message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050510] flex items-center justify-center p-6 text-white font-sans">
      <div className="max-w-md w-full">
        <div className="bg-white/[0.03] backdrop-blur-3xl rounded-[50px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] p-10 md:p-14 border border-white/10 relative overflow-hidden">

          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-amber-600 to-transparent" />

          <div className="text-center mb-10">
            <div className="inline-block p-4 bg-white/5 rounded-3xl mb-4 border border-white/5">
              <span className="text-4xl">🎉</span>
            </div>
            <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">
              მისალოცი ბარათი
            </h1>
            <p className="text-white/30 font-bold text-[10px] mt-3 uppercase tracking-[0.2em] italic">
              გაუგზავნეთ მისალოცი საიტის საშუალებით
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <input
                type="text"
                placeholder="თქვენი სახელი"
                className="w-full p-6 bg-white/5 rounded-[24px] border-2 border-white/5 outline-none transition-all font-black text-center text-xl tracking-widest text-white placeholder:text-white/10 placeholder:tracking-normal focus:border-amber-600 focus:bg-white/10"
                value={formData.sender_name}
                onChange={(e) => setFormData({...formData, sender_name: e.target.value})}
                required
              />

              <input
                type="text"
                placeholder="მიმღების სახელი"
                className="w-full p-6 bg-white/5 rounded-[24px] border-2 border-white/5 outline-none transition-all font-black text-center text-xl tracking-widest text-white placeholder:text-white/10 placeholder:tracking-normal focus:border-amber-600 focus:bg-white/10"
                value={formData.recipient_name}
                onChange={(e) => setFormData({...formData, recipient_name: e.target.value})}
                required
              />

              <select
                className="w-full p-6 bg-white/5 rounded-[24px] border-2 border-white/5 outline-none transition-all font-black text-center text-xl tracking-widest text-white focus:border-amber-600 focus:bg-white/10"
                value={formData.occasion}
                onChange={(e) => setFormData({...formData, occasion: e.target.value})}
              >
                {OCCASIONS.map(occasion => (
                  <option key={occasion} value={occasion}>{occasion}</option>
                ))}
              </select>

              <textarea
                placeholder="მისალოცი ტექსტი"
                rows={4}
                className="w-full p-6 bg-white/5 rounded-[24px] border-2 border-white/5 outline-none transition-all font-bold text-center text-lg tracking-wide text-white placeholder:text-white/10 placeholder:tracking-normal focus:border-amber-600 focus:bg-white/10 resize-none"
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                required
              />

              <div className="space-y-2">
                <label className="block text-white/60 font-bold text-sm text-center">
                  სურვილისამებრ სურათი (არასავალდებულო)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full p-4 bg-white/5 rounded-[24px] border-2 border-white/5 outline-none transition-all font-bold text-center text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-amber-600 file:text-white hover:file:bg-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 text-white py-6 rounded-[24px] font-black text-xs uppercase italic tracking-widest hover:bg-amber-500 transition-all shadow-[0_20px_40px_-10px_rgba(217,119,6,0.3)] active:scale-95 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="group-hover:tracking-[0.3em] transition-all duration-300">
                {loading ? 'იგზავნება...' : 'გაგზავნა →'}
              </span>
            </button>
          </form>

          <div className="mt-10 text-center">
            <Link
              href="/community/congratulations"
              className="text-white/20 font-black uppercase italic text-[9px] tracking-widest hover:text-white transition-all border-b border-transparent hover:border-white/10 pb-1"
            >
              ← უკან დაბრუნება
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}