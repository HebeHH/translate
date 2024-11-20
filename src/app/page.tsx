"use client";

import React, { useState, useRef } from "react";
import LanguageSelector from "./components/LanguageSelector";
import GenderSelector from "./components/GenderSelector";
import AudioRecorder from "./components/AudioRecorder";
import OptionSliders from "./components/OptionSliders";
import {
    AudioStreamPlayer,
    createAudioStream,
    processAudioChunks,
} from "@/app/lib/audio";
import { voices } from "./data/voices";
import { Message, Options } from "./utils/types";
import { MessageCard } from "./components/MessageCard";

export default function Home() {
    console.log(process.env.SESSION_SECRET_KEY);

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
    const audioPlayer = useRef<AudioStreamPlayer | null>(null);

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

            // Create form data for the audio file
            const formData = new FormData();
            formData.append("audio", blob);
            formData.append("language_code", fromLang);

            // Get the session token from cookies
            const sessionToken = document.cookie
                .split("; ")
                .find((row) => row.startsWith("session-token="))
                ?.split("=")[1];

            console.log("Preparing audio for transcription:", {
                blobType: blob.type,
                blobSize: blob.size,
                fromLang,
                hasSessionToken: !!sessionToken,
            });
            // Call our new API endpoint
            const transcriptionResponse = await fetch("/api/transcribe", {
                method: "POST",
                body: formData,
                credentials: "include", // Changed from 'same-origin' to 'include'
                headers: {
                    Accept: "application/json",
                    ...(sessionToken && {
                        Authorization: `Bearer ${sessionToken}`,
                    }),
                },
            });

            if (!transcriptionResponse.ok) {
                const error = await transcriptionResponse.json();
                console.error("Transcription API error:", error);
                throw new Error(error.error || "Transcription failed");
            }

            const transcriptionResult = await transcriptionResponse.json();
            const transcription = transcriptionResult.text;

            // Continue with translation...
            const translationResponse = await fetch("/api/translate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    text: transcription,
                    fromLang: voices[fromLang].name,
                    toLang: voices[toLang].name,
                    options: {
                        tone: fromOptions.tone,
                        detail: fromOptions.detail,
                        emotion: fromOptions.emotion,
                        fromGender: isUserA ? genderA : genderB,
                        toGender: isUserA ? genderB : genderA,
                    },
                }),
            });

            if (!translationResponse.ok) {
                const error = await translationResponse.json();
                console.error("Translation API error:", error);
                throw new Error(error.error || "Translation failed");
            }

            const translationResult = await translationResponse.json();
            const translation = translationResult.text;

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
            try {
                // Stop any existing playback
                if (audioPlayer.current) {
                    audioPlayer.current.stop();
                    await audioPlayer.current.close();
                }

                const ttsResponse = await fetch("/api/tts", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/octet-stream",
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        text: translation,
                        language: toLang,
                        voiceId: voiceId,
                        options: {
                            speed: fromOptions.speed,
                            emotion: fromOptions.emotion,
                            sampleRate: 44100,
                        },
                    }),
                });

                if (!ttsResponse.ok) {
                    const error = await ttsResponse.json();
                    console.error("TTS API error:", error);
                    throw new Error(error.error || "TTS failed");
                }

                const sampleRate = parseInt(
                    ttsResponse.headers.get("X-Sample-Rate") || "44100"
                );

                // Create new audio player
                audioPlayer.current = new AudioStreamPlayer(sampleRate);

                // Process the audio stream
                const stream = createAudioStream(ttsResponse);
                for await (const chunk of processAudioChunks(stream)) {
                    await audioPlayer.current.playChunk(chunk);
                }
            } catch (error) {
                console.error("Error playing audio:", error);
                throw error;
            }
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
        <main className="flex flex-col min-h-[95vh] bg-violet-900 text-white p-4 md:p-8">
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
                            className={`flex-1 flex flex-col space-y-6 md:px-8 ${
                                isUserA ? "border-r-2" : "border-l-2"
                            } border-teal-300`}
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
