import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  revalidatePath('/admin');
  return NextResponse.redirect(new URL('/admin', request.url));
}
