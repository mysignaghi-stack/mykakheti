'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { Database } from '@/types/supabase';
import { useAdminAuth } from '@/app/hooks/useAdminAuth';
import AdminNav from '@/app/components/admin/AdminNav';

type Announcement = Database['public']['Tables']['announcements']['Row'];
type NotificationSummary = { total: number; sent: number; failed: number };
type ServiceRequest = Announcement & { notification_summary?: NotificationSummary };
type Draft = Pick<Announcement, 'title' | 'description' | 'location' | 'phone' | 'price' | 'currency'> & {
  is_approved: boolean;
  is_archived: boolean;
};

function createDraft(item: ServiceRequest): Draft {
  return {
    title: item.title ?? '',
    description: item.description ?? '',
    location: item.location ?? '',
    phone: item.phone ?? '',
    price: item.price ?? 'შეთანხმებით',
    currency: item.currency ?? 'GEL',
    is_approved: item.is_approved === true,
    is_archived: item.is_archived === true,
  };
}

export default function AdminServiceRequestsPage() {
  const { isAdmin, loading: authLoading } = useAdminAuth();
  const [items, setItems] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [activeTab, setActiveTab] = useState<'published' | 'pending' | 'archived' | 'all'>('published');

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/service-requests', { credentials: 'same-origin', cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'Fetch failed');
      const rows = Array.isArray(payload?.data) ? payload.data : [];
      setItems(rows);
      setDrafts(Object.fromEntries(rows.map((item: ServiceRequest) => [item.id, createDraft(item)])));
    } catch (error) {
      console.error('Service request fetch error:', error);
      alert('სერვისის მაძიებლების სია ვერ ჩაიტვირთა');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin || authLoading) return;
    fetchItems();
  }, [isAdmin, authLoading]);

  const counts = useMemo(() => {
    const published = items.filter((item) => item.is_approved === true && item.is_archived !== true).length;
    const pending = items.filter((item) => item.is_approved !== true && item.is_archived !== true).length;
    const archived = items.filter((item) => item.is_archived === true).length;
    return { published, pending, archived, all: items.length };
  }, [items]);

  const visibleItems = useMemo(() => {
    if (activeTab === 'published') return items.filter((item) => item.is_approved === true && item.is_archived !== true);
    if (activeTab === 'pending') return items.filter((item) => item.is_approved !== true && item.is_archived !== true);
    if (activeTab === 'archived') return items.filter((item) => item.is_archived === true);
    return items;
  }, [activeTab, items]);

  const updateDraft = (id: string, patch: Partial<Draft>) => {
    const item = items.find((entry) => entry.id === id);
    if (!item && !drafts[id]) return;
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? createDraft(item as ServiceRequest)), ...patch },
    }));
  };

  const saveItem = async (id: string) => {
    const draft = drafts[id];
    if (!draft) return;
    setSavingId(id);
    try {
      const response = await fetch('/api/admin/service-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ id, values: draft }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'Save failed');
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...payload.data } : item)));
      setEditingId(null);
    } catch (error) {
      alert((error as Error)?.message || 'შენახვა ვერ მოხერხდა');
    } finally {
      setSavingId(null);
    }
  };

  const removeItem = async (id: string) => {
    if (!confirm('ნამდვილად გსურთ ამ სერვისის ძებნის განცხადების წაშლა?')) return;
    setSavingId(id);
    try {
      const response = await fetch('/api/admin/service-requests', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ id }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || 'Delete failed');
      setItems((prev) => prev.filter((item) => item.id !== id));
      setEditingId((current) => (current === id ? null : current));
    } catch (error) {
      alert((error as Error)?.message || 'წაშლა ვერ მოხერხდა');
    } finally {
      setSavingId(null);
    }
  };

  if (authLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#050510] text-white">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        <p className="text-xs font-black uppercase tracking-[0.2em] text-white/35">ავტორიზაცია მოწმდება...</p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#050510] px-6 text-center text-white">
        <p className="text-lg font-black uppercase tracking-widest">მხოლოდ ადმინებისთვის</p>
        <Link href="/login" className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-black uppercase text-black">ავტორიზაცია</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050510] p-6 font-sans text-white md:p-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-5 rounded-[32px] border border-white/10 bg-white/[0.035] p-6 shadow-2xl md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200/70">სერვისის მაძიებლები</p>
            <h1 className="mt-2 text-3xl font-black uppercase italic tracking-tight text-white">ძებნის განცხადებების მართვა</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/45">
              აქ შეგიძლიათ ნახოთ, დაარედაქტიროთ, გამოაქვეყნოთ, დააარქივოთ ან წაშალოთ მომხმარებლების მიერ დამატებული „ვეძებ სერვისს“ განცხადებები.
            </p>
          </div>
          <AdminNav />
        </div>

        <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/25 p-3">
          {[
            { key: 'published', label: 'გამოქვეყნებული', count: counts.published },
            { key: 'pending', label: 'მოდერაციაზე', count: counts.pending },
            { key: 'archived', label: 'არქივი', count: counts.archived },
            { key: 'all', label: 'ყველა', count: counts.all },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`rounded-xl border px-4 py-2 text-xs font-black uppercase transition ${
                activeTab === tab.key
                  ? 'border-cyan-300/45 bg-cyan-500/20 text-cyan-100'
                  : 'border-white/10 bg-white/5 text-white/55 hover:bg-white/10 hover:text-white'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
          <button
            type="button"
            onClick={fetchItems}
            className="ml-auto rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            განახლება
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
            <p className="text-xs font-black uppercase tracking-[0.2em] text-white/35">იტვირთება...</p>
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-10 text-center text-white/45">
            ამ განყოფილებაში ჩანაწერები არ არის.
          </div>
        ) : (
          <div className="space-y-4">
            {visibleItems.map((item) => {
              const draft = drafts[item.id] ?? createDraft(item);
              const isEditing = editingId === item.id;
              const summary = item.notification_summary ?? { total: 0, sent: 0, failed: 0 };

              return (
                <article key={item.id} className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5 shadow-xl">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap gap-2">
                        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${
                          item.is_approved ? 'bg-emerald-500/15 text-emerald-200' : 'bg-amber-500/15 text-amber-200'
                        }`}>
                          {item.is_approved ? 'გამოქვეყნებული' : 'მოდერაციაზე'}
                        </span>
                        {item.is_archived && <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase text-white/45">არქივი</span>}
                        <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-[10px] font-black uppercase text-cyan-100">
                          ელფოსტა: {summary.sent}/{summary.total}
                        </span>
                      </div>

                      {isEditing ? (
                        <div className="grid grid-cols-1 gap-3">
                          <input
                            value={draft.title}
                            onChange={(event) => updateDraft(item.id, { title: event.target.value })}
                            className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold text-white outline-none focus:border-cyan-300/50"
                            placeholder="სათაური"
                          />
                          <textarea
                            value={draft.description ?? ''}
                            onChange={(event) => updateDraft(item.id, { description: event.target.value })}
                            rows={6}
                            className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-relaxed text-white outline-none focus:border-cyan-300/50"
                            placeholder="აღწერა"
                          />
                          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                            <input
                              value={draft.location}
                              onChange={(event) => updateDraft(item.id, { location: event.target.value })}
                              className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50 md:col-span-2"
                              placeholder="მუნიციპალიტეტი / ლოკაცია"
                            />
                            <input
                              value={draft.phone ?? ''}
                              onChange={(event) => updateDraft(item.id, { phone: event.target.value })}
                              className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50"
                              placeholder="ტელეფონი"
                            />
                            <input
                              value={draft.price}
                              onChange={(event) => updateDraft(item.id, { price: event.target.value })}
                              className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50"
                              placeholder="ბიუჯეტი"
                            />
                          </div>
                          <div className="flex flex-wrap gap-3">
                            <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold text-white/70">
                              <input
                                type="checkbox"
                                checked={draft.is_approved}
                                onChange={(event) => updateDraft(item.id, { is_approved: event.target.checked })}
                              />
                              გამოქვეყნებული
                            </label>
                            <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold text-white/70">
                              <input
                                type="checkbox"
                                checked={draft.is_archived}
                                onChange={(event) => updateDraft(item.id, { is_archived: event.target.checked })}
                              />
                              არქივი
                            </label>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h2 className="break-words text-xl font-black text-white">{item.title}</h2>
                          <p className="mt-1 text-sm font-bold text-white/55">{item.location} • {item.phone || 'ტელეფონი არ არის'} • {item.price} {item.currency}</p>
                          <p className="mt-3 whitespace-pre-line break-words text-sm leading-relaxed text-white/65">{item.description}</p>
                        </>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-col gap-2 md:w-44">
                      <p className="text-right text-[11px] font-bold text-white/35">
                        {item.created_at ? new Date(item.created_at).toLocaleString('ka-GE') : '—'}
                      </p>
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => saveItem(item.id)}
                            disabled={savingId === item.id}
                            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black uppercase text-white transition hover:bg-emerald-500 disabled:opacity-50"
                          >
                            შენახვა
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDrafts((prev) => ({ ...prev, [item.id]: createDraft(item) }));
                              setEditingId(null);
                            }}
                            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase text-white/60 transition hover:bg-white/10 hover:text-white"
                          >
                            გაუქმება
                          </button>
                        </>
                      ) : (
                        <>
                          <Link href={`/announcements/${item.id}`} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-center text-xs font-black uppercase text-white/70 transition hover:bg-white/10 hover:text-white">
                            ნახვა
                          </Link>
                          <button
                            type="button"
                            onClick={() => setEditingId(item.id)}
                            className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-black uppercase text-white transition hover:bg-amber-500"
                          >
                            რედაქტირება
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            disabled={savingId === item.id}
                            className="rounded-xl bg-red-600 px-4 py-2 text-xs font-black uppercase text-white transition hover:bg-red-500 disabled:opacity-50"
                          >
                            წაშლა
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
