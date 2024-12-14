// app/lib/auth.ts
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const SECRET_KEY = process.env.SESSION_SECRET_KEY;
if (!SECRET_KEY) {
    throw new Error('SESSION_SECRET_KEY environment variable is not set');
}

const key = new TextEncoder().encode(SECRET_KEY);

// Helper to get current timestamp in seconds
const getCurrentTimestamp = () => Math.floor(Date.now() / 1000);

export async function createSession(): Promise<string> {
    const now = getCurrentTimestamp();

    const token = await new SignJWT({
        iat: now,
        // Set expiration to 24 hours from now
        exp: now + (24 * 60 * 60),
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .sign(key);

    return token;
}

// Function to check if token needs renewal (e.g., if it expires in less than 1 hour)
async function shouldRenewToken(token: string): Promise<boolean> {
    try {
        const { payload } = await jwtVerify(token, key);
        const now = getCurrentTimestamp();
        const oneHour = 60 * 60;

        return payload.exp ? (payload.exp - now) < oneHour : false;
    } catch {
        return true;
    }
}

function isValidOrigin(origin: string | null, host: string | null): boolean {
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

export async function verifySession(request: NextRequest): Promise<{ isValid: boolean; newToken?: string }> {
    try {
        // Check origin in a more flexible way
        const origin = request.headers.get('origin');
        const host = request.headers.get('host');
        const referer = request.headers.get('referer');

        // Allow requests from same domain or when origin is not set (same-origin requests)
        if (origin && !isValidOrigin(origin, host)) {
            if (referer && !isValidOrigin(referer, host)) {
                console.warn('Origin/referer verification failed:', { origin, host, referer });
                return { isValid: false };
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
            return { isValid: false };
        }

        // Verify the token
        await jwtVerify(token, key);

        // Check if token needs renewal
        const needsRenewal = await shouldRenewToken(token);
        if (needsRenewal) {
            console.log('Token needs renewal');
            const newToken = await createSession();
            return { isValid: true, newToken };
        }

        return { isValid: true };
    } catch (error) {
        console.error('Session verification failed:', error);
        return { isValid: false };
    }
}

export class AuthError extends Error {
    constructor(message: string = 'Unauthorized') {
        super(message);
        this.name = 'AuthError';
    }
}

export async function validateRequest(request: NextRequest): Promise<string | undefined> {
    const { isValid, newToken } = await verifySession(request);

    if (!isValid) {
        throw new AuthError();
    }

    return newToken;
}