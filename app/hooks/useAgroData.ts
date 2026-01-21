import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../../types/supabase';
import { AgroItem } from '../lib/types';
import { DEFAULT_AGRO_DATA } from '../lib/constants';

type AgroRow = any;

export function useAgroData() {
  const [agroData, setAgroData] = useState<AgroItem[]>(DEFAULT_AGRO_DATA);
  const [loading, setLoading] = useState(false);
  const [editAgroItem, setEditAgroItem] = useState<AgroItem | null>(null);
  const [selectedAgro, setSelectedAgro] = useState<AgroItem | null>(null);
  const [newPrice, setNewPrice] = useState('');

  const fetchAgroData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase.from('agro_prices' as any) as any).select('*');
    if (!error && data) {
      const normalized: AgroItem[] = (data as AgroRow[]).map((row) => ({
        id: row.id,
        name: row.name,
        unit: row.unit,
        price: row.price,
        color: row.color,
        icon: row.icon,
        category: row.category,
        details: Array.isArray(row.details) ? (row.details as AgroItem['details']) : null,
      }));
      setAgroData(normalized);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAgroData();
  }, [fetchAgroData]);



  return {
    agroData,
    setAgroData,
    loading,
    fetchAgroData,
    editAgroItem,
    setEditAgroItem,
    selectedAgro,
    setSelectedAgro,
    newPrice,
    setNewPrice,
    // handleUpdatePrice removed, now handled in HomePage for Snackbar
  };
}
