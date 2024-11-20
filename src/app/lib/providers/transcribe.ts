// app/lib/providers/transcribe.ts
export interface TranscriptionResult {
    text: string;
    language?: string;
    confidence?: number | null;
    words?: Array<{
        text: string;
        start: number;
        end: number;
        confidence: number;
    }>;
}

export interface TranscriptionOptions {
    language_code?: string;
    audio_start_from?: number;
    audio_end_at?: number;
    punctuate?: boolean;
    format_text?: boolean;
}

export interface TranscriptionProvider {
    transcribe(
        audio: Blob,
        options?: TranscriptionOptions
    ): Promise<TranscriptionResult>;
}

// Error types
export class TranscriptionError extends Error {
    constructor(
        message: string,
        public readonly code?: string,
        public readonly provider?: string
    ) {
        super(message);
        this.name = 'TranscriptionError';
    }
}