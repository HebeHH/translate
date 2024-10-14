// app/components/AudioRecorder.tsx
import React from "react";
import { FaMicrophone, FaStop } from "react-icons/fa";
import { ImSpinner8 } from "react-icons/im";

interface AudioRecorderProps {
    isRecording: boolean;
    isDisabled: boolean;
    isLoading: boolean;
    onClick: () => void;
}

export default function AudioRecorder({
    isRecording,
    isDisabled,
    isLoading,
    onClick,
}: AudioRecorderProps) {
    return (
        <button
            onClick={onClick}
            disabled={isDisabled}
            className={`w-16 h-16 rounded-full flex items-center justify-center ${
                isRecording ? "bg-red-500" : "bg-teal-400"
            } ${
                isDisabled
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-opacity-80"
            } transition-all duration-300 ease-in-out`}
        >
            {isLoading ? (
                <ImSpinner8 className="w-8 h-8 animate-spin text-indigo-600" />
            ) : isRecording ? (
                <FaStop className="w-8 h-8 text-white" />
            ) : (
                <FaMicrophone className="w-8 h-8 text-indigo-700" />
            )}
        </button>
    );
}
