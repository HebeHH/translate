// app/api/transcribe/assemblyai.ts
import { AssemblyAI } from 'assemblyai';
import {
    TranscriptionProvider,
    TranscriptionResult,
    TranscriptionOptions,
    TranscriptionError
} from '@/app/lib/providers/transcribe';

export class AssemblyAIProvider implements TranscriptionProvider {
    private client: AssemblyAI | null = null;
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    private initializeClient() {
        if (!this.client) {
            if (!this.apiKey) {
                throw new TranscriptionError(
                    'AssemblyAI API key is not configured',
                    'CONFIGURATION_ERROR',
                    'AssemblyAI'
                );
            }
            this.client = new AssemblyAI({
                apiKey: this.apiKey,
            });
        }
        return this.client;
    }

    async transcribe(audioBlob: Blob, options?: TranscriptionOptions): Promise<TranscriptionResult> {
        try {
            const client = this.initializeClient();

            // Instead of creating a File object, pass the Blob directly
            const params = {
                audio: audioBlob,
                language_code: options?.language_code,
                ...(options?.audio_start_from && { audio_start_from: options.audio_start_from }),
                ...(options?.audio_end_at && { audio_end_at: options.audio_end_at }),
                ...(options?.punctuate !== undefined && { punctuate: options.punctuate }),
                ...(options?.format_text !== undefined && { format_text: options.format_text }),
            };

            console.log('Sending transcription request with params:', {
                ...params,
                audio: 'Blob data omitted'
            });

            const transcript = await client.transcripts.transcribe(params);

            console.log('Received transcription response:', transcript);

            if (transcript.status === 'error') {
                throw new TranscriptionError(
                    transcript.error || 'Unknown transcription error',
                    'TRANSCRIPTION_FAILED',
                    'AssemblyAI'
                );
            }

            return {
                text: transcript.text || '',
                language: transcript.language_code,
                confidence: transcript.confidence,
                words: transcript.words?.map(word => ({
                    text: word.text,
                    start: word.start,
                    end: word.end,
                    confidence: word.confidence
                }))
            };
        } catch (error) {
            console.error('Transcription error details:', error);

            if (error instanceof TranscriptionError) {
                throw error;
            }

            throw new TranscriptionError(
                error instanceof Error ? error.message : 'Unknown error',
                'PROVIDER_ERROR',
                'AssemblyAI'
            );
        }
    }
}