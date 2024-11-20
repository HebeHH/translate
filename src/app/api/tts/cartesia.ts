// app/api/tts/cartesia.ts
import Cartesia, { EmotionControl } from "@cartesia/cartesia-js";
import {
    TTSProvider,
    TTSOptions,
    TTSError,
    TTSMetadata
} from "@/app/lib/providers/tts";

export class CartesiaTTSProvider implements TTSProvider {
    private client: Cartesia | null = null;
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    private initializeClient() {
        if (!this.client) {
            if (!this.apiKey) {
                throw new TTSError(
                    'Cartesia API key not configured',
                    'CONFIGURATION_ERROR',
                    'Cartesia'
                );
            }
            this.client = new Cartesia({
                apiKey: this.apiKey,
            });
        }
        return this.client;
    }

    private getSpeedSetting(speed?: number): 'slowest' | 'normal' | 'fastest' {
        if (!speed) return 'normal';
        if (speed < -0.3) return 'slowest';
        if (speed > 0.3) return 'fastest';
        return 'normal';
    }

    private getEmotionSettings(emotion?: number): EmotionControl[] {
        if (!emotion) return [];
        if (emotion < 0) return ['positivity:high', 'sadness:low'];
        if (emotion > 0) return ['sadness:high', 'positivity:low'];
        return [];
    }

    getMetadata(options?: TTSOptions): TTSMetadata {
        return {
            format: 'pcm_f32le',
            sampleRate: options?.sampleRate || 44100
        };
    }

    async* synthesize(
        text: string,
        language: string,
        voiceId: string,
        options?: TTSOptions
    ): AsyncGenerator<Uint8Array> {
        try {
            const client = this.initializeClient();
            const sampleRate = options?.sampleRate || 44100;

            console.log('Creating TTS request with options:', {
                language,
                voiceId,
                textLength: text.length,
                sampleRate,
                speed: options?.speed,
                emotion: options?.emotion
            });

            const websocket = client.tts.websocket({
                container: "raw",
                encoding: "pcm_f32le",
                sampleRate
            });

            await websocket.connect();

            const response = await websocket.send({
                model_id: "sonic-multilingual",
                voice: {
                    mode: "id",
                    id: voiceId,
                    __experimental_controls: {
                        speed: this.getSpeedSetting(options?.speed),
                        emotion: this.getEmotionSettings(options?.emotion),
                    },
                },
                language: language,
                transcript: text
            });

            try {
                for await (const message of response.events('message')) {
                    try {
                        const parsedMessage = JSON.parse(message);
                        console.log("Received message type:", parsedMessage.type);

                        if (parsedMessage.type === 'chunk' && parsedMessage.data) {
                            // Convert base64 to Uint8Array
                            const binaryString = atob(parsedMessage.data);
                            const bytes = new Uint8Array(binaryString.length);
                            for (let i = 0; i < binaryString.length; i++) {
                                bytes[i] = binaryString.charCodeAt(i);
                            }
                            yield bytes;
                        } else if (parsedMessage.type === 'done') {
                            break;
                        }
                    } catch (error) {
                        console.error('Error processing TTS chunk:', error);
                        throw new TTSError(
                            'Error processing audio chunk',
                            'PROCESSING_ERROR',
                            'Cartesia'
                        );
                    }
                }
            } finally {
                // Ensure we always close the websocket
                try {
                    await websocket.disconnect();
                } catch (error) {
                    console.warn('Error closing websocket:', error);
                }
            }
        } catch (error) {
            console.error('TTS error details:', error);

            if (error instanceof TTSError) {
                throw error;
            }

            throw new TTSError(
                error instanceof Error ? error.message : 'Unknown error',
                'PROVIDER_ERROR',
                'Cartesia'
            );
        }
    }
}