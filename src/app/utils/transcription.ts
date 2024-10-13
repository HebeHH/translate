// app/utils/transcription.ts
import { AssemblyAI } from 'assemblyai';

const client = new AssemblyAI({
    apiKey: process.env.NEXT_PUBLIC_ASSEMBLYAI_API_KEY || '',
});

export async function transcribeAudio(audioBlob: Blob, languageCode: string): Promise<string> {
    try {
        const audioFile = new File([audioBlob], 'audio.wav', { type: 'audio/wav' });

        const params = {
            audio: audioFile,
            language_code: languageCode,
        };

        const transcript = await client.transcripts.transcribe(params);

        console.log('Transcription:', transcript);

        if (transcript.status === 'error') {
            throw new Error(`Transcription failed: ${transcript.error}`);
        }

        return transcript.text || "";
    } catch (error) {
        console.error('Error in transcribeAudio:', error);
        throw error;
    }
}