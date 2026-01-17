'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: 'კონტაქტი', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await (supabase as any).from('contact_messages').insert([formData]);
      if (error) throw error;
      setSent(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      alert('შეცდომა: ' + message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = "w-full p-4 bg-white rounded-2xl border-2 border-slate-200 outline-none focus:border-[#9A3412] transition-all font-bold text-blue-950 shadow-sm";

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <nav className="border-b-4 border-blue-900 bg-white p-6 flex justify-between items-center shadow-md">
        <Link href="/" className="text-3xl font-black italic tracking-tighter text-blue-900">
          mykakheti<span className="text-[#9A3412]">.ge</span>
        </Link>
        <Link href="/" className="text-slate-500 font-bold hover:text-blue-900 transition-all">← მთავარი</Link>
      </nav>

      <div className="flex-grow flex items-center justify-center p-6">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 bg-white rounded-[40px] shadow-2xl overflow-hidden border border-blue-900/5">
          <div className="bg-blue-950 p-12 text-white flex flex-col justify-center border-r-8 border-[#9A3412]">
            <h1 className="text-4xl font-black mb-8 uppercase italic leading-tight text-orange-400">მოგვწერეთ</h1>
            <div className="space-y-6 font-bold text-blue-100 italic text-sm">
              <p>📧 mysignaghi@gmail.com</p>
              <p>📞 557 58 47 00</p>
              <p>📍 ქ. წნორი</p>
            </div>
          </div>
          <div className="p-12">
            {sent ? (
              <div className="text-center py-10">
                <h2 className="text-3xl font-black text-blue-900 mb-4 tracking-tighter italic uppercase">✅ გაიგზავნა!</h2>
                <p className="text-slate-500 font-bold italic">მადლობა, შეტყობინება მიღებულია.</p>
                <button onClick={() => setSent(false)} className="mt-8 bg-blue-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-[#9A3412] transition-all">კიდევ მიწერა</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <input required placeholder="თქვენი სახელი" className={inputStyle} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                <input required type="email" placeholder="თქვენი იმეილი" className={inputStyle} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                <textarea required rows={5} placeholder="თქვენი შეტყობინება..." className={`${inputStyle} resize-none`} onChange={(e) => setFormData({...formData, message: e.target.value})}></textarea>
                <button type="submit" disabled={loading} className="w-full bg-[#9A3412] text-white py-5 rounded-2xl font-black text-xl hover:bg-blue-900 transition-all shadow-xl active:scale-95 disabled:opacity-50 mt-4">
                  {loading ? '⏳ იგზავნება...' : 'გაგზავნა'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}