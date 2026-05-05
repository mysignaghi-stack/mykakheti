'use client';

import { useState, useEffect } from 'react';
import imageCompression from 'browser-image-compression';
import { supabase } from '../../lib/supabase';
import AdminNav from '../../components/admin/AdminNav';

export default function AdminSiteSettings() {
  const [loading, setLoading] = useState(false);
  const [currentBgUrl, setCurrentBgUrl] = useState<string>('');
  const [marqueeText, setMarqueeText] = useState<string>('');
  const [headerText, setHeaderText] = useState<string>('');
  const [headerMode, setHeaderMode] = useState<string>('blink');
  const [headerColor, setHeaderColor] = useState<string>('#ef4444');
  const [headerSize, setHeaderSize] = useState<string>('md');
  const [headerSpeed, setHeaderSpeed] = useState<string>('18');
  const [headerEnabled, setHeaderEnabled] = useState<boolean>(true);
  const [headerDirection, setHeaderDirection] = useState<string>('left');
  const [headerBg, setHeaderBg] = useState<string>('');
  const [headerBgOpacity, setHeaderBgOpacity] = useState<string>('0.2');
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
        .in('key', [
          'background_url',
          'marquee_text',
          'header_text',
          'header_mode',
          'header_color',
          'header_size',
          'header_speed',
          'header_enabled',
          'header_direction',
          'header_bg',
          'header_bg_opacity',
        ]);

      if (error) throw error;

      const bg = data?.find((item: any) => item.key === 'background_url')?.value;
      const marquee = data?.find((item: any) => item.key === 'marquee_text')?.value;
      const headerTextValue = data?.find((item: any) => item.key === 'header_text')?.value;
      const headerModeValue = data?.find((item: any) => item.key === 'header_mode')?.value;
      const headerColorValue = data?.find((item: any) => item.key === 'header_color')?.value;
      const headerSizeValue = data?.find((item: any) => item.key === 'header_size')?.value;
      const headerSpeedValue = data?.find((item: any) => item.key === 'header_speed')?.value;
      const headerEnabledValue = data?.find((item: any) => item.key === 'header_enabled')?.value;
      const headerDirectionValue = data?.find((item: any) => item.key === 'header_direction')?.value;
      const headerBgValue = data?.find((item: any) => item.key === 'header_bg')?.value;
      const headerBgOpacityValue = data?.find((item: any) => item.key === 'header_bg_opacity')?.value;

      setCurrentBgUrl(bg || '');
      setMarqueeText(marquee || '');
      setHeaderText(headerTextValue || '');
      setHeaderMode(headerModeValue || 'blink');
      setHeaderColor(headerColorValue || '#ef4444');
      setHeaderSize(headerSizeValue || 'md');
      setHeaderSpeed(headerSpeedValue || '18');
      setHeaderEnabled(headerEnabledValue ? headerEnabledValue === 'true' : true);
      setHeaderDirection(headerDirectionValue || 'left');
      setHeaderBg(headerBgValue || '');
      setHeaderBgOpacity(headerBgOpacityValue || '0.2');
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
      let compressedFile: File | Blob = selectedFile;
      if (selectedFile.type.startsWith('image/')) {
        try {
          // Sanitize file name to avoid Unicode issues with browser-image-compression
          const sanitizedName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const sanitizedFile = new File([selectedFile], sanitizedName, { type: selectedFile.type });
          compressedFile = await imageCompression(sanitizedFile, {
            maxSizeMB: 2,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          });
        } catch (compressionError) {
          console.warn('Image compression failed, using original file:', compressionError);
          compressedFile = selectedFile;
        }
      }
      console.log('Image compression completed');

      // Upload to site-assets bucket
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase() || 'jpg';
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

  const updateHeaderBanner = async () => {
    try {
      const payload = [
        { key: 'header_text', value: headerText },
        { key: 'header_mode', value: headerMode },
        { key: 'header_color', value: headerColor },
        { key: 'header_size', value: headerSize },
        { key: 'header_speed', value: headerSpeed },
        { key: 'header_enabled', value: headerEnabled ? 'true' : 'false' },
        { key: 'header_direction', value: headerDirection },
        { key: 'header_bg', value: headerBg },
        { key: 'header_bg_opacity', value: headerBgOpacity },
      ];

      const { error } = await (supabase as any)
        .from('site_settings')
        .upsert(payload);

      if (error) throw error;
      alert('ჰედერის წარწერა განახლდა');
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

          {/* Header Banner Section */}
          <div className="bg-white/5 rounded-3xl border border-white/10 p-6">
            <h2 className="text-xl font-black text-amber-400 mb-4">ჰედერის წარწერა</h2>

            <div className="space-y-4">
              <label className="flex items-center gap-3 text-sm font-bold text-white/70">
                <input
                  type="checkbox"
                  checked={headerEnabled}
                  onChange={(e) => setHeaderEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-white/10"
                />
                ჩართვა/გამორთვა
              </label>

              <div>
                <label className="block text-sm font-bold text-white/60 mb-2">ტექსტი</label>
                <input
                  type="text"
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white"
                  placeholder="ჰედერის ტექსტი"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-white/60 mb-2">რეჟიმი</label>
                  <select
                    value={headerMode}
                    onChange={(e) => setHeaderMode(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white"
                  >
                    <option value="blink">ციმციმი</option>
                    <option value="marquee">გორბენალი სტრიქონი</option>
                    <option value="static">სტატიკური</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-white/60 mb-2">შრიფტის ზომა</label>
                  <select
                    value={headerSize}
                    onChange={(e) => setHeaderSize(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white"
                  >
                    <option value="sm">მცირე</option>
                    <option value="md">სტანდარტული</option>
                    <option value="lg">დიდი</option>
                    <option value="xl">ძალიან დიდი</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-white/60 mb-2">ფერი</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={headerColor}
                      onChange={(e) => setHeaderColor(e.target.value)}
                      className="h-10 w-16 rounded-lg border border-white/10 bg-white/5"
                    />
                    <input
                      type="text"
                      value={headerColor}
                      onChange={(e) => setHeaderColor(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white"
                      placeholder="#ef4444"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-white/60 mb-2">სიჩქარე (გორბენალი)</label>
                  <input
                    type="number"
                    min="8"
                    max="40"
                    step="1"
                    value={headerSpeed}
                    onChange={(e) => setHeaderSpeed(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white"
                    placeholder="18"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-white/60 mb-2">მიმართულება (გორბენალი)</label>
                  <select
                    value={headerDirection}
                    onChange={(e) => setHeaderDirection(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white"
                  >
                    <option value="left">მარცხნივ</option>
                    <option value="right">მარჯვნივ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-white/60 mb-2">ფონი (hex)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={headerBg || '#000000'}
                      onChange={(e) => setHeaderBg(e.target.value)}
                      className="h-10 w-16 rounded-lg border border-white/10 bg-white/5"
                    />
                    <input
                      type="text"
                      value={headerBg}
                      onChange={(e) => setHeaderBg(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-white/60 mb-2">ფონის გამჭვირვალობა (0-1)</label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  value={headerBgOpacity}
                  onChange={(e) => setHeaderBgOpacity(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white"
                  placeholder="0.2"
                />
              </div>

              <button
                onClick={updateHeaderBanner}
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