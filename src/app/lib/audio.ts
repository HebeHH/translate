// app/lib/audio.ts

// Class to manage audio streaming and playback
export class AudioStreamPlayer {
    private audioContext: AudioContext;
    private sourceNode: AudioBufferSourceNode | null = null;
    private nextStartTime: number = 0;
    private isPlaying: boolean = false;
    private scheduledBuffers: AudioBufferSourceNode[] = [];

    constructor(private sampleRate: number = 44100) {
        this.audioContext = new AudioContext();
    }

    public async playChunk(chunk: ArrayBuffer) {
        const floatArray = new Float32Array(chunk);
        const audioBuffer = this.audioContext.createBuffer(1, floatArray.length, this.sampleRate);
        audioBuffer.copyToChannel(floatArray, 0);

        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.audioContext.destination);

        // Schedule this chunk to play after the previous chunk
        const startTime = Math.max(this.audioContext.currentTime, this.nextStartTime);
        source.start(startTime);
        this.nextStartTime = startTime + audioBuffer.duration;

        // Keep track of scheduled buffers
        this.scheduledBuffers.push(source);
        source.onended = () => {
            const index = this.scheduledBuffers.indexOf(source);
            if (index > -1) {
                this.scheduledBuffers.splice(index, 1);
            }
        };

        this.isPlaying = true;
    }

    public stop() {
        // Stop all scheduled buffers
        this.scheduledBuffers.forEach(source => {
            try {
                source.stop();
            } catch (e) {
                console.log(e)
                // Ignore errors from already stopped sources
            }
        });
        this.scheduledBuffers = [];
        this.isPlaying = false;
        this.nextStartTime = 0;
    }

    public async close() {
        this.stop();
        if (this.audioContext.state !== 'closed') {
            await this.audioContext.close();
        }
    }
}

// Function to create a ReadableStream from audio chunks
export function createAudioStream(response: Response): ReadableStream<Uint8Array> {
    const reader = response.body!.getReader();
    return new ReadableStream({
        async start(controller) {
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    controller.enqueue(value);
                }
                controller.close();
            } catch (err) {
                controller.error(err);
            }
        },
    });
}

// Function to process chunks into Float32Arrays
export async function* processAudioChunks(stream: ReadableStream<Uint8Array>): AsyncGenerator<ArrayBuffer> {
    const reader = stream.getReader();
    const chunkSize = 16384; // Process in smaller chunks to avoid stack overflow
    let buffer = new Uint8Array(0);

    try {
        while (true) {
            const { done, value } = await reader.read();

            if (value) {
                // Append new data to buffer
                const newBuffer = new Uint8Array(buffer.length + value.length);
                newBuffer.set(buffer);
                newBuffer.set(value, buffer.length);
                buffer = newBuffer;
            }

            // Process complete chunks
            while (buffer.length >= chunkSize) {
                const chunk = buffer.slice(0, chunkSize);
                buffer = buffer.slice(chunkSize);
                yield chunk.buffer;
            }

            // If we're done, yield any remaining data
            if (done) {
                if (buffer.length > 0) {
                    yield buffer.buffer;
                }
                break;
            }
        }
    } finally {
        reader.releaseLock();
    }
}