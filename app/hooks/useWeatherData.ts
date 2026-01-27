import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { WeatherItem } from '../lib/types';
import { WEATHER_POINTS } from '../lib/constants';

type WeatherRow = WeatherItem;

export function useWeatherData(initialWeather: WeatherItem[] = []) {
  const [weatherData, setWeatherData] = useState<WeatherItem[]>(initialWeather);
  const [loading, setLoading] = useState(false);

  const getWeatherMeta = (code: number) => {
    if ([0].includes(code)) return { icon: '☀️', glow: 'text-yellow-400' };
    if ([1, 2].includes(code)) return { icon: '🌤️', glow: 'text-amber-300' };
    if ([3].includes(code)) return { icon: '☁️', glow: 'text-slate-300' };
    if ([45, 48].includes(code)) return { icon: '🌫️', glow: 'text-slate-400' };
    if ([51, 53, 55].includes(code)) return { icon: '🌦️', glow: 'text-blue-300' };
    if ([61, 63, 65].includes(code)) return { icon: '🌧️', glow: 'text-blue-400' };
    if ([66, 67].includes(code)) return { icon: '🌧️', glow: 'text-blue-400' };
    if ([71, 73, 75, 77].includes(code)) return { icon: '❄️', glow: 'text-sky-200' };
    if ([80, 81, 82].includes(code)) return { icon: '🌧️', glow: 'text-blue-500' };
    if ([85, 86].includes(code)) return { icon: '❄️', glow: 'text-sky-200' };
    if ([95, 96, 99].includes(code)) return { icon: '⛈️', glow: 'text-purple-400' };
    return { icon: '🌦️', glow: 'text-blue-300' };
  };

  const fetchWeatherData = useCallback(async () => {
    setLoading(true);
    try {
      const apiResults = await Promise.all(
        WEATHER_POINTS.map(async (point) => {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${point.lat}&longitude=${point.lon}&current=temperature_2m,weather_code&timezone=auto`;
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Weather API error for ${point.name}`);
          }
          const data = await response.json();
          const temp = Math.round(data?.current?.temperature_2m ?? 0);
          const code = Number(data?.current?.weather_code ?? 0);
          const meta = getWeatherMeta(code);
          return {
            name: point.name,
            lat: point.lat,
            lon: point.lon,
            temp,
            icon: meta.icon,
            glow: meta.glow,
          } as WeatherItem;
        })
      );

      setWeatherData(apiResults);
    } catch {
      try {
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
          setLoading(false);
          return;
        }
      } catch {
        // ignore and fallback below
      }

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
