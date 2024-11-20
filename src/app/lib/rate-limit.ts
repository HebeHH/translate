// app/lib/rate-limit.ts
import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'
import { NextRequest } from 'next/server'
import { headers } from 'next/headers'
import { validateRequest } from './auth'

// Initialize Redis client lazily
let redis: Redis | null = null;
let ratelimit: Ratelimit | null = null;

function initializeRedis() {
    if (!redis) {
        try {
            redis = Redis.fromEnv();
            ratelimit = new Ratelimit({
                redis,
                limiter: Ratelimit.slidingWindow(10, '10 s'),
                analytics: true,
                prefix: 'translation-app',
            });
        } catch (error) {
            console.warn('Rate limiting is disabled:', error);
        }
    }
    return { redis, ratelimit };
}

export class RateLimitError extends Error {
    constructor(message: string = 'Too many requests') {
        super(message);
        this.name = 'RateLimitError';
    }
}

export async function checkRateLimit(request: NextRequest): Promise<void> {
    const { ratelimit: rateLimiter } = initializeRedis();

    // If rate limiting is not configured, allow the request
    if (!rateLimiter) {
        console.warn('Rate limiting is not configured');
        return;
    }

    try {
        // Get IP for rate limiting
        const forwardedFor = request.headers.get('x-forwarded-for')
        const ip = forwardedFor?.split(',')[0] || request.ip || '127.0.0.1'

        // Get session token as additional identifier
        const headersList = headers()
        const sessionToken = headersList.get('session-token')

        // Create a composite identifier for more precise rate limiting
        const identifier = `${ip}-${sessionToken || 'no-session'}`

        const { success, limit, reset, remaining } = await rateLimiter.limit(identifier)

        // Add rate limit info to response headers
        const res = new Response()
        res.headers.set('X-RateLimit-Limit', limit.toString())
        res.headers.set('X-RateLimit-Remaining', remaining.toString())
        res.headers.set('X-RateLimit-Reset', reset.toString())

        if (!success) {
            throw new RateLimitError()
        }
    } catch (error) {
        if (error instanceof RateLimitError) {
            throw error
        }
        // If Redis is down or not configured, we'll log the error but allow the request
        console.warn('Rate limiting error:', error)
    }
}

// Middleware helper that combines auth and rate limiting
export async function validateApiRequest(request: NextRequest): Promise<void> {
    await Promise.all([
        validateRequest(request),
        checkRateLimit(request)
    ])
}