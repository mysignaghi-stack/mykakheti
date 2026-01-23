import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { WeatherItem } from '../lib/types';
import { WEATHER_POINTS } from '../lib/constants';

type WeatherRow = WeatherItem;

export function useWeatherData(initialWeather: WeatherItem[] = []) {
  const [weatherData, setWeatherData] = useState<WeatherItem[]>(initialWeather);
  const [loading, setLoading] = useState(false);

  const fetchWeatherData = useCallback(async () => {
    setLoading(true);
    try {
      // Try to fetch from Supabase first
      const { data, error } = await (supabase.from('weather' as any) as any).select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        const normalized: WeatherItem[] = (data as WeatherRow[]).map((row) => ({
          name: row.name,
          lat: row.lat,
          lon: row.lon,
          temp: row.temp ?? 0,
          icon: row.icon ?? '☀️',
          glow: row.glow ?? 'text-yellow-400',
        }));
        setWeatherData(normalized);
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
  }, []);

  useEffect(() => {
    setWeatherData(initialWeather);
  }, [initialWeather]);

  useEffect(() => {
    if (initialWeather.length === 0) {
      fetchWeatherData();
    }
  }, [fetchWeatherData, initialWeather.length]);

  return {
    weatherData,
    setWeatherData,
  };
}
