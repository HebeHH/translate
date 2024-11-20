// app/api/tts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { CartesiaTTSProvider } from './cartesia';
import { TTSError, TTSOptions } from '@/app/lib/providers/tts';
import { validateApiRequest } from '@/app/lib/rate-limit';

// Configure the route segment
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const preferredRegion = 'auto';

// Initialize provider lazily
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
        const { text, language, voiceId, options } = body as {
            text: string;
            language: string;
            voiceId: string;
            options?: TTSOptions;
        };

        console.log('TTS request received:', {
            language,
            voiceId,
            textLength: text?.length,
            hasOptions: !!options
        });

        // Validate required fields
        if (!text || !language || !voiceId) {
            return NextResponse.json(
                { error: 'Missing required fields: text, language, or voiceId' },
                { status: 400 }
            );
        }

        // Call the provider
        const result = await getProvider().synthesize(text, language, voiceId, options);

        console.log('TTS successful:', {
            format: result.format,
            sampleRate: result.sampleRate,
            bufferSize: result.audioBuffer.byteLength
        });

        // Return the audio data as an array buffer
        return new Response(result.audioBuffer, {
            headers: {
                'Content-Type': 'application/octet-stream',
                'X-Sample-Rate': result.sampleRate.toString(),
                'X-Audio-Format': result.format
            }
        });
    } catch (error) {
        console.error('TTS error:', error);

        if (error instanceof TTSError) {
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