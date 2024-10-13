// app/components/AudioRecorder.tsx
import React, { useState, useRef } from "react";

interface AudioRecorderProps {
    onRecordingComplete: (blob: Blob) => void;
}

export default function AudioRecorder({
    onRecordingComplete,
}: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const audioChunks = useRef<Blob[]>([]);

    const startRecording = async () => {
        audioChunks.current = [];
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            mediaRecorder.current = new MediaRecorder(stream);
            mediaRecorder.current.ondataavailable = (event) => {
                audioChunks.current.push(event.data);
            };
            mediaRecorder.current.onstop = () => {
                const audioBlob = new Blob(audioChunks.current, {
                    type: "audio/wav",
                });
                onRecordingComplete(audioBlob);
            };
            mediaRecorder.current.start();
            setIsRecording(true);
        } catch (error) {
            console.error("Error accessing microphone:", error);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder.current) {
            mediaRecorder.current.stop();
            setIsRecording(false);
        }
    };

    return (
        <div className="mt-4">
            {!isRecording ? (
                <button
                    onClick={startRecording}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    Start Recording
                </button>
            ) : (
                <button
                    onClick={stopRecording}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                >
                    Stop Recording
                </button>
            )}
        </div>
    );
}
