import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // List files in announcements bucket
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from('announcements')
      .list('', { limit: 1000 });

    if (listError) {
      return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
    }

    // Get all image URLs from database
    const { data: announcements, error: dbError } = await supabaseAdmin
      .from('announcements')
      .select('all_images');

    if (dbError) {
      return NextResponse.json({ error: 'Failed to fetch database images' }, { status: 500 });
    }

    const dbImages = new Set<string>();
    announcements?.forEach(ann => {
      if (Array.isArray(ann.all_images)) {
        ann.all_images.forEach((img: string) => {
          if (typeof img === 'string') {
            const filename = img.split('/').pop();
            if (filename) dbImages.add(filename);
          }
        });
      }
    });

    const orphanedFiles = files?.filter(file =>
      file.name && !dbImages.has(file.name)
    ) || [];

    // Delete orphaned files
    const deletePromises = orphanedFiles.map(file =>
      supabaseAdmin.storage
        .from('announcements')
        .remove([file.name])
    );

    const deleteResults = await Promise.allSettled(deletePromises);

    const successfulDeletes = deleteResults.filter(result => result.status === 'fulfilled').length;
    const failedDeletes = deleteResults.filter(result => result.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      totalOrphaned: orphanedFiles.length,
      deleted: successfulDeletes,
      failed: failedDeletes
    });
  } catch (error: any) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}