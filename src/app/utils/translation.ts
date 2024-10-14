// app/utils/translation.ts
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
    apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
    dangerouslyAllowBrowser: true
});

export async function translateText(text: string, fromLang: string, toLang: string, fromOptions: any, toOptions: any): Promise<string> {
    const toneInstruction = toOptions.tone < 0 ? "Use a more casual tone." : toOptions.tone > 0 ? "Use a more respectful tone." : "";
    const detailInstruction = toOptions.detail < 0 ? "Be more concise." : toOptions.detail > 0 ? "Include more details." : "";
    const emotionInstruction = toOptions.emotion < 0 ? "Express more positive emotions." : toOptions.emotion > 0 ? "Express more negative emotions." : "";

    const msg = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 5463,
        temperature: 0,
        system: `You are utterly fluent in both ${fromLang} and ${toLang}. You are assisting in translating from ${fromLang} into ${toLang}. 
    ${toneInstruction} ${detailInstruction} ${emotionInstruction}
    When the user gives a message in ${fromLang}, you immediately respond with the ${toLang} translation.

    Provide only the translation.`,
        messages: [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": text
                    }
                ]
            }
        ]
    });

    console.log('Translation obj:', msg);
    const translatedText = (msg.content[0] as Anthropic.Messages.TextBlock).text;
    console.log('Translated text:', translatedText);

    return translatedText;
}
