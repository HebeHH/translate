// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createSession } from '@/app/lib/auth'

export async function middleware(request: NextRequest) {
    try {
        const response = NextResponse.next()

        // Get existing session token
        const existingToken = request.cookies.get('session-token')

        // If no session token exists or it's expired, create a new one
        if (!existingToken) {
            const token = await createSession()

            // Set cookie
            response.cookies.set({
                name: 'session-token',
                value: token,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax', // Changed from 'strict' to 'lax' for better compatibility
                path: '/',       // Ensure cookie is available for all paths
                maxAge: 60 * 60 * 24 // 24 hours
            })

            // Also set as Authorization header for API routes
            if (request.nextUrl.pathname.startsWith('/api')) {
                response.headers.set('Authorization', `Bearer ${token}`)
            }
        } else {
            // If token exists, ensure it's also in Authorization header for API routes
            if (request.nextUrl.pathname.startsWith('/api')) {
                response.headers.set('Authorization', `Bearer ${existingToken.value}`)
            }
        }

        // Add security headers
        response.headers.set('X-Frame-Options', 'DENY')
        response.headers.set('X-Content-Type-Options', 'nosniff')
        response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
        response.headers.set(
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains'
        )

        return response
    } catch (error) {
        console.error('Middleware error:', error)
        return NextResponse.next()
    }
}

// Configure middleware to run on all routes
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}