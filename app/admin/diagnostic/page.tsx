'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { getAdminIndicators } from '../../lib/adminAuth';
import AdminNav from '../../components/admin/AdminNav';

type AdminUserInfo = {
  id: string;
  email: string | null;
  role_user_metadata?: string | null;
  role_app_metadata?: string | null;
  detected_admin: boolean;
  user_metadata: Record<string, unknown> | null;
  app_metadata: Record<string, unknown> | null;
  created_at: string;
  last_sign_in: string | null;
};

export default function AdminDiagnostic() {
  const [userInfo, setUserInfo] = useState<AdminUserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      await checkUserStatus();
      setLoading(false);
    };
    run();
  }, []);

  const checkUserStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const indicators = getAdminIndicators(user as User);
        setUserInfo({
          id: user.id,
          email: user.email ?? null,
          role_user_metadata: (user as User).user_metadata?.role ?? null,
          role_app_metadata: (user as User).app_metadata?.role ?? null,
          detected_admin: indicators.detected,
          user_metadata: (user as User).user_metadata ?? null,
          app_metadata: (user as User).app_metadata ?? null,
          created_at: user.created_at,
          last_sign_in: user.last_sign_in_at ?? null
        });
      } else {
        setUserInfo(null);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError('Error: ' + message);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserInfo(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050510] flex items-center justify-center p-6 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p>იტვირთება...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050510] p-6 text-white">
      <div className="max-w-2xl mx-auto">
        <AdminNav className="mb-6" />
        <h1 className="text-2xl font-black text-amber-500 uppercase italic mb-6">
          🔍 ადმინისტრატორის დიაგნოსტიკა
        </h1>

        {error && (
          <div className="bg-red-600/20 border border-red-600/50 rounded-xl p-4 mb-6">
            <p className="text-red-400 font-bold">შეცდომა: {error}</p>
          </div>
        )}

        {!userInfo ? (
          <div className="bg-white/5 rounded-xl p-6 text-center">
            <p className="text-white/60 mb-4">არ ხართ ავტორიზებული</p>
            <Link
              href="/admin/login"
              className="inline-block bg-amber-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-amber-500 transition-all"
            >
              შესვლა
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white/5 rounded-xl p-6">
              <h2 className="text-xl font-black text-amber-400 mb-4">მომხმარებლის ინფორმაცია</h2>
              <div className="space-y-2 text-sm">
                <p><strong>ID:</strong> {userInfo.id}</p>
                <p><strong>ელ.ფოსტა:</strong> {userInfo.email}</p>
                <p><strong>როლი (user_metadata):</strong> <span className="ml-2 px-2 py-1 rounded text-xs font-bold bg-white/10">{userInfo.role_user_metadata || '—'}</span></p>
                <p><strong>როლი (app_metadata):</strong> <span className="ml-2 px-2 py-1 rounded text-xs font-bold bg-white/10">{userInfo.role_app_metadata || '—'}</span></p>
                <p><strong>აღმოჩენილი ადმინი:</strong>
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-bold ${userInfo.detected_admin ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                    {userInfo.detected_admin ? 'დიახ' : 'არა'}
                  </span>
                </p>
                <p><strong>შექმნის თარიღი:</strong> {new Date(userInfo.created_at).toLocaleString('ka-GE')}</p>
                <p><strong>ბოლო შესვლა:</strong> {userInfo.last_sign_in ? new Date(userInfo.last_sign_in).toLocaleString('ka-GE') : 'არასოდეს'}</p>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-6">
              <h2 className="text-xl font-black text-amber-400 mb-4">სრული მეტამონაცემები</h2>
              <pre className="bg-black/50 p-4 rounded text-xs overflow-x-auto">
                {JSON.stringify({ user_metadata: userInfo.user_metadata, app_metadata: userInfo.app_metadata }, null, 2)}
              </pre>
            </div>

            <div className="bg-white/5 rounded-xl p-6">
              <h2 className="text-xl font-black text-amber-400 mb-4">შემოწმება</h2>
              <div className="space-y-2">
                <p className={`text-sm ${userInfo.detected_admin ? 'text-green-400' : 'text-red-400'}`}>
                  {userInfo.detected_admin
                    ? '✅ ადმინისტრატორი ამოიცნო სისტემამ'
                    : '❌ ადმინისტრატორის როლი ვერ ამოიცნო'}
                </p>
                {!userInfo.detected_admin && (
                  <div className="bg-red-600/20 border border-red-600/50 rounded-lg p-4 mt-4">
                    <p className="text-red-400 font-bold mb-2">როგორ გავასწოროთ:</p>
                    <div className="space-y-3">
                      <div className="bg-amber-600/20 border border-amber-600/50 rounded-lg p-3">
                        <p className="text-amber-400 font-bold mb-1">🚀 ერთი დაჭერით გადაწყვეტა:</p>
                        <p className="text-amber-300 text-sm">
                          გახსენით <code className="bg-black px-1 rounded">one_click_admin_fix.sql</code> და გაუშვით Supabase-ში
                        </p>
                      </div>
                      <div>
                        <p className="text-red-300 text-sm mb-1">ან ხელით:</p>
                        <ol className="text-sm text-red-300 space-y-1 list-decimal list-inside">
                          <li>გადადით Supabase Dashboard-ში</li>
                          <li>გახსენით Authentication → Users</li>
                          <li>იპოვეთ თქვენი მომხმარებელი</li>
                          <li>დააჭირეთ Edit User Metadata</li>
                          <li>დაამატეთ ერთ-ერთი: <code className="bg-black px-1 rounded">{"{role: \"admin\"}"}</code> ან <code className="bg-black px-1 rounded">{"{is_admin: true}"}</code> (user_metadata ან app_metadata)</li>
                          <li>შეინახეთ და ხელახლა სცადეთ</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={checkUserStatus}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-500 transition-all"
              >
                განახლება
              </button>
              <button
                onClick={signOut}
                className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-500 transition-all"
              >
                გამოსვლა
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}