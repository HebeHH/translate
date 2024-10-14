export type Message = {
    original: string;
    translated: string;
    fromLang: string;
    toLang: string;
};

export type Options = {
    tone: number;
    detail: number;
    speed: number;
    emotion: number;
};

export type SegmentExplainer = {
    originalTextString: string; // verbatim the substring of the original text this references
    translatedTextString: string;
    additionalDetails: string; // the additional information you want to add. Provided in ${toLang}.
}

export type TranslationInfo = {
    accurate: boolean; // whether the translation is accurate
    possibleMistranslations: false | SegmentExplainer[]; // whether any translatons could be improved
    idioms: false | SegmentExplainer[]; // whether there's any idioms, and if so, what
    tone: string; // Quick description of the tone of the original string. Provided in ${toLang}.
}