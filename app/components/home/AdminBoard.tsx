'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '../../lib/supabase';
import { AdminPost } from '../../lib/types';

interface AdminBoardProps {
  isAdmin: boolean;
  children: React.ReactNode;
}

export default function AdminBoard({ isAdmin, children }: AdminBoardProps) {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  
  // ფორმის მონაცემები
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showForm, setShowForm] = useState(false); // ფორმის დამალვა/გამოჩენა

  // მონაცემების წამოღება
  const fetchPosts = async () => {
    // ვიღებთ მხოლოდ ბოლო 2 პოსტს (მარცხენა და მარჯვენა მხარესთვის)
    const { data, error } = await supabase
      .from('admin_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(2); 
    
    if (!error && data) {
      const validPosts = data.filter(post => post.content !== null) as AdminPost[];
      setPosts(validPosts);
    }
  };

  useEffect(() => {
    fetchPosts();
    
    // Realtime განახლება
    const channel = supabase.channel('admin_posts_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_posts' }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // ფაილის ატვირთვა Storage-ში
  const handleFileUpload = async (file: File) => {
    const fileName = `admin-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const { error } = await supabase.storage.from('square-media').upload(fileName, file);
    if (error) throw error;
    
    const { data } = supabase.storage.from('square-media').getPublicUrl(fileName);
    return data.publicUrl;
  };

  // პოსტის დამატება
  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newContent) return;

    setIsUploading(true);
    try {
      let mediaUrl = null;
      let mediaType = null;

      if (mediaFile) {
        mediaUrl = await handleFileUpload(mediaFile);
        mediaType = mediaFile.type.startsWith('video') ? 'video' : 'image';
      }

      const { error } = await (supabase as any).from('admin_posts').insert({
        title: newTitle,
        content: newContent,
        media_url: mediaUrl,
        media_type: mediaType
      });

      if (error) throw error;

      // ფორმის გასუფთავება
      setNewTitle('');
      setNewContent('');
      setMediaFile(null);
      setShowForm(false); // დამატების შემდეგ ფორმა დაიკეცოს
      alert('განცხადება დაემატა! 📢');

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(error);
      alert('შეცდომა: ' + message);
    } finally {
      setIsUploading(false);
    }
  };

  // პოსტის წაშლა
  const handleDelete = async (id: number) => {
    if (!confirm('ნამდვილად გსურთ ამ განცხადების წაშლა?')) return;
    const { error } = await (supabase as any).from('admin_posts').delete().eq('id', id);
    if (error) alert('წაშლა ვერ მოხერხდა');
  };

  // პოსტის რენდერის დამხმარე ფუნქცია
  const renderPost = (post: AdminPost | undefined, side: string) => {
    if (!post) {
      return (
        <div className="h-full min-h-[300px] rounded-[30px] border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-white/10 p-4 text-center bg-white/[0.01]">
           <span className="text-3xl mb-2 opacity-20">📢</span>
           <span className="text-[10px] font-black uppercase tracking-widest">ადგილი {side}</span>
        </div>
      );
    }
    return (
      <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-[30px] overflow-hidden relative flex flex-col h-full shadow-2xl group transition-all hover:border-red-500/30">
         {post.media_url && (
            <div className="h-40 w-full bg-black/50 overflow-hidden relative border-b border-white/5 shrink-0">
               {post.media_type === 'video' ? (
                 <video src={post.media_url} controls className="w-full h-full object-cover" />
               ) : (
                 <Image src={post.media_url} alt="" fill sizes="280px" className="object-cover group-hover:scale-105 transition-transform duration-700" />
               )}
               <div className="absolute top-2 left-2 bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded shadow">INFO</div>
            </div>
         )}
         <div className="p-5 flex-grow flex flex-col">
            <div className="flex justify-between items-start mb-2">
               <h4 className="text-base font-black text-red-100 uppercase italic line-clamp-2">{post.title}</h4>
               {isAdmin && <button onClick={() => handleDelete(post.id)} className="text-red-500 hover:text-white text-xs">✕</button>}
            </div>
            <p className="text-xs text-white/70 leading-relaxed line-clamp-6 whitespace-pre-line mb-3">{post.content}</p>
            <span className="text-[9px] text-white/20 mt-auto font-mono text-right">{new Date(post.created_at).toLocaleDateString('ka-GE')}</span>
         </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* --- სათაური და ღილაკი --- */}
      <div className="flex items-center justify-between px-2 mb-4">
         <div className="flex items-center gap-4">
            <span className="w-12 h-[2px] bg-red-600/70 shadow-[0_0_10px_rgba(220,38,38,0.5)]"></span>
            <h3 className="font-black uppercase italic text-lg tracking-tighter text-white drop-shadow-md">
               ადმინისტრაციის დაფა
            </h3>
         </div>
         {isAdmin && (
            <button 
                onClick={() => setShowForm(!showForm)}
                className="text-[10px] bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg"
            >
                {showForm ? 'დახურვა' : 'ახალი პოსტი +'}
            </button>
         )}
      </div>

      {/* --- ADMIN FORM (მხოლოდ ადმინისთვის) --- */}
      {isAdmin && showForm && (
        <div className="bg-gradient-to-br from-red-900/80 to-slate-900/90 border border-red-500/50 p-6 rounded-[35px] backdrop-blur-xl animate-in slide-in-from-top-5 mb-8">
          <form onSubmit={handleAddPost} className="space-y-4">
            <input 
              type="text" 
              placeholder="სათაური / თემა" 
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:border-red-500 font-bold placeholder:text-white/30"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              required
            />
            <textarea 
              placeholder="ტექსტი..." 
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:border-red-500 min-h-[100px] placeholder:text-white/30 resize-none"
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              required
            />
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <label className={`cursor-pointer w-full sm:w-auto text-center bg-white/5 border ${mediaFile ? 'border-green-500/50 text-green-400' : 'border-white/10 text-white/60'} px-5 py-3 rounded-xl text-xs font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2`}>
                <input type="file" className="hidden" accept="image/*,video/*" onChange={(e) => setMediaFile(e.target.files?.[0] || null)} />
                <span>{mediaFile ? '✅ ფაილი არჩეულია' : '📎 ფოტო/ვიდეო დართვა'}</span>
              </label>
              <button type="submit" disabled={isUploading} className="w-full sm:w-auto sm:ml-auto bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg disabled:opacity-50">
                {isUploading ? 'იგზავნება...' : 'გამოქვეყნება'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- მთავარი სტრუქტურა: [LEFT POST] - [WIDGETS] - [RIGHT POST] --- */}
      <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr_280px] gap-6 items-start">
         
         {/* მარცხენა პოსტი */}
         <div className="order-2 xl:order-1 w-full">
            {renderPost(posts[0], 'მარცხნივ')}
         </div>

         {/* შუა ნაწილი: აგრო/მარცვლეული/გზამკვლევი */}
         <div className="order-1 xl:order-2 w-full min-w-0">
            {children}
         </div>

         {/* მარჯვენა პოსტი */}
         <div className="order-3 xl:order-3 w-full">
            {renderPost(posts[1], 'მარჯვნივ')}
         </div>

      </div>
    </div>
  );
}