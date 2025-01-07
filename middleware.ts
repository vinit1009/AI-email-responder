import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Handle auth error redirects
    if (req.nextUrl.pathname.startsWith('/auth/error')) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Add CORS headers for API routes
    if (req.nextUrl.pathname.startsWith('/api/')) {
      const response = NextResponse.next();
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return response;
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        // Allow access to login page
        if (req.nextUrl.pathname.startsWith('/login')) {
          return true;
        }
        
        // Protect inbox and email API routes
        if (
          (req.nextUrl.pathname.startsWith('/inbox') ||
           req.nextUrl.pathname.startsWith('/api/emails')) &&
          !token
        ) {
          return false;
        }
        return true;
      },
    },
    pages: {
      signIn: '/login',
      error: '/login', // Redirect auth errors to login page
    },
  }
);

// Update config to include auth routes
export const config = {
  matcher: [
    '/inbox/:path*',
    '/api/emails/:path*',
    '/auth/:path*'
  ]
};