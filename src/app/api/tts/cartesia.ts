// app/api/tts/cartesia.ts
import Cartesia, { EmotionControl } from "@cartesia/cartesia-js";
import {
    TTSProvider,
    TTSResult,
    TTSOptions,
    TTSError,
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

    async synthesize(
        text: string,
        language: string,
        voiceId: string,
        options?: TTSOptions
    ): Promise<TTSResult> {
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

            const chunks: ArrayBuffer[] = [];
            let lastChunkTime = Date.now();
            const TIMEOUT = 50000; // 50 seconds timeout

            try {
                for await (const message of response.events('message')) {
                    try {
                        const parsedMessage = JSON.parse(message);
                        console.log("Received message type:", parsedMessage.type);

                        if (parsedMessage.type === 'chunk' && parsedMessage.data) {
                            lastChunkTime = Date.now();
                            const binaryString = atob(parsedMessage.data);
                            const len = binaryString.length;
                            const bytes = new Uint8Array(len);
                            for (let i = 0; i < len; i++) {
                                bytes[i] = binaryString.charCodeAt(i);
                            }
                            chunks.push(bytes.buffer);
                        } else if (parsedMessage.type === 'done') {
                            break;
                        }

                        if (Date.now() - lastChunkTime > TIMEOUT) {
                            throw new TTSError('TTS stream timeout', 'TIMEOUT_ERROR', 'Cartesia');
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

            if (chunks.length === 0) {
                throw new TTSError('No audio data received', 'NO_AUDIO_ERROR', 'Cartesia');
            }

            console.log('TTS synthesis completed:', {
                chunks: chunks.length,
                totalSize: chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0)
            });

            const concatenated = new Blob(chunks).arrayBuffer();

            return {
                audioBuffer: await concatenated,
                format: 'pcm_f32le',
                sampleRate
            };
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