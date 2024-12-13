// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createSession } from './src/app/lib/auth'

// Helper to check if a request is for the API
const isApiRoute = (pathname: string) => pathname.startsWith('/api');

// Helper to get domain from request
function getDomain(req: NextRequest) {
    const host = req.headers.get('host') || '';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    return `${protocol}://${host}`;
}

// Helper to set session token in response
function setSessionToken(response: NextResponse, token: string, domain: string) {
    response.cookies.set({
        name: 'session-token',
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        domain: new URL(domain).hostname,
        // Set max age to 24 hours
        maxAge: 24 * 60 * 60
    });

    response.headers.set('Authorization', `Bearer ${token}`);
}

export async function middleware(request: NextRequest) {
    try {
        const response = NextResponse.next();

        // Add security headers
        const headers = {
            'X-Frame-Options': 'DENY',
            'X-Content-Type-Options': 'nosniff',
            'Referrer-Policy': 'origin-when-cross-origin',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'X-Permitted-Cross-Domain-Policies': 'none',
            'X-DNS-Prefetch-Control': 'off',
        };

        Object.entries(headers).forEach(([key, value]) => {
            response.headers.set(key, value);
        });

        // Only handle session for API routes
        if (isApiRoute(request.nextUrl.pathname)) {
            // Get existing session token
            const existingToken = request.cookies.get('session-token');
            const domain = getDomain(request);

            if (!existingToken) {
                console.log('Creating new session token');
                const token = await createSession();
                setSessionToken(response, token, domain);
            }
        }

        return response;
    } catch (error) {
        console.error('Middleware error:', error);
        return NextResponse.next();
    }
}

// Configure middleware matching
export const config = {
    matcher: [
        '/api/:path*',
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};