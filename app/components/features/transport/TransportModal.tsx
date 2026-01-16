'use client';

import React, { useState, useEffect, useCallback } from 'react';
// 👇 Supabase-ის და ტიპების იმპორტი (relative paths)
import { supabase } from '../../../lib/supabase';
import { AdminRoute, AdminSchedule, TransportRoute } from '../../../lib/types';

interface TransportModalProps {
  isAdmin: boolean;
  onClose: () => void;
  staticSchedule: TransportRoute[];
}

export default function TransportModal({ isAdmin, onClose, staticSchedule }: TransportModalProps) {
  // --- STATE ---
  const [transActiveTab, setTransActiveTab] = useState<'routes' | 'schedule'>('routes');
  const [loading, setLoading] = useState(false);
  
  // მონაცემები ბაზიდან
  const [adminRoutes, setAdminRoutes] = useState<AdminRoute[]>([]);
  const [adminSchedules, setAdminSchedules] = useState<AdminSchedule[]>([]);
  
  // ფორმის მონაცემები
  const [newEntry, setNewEntry] = useState({ 
    origin: '', 
    destination: '', 
    price: '', 
    stops: '',
    departTime: '' 
  });

  // --- DATA FETCHING (მონაცემების წამოღება) ---
  const fetchData = useCallback(async () => {
    if (!isAdmin) return; // მხოლოდ ადმინისტვის
    setLoading(true);

    try {
      // 1. მარშრუტების წამოღება
      const { data: routesData, error: routesError } = await supabase
        .from('transport_routes')
        .select('*')
        .order('created_at', { ascending: false });

      if (routesError) throw routesError;

      // 2. განრიგის წამოღება
      const { data: schedulesData, error: schedulesError } = await supabase
        .from('transport_schedules')
        .select('*')
        .order('created_at', { ascending: false });

      if (schedulesError) throw schedulesError;

      // 3. State-ის განახლება (ბაზის snake_case-ის გადაყვანა ჩვენს camelCase-ზე)
      if (routesData) {
        const formattedRoutes: AdminRoute[] = routesData.map((r) => ({
          id: r.id,
          origin: r.origin,
          destination: r.destination,
          price: r.price,
          stops: r.stops || undefined
        }));
        setAdminRoutes(formattedRoutes);
      }
      
      if (schedulesData) {
        const formattedSchedules: AdminSchedule[] = schedulesData
          .filter((s) => s.route_id !== null) // Filter out schedules with null route_id
          .map((s) => ({
            id: s.id,
            routeId: s.route_id!, // We know it's not null after filtering
            departTime: s.depart_time,
            status: s.status as 'Active' | 'Delayed' | 'Canceled'
          }));
        setAdminSchedules(formattedSchedules);
      }

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching transport data:', message);
      alert('მონაცემების წამოღება ვერ მოხერხდა');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  // კომპონენტის ჩატვირთვისას წამოიღოს მონაცემები
  useEffect(() => {
    fetchData();
  }, [fetchData]);


  // --- HANDLERS (ფუნქციები) ---

  // ✅ დამატება (INSERT)
  const handleAddFullEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.origin || !newEntry.destination || !newEntry.price) return;
    
    setLoading(true);
    try {
      // 1. მარშრუტის ჩაწერა
      const { data: routeData, error: routeError } = await supabase
        .from('transport_routes')
        .insert({
          origin: newEntry.origin,
          destination: newEntry.destination,
          price: parseFloat(newEntry.price),
          stops: newEntry.stops
        })
        .select()
        .single(); // გვჭირდება დაბრუნებული ID

      if (routeError) throw routeError;

      // 2. განრიგის ჩაწერა (მიბმულია მარშრუტის ID-ზე)
      const { error: scheduleError } = await supabase
        .from('transport_schedules')
        .insert({
          route_id: routeData.id,
          depart_time: newEntry.departTime || '00:00',
          status: 'Active'
        });

      if (scheduleError) throw scheduleError;

      // 3. გასუფთავება და განახლება
      setNewEntry({ origin: '', destination: '', price: '', stops: '', departTime: ''}); 
      await fetchData(); // ხელახლა წამოღება
      alert('რეისი წარმატებით დაემატა! ✅');

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error adding entry:', message);
      alert('დამატება ვერ მოხერხდა: ' + message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ წაშლა (DELETE)
  const handleDeleteRoute = async (id: number) => {
    if (!confirm('დარწმუნებული ხართ? წაიშლება მარშრუტიც და განრიგიც.')) return;
    
    setLoading(true);
    try {
      // Cascade delete-ის გამო, მარშრუტის წაშლა წაშლის განრიგსაც
      const { error } = await supabase.from('transport_routes').delete().eq('id', id);
      if (error) throw error;
      
      await fetchData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert('წაშლა ვერ მოხერხდა: ' + message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ სტატუსის შეცვლა (UPDATE)
  const handleStatusChange = async (id: number, newStatus: AdminSchedule['status']) => {
    // ლოკალურად შეცვლა (სწრაფი UI)
    setAdminSchedules(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));

    try {
      const { error } = await supabase
        .from('transport_schedules')
        .update({ status: newStatus })
        .eq('id', id);
        
      if (error) throw error;
    } catch {
      alert('სტატუსი ვერ შეიცვალა ბაზაში');
      fetchData(); // უკან დაბრუნება შეცდომის შემთხვევაში
    }
  };

  // ✅ დროის შეცვლა (UPDATE)
  const handleTimeUpdate = async (id: number, newValue: string) => {
    // ლოკალურად შეცვლა
    setAdminSchedules(prev => prev.map(s => s.id === id ? { ...s, departTime: newValue } : s));

    // Debounce-ის გარეშე პირდაპირ ვაგზავნით (Production-ში ჯობია Debounce)
    try {
      const { error } = await supabase
        .from('transport_schedules')
        .update({ depart_time: newValue })
        .eq('id', id);

      if (error) throw error;
    } catch (error: unknown) {
      console.error('Time update failed', error);
    }
  };

  const getRouteName = (routeId: number) => {
    const route = adminRoutes.find(r => r.id === routeId);
    return route ? `${route.origin} - ${route.destination}` : 'უცნობი მარშრუტი';
  };

  // --- UI RENDER ---
  return (
    <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
       <div className="bg-[#0a0a1f] w-full max-w-4xl rounded-[40px] border border-white/10 p-8 relative shadow-2xl flex flex-col max-h-[85vh]">
          <button onClick={onClose} className="absolute top-6 right-8 text-white/50 hover:text-white text-2xl font-bold transition-colors z-50">✕</button>
          
          {isAdmin ? (
             <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-black text-amber-500 uppercase italic tracking-widest">
                    🚍 ტრანსპორტის მენეჯერი
                    {loading && <span className="text-white/30 text-xs ml-4 animate-pulse">იტვირთება...</span>}
                  </h2>
                  <span className="text-[10px] bg-red-600 px-3 py-1 rounded-full uppercase font-bold text-white">Admin Mode</span>
                </div>
                
                <div className="flex gap-2 mb-6 border-b border-white/10 pb-4">
                  <button onClick={() => setTransActiveTab('routes')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${transActiveTab === 'routes' ? 'bg-amber-600 text-white' : 'bg-white/5 text-white/50 hover:text-white'}`}>
                    მარშრუტები და დამატება
                  </button>
                  <button onClick={() => setTransActiveTab('schedule')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${transActiveTab === 'schedule' ? 'bg-amber-600 text-white' : 'bg-white/5 text-white/50 hover:text-white'}`}>
                    არსებული განრიგის კორექტირება
                  </button>
                </div>

                <div className="overflow-y-auto custom-scrollbar pr-2 flex-grow">
                  
                  {/* TAB 1: ROUTES & ADD */}
                  {transActiveTab === 'routes' && (
                    <div className="space-y-6">
                       <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                          <h3 className="text-sm font-black text-white/60 uppercase mb-4 tracking-widest">ახალი რეისის დამატება</h3>
                          <form onSubmit={handleAddFullEntry} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div className="space-y-1">
                                  <label className="text-[10px] text-white/40 uppercase font-bold ml-1">საიდან</label>
                                  <input type="text" placeholder="მაგ: თბილისი" className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white text-xs outline-none focus:border-amber-500" value={newEntry.origin} onChange={(e) => setNewEntry({...newEntry, origin: e.target.value})} required />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[10px] text-white/40 uppercase font-bold ml-1">სად</label>
                                  <input type="text" placeholder="მაგ: ბათუმი" className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white text-xs outline-none focus:border-amber-500" value={newEntry.destination} onChange={(e) => setNewEntry({...newEntry, destination: e.target.value})} required />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[10px] text-white/40 uppercase font-bold ml-1">გაჩერებები</label>
                                  <input type="text" placeholder="გორი, ქუთაისი..." className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white text-xs outline-none focus:border-amber-500" value={newEntry.stops} onChange={(e) => setNewEntry({...newEntry, stops: e.target.value})} />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[10px] text-white/40 uppercase font-bold ml-1">ფასი (₾)</label>
                                  <input type="number" placeholder="35" className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white text-xs outline-none focus:border-amber-500" value={newEntry.price} onChange={(e) => setNewEntry({...newEntry, price: e.target.value})} required />
                              </div>
                              <div className="md:col-span-4 grid grid-cols-1 gap-4 border-t border-white/5 pt-4 mt-2">
                                  <div className="space-y-1">
                                      <label className="text-[10px] text-amber-500/80 uppercase font-bold ml-1">გასვლის დრო</label>
                                      <input type="time" className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white text-xs outline-none focus:border-amber-500" value={newEntry.departTime} onChange={(e) => setNewEntry({...newEntry, departTime: e.target.value})} required />
                                  </div>
                              </div>
                              <div className="md:col-span-4 mt-2">
                                  <button type="submit" disabled={loading} className="w-full bg-green-600 text-white rounded-xl py-3 font-black hover:bg-green-500 transition-all text-xs uppercase shadow-lg tracking-widest disabled:opacity-50">
                                      {loading ? 'ემატება...' : 'სრული მარშრუტის დამატება (One Click)'}
                                  </button>
                              </div>
                          </form>
                       </div>

                       <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="text-white/40 text-[10px] uppercase border-b border-white/5">
                              <th className="p-3">ID</th>
                              <th className="p-3">მარშრუტი</th>
                              <th className="p-3">გაჩერებები</th>
                              <th className="p-3">ფასი</th>
                              <th className="p-3">მოქმედება</th>
                            </tr>
                          </thead>
                          <tbody>
                            {adminRoutes.length === 0 ? (
                                <tr><td colSpan={5} className="p-4 text-center text-white/30 text-xs">მარშრუტები არ არის</td></tr>
                            ) : (
                                adminRoutes.map((r) => (
                                  <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                                    <td className="p-3 text-xs font-mono text-white/50">{r.id}</td>
                                    <td className="p-3 text-sm font-bold">{r.origin} - {r.destination}</td>
                                    <td className="p-3 text-xs text-white/60">{r.stops || '-'}</td>
                                    <td className="p-3 text-sm text-amber-500 font-black">{r.price} ₾</td>
                                    <td className="p-3">
                                      <button onClick={() => handleDeleteRoute(r.id)} className="text-red-500 hover:text-red-400 p-2 bg-red-500/10 rounded-lg" title="წაშლა">🗑️</button>
                                    </td>
                                  </tr>
                                ))
                            )}
                          </tbody>
                       </table>
                    </div>
                  )}

                  {/* TAB 2: SCHEDULE EDIT */}
                  {transActiveTab === 'schedule' && (
                    <div className="space-y-4">
                      <p className="text-xs text-white/40 mb-2">დააკლიკეთ დროს ჩასასწორებლად. ცვლილება ავტომატურად აისახება ბაზაში.</p>
                      <table className="w-full text-left">
                          <thead className="bg-white/5 text-white/40 text-[10px] uppercase">
                            <tr>
                              <th className="p-3">მარშრუტი</th>
                              <th className="p-3">გასვლა</th>
                              <th className="p-3">სტატუსი</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {adminSchedules.length === 0 ? (
                                <tr><td colSpan={3} className="p-4 text-center text-white/30 text-xs">განრიგი ცარიელია</td></tr>
                            ) : (
                                adminSchedules.map((item) => (
                                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-3 text-sm font-bold">{getRouteName(item.routeId)}</td>
                                    <td className="p-3">
                                      <input type="time" value={item.departTime} onChange={(e) => handleTimeUpdate(item.id, e.target.value)} className="bg-black/30 text-white border border-white/10 rounded px-2 py-1 text-xs outline-none focus:border-amber-500" />
                                    </td>
                                    <td className="p-3">
                                      <select 
                                        value={item.status}
                                        onChange={(e) => handleStatusChange(item.id, e.target.value as AdminSchedule['status'])}
                                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide cursor-pointer outline-none border border-transparent ${
                                          item.status === 'Active' ? 'bg-green-500/20 text-green-400' :
                                          item.status === 'Delayed' ? 'bg-yellow-500/20 text-yellow-400' :
                                          'bg-red-500/20 text-red-400'
                                        }`}
                                      >
                                        <option value="Active" className="text-black">აქტიური</option>
                                        <option value="Delayed" className="text-black">დაგვიანება</option>
                                        <option value="Canceled" className="text-black">გაუქმებული</option>
                                      </select>
                                    </td>
                                  </tr>
                                ))
                            )}
                          </tbody>
                      </table>
                    </div>
                  )}
                </div>
             </div>
          ) : (
             // === USER VIEW (STATIC) ===
             <>
               <div className="text-center mb-8">
                  <span className="text-5xl mb-4 block">🚌</span>
                  <h2 className="text-2xl font-black text-amber-500 uppercase italic tracking-widest drop-shadow-lg">მუნიციპალური ტრანსპორტი</h2>
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mt-2">განრიგი და ტარიფები</p>
               </div>
               <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2">
                  {staticSchedule.map((item, i) => (
                     <div key={i} className="flex justify-between items-center bg-white/5 p-5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group">
                        <div className="flex flex-col gap-1">
                           <div className="flex items-center gap-3">
                              <span className="font-black text-lg">{item.from}</span>
                              <span className="text-white/30 text-xl">➔</span>
                              <span className="font-black text-lg">{item.to}</span>
                           </div>
                           <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider">{item.station}</div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                           <div className="text-amber-500 font-black italic text-sm mb-1">{item.time}</div>
                           <div className="bg-white/10 px-3 py-1 rounded-lg text-[11px] font-bold">{item.price}</div>
                        </div>
                     </div>
                  ))}
               </div>
             </>
          )}
       </div>
    </div>
  );
}