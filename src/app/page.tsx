// app/page.tsx
"use client";

import React, { useState } from "react";
import LanguageSelector from "./components/LanguageSelector";
import AudioRecorder from "./components/AudioRecorder";
import { transcribeAudio } from "./utils/transcription";
import { translateText } from "./utils/translation";
import { textToSpeech, playAudio } from "./utils/tts";

type Message = {
    original: string;
    translated: string;
    fromLang: string;
    toLang: string;
};

export default function Home() {
    const [languageA, setLanguageA] = useState({ id: "en", name: "English" });
    const [languageB, setLanguageB] = useState({ id: "es", name: "Spanish" });
    const [messages, setMessages] = useState<Message[]>([]);
    const [error, setError] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    const handleRecordingComplete = async (blob: Blob, isUserA: boolean) => {
        setIsProcessing(true);
        setError("");
        try {
            const fromLang = isUserA ? languageA : languageB;
            const toLang = isUserA ? languageB : languageA;

            // Transcribe
            const transcription = await transcribeAudio(blob, fromLang.id);

            // Translate
            const translation = await translateText(
                transcription,
                fromLang.name,
                toLang.name
            );

            // Update messages
            const newMessage: Message = {
                original: transcription,
                translated: translation,
                fromLang: fromLang.id,
                toLang: toLang.id,
            };
            setMessages((prevMessages) => [...prevMessages, newMessage]);

            // Text-to-speech
            const audioBuffer = await textToSpeech(translation, toLang.id);
            playAudio(audioBuffer);
        } catch (error) {
            console.error("Error processing audio:", error);
            setError("An error occurred. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <main className="flex flex-col min-h-screen p-8">
            <div className="flex justify-center space-x-8 mb-8">
                <LanguageSelector
                    selected={languageA}
                    onChange={setLanguageA}
                />
                <LanguageSelector
                    selected={languageB}
                    onChange={setLanguageB}
                />
            </div>
            <div className="flex flex-1">
                <div className="w-1/2 p-4 border-r">
                    <h2 className="text-2xl mb-4">{languageA.name}</h2>
                    <div className="h-[calc(100vh-300px)] overflow-y-auto mb-4">
                        {messages.map((msg, index) => (
                            <div key={index} className="mb-2">
                                {msg.fromLang === languageA.id ? (
                                    <p className="font-bold">{msg.original}</p>
                                ) : (
                                    <p className="text-gray-600">
                                        {msg.translated}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                    <AudioRecorder
                        onRecordingComplete={(blob) =>
                            handleRecordingComplete(blob, true)
                        }
                    />
                </div>
                <div className="w-1/2 p-4">
                    <h2 className="text-2xl mb-4">{languageB.name}</h2>
                    <div className="h-[calc(100vh-300px)] overflow-y-auto mb-4">
                        {messages.map((msg, index) => (
                            <div key={index} className="mb-2">
                                {msg.fromLang === languageB.id ? (
                                    <p className="font-bold">{msg.original}</p>
                                ) : (
                                    <p className="text-gray-600">
                                        {msg.translated}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                    <AudioRecorder
                        onRecordingComplete={(blob) =>
                            handleRecordingComplete(blob, false)
                        }
                    />
                </div>
            </div>
            {isProcessing && <p className="text-center mt-4">Processing...</p>}
            {error && <p className="text-red-500 text-center mt-4">{error}</p>}
        </main>
    );
}
