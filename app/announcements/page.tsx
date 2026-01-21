'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

interface Announcement {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  price: string;
  currency: string;
  image_url?: string | null;
  all_images?: string[] | null;
  created_at: string;
}

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from('announcements')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
      setItems((data || []) as Announcement[]);
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <main className="min-h-screen bg-[#050510] p-6 md:p-10 text-white">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-start mb-4">
          <Link href="/" className="text-[11px] font-black uppercase italic text-white/50 hover:text-white transition">← მთავარი გვერდი</Link>
        </div>
        <h1 className="text-2xl font-black text-amber-500 uppercase italic mb-6">განცხადებები</h1>
        {loading ? (
          <div className="opacity-50">იტვირთება...</div>
        ) : (
          <div className="space-y-4">
            {items.map(item => (
              <Link key={item.id} href={`/announcements/${item.id}`} className="block">
                <div className="p-5 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition">
                  <div className="flex gap-4 items-start">
                    {(item.image_url || item.all_images?.[0]) && (
                      <Image
                        src={item.image_url || item.all_images![0]}
                        alt=""
                        width={80}
                        height={80}
                        className="rounded-2xl object-contain flex-shrink-0 shadow-lg ring-1 ring-amber-400/20"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-black text-white text-lg italic">{item.title}</h3>
                        <div className="flex gap-2">
                          <span className="text-amber-500 text-xs font-bold uppercase px-2 py-1 bg-amber-500/10 rounded">
                            {item.category}
                          </span>
                          <span className="text-blue-400 text-xs font-bold uppercase px-2 py-1 bg-blue-400/10 rounded">
                            {item.location}
                          </span>
                        </div>
                      </div>
                      <p className="text-white/80 italic leading-relaxed line-clamp-2">{item.description}</p>
                      <div className="flex justify-between items-center mt-2">
                        <div className="text-white/40 text-xs">
                          {new Date(item.created_at).toLocaleDateString('ka-GE')}
                        </div>
                        <div className="text-amber-500 font-black text-lg">
                          {item.price} {item.currency === 'USD' ? '$' : '₾'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

// Add new fields to congratulations table for enhanced visual templates
ALTER TABLE congratulations ADD COLUMN template TEXT DEFAULT 'თანამედროვე მინიმალიზმი';
ALTER TABLE congratulations ADD COLUMN toast TEXT;
ALTER TABLE congratulations ADD COLUMN music_url TEXT;
ALTER TABLE congratulations ADD COLUMN animation_enabled BOOLEAN DEFAULT false;

// Update existing records with default values
UPDATE congratulations SET template = 'თანამედროვე მინიმალიზმი' WHERE template IS NULL;
