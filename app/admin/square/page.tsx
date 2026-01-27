'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

type SquareMessage = {
  id: string;
  message: string;
  user_name: string;
  ip_address?: string | null;
  fingerprint?: string | null;
  created_at: string;
  archived?: boolean;
};

export default function AdminSquare() {
  const [messages, setMessages] = useState<SquareMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [viewingMessage, setViewingMessage] = useState<SquareMessage | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('square_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm('ნამდვილად გსურთ მესიჯის წაშლა?')) return;

    try {
      const response = await fetch('/api/admin/square/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'Delete failed');
      }
      setMessages(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      console.error('Delete error:', error);
      alert('შეცდომა წაშლისას');
    }
  };

  const banIP = async (ip: string) => {
    if (!ip) return alert('ID ვერ მოიძებნა');
    if (!confirm(`ნამდვილად გსურთ ID ${ip}-ის ბანი?`)) return;

    try {
      const response = await fetch('/api/admin/square/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, reason: 'Admin ban' }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'Ban failed');
      }
      alert('IP დაბანდა');
    } catch (error) {
      console.error('Ban error:', error);
      alert('შეცდომა ბანისას');
    }
  };

  const archiveMessage = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('square_messages')
        .update({ archived: true })
        .eq('id', id);

      if (error) throw error;
      setMessages(prev => prev.map(m => m.id === id ? { ...m, archived: true } : m));
    } catch (error) {
      console.error('Archive error:', error);
      alert('შეცდომა დაარქივებისას');
    }
  };

  const deleteSelected = async () => {
    if (selectedMessages.length === 0) return alert('აირჩიეთ მესიჯები');
    if (!confirm(`ნამდვილად გსურთ ${selectedMessages.length} მესიჯის წაშლა?`)) return;

    try {
      const response = await fetch('/api/admin/square/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedMessages }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'Bulk delete failed');
      }
      setMessages(prev => prev.filter(m => !selectedMessages.includes(m.id)));
      setSelectedMessages([]);
    } catch (error) {
      console.error('Bulk delete error:', error);
      alert('შეცდომა ერთიანი წაშლისას');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedMessages(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedMessages(messages.map(m => m.id));
  };

  const deselectAll = () => {
    setSelectedMessages([]);
  };

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
          <h1 className="text-2xl font-black italic uppercase border-l-4 border-amber-600 pl-4">კახური მოედანი</h1>
          <Link href="/admin" className="bg-white/5 px-4 py-2 rounded-xl text-xs font-black uppercase">← ადმინ ჰაბი</Link>
        </div>

        <div className="bg-white/5 rounded-3xl border border-white/10 p-6 mb-6">
          <div className="flex gap-4 mb-4">
            <button onClick={selectAll} className="bg-amber-600 px-4 py-2 rounded-xl text-xs font-black uppercase">ყველას მონიშვნა</button>
            <button onClick={deselectAll} className="bg-white/5 px-4 py-2 rounded-xl text-xs font-black uppercase">მოხსნა</button>
            <button onClick={deleteSelected} disabled={selectedMessages.length === 0} className="bg-red-600 disabled:bg-gray-600 px-4 py-2 rounded-xl text-xs font-black uppercase">არჩეულების წაშლა</button>
          </div>
        </div>

        <div className="space-y-4">
          {messages.map(message => (
            <div key={message.id} className={`bg-white/5 rounded-2xl p-4 border border-white/10 ${message.archived ? 'opacity-50' : ''}`}>
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={selectedMessages.includes(message.id)}
                  onChange={() => toggleSelect(message.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-bold text-amber-400">{message.user_name}</span>
                      <span className="text-white/40 text-sm ml-2">{new Date(message.created_at).toLocaleString('ka-GE')}</span>
                      {message.archived && <span className="text-yellow-400 text-sm ml-2">(დაარქივებული)</span>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setViewingMessage(message)} className="text-xs bg-green-600 px-2 py-1 rounded">ნახვა</button>
                      <button onClick={() => alert(`ID: ${message.fingerprint || message.ip_address || '-'}`)} className="text-xs bg-blue-600 px-2 py-1 rounded">ID</button>
                      <button onClick={() => banIP(message.fingerprint || message.ip_address || '')} className="text-xs bg-red-600 px-2 py-1 rounded">ბანი</button>
                      <button onClick={() => archiveMessage(message.id)} className="text-xs bg-yellow-600 px-2 py-1 rounded">არქივი</button>
                      <button onClick={() => deleteMessage(message.id)} className="text-xs bg-red-600 px-2 py-1 rounded">წაშლა</button>
                    </div>
                  </div>
                  <p className="text-white/80">{message.message}</p>
                </div>
              </div>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="text-center py-12 text-white/40">
              მესიჯები არ არის
            </div>
          )}
        </div>

        {/* Message View Modal */}
        {viewingMessage && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setViewingMessage(null)}>
            <div className="bg-slate-900 rounded-2xl border border-white/20 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-amber-400">{viewingMessage.user_name}</h3>
                  <p className="text-white/60 text-sm">{new Date(viewingMessage.created_at).toLocaleString('ka-GE')}</p>
                  <p className="text-white/40 text-sm">ID: {viewingMessage.fingerprint || viewingMessage.ip_address || '-'}</p>
                  {viewingMessage.archived && <p className="text-yellow-400 text-sm">(დაარქივებული)</p>}
                </div>
                <button
                  onClick={() => setViewingMessage(null)}
                  className="text-white/60 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>
              <div className="bg-white/5 rounded-xl p-4 mb-4">
                <p className="text-white whitespace-pre-wrap">{viewingMessage.message}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => { banIP(viewingMessage.fingerprint || viewingMessage.ip_address || ''); setViewingMessage(null); }} className="bg-red-600 px-4 py-2 rounded-xl text-sm font-bold">ბანი ID</button>
                <button onClick={() => { archiveMessage(viewingMessage.id); setViewingMessage(null); }} className="bg-yellow-600 px-4 py-2 rounded-xl text-sm font-bold">დაარქივება</button>
                <button onClick={() => { deleteMessage(viewingMessage.id); setViewingMessage(null); }} className="bg-red-600 px-4 py-2 rounded-xl text-sm font-bold">წაშლა</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}