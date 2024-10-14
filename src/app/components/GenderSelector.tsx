// app/components/GenderSelector.tsx
import React from "react";

interface GenderSelectorProps {
    selected: string;
    onChange: (gender: string) => void;
}

export default function GenderSelector({
    selected,
    onChange,
}: GenderSelectorProps) {
    return (
        <div className="flex space-x-2">
            <button
                className={`px-4 py-2 rounded ${
                    selected === "male"
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200"
                }`}
                onClick={() => onChange("male")}
            >
                Male
            </button>
            <button
                className={`px-4 py-2 rounded ${
                    selected === "female"
                        ? "bg-pink-500 text-white"
                        : "bg-gray-200"
                }`}
                onClick={() => onChange("female")}
            >
                Female
            </button>
        </div>
    );
}
