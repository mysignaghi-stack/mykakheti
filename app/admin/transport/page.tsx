'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/app/lib/supabase';
import { AdminRoute, AdminSchedule } from '@/app/lib/types';

export default function AdminTransport() {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'routes' | 'schedule'>('routes');
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
    setLoading(true);

    try {
      // 1. მარშრუტების წამოღება
      const { data: routesData, error: routesError } = await (
        supabase.from('transport_routes' as any) as any
      )
        .select('*')
        .order('created_at', { ascending: false });

      if (routesError) throw routesError;

      // 2. განრიგის წამოღება
      const { data: schedulesData, error: schedulesError } = await (
        supabase.from('transport_schedules' as any) as any
      )
        .select('*')
        .order('created_at', { ascending: false });

      if (schedulesError) throw schedulesError;

      // 3. State-ის განახლება
      if (routesData) {
        const formattedRoutes: AdminRoute[] = routesData.map((r: any) => ({
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
          .filter((s: any) => s.route_id !== null)
          .map((s: any) => ({
            id: s.id,
            routeId: s.route_id!,
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
  }, []);

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
      const { data: routeData, error: routeError } = await (
        supabase.from('transport_routes' as any) as any
      )
        .insert({
          origin: newEntry.origin,
          destination: newEntry.destination,
          price: parseFloat(newEntry.price),
          stops: newEntry.stops
        })
        .select()
        .single();

      if (routeError) throw routeError;

      // 2. განრიგის ჩაწერა
      const { error: scheduleError } = await (
        supabase.from('transport_schedules' as any) as any
      )
        .insert({
          route_id: routeData.id,
          depart_time: newEntry.departTime || '00:00',
          status: 'Active'
        });

      if (scheduleError) throw scheduleError;

      // 3. გასუფთავება და განახლება
      setNewEntry({ origin: '', destination: '', price: '', stops: '', departTime: ''});
      await fetchData();
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
      const { error } = await (
        supabase.from('transport_routes' as any) as any
      )
        .delete()
        .eq('id', id);
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
    setAdminSchedules(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));

    try {
      const { error } = await (
        supabase.from('transport_schedules' as any) as any
      )
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
    } catch {
      alert('სტატუსი ვერ შეიცვალა ბაზაში');
      fetchData();
    }
  };

  // ✅ დროის შეცვლა (UPDATE)
  const handleTimeUpdate = async (id: number, newValue: string) => {
    setAdminSchedules(prev => prev.map(s => s.id === id ? { ...s, departTime: newValue } : s));

    try {
      const { error } = await (
        supabase.from('transport_schedules' as any) as any
      )
        .update({ depart_time: newValue })
        .eq('id', id);

      if (error) throw error;
    } catch (error: unknown) {
      console.error('Time update failed', error);
      alert('დროის განახლება ვერ მოხერხდა');
      fetchData();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">ტრანსპორტის მართვა</h1>
          <p className="text-gray-400">მარშრუტების და განრიგის კორექტირება</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('routes')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'routes'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            მარშრუტები
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'schedule'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            განრიგი
          </button>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            <p className="text-gray-400 mt-2">იტვირთება...</p>
          </div>
        )}

        {/* Routes Tab */}
        {activeTab === 'routes' && !loading && (
          <div className="space-y-6">
            {/* Add New Route Form */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-4">ახალი მარშრუტის დამატება</h2>
              <form onSubmit={handleAddFullEntry} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="გასვლის ადგილი"
                  value={newEntry.origin}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, origin: e.target.value }))}
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400"
                  required
                />
                <input
                  type="text"
                  placeholder="დანიშნულების ადგილი"
                  value={newEntry.destination}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, destination: e.target.value }))}
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400"
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="ფასი (₾)"
                  value={newEntry.price}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, price: e.target.value }))}
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400"
                  required
                />
                <input
                  type="text"
                  placeholder="გაჩერებები (არასავალდებულო)"
                  value={newEntry.stops}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, stops: e.target.value }))}
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400"
                />
                <input
                  type="time"
                  placeholder="გასვლის დრო"
                  value={newEntry.departTime}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, departTime: e.target.value }))}
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400"
                />
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  დამატება
                </button>
              </form>
            </div>

            {/* Routes List */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-4">არსებული მარშრუტები</h2>
              <div className="space-y-4">
                {adminRoutes.map((route) => (
                  <div key={route.id} className="flex items-center justify-between bg-white/5 rounded-lg p-4">
                    <div className="flex-1">
                      <div className="text-white font-medium">
                        {route.origin} → {route.destination}
                      </div>
                      <div className="text-gray-400 text-sm">
                        ფასი: {route.price}₾ {route.stops && `| გაჩერებები: ${route.stops}`}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteRoute(route.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      წაშლა
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && !loading && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">განრიგის მართვა</h2>
            <div className="space-y-4">
              {adminSchedules.map((schedule) => {
                const route = adminRoutes.find(r => r.id === schedule.routeId);
                return (
                  <div key={schedule.id} className="flex items-center justify-between bg-white/5 rounded-lg p-4">
                    <div className="flex-1">
                      <div className="text-white font-medium">
                        {route ? `${route.origin} → ${route.destination}` : 'უცნობი მარშრუტი'}
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-2">
                          <label className="text-gray-400 text-sm">დრო:</label>
                          <input
                            type="time"
                            value={schedule.departTime}
                            onChange={(e) => handleTimeUpdate(schedule.id, e.target.value)}
                            className="bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-sm"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-gray-400 text-sm">სტატუსი:</label>
                          <select
                            value={schedule.status}
                            onChange={(e) => handleStatusChange(schedule.id, e.target.value as AdminSchedule['status'])}
                            className="bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-sm"
                          >
                            <option value="Active">აქტიური</option>
                            <option value="Delayed">დაგვიანებული</option>
                            <option value="Canceled">გაუქმებული</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}