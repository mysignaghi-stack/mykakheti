"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import EditAgroModal from '../components/layout/EditAgroModal';

type AgroRow = {
  id: number | string;
  name: string;
  price?: string | null;
  category?: string | null;
  details?: any;
};

export default function AdminAgroPanel({ showCategory }: { showCategory?: 'grape' | 'grain' }) {
  const [items, setItems] = useState<AgroRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editItem, setEditItem] = useState<AgroRow | null>(null);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [editDetails, setEditDetails] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any).from('agro_prices').select('*').order('id', { ascending: true });
      if (error) throw error;
      setItems((data || []) as AgroRow[]);
    } catch (err) {
      console.error('Failed to load agro items', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const openEdit = (it: AgroRow) => {
    setEditItem(it);
    setNewName(it.name ?? '');
    setNewPrice(it.price ?? '');
    setEditDetails(Array.isArray(it.details) ? it.details : []);
  };

  const openCreate = (category: 'grape' | 'grain') => {
    const newItem: AgroRow = { id: `new-${Date.now()}`, name: '', price: '', category };
    setEditItem(newItem);
    setNewName('');
    setNewPrice('');
    setEditDetails([]);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    try { e?.preventDefault?.(); } catch {}
    if (!editItem) return;
    setSaving(true);
    const payload = { name: newName, price: newPrice, details: editDetails, category: editItem.category };
    try {
      // Use server API route to perform writes with service role key (bypasses RLS for admin actions)
      const resp = await fetch('/api/admin/agro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upsert', payload }),
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok || json?.error) {
        console.error('API save error response:', json, 'payload:', payload);
        throw new Error(json?.error || 'API save failed');
      }
      await fetchItems();
      setEditItem(null);
      alert('შენახვა წარმატებულია');
    } catch (err) {
      console.error('Failed to save agro item', err);
      const getErrorMessage = (e: unknown) => {
        if (!e) return 'Unknown error';
        if (typeof e === 'string') return e;
        if (e instanceof Error) return e.message;
        const anyErr = e as any;
        return anyErr?.message || anyErr?.msg || JSON.stringify(anyErr);
      };
      const msg = getErrorMessage(err);
      alert('შენახვა ვერ მოხერხდა: ' + msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number | string) => {
    if (!confirm('დარწმუნებული ხართ, რომ გსურთ სრული წაშლა?')) return;
    setLoading(true);
    try {
      const targetId = !isNaN(Number(id)) ? Number(id) : id;
      const resp = await fetch('/api/admin/agro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: targetId }),
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok || json?.error) {
        console.error('API delete error response:', json);
        throw new Error(json?.error || 'Delete failed');
      }
      await fetchItems();
      alert('წაშლილია');
    } catch (err) {
      console.error('Delete failed', err);
      alert('წაშლა ვერ მოხერხდა');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-black uppercase text-amber-400">აგრო კონტროლი</h3>
        <div className="text-xs text-white/60">{loading ? 'იტვირთება...' : `${items.length} რიგი`}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {(showCategory === undefined || showCategory === 'grape') && (
          <div>
            <div className="flex items-center justify-between">
              <div className="text-[11px] text-white/70 mb-2">🍇 აგრო-ბირჟა (გონდაწკიცი)</div>
              <button onClick={() => openCreate('grape')} className="text-[11px] px-2 py-1 rounded-lg bg-amber-600 text-white font-black">ახალი</button>
            </div>
            <div className="space-y-2">
              {items.filter(i => i.category === 'grape').map(it => (
                <div key={String(it.id)} className="flex justify-between items-center bg-black/40 p-2 rounded-lg border border-white/5">
                  <div className="text-sm font-bold text-purple-300">{it.name}</div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-black">{it.price}</div>
                    <button onClick={() => openEdit(it)} className="px-3 py-1 bg-amber-600 rounded text-xs font-black">Edit</button>
                    <button onClick={() => handleDelete(it.id)} className="px-3 py-1 bg-red-600 rounded text-xs font-black">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(showCategory === undefined || showCategory === 'grain') && (
          <div>
            <div className="flex items-center justify-between">
              <div className="text-[11px] text-white/70 mb-2">🌾 მარცვლეული</div>
              <button onClick={() => openCreate('grain')} className="text-[11px] px-2 py-1 rounded-lg bg-amber-600 text-white font-black">ახალი</button>
            </div>
            <div className="space-y-2">
              {items.filter(i => i.category === 'grain').map(it => (
                <div key={String(it.id)} className="flex justify-between items-center bg-black/40 p-2 rounded-lg border border-white/5">
                  <div className="text-sm font-bold text-yellow-400">{it.name}</div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-black">{it.price}</div>
                    <button onClick={() => openEdit(it)} className="px-3 py-1 bg-amber-600 rounded text-xs font-black">Edit</button>
                    <button onClick={() => handleDelete(it.id)} className="px-3 py-1 bg-red-600 rounded text-xs font-black">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {editItem && (
        <EditAgroModal
          open={!!editItem}
          item={{ name: editItem.name }}
          newName={newName}
          newPrice={newPrice}
          onChangeName={setNewName}
          onChange={setNewPrice}
          details={editDetails}
          onChangeDetails={setEditDetails}
          onClose={() => setEditItem(null)}
          loading={saving}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
