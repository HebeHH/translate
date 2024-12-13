// app/api/tts/route.ts
import { NextRequest } from 'next/server';
import { CartesiaTTSProvider } from './cartesia';
import { TTSError, TTSOptions } from '@/app/lib/providers/tts';
import { validateApiRequest } from '@/app/lib/rate-limit';
import { logApiCall } from '@/app/lib/db-logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const preferredRegion = 'auto';

let provider: CartesiaTTSProvider | null = null;

function getProvider() {
    if (!provider) {
        const apiKey = process.env.CARTESIA_API_KEY;
        if (!apiKey) {
            throw new TTSError(
                'Cartesia API key not configured',
                'CONFIGURATION_ERROR',
                'Cartesia'
            );
        }
        provider = new CartesiaTTSProvider(apiKey);
    }
    return provider;
}

export async function POST(request: NextRequest) {
    try {
        const newToken = await validateApiRequest(request);

        const contentType = request.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
            console.error('Invalid content type:', contentType);
            return new Response(
                JSON.stringify({ error: 'Request must be application/json' }),
                { status: 400 }
            );
        }

        const body = await request.json();
        const { text, language, voiceId, options } = body as {
            text: string;
            language: string;
            voiceId: string;
            options?: TTSOptions;
        };

        if (!text || !language || !voiceId) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: text, language, or voiceId' }),
                { status: 400 }
            );
        }

        // Log the API call asynchronously - don't await
        logApiCall('tts', request, text);

        const ttsProvider = getProvider();
        const metadata = ttsProvider.getMetadata(options);

        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();

        (async () => {
            try {
                const generator = ttsProvider.synthesize(text, language, voiceId, options);
                for await (const chunk of generator) {
                    await writer.write(chunk);
                }
                await writer.close();
            } catch (error) {
                console.error('TTS generator error:', error);
                await writer.abort(error);
            }
        })();

        // Create response with the audio stream
        const response = new Response(readable, {
            headers: {
                'Content-Type': 'application/octet-stream',
                'Transfer-Encoding': 'chunked',
                'X-Sample-Rate': metadata.sampleRate.toString(),
                'X-Audio-Format': metadata.format
            }
        });

        // If we have a new token, add it to the response headers
        if (newToken) {
            // Add cookie to response
            const cookieValue = `session-token=${newToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${24 * 60 * 60}`;
            response.headers.append('Set-Cookie', cookieValue);

            // Add Authorization header
            response.headers.set('Authorization', `Bearer ${newToken}`);
        }

        return response;
    } catch (error) {
        console.error('TTS error:', error);

        return new Response(
            JSON.stringify({
                error: error instanceof TTSError ? error.message : 'Internal server error',
                code: error instanceof TTSError ? error.code : 'INTERNAL_ERROR',
                provider: error instanceof TTSError ? error.provider : undefined
            }),
            {
                status: error instanceof TTSError ? 400 : 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}