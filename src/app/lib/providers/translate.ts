// app/lib/providers/translate.ts
export interface TranslationOptions {
    tone?: number;       // -1 to 1: casual to formal
    detail?: number;     // -1 to 1: concise to detailed
    emotion?: number;    // -1 to 1: positive to negative
    fromGender?: 'male' | 'female';
    toGender?: 'male' | 'female';
}

export interface TranslationResult {
    text: string;
    detectedLanguage?: string;
    confidence?: number;
}

export interface TranslationProvider {
    translate(
        text: string,
        fromLang: string,
        toLang: string,
        options?: TranslationOptions
    ): Promise<TranslationResult>;
}

export class TranslationError extends Error {
    constructor(
        message: string,
        public readonly code?: string,
        public readonly provider?: string
    ) {
        super(message);
        this.name = 'TranslationError';
    }
}