import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const token = req.cookies.get('tx_umb_session')?.value;
  const protectedPath = req.nextUrl.pathname.startsWith('/dashboard') || req.nextUrl.pathname.startsWith('/submissions');

  if (protectedPath && !token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/submissions/:path*']
};
