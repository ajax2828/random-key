import { type NextRequest, NextResponse } from 'next/server';

/**
 * Proxy/middleware — mode tanpa login & tanpa database.
 * Semua request lolos tanpa redirect atau verifikasi.
 */
export async function proxy(request: NextRequest) {
  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files & images
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
