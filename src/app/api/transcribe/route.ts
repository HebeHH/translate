// app/api/transcribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AssemblyAIProvider } from './assemblyai';
import { TranscriptionError } from '@/app/lib/providers/transcribe';
import { validateApiRequest } from '@/app/lib/rate-limit';
import { logApiCall } from '@/app/lib/db-logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const preferredRegion = 'auto';

let provider: AssemblyAIProvider | null = null;

function getProvider() {
    if (!provider) {
        const apiKey = process.env.ASSEMBLYAI_API_KEY;
        if (!apiKey) {
            throw new TranscriptionError(
                'AssemblyAI API key not configured',
                'CONFIGURATION_ERROR',
                'AssemblyAI'
            );
        }
        provider = new AssemblyAIProvider(apiKey);
    }
    return provider;
}

export async function POST(request: NextRequest) {
    try {
        await validateApiRequest(request);

        const contentType = request.headers.get('content-type');
        if (!contentType?.includes('multipart/form-data')) {
            console.error('Invalid content type:', contentType);
            return NextResponse.json(
                { error: 'Request must be multipart/form-data' },
                { status: 400 }
            );
        }

        const formData = await request.formData();
        const audioFile = formData.get('audio') as Blob | null;
        const languageCode = formData.get('language_code') as string | null;

        if (!audioFile) {
            return NextResponse.json(
                { error: 'No audio file provided' },
                { status: 400 }
            );
        }

        const result = await getProvider().transcribe(audioFile, {
            language_code: languageCode || undefined,
        });

        // Log the API call asynchronously - don't await
        logApiCall('transcribe', request, undefined, result.text);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Transcription error:', error);

        if (error instanceof TranscriptionError) {
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