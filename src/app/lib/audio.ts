// app/lib/audio.ts
export async function playAudioBuffer(audioBuffer: ArrayBuffer, sampleRate: number) {
    const audioContext = new (window.AudioContext)();
    const source = audioContext.createBufferSource();

    // Create a Float32Array from the ArrayBuffer
    const floatArray = new Float32Array(audioBuffer);

    // Create an AudioBuffer
    const buffer = audioContext.createBuffer(1, floatArray.length, sampleRate);

    // Copy the Float32Array data to the AudioBuffer
    buffer.copyToChannel(floatArray, 0);

    // Set the buffer to the source and play
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);

    // Return a promise that resolves when the audio finishes playing
    return new Promise<void>((resolve) => {
        source.onended = () => {
            audioContext.close();
            resolve();
        };
    });
}