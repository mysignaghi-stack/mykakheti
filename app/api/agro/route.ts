import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/app/lib/supabaseAdmin';

export async function GET() {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const { data, error } = await (admin as any)
    .from('agro_prices' as any)
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { headers: { 'Cache-Control': 'no-store' } });
}
