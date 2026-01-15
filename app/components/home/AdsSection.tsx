'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Ad } from '../../lib/types';

interface AdsSectionProps {
  ads: Ad[];
  filteredAds: Ad[];
  isAdmin: boolean;
  showArchive: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategories: string[];
  setSelectedCategories: (cats: string[]) => void;
  onArchive: (e: React.MouseEvent<HTMLButtonElement>, id: string) => void;
  onRestore: (e: React.MouseEvent<HTMLButtonElement>, id: string) => void;
  onDelete: (e: React.MouseEvent<HTMLButtonElement>, ad: Ad) => void;
  onFBShare: (e: React.MouseEvent<HTMLButtonElement>, ad: Ad) => void;
  onCopyShare: (e: React.MouseEvent<HTMLButtonElement>, ad: Ad) => void;
}

const CATEGORIES = ["ყველა", "უძრავი ქონება", "ავტო", "დასაქმება", "სოფლის მეურნეობა", "ცხოველები", "ტექნიკა", "ელექტრონიკა", "სამედიცინო", "განათლება", "მომსახურება", "სპორტი", "ტურიზმი", "სამშენებლო", "სასტუმროები", "რესტორნები", "ვაკანსიები", "დრიური საწოლი", "სამუშაო ჯგუფი", "ტურისტული", "ღვინო და მარნები", "კულტურა", "სხვა"];

const IMPORTANT_CATEGORIES = ["უძრავი ქონება", "ავტო", "დასაქმება", "სოფლის მეურნეობა"];

export default function AdsSection({
  filteredAds,
  isAdmin,
  showArchive,
  searchTerm,
  setSearchTerm,
  selectedCategories,
  setSelectedCategories,
  onArchive,
  onRestore,
  onDelete,
  onFBShare,
  onCopyShare
}: AdsSectionProps) {
  
  const [visibleCount, setVisibleCount] = useState(12);
  const router = useRouter();
  const [showAllCategories, setShowAllCategories] = useState(false);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 12);
  };

  // ✅ უსაფრთხოების ფენა: ვამოწმებთ, არის თუ არა filteredAds მასივი.
  // თუ არ არის (მაგ: undefined, null), ვიყენებთ ცარიელ მასივს [].
  const safeAds = Array.isArray(filteredAds) ? filteredAds : [];
  
  // მონაცემების დაჭრა
  const currentAds = safeAds.slice(0, visibleCount);

  return (
    <section className="relative z-20 px-4 sm:px-6 md:px-10 max-w-[1800px] mx-auto pb-20">
      
      {/* ფილტრები და სათაური */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
        <h2 className="text-2xl sm:text-3xl font-black text-white uppercase italic tracking-widest drop-shadow-lg flex items-center gap-3">
          <span className="text-amber-500 text-4xl">📢</span>
          {showArchive ? 'არქივი' : 'განცხადებები'}
          <span className="text-sm bg-white/10 px-3 py-1 rounded-full text-white/60 not-italic font-bold border border-white/5">
            {safeAds.length}
          </span>
        </h2>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          {/* კატეგორიები */}
          <div className="flex flex-wrap gap-2 bg-white/5 p-2 rounded-2xl border border-white/10">
            {IMPORTANT_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  if (selectedCategories.includes(cat)) {
                    setSelectedCategories(selectedCategories.filter(c => c !== cat));
                  } else {
                    setSelectedCategories([...selectedCategories.filter(c => c !== 'ყველა'), cat]);
                  }
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategories.includes(cat) 
                    ? 'bg-amber-600 text-white shadow-lg scale-105' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
            <button
              onClick={() => setShowAllCategories(true)}
              className="px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all text-white/60 hover:text-white hover:bg-white/5 border border-dashed border-white/20"
            >
              ყველა კატეგორია ▼
            </button>
          </div>

          {/* ძებნა */}
          <div className="relative group w-full sm:w-64">
            <input 
              type="text" 
              placeholder="ძებნა..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-amber-500 transition-all group-hover:bg-black/60 placeholder:text-white/30"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-hover:text-amber-500 transition-colors">🔍</span>
          </div>
        </div>
      </div>

      {/* Grid - აქ ვიყენებთ currentAds-ს, რომელიც გარანტირებულად მასივია */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {currentAds.length > 0 ? (
          currentAds.map((ad, index) => {
            // სურათის განსაზღვრა (დაცვით)
            const mainImage = (ad.all_images && Array.isArray(ad.all_images) && ad.all_images.length > 0) 
              ? ad.all_images[0] 
              : (ad.image_url || 'https://via.placeholder.com/400x300?text=No+Image');

            return (
              <Link 
                href={`/announcements/${ad.id}`} 
                key={`${ad.id}-${index}`} 
                className="group bg-slate-900/50 border border-white/10 rounded-[30px] overflow-hidden hover:border-amber-500/50 transition-all hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] flex flex-col relative"
              >
                {/* Image Container */}
                <div className="h-56 overflow-hidden relative bg-black/50">
                  <Image
                    src={mainImage}
                    alt={ad.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 400px"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-xl border border-white/10">
                    {new Date(ad.created_at).toLocaleDateString('ka-GE')}
                  </div>
                  
                  {ad.category && (
                    <div className="absolute bottom-3 left-3 bg-amber-600 text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-lg uppercase tracking-wider">
                      {ad.category}
                    </div>
                  )}

                  {/* Share Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                    <button onClick={(e) => onFBShare(e, ad)} className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg">f</button>
                    <button onClick={(e) => onCopyShare(e, ad)} className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform shadow-lg">🔗</button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-white font-bold text-lg line-clamp-1 group-hover:text-amber-500 transition-colors">{ad.title}</h3>
                  </div>
                  
                  <p className="text-white/60 text-xs line-clamp-2 mb-4 leading-relaxed h-8">
                    {ad.description}
                  </p>

                  <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center">
                    <span className="text-amber-500 font-black text-lg">
                      {ad.price > 0 ? `${ad.price} ${ad.currency === 'USD' ? '$' : '₾'}` : 'შეთანხმებით'}
                    </span>
                    <span className="text-[10px] text-white/30 flex items-center gap-1">
                      📍 {(ad.location || '').split(',')[0]}
                    </span>
                  </div>

                  {/* Admin Controls */}
                  {isAdmin && (
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {showArchive ? (
                        <>
                          <button onClick={(e) => onRestore(e, ad.id)} className="py-2 bg-green-600/20 text-green-400 rounded-xl text-[10px] font-bold hover:bg-green-600 hover:text-white transition-all">აღდგენა</button>
                          <button onClick={(e) => onDelete(e, ad)} className="py-2 bg-red-600/20 text-red-400 rounded-xl text-[10px] font-bold hover:bg-red-600 hover:text-white transition-all">წაშლა</button>
                          <button onClick={(e) => { e.stopPropagation(); router.push(`/announcements/${ad.id}`); }} className="py-2 bg-blue-600/20 text-blue-400 rounded-xl text-[10px] font-bold hover:bg-blue-600 hover:text-white transition-all text-center">ნახვა</button>
                        </>
                      ) : (
                        <>
                          <button onClick={(e) => { e.stopPropagation(); router.push(`/announcements/${ad.id}`); }} className="py-2 bg-blue-600/20 text-blue-400 rounded-xl text-[10px] font-bold hover:bg-blue-600 hover:text-white transition-all text-center">ნახვა</button>
                          <button onClick={(e) => onArchive(e, ad.id)} className="py-2 bg-white/5 text-white/60 rounded-xl text-[10px] font-bold hover:bg-white/10 hover:text-white transition-all">არქივში</button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            );
          })
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-white/20">
            <span className="text-6xl mb-4 grayscale">📂</span>
            <p className="text-sm font-black uppercase tracking-widest">განცხადებები ვერ მოიძებნა</p>
          </div>
        )}
      </div>

      {/* Load More */}
      {safeAds.length > visibleCount && (
        <div className="mt-12 text-center">
          <button 
            onClick={handleLoadMore}
            className="px-8 py-3 bg-white/5 border border-white/10 rounded-full text-xs font-black uppercase tracking-widest text-white hover:bg-amber-600 hover:border-amber-600 transition-all shadow-lg"
          >
            მეტის ნახვა ({safeAds.length - visibleCount})
          </button>
        </div>
      )}

      {/* All Categories Modal */}
      {showAllCategories && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-[#0a0a1f] p-8 rounded-[40px] border border-white/10 w-full max-w-4xl shadow-2xl relative text-center">
            <button 
              onClick={() => setShowAllCategories(false)} 
              className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors text-xl font-black"
            >
              ✕
            </button>
            <h3 className="text-2xl font-black uppercase italic mb-8 tracking-widest text-white">ყველა კატეგორია</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    if (cat === 'ყველა') {
                      setSelectedCategories(['ყველა']);
                    } else if (selectedCategories.includes(cat)) {
                      setSelectedCategories(selectedCategories.filter(c => c !== cat && c !== 'ყველა'));
                    } else {
                      setSelectedCategories([...selectedCategories.filter(c => c !== 'ყველა'), cat]);
                    }
                    setShowAllCategories(false);
                  }}
                  className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                    selectedCategories.includes(cat) 
                      ? 'bg-amber-600 text-white shadow-lg scale-105' 
                      : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}