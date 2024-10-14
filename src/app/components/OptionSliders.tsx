// app/components/OptionSliders.tsx
import React from "react";
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
    min: number;
    max: number;
    step: number;
}> = ({ value, onChange, min, max, step }) => {
    return (
        <div className="relative w-full">
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div
                className="absolute top-0 left-0 h-2 bg-blue-500 rounded-full pointer-events-none"
                style={{ width: `${((value - min) / (max - min)) * 100}%` }}
            ></div>
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
            label: "Tone",
            leftIcon: FaTshirt,
            rightIcon: FaUserTie,
        },
        {
            key: "detail",
            label: "Detail",
            leftIcon: FaCommentAlt,
            rightIcon: FaBook,
        },
        {
            key: "speed",
            label: "Speed",
            leftIcon: FaWalking,
            rightIcon: FaRunning,
        },
        {
            key: "emotion",
            label: "Emotion",
            leftIcon: FaSmile,
            rightIcon: FaSadTear,
        },
    ];

    return (
        <div className="space-y-6">
            {sliderOptions.map((option) => (
                <div key={option.key} className="flex items-center space-x-4">
                    <option.leftIcon className="text-gray-500 w-6 h-6" />
                    <div className="flex-grow">
                        <Slider
                            value={options[option.key as keyof typeof options]}
                            onChange={(value) => onChange(option.key, value)}
                            min={-1}
                            max={1}
                            step={0.1}
                        />
                    </div>
                    <option.rightIcon className="text-gray-500 w-6 h-6" />
                </div>
            ))}
        </div>
    );
}
