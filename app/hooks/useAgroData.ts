import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AgroItem } from '../lib/types';
import { DEFAULT_AGRO_DATA } from '../lib/constants';

export function useAgroData() {
  const [agroData, setAgroData] = useState<AgroItem[]>(DEFAULT_AGRO_DATA);
  const [loading, setLoading] = useState(false);
  const [editAgroItem, setEditAgroItem] = useState<AgroItem | null>(null);
  const [selectedAgro, setSelectedAgro] = useState<AgroItem | null>(null);
  const [newPrice, setNewPrice] = useState('');

  useEffect(() => {
    fetchAgroData();
  }, []);

  const fetchAgroData = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('agro_prices').select('*');
    if (!error && data) {
      setAgroData(data);
    }
    setLoading(false);
  };



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
