// app/page.tsx
"use client";

import React, { useState, useRef } from "react";
import LanguageSelector from "./components/LanguageSelector";
import GenderSelector from "./components/GenderSelector";
import AudioRecorder from "./components/AudioRecorder";
import OptionSliders from "./components/OptionSliders";
import { transcribeAudio } from "./utils/transcription";
import { translateText } from "./utils/translation";
import { textToSpeech, playAudio } from "./utils/tts";
import { voices } from "./data/voices";
import { Message, Options } from "./utils/types";
import { MessageCard } from "./components/MessageCard";

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
    const [isRecordingA, setIsRecordingA] = useState(false);
    const [isRecordingB, setIsRecordingB] = useState(false);
    const [isLoadingA, setIsLoadingA] = useState(false);
    const [isLoadingB, setIsLoadingB] = useState(false);

    const mediaRecorderA = useRef<MediaRecorder | null>(null);
    const mediaRecorderB = useRef<MediaRecorder | null>(null);
    const audioChunksA = useRef<Blob[]>([]);
    const audioChunksB = useRef<Blob[]>([]);

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

    const startRecording = async (isUserA: boolean) => {
        const audioChunks = isUserA ? audioChunksA : audioChunksB;
        audioChunks.current = [];
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            const mediaRecorder = new MediaRecorder(stream);
            if (isUserA) {
                mediaRecorderA.current = mediaRecorder;
            } else {
                mediaRecorderB.current = mediaRecorder;
            }
            mediaRecorder.ondataavailable = (event) => {
                audioChunks.current.push(event.data);
            };
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks.current, {
                    type: "audio/wav",
                });
                handleRecordingComplete(audioBlob, isUserA);
            };
            mediaRecorder.start();
            if (isUserA) {
                setIsRecordingA(true);
            } else {
                setIsRecordingB(true);
            }
        } catch (error) {
            console.error("Error accessing microphone:", error);
        }
    };

    const stopRecording = (isUserA: boolean) => {
        const mediaRecorder = isUserA
            ? mediaRecorderA.current
            : mediaRecorderB.current;
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
        }
        if (isUserA) {
            setIsRecordingA(false);
        } else {
            setIsRecordingB(false);
        }
    };

    const handleRecordingComplete = async (blob: Blob, isUserA: boolean) => {
        setIsProcessing(true);
        setError("");
        if (isUserA) {
            setIsLoadingA(true);
        } else {
            setIsLoadingB(true);
        }
        try {
            const fromLang = isUserA ? languageA : languageB;
            const toLang = isUserA ? languageB : languageA;
            const toGender = isUserA ? genderA : genderB;
            const fromOptions = isUserA ? optionsA : optionsB;

            // Transcribe
            const transcription = await transcribeAudio(blob, fromLang);

            // Translate
            const translation = await translateText(
                transcription,
                voices[fromLang].name,
                voices[toLang].name,
                fromOptions,
                (isUserA ? genderA : genderB) as "male" | "female",
                (isUserA ? genderB : genderA) as "male" | "female"
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
                fromOptions
            );
            playAudio(audioBuffer);
        } catch (error) {
            console.error("Error processing audio:", error);
            setError("An error occurred. Please try again.");
        } finally {
            setIsProcessing(false);
            setIsLoadingA(false);
            setIsLoadingB(false);
        }
    };

    return (
        <main className="flex flex-col min-h-screen bg-violet-900 text-white p-4 md:p-8">
            <div className="flex flex-col md:flex-row flex-1 space-y-8 md:space-y-0 md:space-x-8">
                {["A", "B"].map((user) => {
                    const isUserA = user === "A";
                    const language = isUserA ? languageA : languageB;
                    const gender = isUserA ? genderA : genderB;
                    const options = isUserA ? optionsA : optionsB;
                    const setGender = isUserA ? setGenderA : setGenderB;
                    const isRecording = isUserA ? isRecordingA : isRecordingB;
                    const isLoading = isUserA ? isLoadingA : isLoadingB;

                    return (
                        <div
                            key={user}
                            className="flex-1 flex flex-col space-y-6 md:px-8"
                        >
                            <LanguageSelector
                                selected={language}
                                onChange={(lang) =>
                                    isUserA
                                        ? setLanguageA(lang)
                                        : setLanguageB(lang)
                                }
                                className="text-2xl font-bold"
                            />
                            <div className="flex-1 bg-violet-800 rounded-lg p-4 overflow-y-auto">
                                {messages.map((msg: Message, index: number) => (
                                    <MessageCard
                                        key={index}
                                        message={msg}
                                        language={language}
                                    />
                                ))}
                            </div>
                            <GenderSelector
                                selected={gender}
                                onChange={setGender}
                            />
                            <OptionSliders
                                options={options}
                                onChange={(key, value) =>
                                    handleOptionChange(
                                        isUserA ? "A" : "B",
                                        key,
                                        value
                                    )
                                }
                            />
                            <div className="flex justify-center">
                                <AudioRecorder
                                    isRecording={isRecording}
                                    isDisabled={
                                        isProcessing ||
                                        (isUserA ? isRecordingB : isRecordingA)
                                    }
                                    isLoading={isLoading}
                                    onClick={() => {
                                        if (isRecording) {
                                            stopRecording(isUserA);
                                        } else {
                                            startRecording(isUserA);
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
            {error && <p className="text-red-500 text-center mt-4">{error}</p>}
        </main>
    );
}
