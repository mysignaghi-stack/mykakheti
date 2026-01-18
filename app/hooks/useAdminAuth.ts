import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { isAdminUser } from '../lib/adminAuth';

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check admin status on mount and auth changes
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth session error:', error);
          setIsAdmin(false);
          setUser(null);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          setIsAdmin(isAdminUser(session.user));
        } else {
          setIsAdmin(false);
          setUser(null);
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
        setIsAdmin(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          setIsAdmin(isAdminUser(session.user));
        } else {
          setIsAdmin(false);
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Logout handler
  const handleAdminLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setIsAdmin(false);
      setUser(null);
    } catch (err) {
      console.error('Error logging out:', err);
    }
  }, []);

  return {
    isAdmin,
    user,
    loading,
    handleAdminLogout,
  };
}
