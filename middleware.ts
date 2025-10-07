import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Public routes
  const publicRoutes = ['/login', '/players', '/api/players'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Admin routes
  const isAdminRoute = pathname.startsWith('/admin');

  if (!isLoggedIn && !isPublicRoute) {
    // Redirect to login if not authenticated
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (isAdminRoute && req.auth?.user?.role !== 'admin') {
    // Redirect non-admin users away from admin routes
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth).*)'],
};
