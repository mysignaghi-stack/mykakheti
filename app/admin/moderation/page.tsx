'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import AdminNav from '../../components/admin/AdminNav';

export const dynamic = 'force-dynamic';

type AnnouncementRow = {
  id: string;
  title: string | null;
  category: string | null;
  is_approved: boolean | null;
  created_at: string | null;
  user_id: string | null;
};

const COMMUNITY_CATEGORIES = ['დაკარგული/ნაპოვნი', 'ოსტატი'] as const;

export default function AdminModerationPage() {
  return <DiagnosticSector />;
}

function DiagnosticSector() {
  const [rawRows, setRawRows] = useState<AnnouncementRow[]>([]);
  const [apiCount, setApiCount] = useState<number>(0);
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [apiError, setApiError] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    setApiError('');
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        throw sessionError;
      }
      setAdminEmail(sessionData.session?.user?.email ?? 'უცნობი');

      const pendingResp = await fetch('/api/admin/announcements/pending', { cache: 'no-store' });
      if (!pendingResp.ok) {
        const errorText = await pendingResp.text().catch(() => 'Unable to read error response');
        setApiError(`Pending API error: ${pendingResp.status} ${pendingResp.statusText} - ${errorText}`);
      }
      const pendingJson = await pendingResp.json().catch(() => ({ data: [] }));
      setApiCount(Array.isArray(pendingJson?.data) ? pendingJson.data.length : 0);

      const { data, error: queryError } = await (supabase as any)
        .from('announcements')
        .select('id, title, category, is_approved, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(10);

      if (queryError) throw queryError;
      setRawRows(data ?? []);
    } catch (err: any) {
      console.error('Diagnostic load error:', err?.message ?? err);
      setError(err?.message ?? 'დაბლოკილი ან გაურკვეველი შეცდომა');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const rowsWithFlags = useMemo(() => {
    const allowed = new Set(COMMUNITY_CATEGORIES);
    return rawRows.map((row) => ({
      ...row,
      mismatch: row.category ? !allowed.has(row.category as typeof COMMUNITY_CATEGORIES[number]) : true,
      hasNulls: !row.title || !row.category,
    }));
  }, [rawRows]);

  return (
    <main className="min-h-screen bg-[#050510] text-white p-6 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-black uppercase italic tracking-tight">მოდერაციის დიაგნოსტიკა</h1>
          <div className="flex gap-2 text-[11px] uppercase font-black">
            <AdminNav />
            <button onClick={loadData} className="px-3 py-2 rounded-lg bg-amber-600 text-black hover:bg-amber-500 transition">განახლება</button>
          </div>
        </div>

        <section className="rounded-2xl border border-white/10 bg-[#1a1a1f] p-5 space-y-4 shadow-lg">
          <div className="flex flex-wrap gap-4 text-sm font-black uppercase">
            <span className="px-3 py-2 rounded-full bg-white/5 border border-white/10 text-white/80">ავტორიზებული ხართ როგორც: {adminEmail || 'უცნობი'}</span>
            <span className="px-3 py-2 rounded-full border text-white/80" style={{ borderColor: apiCount > 0 ? '#22c55e' : '#ef4444', color: apiCount > 0 ? '#22c55e' : '#ef4444' }}>
              API Response Count: {apiCount}
            </span>
            <span className="px-3 py-2 rounded-full bg-white/5 border border-white/10 text-white/60">Raw Rows Loaded: {rawRows.length}</span>
            {apiError && (
              <span className="px-3 py-2 rounded-full bg-red-900/50 border border-red-500 text-red-200">{apiError}</span>
            )}
          </div>

          {loading && (
            <div className="text-white/60 text-sm">იტვირთება...</div>
          )}
          {error && (
            <div className="text-red-400 text-sm font-semibold">შეცდომა: {error}</div>
          )}

          {!loading && !error && (
            <div className="overflow-auto rounded-xl border border-white/10">
              <table className="min-w-full text-sm">
                <thead className="bg-white/5 text-white/70 uppercase text-[11px]">
                  <tr>
                    <th className="px-3 py-2 text-left">ID</th>
                    <th className="px-3 py-2 text-left">სათაური</th>
                    <th className="px-3 py-2 text-left">კატეგორია (raw)</th>
                    <th className="px-3 py-2 text-left">დამტკიცებული?</th>
                    <th className="px-3 py-2 text-left">User ID</th>
                  </tr>
                </thead>
                <tbody>
                  {rowsWithFlags.map((row) => (
                    <tr key={row.id} className={row.mismatch ? 'bg-red-900/30' : 'bg-white/5'}>
                      <td className="px-3 py-2 align-top text-white/80">{row.id}</td>
                      <td className="px-3 py-2 align-top text-white">{row.title || '—'}</td>
                      <td className="px-3 py-2 align-top">
                        <span className="inline-block px-2 py-1 rounded bg-white/10 border border-white/10 text-white/90">
                          {row.category || '—'}
                        </span>
                        {row.category && (
                          <span className="ml-2 text-xs font-black uppercase" style={{ color: row.mismatch ? '#ef4444' : '#22c55e' }}>
                            {row.mismatch ? 'არ ემთხვევა' : 'ემთხვევა'}
                          </span>
                        )}
                        {row.mismatch && (
                          <span className="ml-2 text-xs font-black text-red-400 uppercase">შეუსაბამო კატეგორია</span>
                        )}
                        {row.hasNulls && (
                          <span className="ml-2 text-xs font-black text-amber-400 uppercase">
                            NULL: {!row.title ? 'სათაური ' : ''}{!row.category ? 'კატეგორია' : ''}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 align-top">
                        <span className={`px-2 py-1 rounded text-xs font-black ${row.is_approved ? 'bg-green-600/30 text-green-200' : 'bg-red-600/30 text-red-200'}`}>
                          {row.is_approved ? 'დამტკიცებულია' : 'მოლოდინში'}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-top text-white/70">{row.user_id || '—'}</td>
                    </tr>
                  ))}
                  {rowsWithFlags.length === 0 && (
                    <tr>
                      <td className="px-3 py-4 text-center text-white/50" colSpan={5}>ჩანაწერი ვერ მოიძებნა</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="text-xs text-white/50">
            დაშვებული კატეგორიები: {COMMUNITY_CATEGORIES.join(', ')}<br />
            თუ API Counter &gt; 0 ხოლო Pending UI = 0, პრობლემა ფრონტენდ ფილტრაციაშია.
          </div>
        </section>
      </div>
    </main>
  );
}
