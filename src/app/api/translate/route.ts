// app/api/translate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AnthropicTranslationProvider } from './anthropic';
import { TranslationError, TranslationOptions } from '@/app/lib/providers/translate';
import { validateApiRequest } from '@/app/lib/rate-limit';
import { logApiCall } from '@/app/lib/db-logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const preferredRegion = 'auto';

let provider: AnthropicTranslationProvider | null = null;

function getProvider() {
    if (!provider) {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            throw new TranslationError(
                'Anthropic API key not configured',
                'CONFIGURATION_ERROR',
                'Anthropic'
            );
        }
        provider = new AnthropicTranslationProvider(apiKey);
    }
    return provider;
}

function updateTokenCookies(response: NextResponse, newToken: string | undefined) {
    // If we got a new token, set it in the response
    if (newToken) {
        response.cookies.set({
            name: 'session-token',
            value: newToken,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 24 * 60 * 60 // 24 hours
        });
        response.headers.set('Authorization', `Bearer ${newToken}`);
    }

    return response;
}

export async function POST(request: NextRequest) {
    try {
        const newToken = await validateApiRequest(request);

        const contentType = request.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
            console.error('Invalid content type:', contentType);
            return NextResponse.json(
                { error: 'Request must be application/json' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { text, fromLang, toLang, options } = body as {
            text: string;
            fromLang: string;
            toLang: string;
            options?: TranslationOptions;
        };

        if (!text || !fromLang || !toLang) {
            return updateTokenCookies(NextResponse.json(
                { error: 'Missing required fields: text, fromLang, or toLang' },
                { status: 400 }
            ), newToken);
        }

        const result = await getProvider().translate(text, fromLang, toLang, options);

        // Log the API call asynchronously - don't await
        logApiCall('translate', request, text, result.text);

        return updateTokenCookies(NextResponse.json(result), newToken);
    } catch (error) {
        console.error('Translation error:', error);

        if (error instanceof TranslationError) {
            return NextResponse.json(
                {
                    error: error.message,
                    code: error.code,
                    provider: error.provider
                },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}