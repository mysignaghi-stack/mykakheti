'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Congratulations {
  id: string;
  sender_name: string;
  recipient_name: string;
  message: string;
  occasion: string;
  image_url?: string | null;
  created_at: string;
  is_approved: boolean;
}

export default function CongratulationsAdmin() {
  const [pendingItems, setPendingItems] = useState<Congratulations[]>([]);
  const [approvedItems, setApprovedItems] = useState<Congratulations[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data: pending } = await supabase
      .from('congratulations')
      .select('*')
      .eq('is_approved', false)
      .order('created_at', { ascending: false });

    const { data: approved } = await supabase
      .from('congratulations')
      .select('*')
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    setPendingItems(pending || []);
    setApprovedItems(approved || []);
    setLoading(false);
  };

  const approveItem = async (id: string) => {
    const { error } = await supabase
      .from('congratulations')
      .update({ is_approved: true, approved_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      fetchItems();
    }
  };

  const rejectItem = async (id: string) => {
    if (confirm('ნამდვილად გსურთ წაშლა?')) {
      const { error } = await supabase
        .from('congratulations')
        .delete()
        .eq('id', id);

      if (!error) {
        fetchItems();
      }
    }
  };

  const unapproveItem = async (id: string) => {
    const { error } = await supabase
      .from('congratulations')
      .update({ is_approved: false, approved_at: null })
      .eq('id', id);

    if (!error) {
      fetchItems();
    }
  };

  const items = activeTab === 'pending' ? pendingItems : approvedItems;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-black text-amber-500 uppercase italic mb-6">მისალოცი ბარათები</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-6 py-3 rounded-xl font-black uppercase italic text-sm transition-all ${
            activeTab === 'pending'
              ? 'bg-amber-600 text-white'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          დასადასტურებელი ({pendingItems.length})
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`px-6 py-3 rounded-xl font-black uppercase italic text-sm transition-all ${
            activeTab === 'approved'
              ? 'bg-amber-600 text-white'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          დადასტურებული ({approvedItems.length})
        </button>
      </div>

      {loading ? (
        <div className="text-white/60">იტვირთება...</div>
      ) : (
        <div className="space-y-4">
          {items.map(item => (
            <div key={item.id} className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="flex gap-4 items-start">
                {item.image_url && (
                  <img src={item.image_url} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
                )}
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-black text-white text-lg italic">
                      {item.sender_name} → {item.recipient_name}
                    </div>
                    <div className="flex gap-2">
                      {activeTab === 'pending' ? (
                        <>
                          <button
                            onClick={() => approveItem(item.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-500 transition-all"
                          >
                            ✓ დადასტურება
                          </button>
                          <button
                            onClick={() => rejectItem(item.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-500 transition-all"
                          >
                            ✕ წაშლა
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => unapproveItem(item.id)}
                          className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-bold text-sm hover:bg-yellow-500 transition-all"
                        >
                          ↶ დაბრუნება
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-amber-400 text-sm font-bold uppercase bg-amber-600/20 px-2 py-1 rounded-full inline-block mb-2">
                    {item.occasion}
                  </div>
                  <p className="text-white/80 italic leading-relaxed">{item.message}</p>
                  <div className="text-white/40 text-xs mt-2">
                    {new Date(item.created_at).toLocaleDateString('ka-GE')}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-center py-12 text-white/40">
              {activeTab === 'pending' ? 'დასადასტურებელი მისალოცი ბარათები არ არის' : 'დადასტურებული მისალოცი ბარათები არ არის'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}