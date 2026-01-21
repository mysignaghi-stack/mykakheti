'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { useAdminAuth } from '../../hooks/useAdminAuth';

type AdminPost = {
  id: string;
  title: string;
  content: string;
  category: string;
  media_urls?: string[];
  media_url?: string;
  video_background?: boolean;
  priority?: number;
  link?: string;
  position?: string;
  badge_text?: string;
  created_at: string;
};

export default function AdminPosts() {
  const { isAdmin, loading: authLoading } = useAdminAuth();
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<AdminPost | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    media_urls: [] as string[],
    media_url: '',
    video_background: false,
    priority: 0,
    link: '',
    position: '',
    badge_text: '',
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('admin_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = {
        ...formData,
        media_urls: formData.media_urls.length > 0 ? formData.media_urls : null,
      };

      if (editingPost) {
        const { error } = await (supabase as any)
          .from('admin_posts')
          .update(data)
          .eq('id', editingPost.id);

        if (error) throw error;
        setEditingPost(null);
      } else {
        const { error } = await (supabase as any)
          .from('admin_posts')
          .insert(data);

        if (error) throw error;
      }

      setFormData({
        title: '',
        content: '',
        category: '',
        media_urls: [],
        media_url: '',
        video_background: false,
        priority: 0,
        link: '',
        position: '',
        badge_text: '',
      });

      fetchPosts();
    } catch (error) {
      console.error('Submit error:', error);
      alert('შეცდომა შენახვისას');
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm('ნამდვილად გსურთ პოსტის წაშლა?')) return;

    try {
      const { error } = await (supabase as any)
        .from('admin_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Delete error:', error);
      alert('შეცდომა წაშლისას');
    }
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return alert('აირჩიეთ ფაილები');

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];

      for (const file of selectedFiles) {
        const fileName = `admin-post-${Date.now()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('site-assets')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('site-assets')
          .getPublicUrl(fileName);

        uploadedUrls.push(urlData.publicUrl);
      }

      setFormData(prev => ({
        ...prev,
        media_urls: [...prev.media_urls, ...uploadedUrls]
      }));

      setSelectedFiles([]);
      alert('ფაილები წარმატებით აიტვირთა');
    } catch (error) {
      console.error('Upload error:', error);
      alert('შეცდომა ატვირთვისას');
    } finally {
      setUploading(false);
    }
  };

  const startEdit = (post: AdminPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title || '',
      content: post.content || '',
      category: post.category || '',
      media_urls: post.media_urls || [],
      media_url: post.media_url || '',
      video_background: post.video_background || false,
      priority: post.priority || 0,
      link: post.link || '',
      position: post.position || '',
      badge_text: post.badge_text || '',
    });
  };

  const cancelEdit = () => {
    setEditingPost(null);
    setFormData({
      title: '',
      content: '',
      category: '',
      media_urls: [],
      media_url: '',
      video_background: false,
      priority: 0,
      link: '',
      position: '',
      badge_text: '',
    });
  };

  const addMediaUrl = () => {
    setFormData(prev => ({
      ...prev,
      media_urls: [...prev.media_urls, '']
    }));
  };

  const updateMediaUrl = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      media_urls: prev.media_urls.map((url, i) => i === index ? value : url)
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  if (authLoading) {
    return (
      <main className="min-h-screen bg-[#050510] flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mx-auto mb-4" />
          <p>ავტორიზაცია...</p>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-[#050510] flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-2xl font-black text-red-400 mb-4">წვდომა აკრძალულია</h1>
          <p className="text-white/60 mb-6">ამ გვერდზე წვდომისთვის საჭიროა ადმინისტრატორის უფლებები.</p>
          <Link href="/admin/login" className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-xl font-black uppercase">
            ადმინისტრატორად შესვლა
          </Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050510] flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mx-auto mb-4" />
          <p>იტვირთება...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050510] p-6 md:p-10 text-white font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black italic uppercase border-l-4 border-amber-600 pl-4">ადმინისტრატორის განცხადებები</h1>
          <Link href="/admin" className="bg-white/5 px-4 py-2 rounded-xl text-xs font-black uppercase">← ადმინ ჰაბი</Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white/5 rounded-3xl border border-white/10 p-6">
            <h2 className="text-xl font-black text-amber-400 mb-4">
              {editingPost ? 'პოსტის რედაქტირება' : 'ახალი პოსტი'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-white/60 mb-2">სათაური</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-white/60 mb-2">კატეგორია</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-white/60 mb-2">შინაარსი</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white h-32"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-white/60 mb-2">ბმული</label>
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-white/60 mb-2">პოზიცია</label>
                <select
                  value={formData.position}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white"
                >
                  <option value="">აირჩიეთ პოზიცია</option>
                  <option value="left_top">მარცხენა ზედა (აგრო ბირჟის დაბლა)</option>
                  <option value="right_top">მარჯვენა ზედა (მარცვლეულის დაბლა)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-white/60 mb-2">ბეიჯის ტექსტი</label>
                <input
                  type="text"
                  value={formData.badge_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, badge_text: e.target.value }))}
                  placeholder="ოფიციალური განცხადება"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-white/60 mb-2">პრიორიტეტი</label>
                <input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-white/60 mb-2">მედია URL</label>
                <input
                  type="url"
                  value={formData.media_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, media_url: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-white/60 mb-2">ფოტოების და ვიდეოების ატვირთვა</label>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white mb-2"
                />
                {selectedFiles.length > 0 && (
                  <div className="mb-2">
                    <p className="text-sm text-white/60">არჩეული ფაილები: {selectedFiles.length}</p>
                    <button
                      type="button"
                      onClick={uploadFiles}
                      disabled={uploading}
                      className="bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white px-4 py-2 rounded-xl font-bold text-sm"
                    >
                      {uploading ? 'ატვირთვა...' : 'ატვირთვა'}
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.video_background}
                    onChange={(e) => setFormData(prev => ({ ...prev, video_background: e.target.checked }))}
                  />
                  <span className="text-sm font-bold text-white/60">ვიდეო ფონი</span>
                </label>
              </div>

              <div className="flex gap-4">
                <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-xl font-black uppercase text-sm">
                  {editingPost ? 'განახლება' : 'შენახვა'}
                </button>
                {editingPost && (
                  <button type="button" onClick={cancelEdit} className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-3 rounded-xl font-black uppercase text-sm">
                    გაუქმება
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Posts List */}
          <div className="bg-white/5 rounded-3xl border border-white/10 p-6">
            <h2 className="text-xl font-black text-amber-400 mb-4">არსებული პოსტები</h2>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {posts.map(post => (
                <div key={post.id} className="bg-black/40 rounded-2xl p-4 border border-white/10">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-white">{post.title}</h3>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(post)} className="text-xs bg-blue-600 px-2 py-1 rounded">რედაქტირება</button>
                      <button onClick={() => deletePost(post.id)} className="text-xs bg-red-600 px-2 py-1 rounded">წაშლა</button>
                    </div>
                  </div>
                  <p className="text-white/60 text-sm mb-2">{post.category}</p>
                  <p className="text-white/80 text-sm line-clamp-2">{post.content}</p>
                  <p className="text-white/40 text-xs mt-2">{new Date(post.created_at).toLocaleDateString('ka-GE')}</p>
                </div>
              ))}
              {posts.length === 0 && (
                <div className="text-center py-8 text-white/40">
                  პოსტები არ არის
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}