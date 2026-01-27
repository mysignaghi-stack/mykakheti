'use client';

import { useState, useEffect } from 'react';
import imageCompression from 'browser-image-compression';
import { supabase } from '../../lib/supabase';
import AdminNav from '../../components/admin/AdminNav';

export default function AdminSiteSettings() {
  const [loading, setLoading] = useState(false);
  const [currentBgUrl, setCurrentBgUrl] = useState<string>('');
  const [marqueeText, setMarqueeText] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('site_settings')
        .select('key, value')
        .in('key', ['background_url', 'marquee_text']);

      if (error) throw error;

      const bg = data?.find((item: any) => item.key === 'background_url')?.value;
      const marquee = data?.find((item: any) => item.key === 'marquee_text')?.value;

      setCurrentBgUrl(bg || '');
      setMarqueeText(marquee || '');
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if it's an image file
      if (!file.type.startsWith('image/')) {
        alert('გთხოვთ აირჩიოთ მხოლოდ სურათის ფაილი (JPG, PNG, WebP)');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const uploadBackground = async () => {
    if (!selectedFile) return alert('აირჩიეთ ფოტო');

    setLoading(true);
    try {
      // Compress the image
      console.log('Starting image compression...');
      const compressedFile = selectedFile.type.startsWith('image/') ? await imageCompression(selectedFile, {
        maxSizeMB: 2,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      }) : selectedFile;
      console.log('Image compression completed');

      // Upload to site-assets bucket
      const fileExtension = compressedFile.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `background-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
      console.log('Uploading to site-assets bucket:', fileName);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(fileName, compressedFile);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`ატვირთვის შეცდომა: ${uploadError.message}`);
      }
      console.log('Upload successful:', uploadData);

      // Get public URL
      console.log('Getting public URL...');
      const { data: urlData } = supabase.storage
        .from('site-assets')
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        throw new Error('საჯარო URL-ის მიღების შეცდომა');
      }
      console.log('Public URL obtained:', urlData.publicUrl);

      // Update site_settings
      console.log('Updating site_settings...');
      const { error: updateError } = await (supabase as any)
        .from('site_settings')
        .upsert({ key: 'background_url', value: urlData.publicUrl });

      if (updateError) {
        console.error('Database update error:', updateError);
        throw new Error(`ბაზის განახლების შეცდომა: ${updateError.message}`);
      }
      console.log('Database update successful');

      alert('უკანა ფონი წარმატებით განახლდა');
      setCurrentBgUrl(urlData.publicUrl);
      setSelectedFile(null);
      setPreviewUrl('');
    } catch (error: any) {
      console.error('Upload error details:', {
        message: error?.message,
        name: error?.name,
        stack: error?.stack,
        error
      });
      const errorMessage = error?.message || 'უცნობი შეცდომა';
      alert(`შეცდომა ატვირთვისას: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const updateMarquee = async () => {
    try {
      const { error } = await (supabase as any)
        .from('site_settings')
        .upsert({ key: 'marquee_text', value: marqueeText });

      if (error) throw error;
      alert('მარკიზის ტექსტი განახლდა');
    } catch (error) {
      console.error('Update error:', error);
      alert('შეცდომა განახლებისას');
    }
  };

  return (
    <main className="min-h-screen bg-[#050510] p-6 md:p-10 text-white font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black italic uppercase border-l-4 border-amber-600 pl-4">საიტის პარამეტრები</h1>
          <AdminNav />
        </div>

        <div className="space-y-8">
          {/* Background Image Section */}
          <div className="bg-white/5 rounded-3xl border border-white/10 p-6">
            <h2 className="text-xl font-black text-amber-400 mb-4">უკანა ფონის ფოტო</h2>

            {currentBgUrl && (
              <div className="mb-4">
                <p className="text-white/60 mb-2">მიმდინარე ფონი:</p>
                <div className="flex gap-2 items-start">
                  <img src={currentBgUrl} alt="Current background" className="w-full max-w-md h-48 object-cover rounded-xl border border-white/10" />
                  <button
                    onClick={async () => {
                      if (confirm('გსურთ მიმდინარე ფონის წაშლა?')) {
                        try {
                          const { error } = await (supabase as any)
                            .from('site_settings')
                            .delete()
                            .eq('key', 'background_url');
                          if (error) throw error;
                          setCurrentBgUrl('');
                          alert('ფონი წაიშალა');
                        } catch (error) {
                          console.error('Delete error:', error);
                          alert('შეცდომა წაშლისას');
                        }
                      }
                    }}
                    className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded text-xs font-bold"
                  >
                    ❌ წაშლა
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-white/60 mb-2">აირჩიეთ ახალი ფოტო</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white"
                />
              </div>

              {previewUrl && (
                <div>
                  <p className="text-white/60 mb-2">წინასწარი ნახვა:</p>
                  <img src={previewUrl} alt="Preview" className="w-full max-w-md h-48 object-cover rounded-xl border border-white/10" />
                </div>
              )}

              <button
                onClick={uploadBackground}
                disabled={loading || !selectedFile}
                className="bg-amber-600 hover:bg-amber-500 disabled:bg-gray-600 text-white px-6 py-3 rounded-xl font-black uppercase text-sm"
              >
                {loading ? 'ატვირთვა...' : 'ატვირთვა'}
              </button>
            </div>
          </div>

          {/* Marquee Text Section */}
          <div className="bg-white/5 rounded-3xl border border-white/10 p-6">
            <h2 className="text-xl font-black text-amber-400 mb-4">მარკიზის ტექსტი</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-white/60 mb-2">ტექსტი</label>
                <input
                  type="text"
                  value={marqueeText}
                  onChange={(e) => setMarqueeText(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white"
                  placeholder="შეიყვანეთ მარკიზის ტექსტი"
                />
              </div>

              <button
                onClick={updateMarquee}
                className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-xl font-black uppercase text-sm"
              >
                განახლება
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}