// app/api/translate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AnthropicTranslationProvider } from './anthropic';
import { TranslationError, TranslationOptions } from '@/app/lib/providers/translate';
import { validateApiRequest } from '@/app/lib/rate-limit';

// Configure the route segment
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const preferredRegion = 'auto';

// Initialize provider lazily
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

export async function POST(request: NextRequest) {
    try {
        // Validate the request
        await validateApiRequest(request);

        // Ensure request is JSON
        const contentType = request.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
            console.error('Invalid content type:', contentType);
            return NextResponse.json(
                { error: 'Request must be application/json' },
                { status: 400 }
            );
        }

        // Parse the request body
        const body = await request.json();
        const { text, fromLang, toLang, options } = body as {
            text: string;
            fromLang: string;
            toLang: string;
            options?: TranslationOptions;
        };

        console.log('Translation request received:', {
            fromLang,
            toLang,
            textLength: text?.length,
            hasOptions: !!options
        });

        // Validate required fields
        if (!text || !fromLang || !toLang) {
            return NextResponse.json(
                { error: 'Missing required fields: text, fromLang, or toLang' },
                { status: 400 }
            );
        }

        // Call the provider
        const result = await getProvider().translate(text, fromLang, toLang, options);

        console.log('Translation successful:', {
            originalLength: text.length,
            translatedLength: result.text.length,
            confidence: result.confidence
        });

        return NextResponse.json(result);
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