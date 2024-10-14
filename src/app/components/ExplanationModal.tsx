import React, { useState } from "react";
import { TranslationInfo, Message, SegmentExplainer } from "../utils/types";

interface ExplanationModalProps {
    isOpen: boolean;
    onClose: () => void;
    explanation: TranslationInfo | null;
    isLoading: boolean;
    message: Message;
}

const HIGHLIGHT_COLORS = [
    "bg-pink-200",
    "bg-blue-200",
    "bg-green-200",
    "bg-yellow-200",
    "bg-purple-200",
];

const HighlightedText: React.FC<{
    text: string;
    highlights: SegmentExplainer[];
}> = ({ text, highlights }) => {
    if (!highlights || highlights.length === 0) return <>{text}</>;

    const sortedHighlights = [...highlights].sort(
        (a, b) =>
            text.indexOf(a.originalTextString) -
            text.indexOf(b.originalTextString)
    );

    let lastIndex = 0;
    const elements = [];

    sortedHighlights.forEach((highlight, index) => {
        const startIndex = text.indexOf(
            highlight.originalTextString,
            lastIndex
        );
        if (startIndex === -1) return; // Skip if the substring is not found

        if (startIndex > lastIndex) {
            elements.push(
                <span key={`text-${index}`}>
                    {text.slice(lastIndex, startIndex)}
                </span>
            );
        }
        elements.push(
            <span
                key={`highlight-${index}`}
                className={`${
                    HIGHLIGHT_COLORS[index % HIGHLIGHT_COLORS.length]
                } relative group cursor-pointer`}
            >
                {highlight.originalTextString}
                <span className="absolute z-10 p-2 -mt-1 text-sm bg-white rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-64">
                    {highlight.additionalDetails}
                </span>
            </span>
        );
        lastIndex = startIndex + highlight.originalTextString.length;
    });

    if (lastIndex < text.length) {
        elements.push(<span key="text-last">{text.slice(lastIndex)}</span>);
    }

    return <>{elements}</>;
};

export const ExplanationModal: React.FC<ExplanationModalProps> = ({
    isOpen,
    onClose,
    explanation,
    isLoading,
    message,
}) => {
    const [activeTab, setActiveTab] = useState<"uncertain" | "idioms">(
        "uncertain"
    );

    if (!isOpen) return null;

    const TabButton: React.FC<{
        tabName: "uncertain" | "idioms";
        label: string;
    }> = ({ tabName, label }) => (
        <button
            className={`px-4 py-2 font-semibold ${
                activeTab === tabName
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-700"
            } rounded-t-lg`}
            onClick={() => setActiveTab(tabName)}
        >
            {label}
        </button>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div
                className={`bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
                    explanation?.accurate
                        ? "border-4 border-green-500"
                        : "border-4 border-red-500"
                }`}
            >
                <button
                    onClick={onClose}
                    className="float-right text-gray-600 hover:text-gray-800 transition-colors duration-300"
                >
                    ✕
                </button>
                <h2 className="text-2xl font-bold mb-4 text-indigo-800">
                    Translation Explanation
                </h2>

                {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                    </div>
                ) : explanation ? (
                    <>
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-violet-700">
                                Tone:
                            </h3>
                            <p className="text-gray-700">{explanation.tone}</p>
                        </div>
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-violet-700">
                                Original ({message.fromLang}):
                            </h3>
                            <p className="text-gray-700 p-2 bg-indigo-50 rounded">
                                <HighlightedText
                                    text={message.original}
                                    highlights={[
                                        ...(explanation.idioms || []),
                                        ...(explanation.possibleMistranslations ||
                                            []),
                                    ]}
                                />
                            </p>
                        </div>
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-violet-700">
                                Translated ({message.toLang}):
                            </h3>
                            <p className="text-gray-700 p-2 bg-violet-50 rounded">
                                <HighlightedText
                                    text={message.translated}
                                    highlights={[
                                        ...(explanation.idioms || []),
                                        ...(explanation.possibleMistranslations ||
                                            []),
                                    ]}
                                />
                            </p>
                        </div>

                        <div className="mb-4">
                            <div className="flex mb-2">
                                <TabButton
                                    tabName="uncertain"
                                    label="Uncertain Translations"
                                />
                                <TabButton tabName="idioms" label="Idioms" />
                            </div>

                            {activeTab === "uncertain" &&
                                explanation.possibleMistranslations &&
                                explanation.possibleMistranslations.length >
                                    0 && (
                                    <div className="p-4 bg-gray-100 rounded">
                                        <h3 className="text-lg font-semibold text-violet-700 mb-2">
                                            Possible Mistranslations:
                                        </h3>
                                        <ul className="list-disc list-inside">
                                            {explanation.possibleMistranslations.map(
                                                (mistranslation, index) => (
                                                    <li
                                                        key={index}
                                                        className={`text-gray-700 ${
                                                            HIGHLIGHT_COLORS[
                                                                index %
                                                                    HIGHLIGHT_COLORS.length
                                                            ]
                                                        } p-1 rounded mb-1`}
                                                    >
                                                        <span className="font-semibold">
                                                            {
                                                                mistranslation.originalTextString
                                                            }{" "}
                                                            →{" "}
                                                            {
                                                                mistranslation.translatedTextString
                                                            }
                                                        </span>
                                                        :{" "}
                                                        {
                                                            mistranslation.additionalDetails
                                                        }
                                                    </li>
                                                )
                                            )}
                                        </ul>
                                    </div>
                                )}

                            {activeTab === "idioms" &&
                                explanation.idioms &&
                                explanation.idioms.length > 0 && (
                                    <div className="p-4 bg-gray-100 rounded">
                                        <h3 className="text-lg font-semibold text-violet-700 mb-2">
                                            Idioms:
                                        </h3>
                                        <ul className="list-disc list-inside">
                                            {explanation.idioms.map(
                                                (idiom, index) => (
                                                    <li
                                                        key={index}
                                                        className={`text-gray-700 ${
                                                            HIGHLIGHT_COLORS[
                                                                index %
                                                                    HIGHLIGHT_COLORS.length
                                                            ]
                                                        } p-1 rounded mb-1`}
                                                    >
                                                        <span className="font-semibold">
                                                            {
                                                                idiom.originalTextString
                                                            }{" "}
                                                            →{" "}
                                                            {
                                                                idiom.translatedTextString
                                                            }
                                                        </span>
                                                        :{" "}
                                                        {
                                                            idiom.additionalDetails
                                                        }
                                                    </li>
                                                )
                                            )}
                                        </ul>
                                    </div>
                                )}
                        </div>
                    </>
                ) : (
                    <p className="text-gray-700">No explanation available.</p>
                )}
            </div>
        </div>
    );
};
