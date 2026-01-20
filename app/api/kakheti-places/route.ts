import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '../../../types/supabase';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
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

    const { data: places, error } = await (supabase as any)
      .from('kakheti_heritage')
      .select('id, category, title, description, fun_fact, image_url, location_name')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching Kakheti heritage data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch heritage data' },
        { status: 500 }
      );
    }

    // Transform the data to match the expected format
    const transformedPlaces = places?.map((place: any) => ({
      name: place.id,
      title: place.title,
      description: place.description || '',
      fun_fact: place.fun_fact,
      category: place.category,
      location_name: place.location_name,
      thumbnail: place.image_url
    })) || [];

    // Shuffle for variety and select up to 12 items
    const shuffledPlaces = transformedPlaces.sort(() => Math.random() - 0.5);
    const selectedPlaces = shuffledPlaces.slice(0, Math.min(12, shuffledPlaces.length));

    return NextResponse.json({
      places: selectedPlaces,
      total: selectedPlaces.length,
      categories: ['ისტორია', 'ბუნება', 'ღვინო', 'პერსონაჟი', 'ლეგენდა', 'კულტურა', 'არქიტექტურა', 'ტრადიცია']
    });
  } catch (error) {
    console.error('Error fetching Kakheti heritage data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch heritage data' },
      { status: 500 }
    );
  }
}