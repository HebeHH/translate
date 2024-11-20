// app/lib/auth.ts
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { logDebug, logError } from './logging';

const SECRET_KEY = process.env.SESSION_SECRET_KEY;
if (!SECRET_KEY) {
    throw new Error('SESSION_SECRET_KEY environment variable is not set');
}

const key = new TextEncoder().encode(SECRET_KEY);

export async function createSession(): Promise<string> {
    const token = await new SignJWT({
        iat: Math.floor(Date.now() / 1000),
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(key);

    return token;
}

function isValidOrigin(origin: string | null, host: string | null): boolean {
    logDebug('Checking origin:', { origin, host });
    if (!origin || !host) return false;

    // Always allow localhost in development
    if (process.env.NODE_ENV === 'development') {
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
            return true;
        }
    }

    try {
        const originUrl = new URL(origin);
        const hostName = host.split(':')[0]; // Remove port if present

        // In production, match the domain without considering protocol or port
        return originUrl.hostname === hostName;
    } catch {
        return false;
    }
}

export async function verifySession(request: NextRequest): Promise<boolean> {
    try {
        // Check origin in a more flexible way
        const origin = request.headers.get('origin');
        const host = request.headers.get('host');
        const referer = request.headers.get('referer');

        // Allow requests from same domain or when origin is not set (same-origin requests)
        if (origin && !isValidOrigin(origin, host)) {
            if (referer && !isValidOrigin(referer, host)) {
                console.warn('Origin/referer verification failed:', { origin, host, referer });
                logError('Origin/referer verification failed:', { origin, host, referer });
                return false;
            }
        }

        // Get token from either Authorization header or cookie
        let token: string | undefined;

        const authHeader = request.headers.get('authorization');
        if (authHeader?.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        } else {
            const cookieStore = cookies();
            token = cookieStore.get('session-token')?.value;
        }

        if (!token) {
            console.warn('No session token found');
            logError('No session token found');
            return false;
        }

        // Verify the token
        const { payload } = await jwtVerify(token, key);

        // Verify expiration
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
            console.warn('Token expired');
            logError('Token expired');
            return false;
        }

        return true;
    } catch (error) {
        console.error('Session verification failed:', error);
        logError('Session verification failed:', error);
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