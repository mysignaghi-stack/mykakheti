'use client';
import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import imageCompression from 'browser-image-compression';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { LOCATIONS } from '../lib/constants';

// Flatten nested municipalities → cities → villages into unique label strings for select options.
const LOCATION_OPTIONS = Array.from(new Set(
  LOCATIONS.flatMap(m => [
    m.municipality,
    ...m.cities.flatMap(city => [
      city.name,
      ...city.villages.map(village => `${city.name} - ${village}`),
    ]),
  ])
));

// ✅ ყველა კატეგორია (სამუშაო ჯგუფით)
const CATEGORIES = [
  'უძრავი ქონება', 'ავტო', 'დასაქმება', 'სოფლის მეურნეობა', 'ცხოველები', 'ტექნიკა', 'ელექტრონიკა', 'სამედიცინო', 'განათლება', 'მომსახურება', 'სპორტი', 'ტურიზმი', 'სამშენებლო', 'სასტუმროები', 'რესტორნები', 'ვაკანსიები', 'დრიური საწოლი', 'სამუშაო ჯგუფი', 'ტურისტული', 'ღვინო და მარნები', 'კულტურა', 'სხვა'
];

export default function AddPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [bgImage, setBgImage] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const [authError, setAuthError] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registerMessage, setRegisterMessage] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [registerData, setRegisterData] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  
  // ✨ Added 'currency' to form state (default: GEL)
  const [formData, setFormData] = useState({ 
    title: '', description: '', price: '', phone: '', location: LOCATION_OPTIONS[0] ?? '', category: '', currency: 'GEL' 
  });
  const isAuthenticated = Boolean(session);

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

  useEffect(() => {
    async function fetchBG() {
      const { data }: any = await ((supabase as any).from('site_settings')).select('value').eq('key', 'background_url').single();
      if (data && 'value' in data) setBgImage(data.value as string);
    }
    fetchBG();
  }, []);

  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session ?? null);
    };
    loadSession();
  }, []);

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    setAuthError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?redirect=/add` },
    });
    if (error) setAuthError('Social ავტორიზაცია ვერ შესრულდა, სცადეთ თავიდან.');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    router.refresh();
  };

  const handleEmailActivation = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterMessage('');

    if (!registerData.firstName || !registerData.lastName || !registerData.email || !registerData.phone) {
      setRegisterError('გთხოვთ შეავსოთ ყველა ველი.');
      return;
    }

    setRegisterLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: registerData.email,
        options: {
          data: {
            first_name: registerData.firstName,
            last_name: registerData.lastName,
            phone: registerData.phone,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=/add`,
        },
      });

      if (error) throw error;
      setRegisterMessage('აქტივაციის ბმული გაიგზავნა თქვენს მითითებულ ელფოსტაზე. გთხოვთ შეამოწმოთ საფოსტო ყუთი.');
      setRegisterData({ firstName: '', lastName: '', email: '', phone: '' });
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      setRegisterError(`ვერ გაიგზავნა ბმული: ${message}`);
    } finally {
      setRegisterLoading(false);
    }
  };


  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // ✅ 5 ფოტოს მკაცრი ლიმიტი
    if (images.length + files.length > 5) {
      return alert('შეგიძლიათ ატვირთოთ მაქსიმუმ 5 ფოტო მეხსიერების დასაზოგად.');
    }

    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        setImages(prev => [...prev, file]);
        setPreviews(prev => [...prev, URL.createObjectURL(file)]);
      }
    });
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index]);
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    setImages(newImages);
    setPreviews(newPreviews);
  };

  const handlePost = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.category || images.length === 0) {
      return alert('გთხოვთ შეავსოთ ყველა ველი და ატვირთოთ მინიმუმ 1 ფოტო');
    }

    setLoading(true);
    try {
      // Get current user (can be null for anonymous)
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || null;

      const uploadedUrls: string[] = [];
      
      // ✅ ავტომატური კომპრესია ატვირთვისას
      for (const img of images) {
        const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1280, useWebWorker: true };
        const compressedFile = await imageCompression(img, options);
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${img.name.split('.').pop()}`;
        
        const { error: uploadError } = await supabase.storage.from('announcements').upload(fileName, compressedFile);
        if (uploadError) {
          const status = (uploadError as { statusCode?: number }).statusCode;
          const statusInfo = status ? ` (სტატუსი: ${status})` : '';
          // Hint for missing storage policy allowing owner insert
          throw new Error(`Storage upload failed: ${uploadError.message}${statusInfo}. If status is 403, run fix_announcements_storage_policies.sql in Supabase SQL Editor.`);
        }

        const { data: { publicUrl } } = supabase.storage.from('announcements').getPublicUrl(fileName);
        uploadedUrls.push(publicUrl);
      }

      const { data: insertedData, error: dbError } = await ((supabase as any).from('announcements')).insert([{ 
        ...formData, 
        price: formData.price, 
        image_url: uploadedUrls[0], 
        all_images: uploadedUrls, 
        is_approved: false,
        user_id: userId
      }]).select().single();

      if (dbError) throw dbError;
      alert('თქვენი განცხადება წარმატებით გაიგზავნა მოდერაციაზე! 🚀');
      router.push(`/announcements/${insertedData.id}`);
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      console.error('Upload error details:', err);
      alert(`შეცდომა ატვირთვისას: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative flex flex-col bg-[#050510] text-white font-sans">
      <div className="fixed inset-0 z-0">
         {bgImage && (
           <Image
             src={bgImage}
             alt=""
             fill
             sizes="100vw"
             className="object-cover opacity-40 transition-opacity duration-1000"
             priority
           />
         )}
         <div className="absolute inset-0 bg-[#050510]/80 backdrop-blur-[10px]" />
      </div>

      <nav className="relative z-50 px-10 py-6 border-b border-white/10 flex justify-between items-center bg-black/40 backdrop-blur-xl">
        <Link href="/" className="text-xl font-black italic tracking-tighter">mykakheti<span className="text-amber-500">.ge</span></Link>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-[10px] font-black uppercase italic text-white/40 hover:text-white transition-all">← მთავარზე დაბრუნება</Link>
          {isAuthenticated && (
            <button
              type="button"
              onClick={handleSignOut}
              className="text-[10px] font-black uppercase italic text-white/70 hover:text-white transition-all bg-white/5 border border-white/10 rounded-full px-3 py-1"
            >
              გამოსვლა
            </button>
          )}
        </div>
      </nav>

      <div className="relative z-10 max-w-2xl mx-auto w-full px-6 py-20">
        <div className="bg-slate-950/60 backdrop-blur-3xl p-8 md:p-12 rounded-[45px] border border-white/10 shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-black uppercase italic tracking-widest text-amber-500 drop-shadow-lg">განცხადების დამატება</h1>
          </div>

          {!isAuthenticated && (
            <div className="mb-8 space-y-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-50">
              <div className="text-center space-y-2">
                <p className="font-black uppercase tracking-wide text-[11px]">საწყის ეტაპზე საჭიროა ავტორიზაცია ან რეგისტრაცია.</p>
                <p className="text-[11px] text-white/70">რეგისტრაციის დასრულების შემდეგ ავტომატურად გამოჩნდება განცხადების ფორმა.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <h3 className="text-[11px] font-black uppercase tracking-wide text-white/70">სწრაფი სოც. ავტორიზაცია</h3>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => handleOAuth('google')}
                      className="rounded-xl bg-white text-slate-900 font-black py-3 uppercase text-[11px] hover:bg-amber-50 transition"
                    >
                      Google ავტორიზაცია
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOAuth('facebook')}
                      className="rounded-xl bg-[#1877f2] text-white font-black py-3 uppercase text-[11px] hover:bg-[#0f5ccc] transition"
                    >
                      Facebook ავტორიზაცია
                    </button>
                  </div>
                  {authError && <p className="text-red-300 text-xs font-semibold">{authError}</p>}
                </div>

                <form onSubmit={handleEmailActivation} className="space-y-2">
                  <h3 className="text-[11px] font-black uppercase tracking-wide text-white/70">სწრაფი რეგისტრაცია (Email ლინკი)</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className="w-full p-3 rounded-xl bg-white/10 border border-white/10 focus:border-amber-500 outline-none text-white placeholder:text-white/40 text-[12px]"
                      placeholder="სახელი"
                      value={registerData.firstName}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setRegisterData({ ...registerData, firstName: e.target.value })}
                    />
                    <input
                      className="w-full p-3 rounded-xl bg-white/10 border border-white/10 focus:border-amber-500 outline-none text-white placeholder:text-white/40 text-[12px]"
                      placeholder="გვარი"
                      value={registerData.lastName}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setRegisterData({ ...registerData, lastName: e.target.value })}
                    />
                  </div>
                  <input
                    className="w-full p-3 rounded-xl bg-white/10 border border-white/10 focus:border-amber-500 outline-none text-white placeholder:text-white/40 text-[12px]"
                    placeholder="ელფოსტა"
                    type="email"
                    value={registerData.email}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setRegisterData({ ...registerData, email: e.target.value })}
                  />
                  <input
                    className="w-full p-3 rounded-xl bg-white/10 border border-white/10 focus:border-amber-500 outline-none text-white placeholder:text-white/40 text-[12px]"
                    placeholder="ტელეფონი"
                    value={registerData.phone}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setRegisterData({ ...registerData, phone: e.target.value })}
                  />
                  <button
                    type="submit"
                    disabled={registerLoading}
                    className="w-full rounded-xl bg-amber-600 text-white font-black py-3 uppercase text-[11px] hover:bg-amber-500 transition disabled:opacity-60"
                  >
                    {registerLoading ? 'იგზავნება...' : 'მიიღე აქტივაციის ბმული'}
                  </button>
                  {registerError && <p className="text-red-300 text-xs font-semibold">{registerError}</p>}
                  {registerMessage && <p className="text-emerald-300 text-xs font-semibold">{registerMessage}</p>}
                </form>
              </div>
            </div>
          )}

          {isAuthenticated && (
          <form onSubmit={handlePost} className="space-y-6">
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-8">
               {previews.map((src, i) => (
                 <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-white/20 relative shadow-xl group">
                   <Image src={src} alt="" fill sizes="120px" className="object-cover" />
                   <button type="button" onClick={() => removeImage(i)} className="absolute inset-0 bg-red-600/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-black text-[10px] uppercase">წაშლა</button>
                 </div>
               ))}
               {images.length < 5 && (
                 <label className="aspect-square bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 hover:bg-white/10 transition-all group">
                   <span className="text-2xl text-white/20 group-hover:text-amber-500 transition-colors">+</span>
                   <span className="text-[8px] font-black uppercase text-white/20 mt-1">ფოტო</span>
                   <input type="file" multiple accept="image/*" hidden onChange={handleImageChange} />
                 </label>
               )}
            </div>
            
            <div className="text-[9px] text-white/20 uppercase font-bold text-center mb-6 tracking-widest bg-white/5 py-2 rounded-full">
               ატვირთულია: {images.length} / 5 (ფოტოები ავტომატურად ოპტიმიზირდება)
            </div>

            <div className="space-y-4">
              <input required className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-amber-500 text-white font-bold transition-all placeholder:text-white/20" placeholder="განცხადების სათაური" onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, title: e.target.value})} />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select required className="p-5 bg-white text-slate-950 border-none rounded-2xl font-black text-[11px] uppercase italic cursor-pointer shadow-lg outline-none" onChange={(e: ChangeEvent<HTMLSelectElement>) => setFormData({...formData, category: e.target.value})}>
                  <option value="">აირჩიეთ კატეგორია...</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select className="p-5 bg-white text-slate-950 border-none rounded-2xl font-black text-[11px] uppercase italic cursor-pointer shadow-lg outline-none" onChange={(e: ChangeEvent<HTMLSelectElement>) => setFormData({...formData, location: e.target.value})}>
                  {LOCATION_OPTIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* ✨ განახლებული ფასის ველი ვალუტის არჩევით */}
                <div className="relative flex items-center bg-white/5 border border-white/10 rounded-2xl focus-within:border-amber-500 transition-all overflow-hidden">
                   <input 
                     required 
                     type="number" 
                     className="w-full p-5 bg-transparent outline-none font-bold text-white placeholder:text-white/20" 
                     placeholder="ფასი" 
                     onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, price: e.target.value})} 
                   />
                   <div className="flex bg-black/30 p-1 m-1 rounded-xl">
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, currency: 'GEL'})}
                        className={`px-3 py-2 rounded-lg text-[10px] font-black transition-all ${formData.currency === 'GEL' ? 'bg-amber-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                      >
                        ₾
                      </button>
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, currency: 'USD'})}
                        className={`px-3 py-2 rounded-lg text-[10px] font-black transition-all ${formData.currency === 'USD' ? 'bg-green-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                      >
                        $
                      </button>
                   </div>
                </div>

                <input required className="p-5 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-amber-500 font-bold text-white placeholder:text-white/20" placeholder="ტელეფონი" onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, phone: e.target.value})} />
              </div>
              
              <textarea rows={5} className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-amber-500 italic text-white placeholder:text-white/20 resize-none" placeholder="აღწერეთ დეტალურად..." onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFormData({...formData, description: e.target.value})} />
            </div>

            <button type="submit" disabled={loading || !isAuthenticated} className="w-full py-6 bg-amber-600 text-white rounded-[30px] font-black uppercase italic shadow-[0_20px_40px_-10px_rgba(217,119,6,0.4)] hover:bg-amber-500 transition-all active:scale-95 disabled:bg-gray-700 disabled:cursor-not-allowed">
              {loading ? 'მიმდინარეობს ატვირთვა...' : isAuthenticated ? 'გამოქვეყნება 🚀' : 'ავტორიზაცია სჭირდება'}
            </button>
          </form>
          )}
        </div>
      </div>
    </main>
  );
}

/* -- fix_announcements_storage_policies.sql
-- Fix storage policies for the 'announcements' bucket
-- Run this in Supabase SQL Editor

-- Ensure bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('announcements', 'announcements', true)
ON CONFLICT (id) DO NOTHING;

-- Drop old policies
DROP POLICY IF EXISTS "Anyone can view announcements" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload announcements" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete own announcements" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete announcements" ON storage.objects;

-- Allow public read
CREATE POLICY "Anyone can view announcements" ON storage.objects
FOR SELECT USING (bucket_id = 'announcements');

-- Allow any authenticated user to upload/delete in this bucket
CREATE POLICY "Authenticated can upload announcements" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'announcements'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated can delete announcements" ON storage.objects
FOR DELETE USING (
  bucket_id = 'announcements'
  AND auth.uid() IS NOT NULL
);
*/