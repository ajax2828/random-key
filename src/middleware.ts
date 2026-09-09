import { type NextRequest } from 'next/server';
import { middlewareUpdateSession } from '@/lib/session';

export async function middleware(request: NextRequest) {
  return middlewareUpdateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files & images
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
