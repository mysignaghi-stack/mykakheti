import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;
    
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

    // 1. ფოტოს ატვირთვა
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(fileName);

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
          category,
          location,
          price,
          currency,
          phone,
          image_url: publicUrl,
          all_images: [publicUrl],
          is_approved: false, // მოდერაციაზე გასაგზავნად
          user_id: userId
        }])
        .select()
        .single();

      if (dbError) throw dbError;

      return NextResponse.json({ success: true, data: dbData });
    } else {
      // უბრალოდ ფოტოს URL დაბრუნება
      return NextResponse.json({ url: publicUrl });
    }
  } catch (error: any) {
    console.error('Server Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}