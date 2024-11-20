// app/api/transcribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AssemblyAIProvider } from './assemblyai';
import { TranscriptionError } from '@/app/lib/providers/transcribe';
import { validateApiRequest } from '@/app/lib/rate-limit';

// Configure the route segment
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const preferredRegion = 'auto';

// Initialize provider lazily
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
        // Validate the request
        await validateApiRequest(request);

        // Ensure request is multipart/form-data
        const contentType = request.headers.get('content-type');
        if (!contentType?.includes('multipart/form-data')) {
            console.error('Invalid content type:', contentType);
            return NextResponse.json(
                { error: 'Request must be multipart/form-data' },
                { status: 400 }
            );
        }

        console.log('Processing form data from request...');

        // Parse the form data
        const formData = await request.formData();
        const audioFile = formData.get('audio') as Blob | null;
        const languageCode = formData.get('language_code') as string | null;

        console.log('Form data processed:', {
            hasAudioFile: !!audioFile,
            audioFileType: audioFile?.type,
            audioFileSize: audioFile?.size,
            languageCode
        });

        if (!audioFile) {
            return NextResponse.json(
                { error: 'No audio file provided' },
                { status: 400 }
            );
        }

        // Call the provider
        const result = await getProvider().transcribe(audioFile, {
            language_code: languageCode || undefined,
        });

        console.log('Transcription successful:', {
            textLength: result.text.length,
            language: result.language,
            confidence: result.confidence
        });

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