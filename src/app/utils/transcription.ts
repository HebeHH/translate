// app/utils/transcription.ts
import { AssemblyAI } from 'assemblyai';



export async function transcribeAudio(audioBlob: Blob, languageCode: string, ASSEMBLYAI_API_KEY: string): Promise<string> {
    const client = new AssemblyAI({
        apiKey: ASSEMBLYAI_API_KEY,
    });
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