// app/api/explain/anthropic.ts
import Anthropic from "@anthropic-ai/sdk";
import {
    ExplanationProvider,
    ExplanationResult,
    ExplanationError
} from "@/app/lib/providers/explain";

export class AnthropicExplanationProvider implements ExplanationProvider {
    private client: Anthropic | null = null;
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    private initializeClient() {
        if (!this.client) {
            if (!this.apiKey) {
                throw new ExplanationError(
                    'Anthropic API key not configured',
                    'CONFIGURATION_ERROR',
                    'Anthropic'
                );
            }
            this.client = new Anthropic({
                apiKey: this.apiKey,
            });
        }
        return this.client;
    }

    async explain(
        originalText: string,
        translatedText: string,
        fromLang: string,
        toLang: string
    ): Promise<ExplanationResult> {
        try {
            const client = this.initializeClient();

            console.log('Creating explanation request:', {
                fromLang,
                toLang,
                originalLength: originalText.length,
                translatedLength: translatedText.length
            });

            const response = await client.messages.create({
                model: "claude-3-5-sonnet-20240620",
                max_tokens: 5463,
                temperature: 0.1,
                system: `You're fluent in ${fromLang} and ${toLang}. You help check translations, and explain the vagaries of language.
        
        People come to you with original text and their translation. You tell them whether the translation is accurate, whether there's any idioms in the original text which can be hard to translate, and if there's anything missing in the tone. There may have been mistranscriptions in the original text, so note that under possibleMistranslations if something seems nonsensical.
        
        You respond with an object of type TranslationInfo given in TypeScript below:
        
        type SegmentExplainer = {
          originalTextString: string; // verbatim the substring of the original text this references
          translatedTextString: string;
          additionalDetails: string; // the additional information you want to add. Provided in ${toLang}.
        }
        
        type TranslationInfo = {
          accurate: boolean; // whether the translation is accurate
          possibleMistranslations: false | SegmentExplainer[]; // whether any translations could be improved
          idioms: false | SegmentExplainer[]; // whether there's any idioms, and if so, what
          tone: string; // Quick description of the tone of the original string. Provided in ${toLang}.
        }
        
        Make sure you give correct json, using double quotes, and closing brackets properly. Don't be afraid to say there's no mistranslations or idioms!`,
                messages: [
                    {
                        role: "user",
                        content: `Original text: ${originalText}\n\nTranslated text: ${translatedText}`
                    },
                    {
                        "role": "assistant",
                        "content": [
                            {
                                "type": "text",
                                "text": "{"
                            }
                        ]
                    }
                ]
            });

            const resultText = '{' + (response.content[0] as Anthropic.Messages.TextBlock).text;


            console.log('Explanation completed, parsing response');

            console.log(resultText)

            try {
                const result = JSON.parse(resultText) as ExplanationResult;
                return result;
            } catch (parseError) {
                console.error('Error parsing explanation result:', parseError);
                throw new ExplanationError(
                    'Failed to parse explanation result',
                    'PARSING_ERROR',
                    'Anthropic'
                );
            }
        } catch (error) {
            console.error('Explanation error details:', error);

            if (error instanceof ExplanationError) {
                throw error;
            }

            throw new ExplanationError(
                error instanceof Error ? error.message : 'Unknown error',
                'PROVIDER_ERROR',
                'Anthropic'
            );
        }
    }
}