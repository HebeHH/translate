import React, { useState } from "react";
import {
    FaSmile,
    FaSadTear,
    FaRunning,
    FaWalking,
    FaCommentAlt,
    FaBook,
    FaUserTie,
    FaTshirt,
} from "react-icons/fa";

interface OptionSlidersProps {
    options: {
        tone: number;
        detail: number;
        speed: number;
        emotion: number;
    };
    onChange: (key: string, value: number) => void;
}

const Slider: React.FC<{
    value: number;
    onChange: (value: number) => void;
    leftIcon: React.ElementType;
    rightIcon: React.ElementType;
    label: string;
}> = ({ value, onChange, leftIcon: LeftIcon, rightIcon: RightIcon, label }) => {
    const [hover, setHover] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseFloat(e.target.value);
        onChange(Math.round(newValue)); // Round to nearest integer (-1, 0, or 1)
    };

    return (
        <div
            className="relative flex items-center space-x-4 mx-7"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            <LeftIcon className="text-teal-300 w-6 h-6" />
            <div className="flex-grow relative">
                <input
                    type="range"
                    min="-1"
                    max="1"
                    step="1"
                    value={value}
                    onChange={handleChange}
                    className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                />
                <div className="absolute top-0 left-0 right-0 flex justify-between px-1 -mt-2 pointer-events-none">
                    {[-1, 0, 1].map((position) => (
                        <div
                            key={position}
                            className={`w-3 h-3 rounded-full ${
                                value === position
                                    ? "bg-teal-300"
                                    : "bg-gray-400"
                            }`}
                        />
                    ))}
                </div>
            </div>
            <RightIcon className="text-teal-300 w-6 h-6" />

            {/* Tooltip */}
            {hover && (
                <div className="absolute bottom-0 left-1/4 translate-y-full bg-gray-300 text-indigo-900 text-xs rounded-md px-3 py-1 mt-2 z-50">
                    {label}
                </div>
            )}
        </div>
    );
};

export default function OptionSliders({
    options,
    onChange,
}: OptionSlidersProps) {
    const sliderOptions = [
        {
            key: "tone",
            label: "Tone: Casual to Formal",
            leftIcon: FaTshirt,
            rightIcon: FaUserTie,
        },
        {
            key: "detail",
            label: "Detail: Concise to Explanatory",
            leftIcon: FaCommentAlt,
            rightIcon: FaBook,
        },
        {
            key: "speed",
            label: "Speed: Slow to Fast",
            leftIcon: FaWalking,
            rightIcon: FaRunning,
        },
        {
            key: "emotion",
            label: "Emotion: Happy to Sad",
            leftIcon: FaSmile,
            rightIcon: FaSadTear,
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {sliderOptions.map((option) => (
                <Slider
                    key={option.key}
                    value={options[option.key as keyof typeof options]}
                    onChange={(value) => onChange(option.key, value)}
                    leftIcon={option.leftIcon}
                    rightIcon={option.rightIcon}
                    label={option.label} // Pass the label to the slider
                />
            ))}
        </div>
    );
}
