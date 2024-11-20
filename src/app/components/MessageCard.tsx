// app/components/MessageCard.tsx
import React, { useState } from "react";
import { ExplanationModal } from "./ExplanationModal";
import { Message, TranslationInfo } from "../utils/types";

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

        try {
            const response = await fetch("/api/explain", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    originalText: message.original,
                    translatedText: message.translated,
                    fromLang: message.fromLang,
                    toLang: message.toLang,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                console.error("Explanation API error:", error);
                throw new Error(error.error || "Failed to get explanation");
            }

            const result = await response.json();
            setExplanation(result);
        } catch (error) {
            console.error("Error getting explanation:", error);
            // You might want to show an error message to the user here
        } finally {
            setIsLoading(false);
        }
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
