// app/lib/providers/explain.ts
export interface SegmentExplainer {
    originalTextString: string;
    translatedTextString: string;
    additionalDetails: string;
}

export interface ExplanationResult {
    accurate: boolean;
    possibleMistranslations: false | SegmentExplainer[];
    idioms: false | SegmentExplainer[];
    tone: string;
}

export interface ExplanationProvider {
    explain(
        originalText: string,
        translatedText: string,
        fromLang: string,
        toLang: string
    ): Promise<ExplanationResult>;
}

export class ExplanationError extends Error {
    constructor(
        message: string,
        public readonly code?: string,
        public readonly provider?: string
    ) {
        super(message);
        this.name = 'ExplanationError';
    }
}