// app/api/explain/route.ts
import { NextRequest } from 'next/server';
import { AnthropicExplanationProvider } from './anthropic';
import { ExplanationError } from '@/app/lib/providers/explain';
import { validateApiRequest } from '@/app/lib/rate-limit';
import { logApiCall } from '@/app/lib/db-logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const preferredRegion = 'auto';

let provider: AnthropicExplanationProvider | null = null;

function getProvider() {
    if (!provider) {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            throw new ExplanationError(
                'Anthropic API key not configured',
                'CONFIGURATION_ERROR',
                'Anthropic'
            );
        }
        provider = new AnthropicExplanationProvider(apiKey);
    }
    return provider;
}

function updateTokenCookies(response: Response, newToken: string | undefined) {
    if (newToken) {
        // Add cookie to response
        const cookieValue = `session-token=${newToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${24 * 60 * 60}`;
        response.headers.append('Set-Cookie', cookieValue);

        // Add Authorization header
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
            return updateTokenCookies(
                new Response(
                    JSON.stringify({ error: 'Request must be application/json' }),
                    {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    }
                ),
                newToken
            );
        }

        const body = await request.json();
        const { originalText, translatedText, fromLang, toLang } = body as {
            originalText: string;
            translatedText: string;
            fromLang: string;
            toLang: string;
        };

        if (!originalText || !translatedText || !fromLang || !toLang) {
            return updateTokenCookies(
                new Response(
                    JSON.stringify({
                        error: 'Missing required fields: originalText, translatedText, fromLang, or toLang'
                    }),
                    {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    }
                ),
                newToken
            );
        }

        const result = await getProvider().explain(
            originalText,
            translatedText,
            fromLang,
            toLang
        );

        // Log the API call asynchronously - don't await
        const inputText = `Original: ${originalText}\nTranslated: ${translatedText}`;
        const outputText = JSON.stringify(result);
        logApiCall('explain', request, inputText, outputText);

        // Create and return response with token if needed
        return updateTokenCookies(
            new Response(
                JSON.stringify(result),
                {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                }
            ),
            newToken
        );
    } catch (error) {
        console.error('Explanation error:', error);

        return updateTokenCookies(
            new Response(
                JSON.stringify({
                    error: error instanceof ExplanationError ? error.message : 'Internal server error',
                    code: error instanceof ExplanationError ? error.code : 'INTERNAL_ERROR',
                    provider: error instanceof ExplanationError ? error.provider : undefined
                }),
                {
                    status: error instanceof ExplanationError ? 400 : 500,
                    headers: { 'Content-Type': 'application/json' }
                }
            ),
            undefined
        );
    }
}