'use client';

import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface AdminPostFormProps {
  onPostAdded: () => void; // მშობელ კომპონენტს ვაცნობებთ, რომ განაახლოს სია
}

export default function AdminPostForm({ onPostAdded }: AdminPostFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState(0);
  const [link, setLink] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [videoAsBackground, setVideoAsBackground] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    setLoading(true);

    try {
      const mediaUrls: string[] = [];
      let mediaType: 'image' | 'video' | 'gallery' | null = null;

      if (files.length > 0) {
        for (const file of files) {
          const fileName = `admin-${Date.now()}-${Math.random().toString(36).substring(7)}`;
          const { error: uploadError } = await supabase.storage.from('square-media').upload(fileName, file);
          if (uploadError) throw uploadError;
          
          const { data } = supabase.storage.from('square-media').getPublicUrl(fileName);
          mediaUrls.push(data.publicUrl);
        }

        if (files.length === 1) {
          mediaType = files[0].type.startsWith('video') ? 'video' : 'image';
        } else {
          mediaType = 'gallery';
        }
      }

      const { error } = await (supabase as any).from('admin_posts').insert({
        title, 
        content,
        category: category || null,
        priority,
        link: link || null,
        media_urls: mediaUrls.length > 0 ? mediaUrls : null,
        media_type: mediaType,
        video_background: videoAsBackground && mediaType === 'video'
      });

      if (error) throw error;

      // გასუფთავება
      setTitle(''); 
      setContent(''); 
      setCategory('');
      setPriority(0);
      setLink('');
      setFiles([]);
      setVideoAsBackground(false);
      setIsOpen(false);
      onPostAdded(); // სიის განახლება
      alert('წარმატებით დაემატა! ✅');

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      alert('შეცდომა: ' + message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(selectedFiles);
    // თუ ვიდეოა, შეგვიძლია ფონზე გაშვება
    if (selectedFiles.length === 1 && selectedFiles[0].type.startsWith('video/')) {
      setVideoAsBackground(false); // reset
    }
  };

  return (
    <div className="w-full mb-8">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 bg-gradient-to-r from-red-900/20 to-purple-900/20 border border-red-500/30 rounded-3xl text-red-400 text-sm font-black uppercase tracking-widest hover:from-red-900/40 hover:to-purple-900/40 transition-all flex items-center justify-center gap-3 shadow-xl hover:shadow-red-500/20"
      >
        {isOpen ? '✕ ფორმის დახურვა' : '📢 ადმინისტრაციის პანელი (პოსტის დამატება)'}
      </button>

      {isOpen && (
        <div className="mt-6 bg-gradient-to-br from-black/40 to-slate-900/40 border border-white/10 p-8 rounded-[40px] animate-in slide-in-from-top-4 backdrop-blur-xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <input 
                className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-red-500 font-bold placeholder:text-white/30 transition-all"
                placeholder="სათაური"
                value={title} onChange={e => setTitle(e.target.value)} required
              />
              <input 
                className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-purple-500 font-bold placeholder:text-white/30 transition-all"
                placeholder="კატეგორია"
                value={category} onChange={e => setCategory(e.target.value)}
              />
              <input 
                type="number"
                className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-green-500 font-bold placeholder:text-white/30 transition-all"
                placeholder="პრიორიტეტი"
                value={priority} onChange={e => setPriority(Number(e.target.value))} min="0" max="10"
              />
              <input 
                className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-blue-500 font-bold placeholder:text-white/30 transition-all"
                placeholder="ბმული (არასავალდებულო)"
                value={link} onChange={e => setLink(e.target.value)}
              />
            </div>
            <textarea 
              className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-red-500 min-h-[120px] placeholder:text-white/30 resize-none transition-all"
              placeholder="განცხადების ტექსტი..."
              value={content} onChange={e => setContent(e.target.value)} required
            />
            <div className="space-y-4">
              <label className="flex text-xs text-white/60 cursor-pointer hover:text-white items-center gap-3 bg-white/5 px-6 py-4 rounded-2xl border border-dashed border-white/10 hover:border-red-500/50 transition-all group">
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*,video/*" 
                  multiple 
                  onChange={handleFileChange} 
                />
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold">{files.length > 0 ? `${files.length} ფაილი არჩეულია` : '📎 ფოტოები/ვიდეო დართვა'}</span>
                  <span className="text-xs text-white/40">მრავალი ფაილის არჩევა შესაძლებელია</span>
                </div>
              </label>
              {files.length === 1 && files[0].type.startsWith('video/') && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={videoAsBackground} 
                    onChange={e => setVideoAsBackground(e.target.checked)}
                    className="w-4 h-4 accent-red-500"
                  />
                  <span className="text-sm text-white/60">ვიდეო ფონზე გაშვება (autoplay, muted)</span>
                </label>
              )}
            </div>
            <button 
              disabled={loading} 
              className="w-full bg-gradient-to-r from-red-600 to-purple-600 text-white px-8 py-4 rounded-2xl text-sm font-bold uppercase disabled:opacity-50 hover:from-red-500 hover:to-purple-500 transition-all shadow-xl hover:shadow-red-500/30"
            >
              {loading ? 'იგზავნება...' : 'გამოქვეყნება 🚀'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}