import { NextRequest, NextResponse } from 'next/server';

export { auth as middleware } from '@/auth';

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest)
     * - icon-*.png (PWA icons)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.json|icon-.*\\.png).*)',
  ],
};
