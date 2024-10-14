// app/components/GenderSelector.tsx
import React from "react";
import { FaMale, FaFemale } from "react-icons/fa";

interface GenderSelectorProps {
    selected: string;
    onChange: (gender: string) => void;
}

export default function GenderSelector({
    selected,
    onChange,
}: GenderSelectorProps) {
    return (
        <div className="flex space-x-4">
            <button
                className={`flex-1 px-4 py-2 rounded ${
                    selected === "male"
                        ? "bg-blue-500 text-white"
                        : "bg-violet-700 text-gray-300"
                }`}
                onClick={() => onChange("male")}
            >
                <FaMale className="inline-block mr-2" /> Male
            </button>
            <button
                className={`flex-1  px-4 py-2 rounded ${
                    selected === "female"
                        ? "bg-pink-500 text-white"
                        : "bg-violet-700 text-gray-300"
                }`}
                onClick={() => onChange("female")}
            >
                <FaFemale className="inline-block mr-2" /> Female
            </button>
        </div>
    );
}
