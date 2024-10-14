import React, { useState } from "react";
import { ExplanationModal } from "./ExplanationModal";
import { Message, TranslationInfo } from "../utils/types";
import { explainText } from "../utils/explanation";

interface MessageCardProps {
    message: Message;
    language: string;
}

export const MessageCard: React.FC<MessageCardProps> = ({
    message,
    language,
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [explanation, setExplanation] = useState<TranslationInfo | null>(
        null
    );
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = async () => {
        setIsLoading(true);
        setIsModalOpen(true);
        const result = await explainText(
            message.original,
            message.translated,
            message.fromLang,
            message.toLang
        );
        setExplanation(result);
        setIsLoading(false);
    };

    const isOriginal = message.fromLang === language;

    return (
        <>
            <div
                className={`mb-4 p-4 rounded-lg shadow-md cursor-pointer transition-all duration-300 hover:shadow-lg ${
                    isOriginal
                        ? "bg-indigo-100 ml-auto"
                        : "bg-violet-100 mr-auto"
                }`}
                style={{ maxWidth: "70%" }}
                onClick={handleClick}
            >
                <p
                    className={
                        isOriginal
                            ? "font-bold text-indigo-800"
                            : "text-violet-800"
                    }
                >
                    {isOriginal ? message.original : message.translated}
                </p>
            </div>
            {isModalOpen && (
                <ExplanationModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    explanation={explanation}
                    isLoading={isLoading}
                    message={message}
                />
            )}
        </>
    );
};
