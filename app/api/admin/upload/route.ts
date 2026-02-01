import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { isAdminUser } from '@/app/lib/adminAuth';

export async function POST(request: Request) {
  try {
    console.log('Admin upload API called');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasAnon: !!supabaseAnonKey,
      hasService: !!serviceRoleKey
    });

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Server misconfiguration: missing Supabase env vars.' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    console.log('File received:', {
      hasFile: !!file,
      isFile: file instanceof File,
      fileName: file instanceof File ? file.name : 'N/A',
      fileSize: file instanceof File ? file.size : 'N/A'
    });

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }

    // Check file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 50MB allowed.' }, { status: 400 });
    }

    // For now, skip authentication and just test upload
    // TODO: Restore authentication after testing
    const cookieStore = await cookies();
    const authClient = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
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

    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) {
      console.log('Authentication failed:', userError?.message);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    let isAdmin = isAdminUser(user);
    if (!isAdmin) {
      const { data: profile } = await (serviceClient as any)
        .from('profiles')
        .select('role,is_admin,roles')
        .eq('id', user.id)
        .single();
      const roles = Array.isArray((profile as any)?.roles) ? (profile as any).roles : [];
      isAdmin = profile?.role === 'admin' || profile?.is_admin === true || roles.includes('admin');
    }

    if (!isAdmin) {
      const email = (user.email ?? '').toLowerCase();
      const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      if (email && adminEmails.includes(email)) {
        isAdmin = true;
      }
    }

    if (!isAdmin) {
      console.log('Admin check failed for user:', user.email);
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    const extension = file.name.split('.').pop() || 'bin';
    const randomId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const bucketName = (formData.get('bucket') as string) || 'admin-media';
    const allowedBuckets = new Set(['admin-media']);
    if (!allowedBuckets.has(bucketName)) {
      return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 });
    }

    const fileName = `admin-posts/${Date.now()}-${randomId}.${extension}`;

    console.log('Attempting upload with filename:', fileName);

    const { error: uploadError } = await serviceClient.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: { publicUrl } } = serviceClient.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    console.log('Upload successful, publicUrl:', publicUrl);

    return NextResponse.json({ publicUrl });
  } catch (error) {
    console.error('Admin upload error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}