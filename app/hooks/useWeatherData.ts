import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { WeatherItem } from '../lib/types';
import { WEATHER_POINTS } from '../lib/constants';

export function useWeatherData() {
  const [weatherData, setWeatherData] = useState<WeatherItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWeatherData();
  }, []);

  const fetchWeatherData = async () => {
    setLoading(true);
    try {
      // Try to fetch from Supabase first
      const { data, error } = await supabase.from('weather').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        setWeatherData(data);
      } else {
        // Fallback to static data if table is empty or doesn't exist
        const staticWeatherData: WeatherItem[] = WEATHER_POINTS.map(point => ({
          name: point.name,
          lat: point.lat,
          lon: point.lon,
          temp: Math.floor(Math.random() * 15) + 15, // Random temp between 15-30°C
          icon: '☀️', // Default sunny icon
          glow: 'text-yellow-400'
        }));
        setWeatherData(staticWeatherData);
      }
    } catch {
      // Fallback to static data on error
      const staticWeatherData: WeatherItem[] = WEATHER_POINTS.map(point => ({
        name: point.name,
        lat: point.lat,
        lon: point.lon,
        temp: Math.floor(Math.random() * 15) + 15,
        icon: '☀️',
        glow: 'text-yellow-400'
      }));
      setWeatherData(staticWeatherData);
    }
    setLoading(false);
  };

  return {
    weatherData,
    setWeatherData,
    loading,
    fetchWeatherData,
  };
}
