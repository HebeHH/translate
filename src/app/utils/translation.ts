// app/utils/translation.ts
import Anthropic from "@anthropic-ai/sdk";
import { Options } from "./types";



export async function translateText(text: string, fromLang: string, toLang: string, fromOptions: Options, fromGender: 'male' | 'female', toGender: 'male' | 'female', ANTHROPIC_API_KEY: string): Promise<string> {

    const anthropic = new Anthropic({
        apiKey: ANTHROPIC_API_KEY,
        dangerouslyAllowBrowser: true
    });

    const toneInstruction = fromOptions.tone < 0 ? "Be casual - this is a friendly conversation" : fromOptions.tone > 0 ? "Be very respectful. The speaker is talking to somebody they look up to, like a professor or a mother-in-law. Ensure that your translation conveys their sincere politeness and avoids misunderstandings." : "";
    const detailInstruction = fromOptions.detail < 0 ? "Be concise." : fromOptions.detail > 0 ? "Convey the meaning fully, using as many words as needed to get the general feeling across." : "";
    const emotionInstruction = fromOptions.emotion < 0 ? "The speaker is feeling warm and positive." : fromOptions.emotion > 0 ? "The speaker is feeling negative and upset." : "";
    const genderInstruction = `The speaker is ${fromGender}, and the listener is ${toGender}.`;

    const msg = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 5463,
        temperature: 0,
        system: `You are utterly fluent in both ${fromLang} and ${toLang}. You are assisting in translating from ${fromLang} into ${toLang}. ${genderInstruction}

        There may be errors in the transcription, so if something sounds nonsensical, go with the common-sense version. Use punctuation freely to make the translation more readable and split it into bite sized chunks.
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
