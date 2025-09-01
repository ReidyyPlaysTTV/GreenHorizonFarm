
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getMaintenanceMode } from '@/lib/actions/settings-actions';
import { getUsers } from './lib/actions';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const loggedInUser = request.cookies.get('loggedInUser')?.value;
  
  // Allow requests for static files and internal Next.js assets
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.endsWith('.png') || pathname.endsWith('.ico')) {
    return NextResponse.next();
  }

  // Check maintenance mode first
  const isMaintenanceMode = await getMaintenanceMode();
  
  if (isMaintenanceMode && pathname !== '/maintenance') {
    if (loggedInUser) {
      const users = await getUsers();
      const currentUser = users.find(u => u.username === loggedInUser);
      if (currentUser?.role !== 'Developer') {
        return NextResponse.redirect(new URL('/maintenance', request.url));
      }
    } else {
        // Redirect non-logged-in users to maintenance page as well
        return NextResponse.redirect(new URL('/maintenance', request.url));
    }
  }

  // If not in maintenance, check for banned status
  if (loggedInUser && pathname !== '/banned') {
      const users = await getUsers();
      const currentUser = users.find(u => u.username === loggedInUser);
      if (currentUser?.status === 'Banned') {
          return NextResponse.redirect(new URL('/banned', request.url));
      }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
