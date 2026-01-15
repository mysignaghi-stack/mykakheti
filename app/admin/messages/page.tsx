'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Database } from '../../../types/supabase';
import { supabase } from '../../lib/supabase';

type ContactMessageRow = Database['public']['Tables']['contact_messages']['Row'];

export default function AdminMessages() {
  const [messages, setMessages] = useState<ContactMessageRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, []);

  async function fetchMessages() {
    setLoading(true);
    const { data } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setMessages(data);
    setLoading(false);
  }

  async function deleteMessage(id: string) {
    if (confirm('ნამდვილად გსურთ ამ წერილის წაშლა?')) {
      const { error } = await supabase.from('contact_messages').delete().eq('id', id);
      if (!error) {
        // ოპტიმისტური განახლება - მაშინვე ვაშლით სიიდან
        setMessages(prev => prev.filter(m => m.id !== id));
      }
    }
  }

  return (
    <main className="min-h-screen bg-[#050510] p-6 md:p-10 font-sans text-white relative overflow-hidden">
      
      {/* Background Blur Effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-600/5 rounded-full blur-[120px] -z-10" />

      <div className="max-w-5xl mx-auto relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 bg-white/[0.03] backdrop-blur-3xl p-8 rounded-[40px] border border-white/10 shadow-2xl gap-6">
          <div>
            <h1 className="text-3xl font-black text-amber-500 uppercase italic tracking-tighter leading-none">
              შემოსული წერილები
            </h1>
            <p className="text-white/30 font-bold text-[10px] mt-2 uppercase tracking-[0.2em] italic">
              კონტაქტის ფორმის მართვა • Core
            </p>
          </div>
          <Link href="/admin" className="bg-white/5 text-white px-8 py-3 rounded-2xl font-black uppercase italic text-[11px] border border-white/10 hover:bg-amber-600 transition-all">
            ← უკან
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-white/20 font-black uppercase italic tracking-widest text-[10px]">წერილები იტვირთება...</p>
          </div>
        ) : (
          <div className="grid gap-8">
            {messages.map((msg) => (
              <div key={msg.id} className="group bg-white/[0.02] backdrop-blur-3xl p-8 rounded-[45px] border border-white/5 hover:border-amber-500/20 transition-all duration-500 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-600/30 group-hover:bg-amber-600 transition-colors" />
                
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                       <h2 className="text-xl font-black text-white italic tracking-tight">{msg.name}</h2>
                       <span className="text-[9px] bg-white/5 px-3 py-1 rounded-full font-black text-white/30 uppercase italic">
                          {msg.created_at ? new Date(msg.created_at).toLocaleDateString('ka-GE') : ''}
                       </span>
                    </div>
                    <p className="text-amber-500 font-black text-xs uppercase tracking-widest italic">{msg.email}</p>
                  </div>
                  
                  <button 
                    onClick={() => deleteMessage(msg.id)} 
                    className="text-red-500/40 font-black hover:text-red-500 p-3 rounded-2xl bg-white/5 hover:bg-red-500/10 transition-all text-xs uppercase italic"
                  >
                    წაშლა 🗑️
                  </button>
                </div>

                <div className="mt-8 bg-black/20 p-8 rounded-[32px] text-white/70 italic font-medium leading-relaxed border border-white/5 group-hover:text-white transition-colors">
                  {msg.message}
                </div>
              </div>
            ))}

            {messages.length === 0 && (
              <div className="text-center py-32 bg-white/[0.01] rounded-[50px] border border-white/5 border-dashed">
                <span className="text-5xl block mb-6 opacity-20">📭</span>
                <p className="text-white/20 italic font-black uppercase tracking-[0.3em] text-xs">ამჟამად წერილები არ არის</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}