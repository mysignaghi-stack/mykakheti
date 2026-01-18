'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';
import imageCompression from 'browser-image-compression';
import SubmissionAuthGate from '../../../components/auth/SubmissionAuthGate';

const CATEGORY_OPTIONS = [
  { value: 'დაბადების დღე', label: 'დაბადების დღე 🎂' },
  { value: 'ქორწილი და ნიშნობა', label: 'ქორწილი და ნიშნობა 💍' },
  { value: 'შვილის შეძენა', label: 'შვილის შეძენა 👶' },
  { value: 'ქორწინების იუბილე', label: 'ქორწინების იუბილე 🎊' },
  { value: 'ანგელოზის დღე', label: 'ანგელოზის დღე ✨' },
  { value: 'აღდგომა', label: 'აღდგომა 🥚' },
  { value: 'შობა', label: 'შობა 🌟' },
  { value: 'გიორგობა', label: 'გიორგობა ⛪' },
  { value: 'მარიამობა', label: 'მარიამობა 🌸' },
  { value: 'ნათლისღება', label: 'ნათლისღება 💧' },
  { value: 'ახალი წელი', label: 'ახალი წელი 🎄' },
  { value: 'ბედობა', label: 'ბედობა 🎭' },
  { value: 'დედის დღე', label: 'დედის დღე 🌷' },
  { value: 'ქალთა დღე', label: 'ქალთა დღე 💐' },
  { value: 'დამოუკიდებლობის დღე', label: 'დამოუკიდებლობის დღე 🇬🇪' },
  { value: 'სიყვარულის დღე', label: 'სიყვარულის დღე ❤️' },
  { value: 'სწავლის დასრულება', label: 'სწავლის დასრულება 🎓' },
  { value: 'ახალი სამსახური', label: 'ახალი სამსახური 💼' },
  { value: 'ახალმოსახლეობა', label: 'ახალმოსახლეობა 🔑' },
  { value: 'პენსიაზე გასვლა', label: 'პენსიაზე გასვლა 🎖️' },
  { value: 'რთველი', label: 'რთველი 🍇' },
  { value: 'თბილისობა', label: 'თბილისობა 🎡' },
];

const STYLE_OPTIONS = [
  { value: 'ელეგანტური', label: 'ელეგანტური ✨' },
  { value: 'კლასიკური', label: 'კლასიკური 🕊️' },
  { value: 'ფერმკრთალი', label: 'ფერმკრთალი 🌫️' },
  { value: 'მხიარული', label: 'მხიარული 🎉' },
  { value: 'ქართულ-ტრადიციული', label: 'ქართულ-ტრადიციული 🇬🇪' },
];

export default function SubmitCongratulations() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    sender_name: '',
    recipient_name: '',
    message: '',
    category: CATEGORY_OPTIONS[0]?.value ?? 'დაბადების დღე',
    theme: STYLE_OPTIONS[0]?.value ?? 'ელეგანტური'
  });
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert('ბარათის დასამატებლად საჭიროა გამარტივებული ავტორიზაცია.');
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
          const fileName = `congrats-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
          const { error: uploadError } = await supabase.storage
            .from('congratulations')
            .upload(fileName, compressed);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('congratulations')
            .getPublicUrl(fileName);

          uploads.push(publicUrl);
        }
        imageUrls = uploads;
        imageUrl = uploads[0] ?? null;
      }

      const { error } = await (supabase as any).from('congratulations').insert([{
        sender_name: formData.sender_name,
        receiver_name: formData.recipient_name,
        message: formData.message,
        category: formData.category,
        theme: formData.theme,
        image_url: imageUrl,
        all_images: imageUrls.length > 0 ? imageUrls : null,
        is_approved: false
      }]);

      if (error) throw error;

      alert('მისალოცი ბარათი გაიგზავნა! ადმინისტრატორის დადასტურების შემდეგ გამოჩნდება საიტზე.');
      router.push('/community/congratulations');

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      alert('შეცდომა: ' + message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050510] flex items-center justify-center p-6 text-white font-sans">
      <div className="max-w-md w-full">
        <div className="flex justify-start mb-4">
          <Link href="/" className="text-[11px] font-black uppercase italic text-white/50 hover:text-white transition">← მთავარი გვერდი</Link>
        </div>
        <div className="bg-slate-950/80 backdrop-blur-3xl rounded-[50px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] p-10 md:p-14 border border-white/10 relative overflow-hidden">

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

          <SubmissionAuthGate redirectPath="/community/congratulations/submit" heading="განცხადებების გამოქვეყნება შესაძლებელია გამარტივებული ავტორიზაციის დასრულების შემდეგ.">
            {() => (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="ავტორი"
                    className="w-full p-6 bg-white/5 rounded-[24px] border-2 border-white/5 outline-none transition-all font-black text-center text-xl tracking-widest text-white placeholder:text-white/10 placeholder:tracking-normal focus:border-amber-600 focus:bg-white/10"
                    value={formData.sender_name}
                    onChange={(e) => setFormData({...formData, sender_name: e.target.value})}
                    required
                  />

                  <input
                    type="text"
                    placeholder="ვის ვულოცავთ"
                    className="w-full p-6 bg-white/5 rounded-[24px] border-2 border-white/5 outline-none transition-all font-black text-center text-xl tracking-widest text-white placeholder:text-white/10 placeholder:tracking-normal focus:border-amber-600 focus:bg-white/10"
                    value={formData.recipient_name}
                    onChange={(e) => setFormData({...formData, recipient_name: e.target.value})}
                    required
                  />

                  <div className="rounded-[24px] bg-white/5 border border-white/10 p-4">
                    <p className="text-[11px] font-black uppercase text-white/60 mb-3 tracking-widest">კატეგორია</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {CATEGORY_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, category: option.value })}
                          className={`rounded-2xl px-3 py-3 text-[11px] font-black uppercase tracking-wide transition-all border ${
                            formData.category === option.value
                              ? 'bg-amber-600/30 border-amber-500 text-white'
                              : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[24px] bg-white/5 border border-white/10 p-4">
                    <p className="text-[11px] font-black uppercase text-white/60 mb-3 tracking-widest">დიზაინის სტილი</p>
                    <div className="grid grid-cols-2 gap-2">
                      {STYLE_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, theme: option.value })}
                          className={`rounded-2xl px-3 py-3 text-[11px] font-black uppercase tracking-wide transition-all border ${
                            formData.theme === option.value
                              ? 'bg-emerald-500/20 border-emerald-400 text-white'
                              : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    placeholder="მისალოცი ტექსტი"
                    rows={4}
                    className="w-full p-6 bg-white/5 rounded-[24px] border-2 border-white/5 outline-none transition-all font-bold text-center text-lg tracking-wide text-white placeholder:text-white/10 placeholder:tracking-normal focus:border-amber-600 focus:bg-white/10 resize-none"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    required
                  />

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
            )}
          </SubmissionAuthGate>

          <div className="mt-10" />
        </div>
      </div>
    </main>
  );
}