import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

// Bypass auth in development if DEV_AUTH_BYPASS is set
const DEV_AUTH_BYPASS = process.env.DEV_AUTH_BYPASS === 'true';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

export default function middleware(request: NextRequest) {
  // In dev mode with bypass enabled, mock the user
  if (DEV_AUTH_BYPASS && process.env.NODE_ENV === 'development') {
    const response = NextResponse.next();
    // Mock user ID in header for API routes
    response.headers.set('x-dev-user-id', 'dev_user_123');
    return response;
  }

  // Use normal Clerk middleware
  return clerkMiddleware((auth, req) => {
    if (!isPublicRoute(req)) auth().protect();
  })(request);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
