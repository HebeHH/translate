// app/api/explain/route.ts
import { NextRequest } from 'next/server';
import { AnthropicExplanationProvider } from './anthropic';
import { ExplanationError } from '@/app/lib/providers/explain';
import { validateApiRequest } from '@/app/lib/rate-limit';

// Configure the route segment
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const preferredRegion = 'auto';

// Initialize provider lazily
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

export async function POST(request: NextRequest) {
    try {
        // Validate the request
        await validateApiRequest(request);

        // Ensure request is JSON
        const contentType = request.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
            console.error('Invalid content type:', contentType);
            return Response.json(
                { error: 'Request must be application/json' },
                { status: 400 }
            );
        }

        // Parse the request body
        const body = await request.json();
        const { originalText, translatedText, fromLang, toLang } = body as {
            originalText: string;
            translatedText: string;
            fromLang: string;
            toLang: string;
        };

        console.log('Explanation request received:', {
            fromLang,
            toLang,
            originalLength: originalText?.length,
            translatedLength: translatedText?.length
        });

        // Validate required fields
        if (!originalText || !translatedText || !fromLang || !toLang) {
            return Response.json(
                { error: 'Missing required fields: originalText, translatedText, fromLang, or toLang' },
                { status: 400 }
            );
        }

        // Call the provider
        const result = await getProvider().explain(
            originalText,
            translatedText,
            fromLang,
            toLang
        );

        return Response.json(result);
    } catch (error) {
        console.error('Explanation error:', error);

        return Response.json(
            {
                error: error instanceof ExplanationError ? error.message : 'Internal server error',
                code: error instanceof ExplanationError ? error.code : 'INTERNAL_ERROR',
                provider: error instanceof ExplanationError ? error.provider : undefined
            },
            {
                status: error instanceof ExplanationError ? 400 : 500
            }
        );
    }
}