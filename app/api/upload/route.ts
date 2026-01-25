import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
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

    let supabaseAdmin;
    try {
      supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY! // გვერდს ავლის RLS-ს
      );
    } catch (err) {
      return NextResponse.json({ error: 'Failed to create Supabase client' }, { status: 500 });
    }

    // Normalize category to expected Georgian labels used in admin panels
    const categoryMap: Record<string, string> = {
      'condolence': 'სამძიმარი',
      'სამძიმარი': 'სამძიმარი',
      'lost_found': 'დაკარგული/ნაპოვნი',
      'დაკარგული/ნაპოვნი': 'დაკარგული/ნაპოვნი',
      'lost-found': 'დაკარგული/ნაპოვნი',
      'master': 'ოსტატი',
      'ოსტატი': 'ოსტატი',
      'congratulation': 'მილოცვა',
      'მილოცვა': 'მილოცვა',
    };
    const normalizedCategory = categoryMap[category] || category;

    // 1. ფოტოების ატვირთვა (თითოეულ ფაილს უნიკალური სახელი აქვს)
    const publicUrls: string[] = [];
    for (const file of files) {
      const extension = file.name.split('.').pop() || 'jpg';
      const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from(bucketName)
        .upload(uniqueName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from(bucketName)
        .getPublicUrl(uniqueName);
      publicUrls.push(publicUrl);
    }

    // თუ ეს არის განცხადების ატვირთვა (title არსებობს), ჩავწეროთ ბაზაში
    if (title) {
      // ვალიდაცია: შევამოწმოთ აუცილებელი ველები
      if (!category || !location || !price) {
        return NextResponse.json({ error: 'აუცილებელი ველები არ არის შევსებული: category, location, price' }, { status: 400 });
      }

      // 2. ბაზაში ჩაწერა
      const { data: dbData, error: dbError } = await supabaseAdmin
        .from('announcements')
        .insert([{
          title,
          description,
          category: normalizedCategory,
          location,
          price,
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
      return NextResponse.json({ success: true, data: dbData });
    } else {
      // უბრალოდ ფოტო(ების) URL-ების დაბრუნება
      return NextResponse.json({ urls: publicUrls });
    }
  } catch (error: any) {
    console.error('Server Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}