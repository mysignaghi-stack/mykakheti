'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { isAdminUser } from '../../lib/adminAuth';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if already logged in
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && isAdminUser(user)) {
        router.push('/admin');
      }
    };
    checkUser();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        alert('გთხოვთ გაიაროთ ავტორიზაცია');
        return;
      }

      if (error) {
        setError('არასწორი მონაცემები');
        return;
      }

      if (data.user && isAdminUser(data.user)) {
        router.push('/admin');
      } else {
        await supabase.auth.signOut();
        setError('ადმინისტრატორის წვდომა არ არის');
      }
    } catch (error: any) {
      console.error('Upload error details:', {
        message: error?.message,
        name: error?.name,
        stack: error?.stack,
        error
      });
      const errorMessage = error?.message || 'უცნობი შეცდომა';
      alert(`შეცდომა ატვირთვისას: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050510] flex items-center justify-center p-6 font-sans relative overflow-hidden">
      
      {/* დეკორატიული ფონი (Blur Effects) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-600/10 rounded-full blur-[120px]" />

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/[0.03] backdrop-blur-3xl rounded-[50px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] p-10 md:p-14 border border-white/10 relative overflow-hidden">
          
          {/* ზედა დეკორატიული ხაზი */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-amber-600 to-transparent" />

          <div className="text-center mb-10">
            <div className="inline-block p-4 bg-white/5 rounded-3xl mb-4 border border-white/5">
                <span className="text-4xl">🛡️</span>
            </div>
            <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">
              ავტორიზაცია
            </h1>
            <p className="text-white/30 font-bold text-[10px] mt-3 uppercase tracking-[0.2em] italic">
              Digital Kakheti Hub • Core Access
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative group">
              <input 
                type="email" 
                placeholder="ელ.ფოსტა" 
                className={`w-full p-6 bg-white/5 rounded-[24px] border-2 outline-none transition-all font-black text-center text-xl tracking-widest text-white placeholder:text-white/10 placeholder:tracking-normal ${
                  error 
                  ? 'border-red-500 animate-shake' 
                  : 'border-white/5 focus:border-amber-600 focus:bg-white/10'
                }`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="relative group">
              <input 
                type="password" 
                placeholder="პაროლი" 
                className={`w-full p-6 bg-white/5 rounded-[24px] border-2 outline-none transition-all font-black text-center text-xl tracking-widest text-white placeholder:text-white/10 placeholder:tracking-normal ${
                  error 
                  ? 'border-red-500 animate-shake' 
                  : 'border-white/5 focus:border-amber-600 focus:bg-white/10'
                }`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {error && (
                <p className="text-red-500 text-[10px] font-black uppercase italic mt-3 text-center animate-pulse">
                  {error}
                </p>
              )}
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-amber-600 text-white py-6 rounded-[24px] font-black text-xs uppercase italic tracking-widest hover:bg-amber-500 transition-all shadow-[0_20px_40px_-10px_rgba(217,119,6,0.3)] active:scale-95 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="group-hover:tracking-[0.3em] transition-all duration-300">
                {loading ? 'შესვლა...' : 'შესვლა სისტემაში →'}
              </span>
            </button>
          </form>

          <div className="mt-10 text-center">
            <Link 
              href="/admin/diagnostic" 
              className="text-white/40 font-black uppercase italic text-[9px] tracking-widest hover:text-amber-400 transition-all border-b border-transparent hover:border-amber-400/50 pb-1 mr-4"
            >
              🔍 დიაგნოსტიკა
            </Link>
            <Link 
              href="/" 
              className="text-white/20 font-black uppercase italic text-[9px] tracking-widest hover:text-white transition-all border-b border-transparent hover:border-white/10 pb-1"
            >
              ← დაბრუნება მთავარ გვერდზე
            </Link>
          </div>
        </div>
        
        {/* Footer Info */}
        <p className="text-center mt-8 text-white/10 font-black italic text-[9px] uppercase tracking-widest">
          Secure Core Management System © 2026
        </p>
      </div>
    </main>
  );
}

/* CREATE POLICY "Authenticated users can manage admin posts" ON admin_posts
FOR ALL USING (auth.uid() IS NOT NULL); */