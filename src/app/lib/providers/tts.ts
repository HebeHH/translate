// app/lib/providers/tts.ts
export interface TTSOptions {
    speed?: number;      // -1 to 1: slow to fast
    emotion?: number;    // -1 to 1: positive to negative
    sampleRate?: number; // Audio sample rate (default 44100)
}

export interface TTSMetadata {
    format: 'pcm_f32le'; // We'll always use this format for consistency
    sampleRate: number;
}

// Changed from returning a Result to returning an AsyncGenerator
export interface TTSProvider {
    synthesize(
        text: string,
        language: string,
        voiceId: string,
        options?: TTSOptions
    ): AsyncGenerator<Uint8Array>;

    getMetadata(options?: TTSOptions): TTSMetadata;
}

export class TTSError extends Error {
    constructor(
        message: string,
        public readonly code?: string,
        public readonly provider?: string
    ) {
        super(message);
        this.name = 'TTSError';
    }
}