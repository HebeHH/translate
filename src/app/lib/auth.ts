// app/lib/auth.ts
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

// Check for session secret at module initialization
const SECRET_KEY = process.env.SESSION_SECRET_KEY;
if (!SECRET_KEY) {
    throw new Error('SESSION_SECRET_KEY environment variable is not set');
}

const key = new TextEncoder().encode(SECRET_KEY);

export async function createSession(): Promise<string> {
    // Create a session token that expires in 24 hours
    const token = await new SignJWT({
        // Add creation timestamp to prevent token reuse
        iat: Math.floor(Date.now() / 1000),
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(key);

    return token;
}

function isLocalhost(host?: string | null): boolean {
    if (!host) return false;
    return host.includes('localhost') ||
        host.includes('127.0.0.1') ||
        host.includes('[::1]');
}

export async function verifySession(request: NextRequest): Promise<boolean> {
    try {
        // First check if request is from our domain
        const origin = request.headers.get('origin');
        const host = request.headers.get('host');

        // In development, be more lenient with origin checking
        if (process.env.NODE_ENV === 'development') {
            if (!origin || !host) {
                console.warn('Missing origin or host in development');
                return false;
            }

            // Allow requests between localhost ports in development
            if (isLocalhost(new URL(origin).hostname) && isLocalhost(host.split(':')[0])) {
                console.log('Allowing localhost development request');
                return true;
            }
        } else {
            // In production, strictly verify origin matches host
            if (!origin || !host || !origin.includes(host)) {
                console.warn('Origin verification failed:', { origin, host });
                return false;
            }
        }

        // Then verify the session token from either cookies or authorization header
        let sessionToken: string | undefined;

        // First try to get from authorization header
        const authHeader = request.headers.get('authorization');
        if (authHeader?.startsWith('Bearer ')) {
            sessionToken = authHeader.substring(7);
        } else {
            // Fall back to cookies
            const cookieStore = cookies();
            const tokenCookie = cookieStore.get('session-token');
            sessionToken = tokenCookie?.value;
        }

        if (!sessionToken) {
            console.warn('No session token found');
            return false;
        }

        // Verify the token
        const { payload } = await jwtVerify(sessionToken, key);

        // Check if token is expired (although jose already checks this)
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
            console.warn('Token expired');
            return false;
        }

        return true;
    } catch (error) {
        console.error('Session verification failed:', error);
        return false;
    }
}

export class AuthError extends Error {
    constructor(message: string = 'Unauthorized') {
        super(message);
        this.name = 'AuthError';
    }
}

export async function validateRequest(request: NextRequest): Promise<void> {
    const isValid = await verifySession(request);

    if (!isValid) {
        throw new AuthError();
    }
}