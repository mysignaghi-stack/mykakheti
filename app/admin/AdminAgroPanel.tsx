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
  source?: string | null;
};

const cleanAgroPriceText = (value?: string | null) =>
  String(value ?? '')
    .trim()
    .replace(/₾/g, 'GEL')
    .replace(/\bgel\b/gi, 'GEL')
    .replace(/\bGEL(?:\s+GEL)+\b/g, 'GEL')
    .replace(/\s*ლ\s*(?=$|GEL|gel|₾)/g, ' ')
    .replace(/(\d)\s*ლ\b/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();

export default function AdminAgroPanel({ showCategory }: { showCategory?: 'grape' | 'grain' }) {
  const [items, setItems] = useState<AgroRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editItem, setEditItem] = useState<AgroRow | null>(null);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [editDetails, setEditDetails] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'grape' | 'grain'>(showCategory ?? 'all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    try {
      const resp = await fetch('/api/admin/agro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list' }),
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok || json?.error) {
        throw new Error(json?.error || 'Load failed');
      }
      setItems((json?.data || []) as AgroRow[]);
    } catch (err) {
      console.error('Failed to load agro items', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    setActiveCategory(showCategory ?? 'all');
  }, [showCategory]);

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

  const filteredItems = items.filter((item) => {
    if (activeCategory !== 'all' && item.category !== activeCategory) return false;
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return `${item.name ?? ''} ${item.price ?? ''}`.toLowerCase().includes(term);
  });

  const counts = {
    grape: items.filter(i => i.category === 'grape').length,
    grain: items.filter(i => i.category === 'grain').length,
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    try { e?.preventDefault?.(); } catch {}
    if (!editItem) return;
    setSaving(true);
    const payload = {
      id: editItem.id,
      name: newName,
      price: newPrice,
      details: editDetails,
      category: editItem.category,
    };
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

  const handleResetDefaults = async () => {
    if (!confirm('ნამდვილად გსურთ ძველი ჩანაწერების წაშლა და სტანდარტული მონაცემების ჩასმა?')) return;
    setLoading(true);
    try {
      const resp = await fetch('/api/admin/agro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok || json?.error) throw new Error(json?.error || 'Reset failed');
      await fetchItems();
      alert('სტანდარტული მონაცემები ჩაიტვირთა');
    } catch (err) {
      console.error('Reset defaults failed', err);
      alert('სტანდარტული მონაცემების ჩატვირთვა ვერ მოხერხდა');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-black/70 via-black/50 to-amber-950/30 border border-amber-500/20 rounded-[28px] p-5 md:p-6 mb-6 shadow-2xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg md:text-xl font-black uppercase text-amber-300 tracking-[0.2em]">აგრო კონტროლი</h3>
          <p className="text-xs text-white/50 mt-1">აგრო-ბირჟა და მარცვლეული — რედაქტირება და წაშლა</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => fetchItems()}
            className="px-3 py-1 rounded-xl text-xs font-black bg-white/10 text-white/80 hover:bg-white/20"
            type="button"
          >
            განახლება
          </button>
          <button
            onClick={handleResetDefaults}
            className="px-3 py-1 rounded-xl text-xs font-black bg-white/10 text-white/80 hover:bg-white/20"
            type="button"
          >
            სტანდარტული ჩასმა
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-2">
          {([
            { key: 'all', label: 'ყველა', count: items.length },
            { key: 'grape', label: `🍇 აგრო-ბირჟა (${counts.grape})` },
            { key: 'grain', label: `🌾 მარცვლეული (${counts.grain})` },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveCategory(tab.key)}
              className={`px-3 py-1 rounded-xl text-xs font-black ${activeCategory === tab.key ? 'bg-amber-600 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ძებნა სახელით/ფასით"
            className="bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-xs text-white w-full md:w-64"
          />
          <div className="text-xs text-white/50 min-w-[90px] text-right">
            {loading ? 'იტვირთება...' : `${filteredItems.length} ჩანაწერი`}
          </div>
        </div>
      </div>

      {filteredItems.length === 0 && !loading && (
        <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/50">
          ჩანაწერები ვერ მოიძებნა. სცადე ძიების შეცვლა ან დაამატე ახალი.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {(activeCategory === 'all' || activeCategory === 'grape') && (
          <div>
            <div className="flex items-center justify-between">
              <div className="text-[11px] text-white/70 mb-2">🍇 აგრო-ბირჟა (გონდაწკიცი)</div>
            </div>
            <div className="space-y-2">
              {filteredItems.filter(i => i.category === 'grape').map(it => (
                <div key={String(it.id)} className="flex justify-between items-center bg-black/40 p-2 rounded-lg border border-white/5">
                  <div>
                    <div className="text-sm font-bold text-purple-300">{it.name}</div>
                    {it.source === 'announcement' && (
                      <div className="mt-1 text-[10px] font-black uppercase tracking-widest text-white/35">მოდერაციით დამატებული</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-black">{cleanAgroPriceText(it.price)}</div>
                    <button onClick={() => openEdit(it)} className="px-3 py-1 bg-amber-600 rounded text-xs font-black">Edit</button>
                    <button onClick={() => handleDelete(it.id)} className="px-3 py-1 bg-red-600 rounded text-xs font-black">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(activeCategory === 'all' || activeCategory === 'grain') && (
          <div>
            <div className="flex items-center justify-between">
              <div className="text-[11px] text-white/70 mb-2">🌾 მარცვლეული</div>
            </div>
            <div className="space-y-2">
              {filteredItems.filter(i => i.category === 'grain').map(it => (
                <div key={String(it.id)} className="flex justify-between items-center bg-black/40 p-2 rounded-lg border border-white/5">
                  <div>
                    <div className="text-sm font-bold text-yellow-400">{it.name}</div>
                    {it.source === 'announcement' && (
                      <div className="mt-1 text-[10px] font-black uppercase tracking-widest text-white/35">მოდერაციით დამატებული</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-black">{cleanAgroPriceText(it.price)}</div>
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
          showPriceInput
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
