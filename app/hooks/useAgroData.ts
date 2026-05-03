import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { AgroItem } from '../lib/types';
import { DEFAULT_AGRO_DATA } from '../lib/constants';

type AgroRow = AgroItem & { details: AgroItem['details'] };

export function useAgroData(initialData: AgroItem[] = DEFAULT_AGRO_DATA) {
  const fallback = initialData.length > 0 ? initialData : DEFAULT_AGRO_DATA;
  const [agroData, setAgroData] = useState<AgroItem[]>(fallback);
  const [loading, setLoading] = useState(false);
  const [editAgroItem, setEditAgroItem] = useState<AgroItem | null>(null);
  const [selectedAgro, setSelectedAgro] = useState<AgroItem | null>(null);
  const [newPrice, setNewPrice] = useState('');

  const fetchAgroData = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch('/api/agro');
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok || json?.error) throw new Error(json?.error || 'Failed to fetch');
      const rows = (json?.data || []) as AgroRow[];
      const normalized: AgroItem[] = rows.map((row) => ({
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
    } catch (error) {
      console.error('Failed to fetch agro data', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setAgroData(initialData.length > 0 ? initialData : DEFAULT_AGRO_DATA);
  }, [initialData]);

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
