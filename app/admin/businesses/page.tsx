'use client';
import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import imageCompression from 'browser-image-compression';
import { supabase } from '../../lib/supabase';
import AdminNav from '../../components/admin/AdminNav';

const BUSINESS_CATEGORIES = [
  'მარნები და ღვინო', 
  'სასტუმროები', 
  'რესტორნები და კაფეები', 
  'ტურისტული მარშრუტები', 
  'სახელოსნოები', 
  'სხვა'
];

export default function AdminBusinesses() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    category: BUSINESS_CATEGORIES[0],
    address: '',
    phone: '',
    description: '',
  });

  // მეხსიერების გაწმენდა (Memory Leak Prevention)
  useEffect(() => {
    return () => previews.forEach(url => URL.revokeObjectURL(url));
  }, [previews]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 5) {
      return alert('მაქსიმუმ 5 ფოტო!');
    }
    setImages(prev => [...prev, ...files]);
    setPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (images.length === 0) return alert('ატვირთეთ მინიმუმ 1 ფოტო');
    setLoading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of images) {
        let compressedFile: File | Blob = file;
        try {
          // Sanitize file name to avoid Unicode issues with browser-image-compression
          const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const sanitizedFile = new File([file], sanitizedName, { type: file.type });
          compressedFile = await imageCompression(sanitizedFile, { maxSizeMB: 0.5, maxWidthOrHeight: 1400, useWebWorker: true });
        } catch (compressionError) {
          console.warn('Image compression failed, using original file:', compressionError);
          compressedFile = file;
        }
        const fileName = `biz-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        
        const { error: uploadError } = await supabase.storage
          .from('announcements') // იყენებს არსებულ ბაკეტს
          .upload(fileName, compressedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('announcements')
          .getPublicUrl(fileName);
        
        uploadedUrls.push(publicUrl);
      }

      const { error } = await (supabase.from('businesses' as any) as any)
        .insert([{ 
          ...formData, 
          image_url: uploadedUrls[0], // მთავარი ფოტო
          all_images: uploadedUrls,   // ფოტოების მასივი
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      setSuccess(true);
      setFormData({ name: '', category: BUSINESS_CATEGORIES[0], address: '', phone: '', description: '' });
      setImages([]);
      setPreviews([]);
      setTimeout(() => {
        setSuccess(false);
        router.refresh();
      }, 3000);

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      alert(`შეცდომა: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full p-5 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-amber-500 font-bold text-white transition-all placeholder:text-white/20";

  return (
    <main className="min-h-screen bg-[#050510] py-12 px-6 font-sans relative overflow-hidden">
      {/* Background Effect */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-[120px] -z-10" />
      
      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* Nav Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 bg-white/[0.03] backdrop-blur-3xl p-8 rounded-[40px] border border-white/10 shadow-2xl gap-6">
          <AdminNav />
          <h1 className="text-3xl font-black uppercase italic text-white tracking-tighter leading-none">
            ბიზნეს ობიექტების <span className="text-amber-500">მართვა</span>
          </h1>
        </div>

        {/* Form Container */}
        <div className="bg-white/[0.02] backdrop-blur-3xl rounded-[50px] shadow-2xl p-8 md:p-16 border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 to-transparent" />
          
          <h2 className="text-xl font-black text-white uppercase italic mb-10 flex items-center gap-4">
             <span className="text-amber-500">01.</span> ახალი ობიექტის რეგისტრაცია
          </h2>
          
          <form onSubmit={handleUpload} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-white/30 ml-2 tracking-widest">დასახელება</label>
                <input required className={inputClass} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="მაგ: მარანი 'შატო მუხრანი'" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-white/30 ml-2 tracking-widest">კატეგორია</label>
                <select className={`${inputClass} appearance-none cursor-pointer`} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  {BUSINESS_CATEGORIES.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-white/30 ml-2 tracking-widest">მისამართი</label>
                <input required className={inputClass} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="მაგ: თელავი, ჩოლოყაშვილის ქ." />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-white/30 ml-2 tracking-widest">ტელეფონი</label>
                <input required className={inputClass} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="5XX XX XX XX" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/30 ml-2 tracking-widest">აღწერა (ისტორია, მომსახურება)</label>
              <textarea rows={5} className={`${inputClass} resize-none`} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="აღწერეთ ობიექტის უნიკალურობა..."></textarea>
            </div>

            {/* Photo Upload Area */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-white/30 ml-2 tracking-widest block">ფოტოგალერეა (მაქს. 5)</label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                 {previews.map((src, i) => (
                   <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-white/10 relative group shadow-2xl">
                     <Image src={src} alt="" fill sizes="120px" className="object-cover" />
                     <button type="button" onClick={() => removeImage(i)} className="absolute inset-0 bg-red-600/80 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white font-black text-[10px] uppercase">წაშლა</button>
                   </div>
                 ))}
                 {images.length < 5 && (
                   <label className="aspect-square bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 hover:bg-white/10 transition-all group">
                     <span className="text-2xl text-white/20 group-hover:text-amber-500 transition-colors">+</span>
                     <input type="file" multiple accept="image/*" hidden onChange={handleImageChange} />
                   </label>
                 )}
              </div>
            </div>

            {/* Submit Button */}
            <button 
              disabled={loading} 
              type="submit" 
              className={`w-full py-6 rounded-[28px] font-black text-white uppercase italic text-lg shadow-[0_20px_40px_-10px_rgba(217,119,6,0.3)] transition-all ${loading ? 'bg-white/10 scale-95 opacity-50' : 'bg-amber-600 hover:bg-amber-500 hover:scale-[1.01] active:scale-95'}`}
            >
              {loading ? 'მიმდინარეობს შენახვა...' : 'ობიექტის დამატება ✅'}
            </button>

            {success && (
              <div className="mt-6 p-4 bg-green-500/20 border border-green-500/50 text-green-500 rounded-2xl text-center font-black uppercase italic text-xs animate-bounce">
                ბიზნესი წარმატებით დაემატა საიტის ბაზაში!
              </div>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}