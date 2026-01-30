'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { isAdminUser } from '../lib/adminAuth';
import AdminLogin from './login/page';

interface AdminAuthGuardProps {
  children: React.ReactNode | ((isAuthenticated: boolean) => React.ReactNode);
  fallback?: React.ReactNode;
}

export default function AdminAuthGuard({ children, fallback }: AdminAuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showLoginInline, setShowLoginInline] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth check error:', error);
          if (error.message?.includes('refresh_token_not_found') ||
              error.message?.includes('Invalid Refresh Token') ||
              error.message?.includes('Refresh Token Not Found')) {
            setAuthError('სესიის ვადა გავიდა. გთხოვთ თავიდან შესვლა.');
            // Clear any stored session data
            localStorage.removeItem('supabase.auth.token');
            sessionStorage.clear();
            setShowLoginInline(true);
            return;
          }
          setAuthError('ავტორიზაციის შეცდომა');
          return;
        }

        if (session?.user && isAdminUser(session.user)) {
          setIsAuthenticated(true);
        } else {
          // No valid admin session — show inline login UI inside /admin to avoid navigation flash
          setShowLoginInline(true);
          return;
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        // Show inline login UI on error to avoid navigation flash
        setShowLoginInline(true);
        return;
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change in guard:', event);

        if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          // Show inline login UI
          setShowLoginInline(true);
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
          setAuthError(null);
          if (session?.user && isAdminUser(session.user)) {
            setIsAuthenticated(true);
            setShowLoginInline(false);
          }
        } else if (session?.user && isAdminUser(session.user)) {
          setIsAuthenticated(true);
          setAuthError(null);
          setShowLoginInline(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#050510] flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mx-auto mb-4" />
          <p>ავტორიზაციის შემოწმება...</p>
        </div>
      </main>
    );
  }
  // If we flagged to show inline login UI, render the Admin login component here
  if (showLoginInline && !isAuthenticated) {
    return <AdminLogin />;
  }

  if (authError) {
    return (
      <main className="min-h-screen bg-[#050510] flex items-center justify-center text-white">
        <div className="text-center">
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 mb-4">
            <p className="text-red-400 mb-2">{authError}</p>
            <p className="text-white/70 text-sm">გადამისამართება შესვლის გვერდზე...</p>
          </div>
          <Link href="/admin/login" className="bg-amber-600 text-white px-6 py-3 rounded-xl font-black uppercase text-xs">
            შესვლა ახლავე
          </Link>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return fallback || (
      <main className="min-h-screen bg-[#050510] flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-white/70 mb-4">წვდომა შეზღუდულია</p>
          <Link href="/admin/login" className="bg-amber-600 text-white px-6 py-3 rounded-xl font-black uppercase text-xs">შესვლა</Link>
        </div>
      </main>
    );
  }

  return <>{typeof children === 'function' ? children(isAuthenticated) : children}</>;
}