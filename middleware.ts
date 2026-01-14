import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(_request: NextRequest) {
  // შენიშვნა:
  // supabase-js ნაგულისხმევად ინახავს სესიას localStorage-ში და არა cookies-ში,
  // ამიტომ middleware-დან cookie-ზე დაყრდნობა იწვევს უსასრულო რედირექტს.
  // ადმინისტრატორის გვერდებზე წვდომას აკონტროლებს კლიენტის მხარე (`useAdminAuth`).
  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};