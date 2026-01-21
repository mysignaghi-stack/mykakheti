'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { Database } from '../../../../types/supabase';
import { supabase } from '../../../lib/supabase';

type LostFoundRow = Database['public']['Tables']['lost_found']['Row'];

export default function LostFoundDetails() {
  const params = useParams();
  const id = params?.id as string;
  const [item, setItem] = useState<LostFoundRow | null>(null);
  const CATEGORY_LABELS: Record<string, string> = {
    personal_documents_wallet: 'პირადი დოკუმენტები და საფულე',
    electronics_gadgets: 'ელექტრონიკა და გაჯეტები',
    accessories_jewelry: 'აქსესუარები და სამკაულები',
    bags_luggage: 'ჩანთები და ბარგი',
    clothing_footwear: 'ტანსაცმელი და ფეხსაცმელი',
    pet: 'შინაური ცხოველები',
    tools_agricultural: 'პირუტყვი და სასოფლო-სამეურნეო ინვენტარი',
    children_items: 'საბავშვო ნივთები',
    transport_sports: 'ტრანსპორტი და სპორტი',
    person: 'ადამიანი',
    other: 'სხვადასხვა',
  };
  const FILTER_LABELS: Record<'lost'|'found', string> = {
    lost: 'დაკარგული',
    found: 'ნაპოვნი',
  };

  useEffect(() => {
    if (!id) return;
    const fetchOne = async () => {
      const { data } = await (supabase as any).from('lost_found').select('*').eq('id', id).single();
      setItem(data);
    };
    fetchOne();
  }, [id]);

  if (!item) return <main className="min-h-screen bg-[#050510] p-6 md:p-10 text-white">იტვირთება...</main>;

  return (
    <main className="min-h-screen bg-[#050510] p-6 md:p-10 text-white">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex justify-start">
          <Link href="/" className="text-[11px] font-black uppercase italic text-white/50 hover:text-white transition">← მთავარი გვერდი</Link>
        </div>
        <h1 className="text-2xl font-black text-amber-500 uppercase italic">{item.title}</h1>
        <div className="text-[12px] text-white/60 flex gap-3">
          <span className={`font-black uppercase ${item.kind==='lost'?'text-red-400':'text-green-400'}`}>{FILTER_LABELS[item.kind as 'lost'|'found']}</span>
          {item.category && (<span className="font-black uppercase text-white/40">{CATEGORY_LABELS[item.category] ?? item.category}</span>)}
        </div>
        {item.image_url && (
          <div className="relative w-full h-[360px] rounded-2xl overflow-hidden">
            <Image src={item.image_url} alt="" fill sizes="(max-width: 768px) 100vw, 700px" className="object-contain rounded-2xl" />
          </div>
        )}
        {item.location && (<p className="text-sm text-white/80">ლოკაცია: {item.location}</p>)}
        {item.event_date && (<p className="text-sm text-white/80">თარიღი: {new Date(item.event_date).toLocaleDateString()}</p>)}
        {item.contact && (<p className="text-sm text-white/80">კონტაქტი: {item.contact}</p>)}
        {item.description && (<p className="text-base text-white">{item.description}</p>)}
        {item.kind==='lost' && item.reward && (
          <div className="text-amber-400 font-black">მპოვნელს დავასაჩუქრებ {item.reward_note ? `— ${item.reward_note}`:''}</div>
        )}
        <div>
          <button onClick={() => {
            const url = window.location.href;
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
          }} className="bg-blue-600/20 text-blue-400 px-4 py-2 rounded-xl text-sm hover:bg-blue-600 hover:text-white">გაზიარება Facebook-ზე</button>
        </div>
      </div>
    </main>
  );
}
