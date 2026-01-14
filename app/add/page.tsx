'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import imageCompression from 'browser-image-compression';
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
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  
  // ✨ Added 'currency' to form state (default: GEL)
  const [formData, setFormData] = useState({ 
    title: '', description: '', price: '', phone: '', location: LOCATION_OPTIONS[0] ?? '', category: '', currency: 'GEL' 
  });

  useEffect(() => {
    async function fetchBG() {
      const { data } = await supabase.from('site_settings').select('value').eq('key', 'background_url').single();
      if (data?.value) setBgImage(data.value);
    }
    fetchBG();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category || images.length === 0) {
      return alert('გთხოვთ შეავსოთ ყველა ველი და ატვირთოთ მინიმუმ 1 ფოტო');
    }

    setLoading(true);
    try {
      const uploadedUrls: string[] = [];
      
      // ✅ ავტომატური კომპრესია ატვირთვისას
      for (const img of images) {
        const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1280, useWebWorker: true };
        const compressedFile = await imageCompression(img, options);
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${img.name.split('.').pop()}`;
        
        const { error: uploadError } = await supabase.storage.from('announcements').upload(fileName, compressedFile);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('announcements').getPublicUrl(fileName);
        uploadedUrls.push(publicUrl);
      }

      const { error: dbError } = await supabase.from('announcements').insert([{ 
        ...formData, 
        price: parseFloat(formData.price), 
        image_url: uploadedUrls[0], 
        all_images: uploadedUrls, 
        is_approved: false 
      }]);

      if (dbError) throw dbError;
      alert('თქვენი განცხადება წარმატებით გაიგზავნა მოდერაციაზე! 🚀');
      router.push('/');
    } catch (err: any) { 
      alert(`შეცდომა ატვირთვისას: ${err.message}`); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <main className="min-h-screen relative flex flex-col bg-[#050510] text-white font-sans">
      <div className="fixed inset-0 z-0">
         {bgImage && <img src={bgImage} className="w-full h-full object-cover opacity-40 transition-opacity duration-1000" alt="" />}
         <div className="absolute inset-0 bg-[#050510]/80 backdrop-blur-[10px]" />
      </div>

      <nav className="relative z-50 px-10 py-6 border-b border-white/10 flex justify-between items-center bg-black/40 backdrop-blur-xl">
        <a href="/" className="text-xl font-black italic tracking-tighter">mykakheti<span className="text-amber-500">.ge</span></a>
        <a href="/" className="text-[10px] font-black uppercase italic text-white/40 hover:text-white transition-all">← მთავარზე დაბრუნება</a>
      </nav>

      <div className="relative z-10 max-w-2xl mx-auto w-full px-6 py-20">
        <div className="bg-slate-950/60 backdrop-blur-3xl p-8 md:p-12 rounded-[45px] border border-white/10 shadow-2xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black uppercase italic tracking-widest text-amber-500 drop-shadow-lg">განცხადების დამატება</h1>
          </div>

          <form onSubmit={handlePost} className="space-y-6">
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-8">
               {previews.map((src, i) => (
                 <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-white/20 relative shadow-xl group">
                   <img src={src} className="w-full h-full object-cover" alt="" />
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
              <input required className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-amber-500 text-white font-bold transition-all placeholder:text-white/20" placeholder="განცხადების სათაური" onChange={e => setFormData({...formData, title: e.target.value})} />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select required className="p-5 bg-white text-slate-950 border-none rounded-2xl font-black text-[11px] uppercase italic cursor-pointer shadow-lg outline-none" onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option value="">აირჩიეთ კატეგორია...</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select className="p-5 bg-white text-slate-950 border-none rounded-2xl font-black text-[11px] uppercase italic cursor-pointer shadow-lg outline-none" onChange={e => setFormData({...formData, location: e.target.value})}>
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
                     onChange={e => setFormData({...formData, price: e.target.value})} 
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

                <input required className="p-5 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-amber-500 font-bold text-white placeholder:text-white/20" placeholder="ტელეფონი" onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              
              <textarea rows={5} className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-amber-500 italic text-white placeholder:text-white/20 resize-none" placeholder="აღწერეთ დეტალურად..." onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>

            <button type="submit" disabled={loading} className="w-full py-6 bg-amber-600 text-white rounded-[30px] font-black uppercase italic shadow-[0_20px_40px_-10px_rgba(217,119,6,0.4)] hover:bg-amber-500 transition-all active:scale-95 disabled:bg-gray-700">
              {loading ? 'მიმდინარეობს ატვირთვა...' : 'გამოქვეყნება 🚀'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}