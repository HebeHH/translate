// app/page.tsx
"use client";

import React, { useState } from "react";
import LanguageSelector from "./components/LanguageSelector";
import GenderSelector from "./components/GenderSelector";
import AudioRecorder from "./components/AudioRecorder";
import OptionSliders from "./components/OptionSliders";
import { transcribeAudio } from "./utils/transcription";
import { translateText } from "./utils/translation";
import { textToSpeech, playAudio } from "./utils/tts";
import { voices } from "./data/voices";

type Message = {
    original: string;
    translated: string;
    fromLang: string;
    toLang: string;
};

type Options = {
    tone: number;
    detail: number;
    speed: number;
    emotion: number;
};

export default function Home() {
    const [languageA, setLanguageA] = useState("en");
    const [languageB, setLanguageB] = useState("fr");
    const [genderA, setGenderA] = useState("male");
    const [genderB, setGenderB] = useState("female");
    const [optionsA, setOptionsA] = useState<Options>({
        tone: 0,
        detail: 0,
        speed: 0,
        emotion: 0,
    });
    const [optionsB, setOptionsB] = useState<Options>({
        tone: 0,
        detail: 0,
        speed: 0,
        emotion: 0,
    });
    const [messages, setMessages] = useState<Message[]>([]);
    const [error, setError] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    const getVoiceId = (language: string, gender: string) => {
        const voiceOption = voices[language].voiceOptions.find(
            (option) => option.gender === gender
        );
        return voiceOption
            ? voiceOption.id
            : voices[language].voiceOptions[0].id;
    };

    const handleOptionChange = (
        user: "A" | "B",
        key: string,
        value: number
    ) => {
        if (user === "A") {
            setOptionsA((prev) => ({ ...prev, [key]: value }));
        } else {
            setOptionsB((prev) => ({ ...prev, [key]: value }));
        }
    };

    const handleRecordingComplete = async (blob: Blob, isUserA: boolean) => {
        setIsProcessing(true);
        setError("");
        try {
            const fromLang = isUserA ? languageA : languageB;
            const toLang = isUserA ? languageB : languageA;
            const toGender = isUserA ? genderA : genderB;
            const fromOptions = isUserA ? optionsA : optionsB;
            const toOptions = isUserA ? optionsB : optionsA;

            // Transcribe
            const transcription = await transcribeAudio(blob, fromLang);

            // Translate
            const translation = await translateText(
                transcription,
                voices[fromLang].name,
                voices[toLang].name,
                fromOptions,
                toOptions
            );

            // Update messages
            const newMessage: Message = {
                original: transcription,
                translated: translation,
                fromLang: fromLang,
                toLang: toLang,
            };
            setMessages((prevMessages) => [...prevMessages, newMessage]);

            // Text-to-speech
            const voiceId = getVoiceId(toLang, toGender);
            const audioBuffer = await textToSpeech(
                translation,
                toLang,
                voiceId,
                toOptions
            );
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
                <div>
                    <LanguageSelector
                        selected={languageA}
                        onChange={setLanguageA}
                    />
                    <GenderSelector selected={genderA} onChange={setGenderA} />
                </div>
                <div>
                    <LanguageSelector
                        selected={languageB}
                        onChange={setLanguageB}
                    />
                    <GenderSelector selected={genderB} onChange={setGenderB} />
                </div>
            </div>
            <div className="flex flex-1">
                <div className="w-1/2 p-4 border-r">
                    <h2 className="text-2xl mb-4">{voices[languageA].name}</h2>
                    <div className="h-[calc(100vh-450px)] overflow-y-auto mb-4">
                        {messages.map((msg, index) => (
                            <div key={index} className="mb-2">
                                {msg.fromLang === languageA ? (
                                    <p className="font-bold">{msg.original}</p>
                                ) : (
                                    <p className="text-gray-600">
                                        {msg.translated}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                    <OptionSliders
                        options={optionsA}
                        onChange={(key, value) =>
                            handleOptionChange("A", key, value)
                        }
                    />
                    <AudioRecorder
                        onRecordingComplete={(blob) =>
                            handleRecordingComplete(blob, true)
                        }
                    />
                </div>
                <div className="w-1/2 p-4">
                    <h2 className="text-2xl mb-4">{voices[languageB].name}</h2>
                    <div className="h-[calc(100vh-450px)] overflow-y-auto mb-4">
                        {messages.map((msg, index) => (
                            <div key={index} className="mb-2">
                                {msg.fromLang === languageB ? (
                                    <p className="font-bold">{msg.original}</p>
                                ) : (
                                    <p className="text-gray-600">
                                        {msg.translated}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                    <OptionSliders
                        options={optionsB}
                        onChange={(key, value) =>
                            handleOptionChange("B", key, value)
                        }
                    />
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
