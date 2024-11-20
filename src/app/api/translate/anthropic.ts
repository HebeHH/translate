// app/api/translate/anthropic.ts
import Anthropic from "@anthropic-ai/sdk";
import {
    TranslationProvider,
    TranslationResult,
    TranslationOptions,
    TranslationError,
} from "@/app/lib/providers/translate";

export class AnthropicTranslationProvider implements TranslationProvider {
    private client: Anthropic | null = null;
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    private initializeClient() {
        if (!this.client) {
            if (!this.apiKey) {
                throw new TranslationError(
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

    async translate(
        text: string,
        fromLang: string,
        toLang: string,
        options?: TranslationOptions
    ): Promise<TranslationResult> {
        try {
            const client = this.initializeClient();

            // Build the system prompt based on options
            const toneInstruction = options?.tone
                ? options.tone < 0
                    ? "Be casual - this is a friendly conversation"
                    : "Be very respectful. The speaker is talking to somebody they look up to, like a professor or a mother-in-law. Ensure that your translation conveys their sincere politeness and avoids misunderstandings."
                : "";

            const detailInstruction = options?.detail
                ? options.detail < 0
                    ? "Be concise."
                    : "Convey the meaning fully, using as many words as needed to get the general feeling across."
                : "";

            const emotionInstruction = options?.emotion
                ? options.emotion < 0
                    ? "The speaker is feeling warm and positive."
                    : "The speaker is feeling negative and upset."
                : "";

            const genderInstruction = options?.fromGender && options?.toGender
                ? `The speaker is ${options.fromGender}, and the listener is ${options.toGender}.`
                : "";

            console.log('Creating translation request with options:', {
                fromLang,
                toLang,
                options,
                textLength: text.length
            });

            const response = await client.messages.create({
                model: "claude-3-5-sonnet-20240620",
                max_tokens: 5463,
                temperature: 0,
                system: `You are utterly fluent in both ${fromLang} and ${toLang}. You are assisting in translating from ${fromLang} into ${toLang}. ${genderInstruction}

        There may be errors in the transcription, so if something sounds nonsensical, go with the common-sense version. Use punctuation freely to make the translation more readable and split it into bite sized chunks.
        ${toneInstruction} ${detailInstruction} ${emotionInstruction}
        When the user gives a message in ${fromLang}, you immediately respond with the ${toLang} translation. 

        Provide only the translation.`,
                messages: [
                    {
                        role: "user",
                        content: text
                    }
                ]
            });

            const translatedText = (response.content[0] as Anthropic.Messages.TextBlock).text;

            console.log('Translation completed:', {
                originalLength: text.length,
                translatedLength: translatedText.length
            });

            return {
                text: translatedText,
                // Note: Anthropic doesn't provide confidence scores
                confidence: 1.0
            };
        } catch (error) {
            console.error('Translation error details:', error);

            if (error instanceof TranslationError) {
                throw error;
            }

            throw new TranslationError(
                error instanceof Error ? error.message : 'Unknown error',
                'PROVIDER_ERROR',
                'Anthropic'
            );
        }
    }
}