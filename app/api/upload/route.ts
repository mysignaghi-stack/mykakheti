import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function GET() {
  return NextResponse.json({ status: 'ready' });
}

export async function POST(request: NextRequest) {
  if (!request.body) {
    return NextResponse.json({ error: 'Request body is empty' }, { status: 400 });
  }
  try {
    const formData = await request.formData();
    const files = (formData.getAll('file') as File[]).filter((f) => f instanceof File);
    if (files.length === 0) {
      return NextResponse.json({ error: 'ფაილები ვერ მოიძებნა' }, { status: 400 });
    }
    
    // ვიღებთ დანარჩენ მონაცემებს ფორმიდან
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const location = formData.get('location') as string;
    const price = formData.get('price') as string;
    const currency = formData.get('currency') as string;
    const phone = formData.get('phone') as string;
    const userId = formData.get('userId') as string;
    const bucketName = (formData.get('bucket') as string) || 'announcements';

    // Validate required env vars early to return clear errors
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase env vars', { supabaseUrl: !!supabaseUrl, supabaseServiceKey: !!supabaseServiceKey });
      return NextResponse.json({ error: 'Server configuration error: Supabase env vars missing' }, { status: 500 });
    }

    let supabaseAdmin;
    try {
      supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    } catch (err: any) {
      console.error('Failed to create Supabase client', err);
      const message = err?.message || String(err);
      return NextResponse.json({ error: `Failed to create Supabase client: ${message}` }, { status: 500 });
    }

    // Normalize category to expected Georgian labels used in admin panels
    // Canonical categories (use only these four values in DB)
    const categoryMap: Record<string, string> = {
      condolence: 'სამძიმარი',
      'სამძიმარი': 'სამძიმარი',
      lost_found: 'დაკარგული/ნაპოვნი',
      'დაკარგული/ნაპოვნი': 'დაკარგული/ნაპოვნი',
      master: 'ოსტატი',
      service: 'ოსტატი',
      'ოსტატი': 'ოსტატი',
      'სერვისი': 'ოსტატი',
      congratulation: 'მილოცვა',
      'მილოცვა': 'მილოცვა',
    };
    const normalizedCategory = categoryMap[category] || category;

    // 1. ფოტოების ატვირთვა (თითოეულ ფაილს უნიკალური სახელი აქვს)
    const publicUrls: string[] = [];
    for (const file of files) {
      try {
        // Sanitize extension and filename to avoid strange characters from iOS
        const rawExt = (file.name || '').split('.').pop() || '';
        const extension = (rawExt || file.type.split('/').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
        const safeNamePart = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const uniqueName = `${safeNamePart}.${extension}`;

        // Log filename/type for diagnostics
        console.info('Uploading file', { name: file.name, type: file.type, size: file.size, bucket: bucketName, key: uniqueName });

        const { error: uploadError } = await supabaseAdmin.storage
          .from(bucketName)
          .upload(uniqueName, file as any, { upsert: true, contentType: file.type || undefined });

        if (uploadError) {
          console.error('Upload error for file', { file: file.name, error: uploadError });
          // Surface a clearer message to client
          throw new Error(`Failed to upload file ${file.name}: ${uploadError.message || String(uploadError)}`);
        }

        const getResp = supabaseAdmin.storage
          .from(bucketName)
          .getPublicUrl(uniqueName);
        const publicUrl = (getResp as any).data?.publicUrl;
        publicUrls.push(publicUrl);
      } catch (fileErr: any) {
        console.error('File processing error', { error: fileErr?.message || String(fileErr) });
        throw fileErr;
      }
    }

    // თუ ეს არის მხოლოდ ფაილების ატვირთვა (title და category არ არის), დავაბრუნოთ URL-ები
    if (!title && !category) {
      return NextResponse.json({ success: true, url: publicUrls[0], urls: publicUrls });
    }

    // თუ ეს არის განცხადების ატვირთვა (title არსებობს), ჩავწეროთ ბაზაში
    // თუ title არ არის, ავტომატურად შევქმნათ სათაური კატეგორიის მიხედვით
    const finalTitle = title || `ახალი ${normalizedCategory}`;

    // ვალიდაცია: შევამოწმოთ აუცილებელი ველები
    const requiresLocationAndPrice = !['სამძიმარი', 'მილოცვა'].includes(normalizedCategory);
    if (!category || (requiresLocationAndPrice && (!location || !price))) {
      return NextResponse.json({ error: 'აუცილებელი ველები არ არის შევსებული: category' + (requiresLocationAndPrice ? ', location, price' : '') }, { status: 400 });
    }

    // 2. ბაზაში ჩაწერა
    const { data: dbData, error: dbError } = await supabaseAdmin
      .from('announcements')
      .insert([{
        title: finalTitle,
        description,
        category: normalizedCategory,
        location: location || null,
        price: price || null,
        currency,
        phone,
        image_url: publicUrls[0] ?? null,
        all_images: publicUrls,
        is_approved: false, // მოდერაციაზე გასაგზავნად
        user_id: userId
      }])
      .select()
      .single();

    if (dbError) throw dbError;

    revalidatePath('/admin/moderate');
    revalidatePath('/admin/moderation');
    return NextResponse.json({ success: true, data: dbData });
  } catch (error: any) {
    console.error('Server Error:', error?.stack || error?.message || String(error));
    const message = error?.message || String(error) || 'უცნობი სერვერის შეცდომა';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
