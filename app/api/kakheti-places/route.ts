import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../types/supabase';
import { cookies } from 'next/headers';
import { debugError, debugLog, debugWarn } from '../../lib/debug';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      debugWarn('kakheti-places missing env', {
        supabaseUrl: !!supabaseUrl,
        supabaseKey: !!supabaseKey,
      });
      throw new Error('Supabase URL and Key are missing!');
    }

    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: Record<string, unknown>) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    });

    const adminClient = serviceRoleKey
      ? createClient<Database>(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
      : null;

    const dbClient = adminClient ?? supabase;

    const { data: places, error } = await (dbClient as any)
      .from('kakheti_heritage')
      .select('id, category, title, description, fun_fact, image_url, location_name')
      .order('created_at', { ascending: false });

    if (error) {
      debugError('kakheti-places fetch error', error);
      return NextResponse.json(
        { error: 'Failed to fetch heritage data' },
        { status: 500 }
      );
    }

    // Transform the data to match the expected format
    const normalizeCategory = (value?: string | null) => {
      if (!value) return value;
      if (value === 'ღვინის კულტურა') return 'ღვინო';
      if (value === 'ცნობილი ადამიანები') return 'პერსონაჟი';
      if (value === 'ლეგენდები') return 'ლეგენდა';
      return value;
    };

    type KakhetiPlace = {
      name: string | number;
      title: string | null;
      description: string;
      fun_fact: string | null;
      category: string | null | undefined;
      location_name: string | null;
      thumbnail: string | null;
    };

    const transformedPlaces: KakhetiPlace[] = places?.map((place: any) => ({
      name: place.id,
      title: place.title,
      description: place.description || '',
      fun_fact: place.fun_fact,
      category: normalizeCategory(place.category),
      location_name: place.location_name,
      thumbnail: place.image_url
    })) || [];

    // Shuffle for variety and select up to 12 items
    const shuffledPlaces = transformedPlaces.sort(() => Math.random() - 0.5);
    const selectedPlaces = shuffledPlaces.slice(0, Math.min(12, shuffledPlaces.length));

    const categories = Array.from(new Set((selectedPlaces || []).map((p) => p.category).filter(Boolean)));

    debugLog('kakheti-places fetch ok', {
      rows: places?.length ?? 0,
      selected: selectedPlaces.length,
      categories,
      usedServiceRole: !!serviceRoleKey,
    });

    return NextResponse.json({
      places: selectedPlaces,
      total: selectedPlaces.length,
      categories,
    });
  } catch (error) {
    debugError('kakheti-places exception', error);
    return NextResponse.json(
      { error: 'Failed to fetch heritage data' },
      { status: 500 }
    );
  }
}