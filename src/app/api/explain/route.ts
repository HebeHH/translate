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

export async function POST(request: NextRequest) {
    try {
        await validateApiRequest(request);

        const contentType = request.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
            console.error('Invalid content type:', contentType);
            return Response.json(
                { error: 'Request must be application/json' },
                { status: 400 }
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
            return Response.json(
                { error: 'Missing required fields: originalText, translatedText, fromLang, or toLang' },
                { status: 400 }
            );
        }

        const result = await getProvider().explain(
            originalText,
            translatedText,
            fromLang,
            toLang
        );

        // Log the API call asynchronously - don't await
        // Combine original and translated text for input, and stringify the explanation result for output
        const inputText = `Original: ${originalText}\nTranslated: ${translatedText}`;
        const outputText = JSON.stringify(result);
        logApiCall('explain', request, inputText, outputText);

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