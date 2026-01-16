import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

if (!supabaseServiceRole || !supabaseUrl) {
  throw new Error("Missing Supabase env vars for profile upsert");
}

export async function POST(req: Request) {
  const body = await req.json();
  const { id, email, name } = body as { id: string; email?: string | null; name?: string | null };

  const supabase = createClient(supabaseUrl, supabaseServiceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await supabase
    .from("profiles")
    .upsert({ id, email: email ?? null, full_name: name ?? null })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
