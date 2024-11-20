// app/utils/tts.ts
import Cartesia from "@cartesia/cartesia-js";
import { Options } from "./types";


export async function textToSpeech(text: string, language: string, voiceId: string, options: Options, CARTESIA_API_KEY: string): Promise<ArrayBuffer> {

    const cartesia = new Cartesia({
        apiKey: CARTESIA_API_KEY,
    });

    const websocket = cartesia.tts.websocket({
        container: "raw",
        encoding: "pcm_f32le",
        sampleRate: 44100
    });

    await websocket.connect();

    const response = await websocket.send({
        model_id: "sonic-multilingual",
        voice: {
            mode: "id",
            id: voiceId,
            __experimental_controls: {
                speed: options.speed < 0 ? "slowest" : options.speed > 0 ? "fastest" : "normal",
                emotion: options.emotion < 0 ? ["positivity:high", "sadness:low"] : options.emotion > 0 ? ["sadness:high", "positivity:low"] : [],
            },
        },
        language: language,
        transcript: text
    });

    const chunks: ArrayBuffer[] = [];
    let lastChunkTime = Date.now();
    const TIMEOUT = 50000; // 50 seconds timeout

    const messageHandler = async () => {
        for await (const message of response.events('message')) {
            try {
                const parsedMessage = JSON.parse(message);
                console.log("Received message from Cartesia:", parsedMessage);
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
                    return; // Exit the loop when 'done' message is received
                }
            } catch (error) {
                console.error('Error parsing message:', error);
            }

            if (Date.now() - lastChunkTime > TIMEOUT) {
                console.log("Timeout reached, ending stream");
                return; // Exit the loop if no chunks received for TIMEOUT duration
            }
        }
    };

    // Use Promise.race to either complete message handling or timeout
    await Promise.race([
        messageHandler(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Operation timed out")), TIMEOUT))
    ]).catch(error => console.error("TTS operation error:", error));

    console.log("Returning array buffer");
    return new Blob(chunks).arrayBuffer();
}

export function playAudio(audioBuffer: ArrayBuffer) {
    const audioContext = new (window.AudioContext)();
    const source = audioContext.createBufferSource();

    // Create a Float32Array from the ArrayBuffer
    const floatArray = new Float32Array(audioBuffer);

    // Create an AudioBuffer
    const buffer = audioContext.createBuffer(1, floatArray.length, 44100);

    // Copy the Float32Array data to the AudioBuffer
    buffer.copyToChannel(floatArray, 0);

    // Set the buffer to the source and play
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
}

// Helper function to convert ArrayBuffer to Float32Array
// function arrayBufferToFloat32Array(buffer: ArrayBuffer): Float32Array {
//     const view = new DataView(buffer);
//     const floatArray = new Float32Array(view.byteLength / 4);
//     for (let i = 0; i < floatArray.length; i++) {
//         floatArray[i] = view.getFloat32(i * 4, true);  // true for little-endian
//     }
//     return floatArray;
// }