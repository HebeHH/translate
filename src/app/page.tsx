// app/page.tsx
"use client";

import React, { useState } from "react";
import LanguageSelector from "./components/LanguageSelector";
import AudioRecorder from "./components/AudioRecorder";
import { transcribeAudio } from "./utils/transcription";

export default function Home() {
    const [languageA, setLanguageA] = useState({ id: "en", name: "English" });
    const [languageB, setLanguageB] = useState({ id: "es", name: "Spanish" });
    const [transcription, setTranscription] = useState("");
    const [error, setError] = useState("");

    const handleRecordingComplete = async (blob: Blob) => {
        try {
            setError("");
            const text = await transcribeAudio(blob, languageA.id);
            setTranscription(text);
            console.log("Transcription:", text);
            // TODO: Implement translation and text-to-speech here
        } catch (error) {
            console.error("Error processing audio:", error);
            setError("Failed to transcribe audio. Please try again.");
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24">
            <h1 className="text-4xl font-bold mb-8">Translation App</h1>
            <div className="flex space-x-8">
                <div>
                    <h2 className="text-2xl mb-4">User A</h2>
                    <LanguageSelector
                        selected={languageA}
                        onChange={setLanguageA}
                    />
                    <AudioRecorder
                        onRecordingComplete={handleRecordingComplete}
                    />
                </div>
                <div>
                    <h2 className="text-2xl mb-4">User B</h2>
                    <LanguageSelector
                        selected={languageB}
                        onChange={setLanguageB}
                    />
                    <AudioRecorder
                        onRecordingComplete={handleRecordingComplete}
                    />
                </div>
            </div>
            {error && <p className="text-red-500 mt-4">{error}</p>}
            {transcription && (
                <div className="mt-8">
                    <h3 className="text-xl font-bold mb-2">Transcription:</h3>
                    <p className="bg-gray-100 p-4 rounded">{transcription}</p>
                </div>
            )}
        </main>
    );
}
