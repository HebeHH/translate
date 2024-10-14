import Anthropic from "@anthropic-ai/sdk";
import { TranslationInfo } from "../utils/types";


export async function explainText(original: string, translated: string, fromLang: string, toLang: string, ANTHROPIC_API_KEY: string): Promise<TranslationInfo> {


    const anthropic = new Anthropic({
        apiKey: ANTHROPIC_API_KEY,
        dangerouslyAllowBrowser: true
    });


    const msg = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 5463,
        temperature: 0.1,
        system: `You're fluent in ${fromLang} and ${toLang}. You help check translations, and explain the vagaries of language.
        
        People come to you with original text and their translation. You tell them whether the translation is accurate, whether there's any idioms in the original text which can be hard to translate, and if there's anything missing in the tone. There may have been mistranscriptions in the original text, so note that under possibleMistranslations if something seems nonsensical.
        
        
        \`\`\`typescript
        type SegmentExplainer = {
        originalTextString: string; // verbatim the substring of the original text this references
        translatedTextString: string;
        additionalDetails: string; // the additional information you want to add. Provided in ${toLang}.
        }
        
        type TranslationInfo = {
        accurate: boolean; // whether the translation is accurate
        possibleMistranslations: false | SegmentExplainer[]; // whether any translatons could be improved
        idioms: false | SegmentExplainer[]; // whether there's any idioms, and if so, what
        tone: string; // Quick description of the tone of the original string. Provided in ${toLang}.
        }
        \`\`\`
        
        You respond with an object of type TranslationInfo, given above. Make sure you give correct json, using ", and closing brackets properly. Don't be afraid to say there's no mistranslations or idioms!`,
        messages: [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": `Original text: ${original}
                        
                        Translated text: ${translated}`
                    }
                ]
            },
            {
                "role": "assistant",
                "content": [
                    {
                        "type": "text",
                        "text": "{"
                    }
                ]
            }
        ]
    });
    console.log('Translation obj:', msg);
    const details = '{' + (msg.content[0] as Anthropic.Messages.TextBlock).text;
    console.log('Translated text:', details);
    let detailObj: TranslationInfo;
    try {
        detailObj = JSON.parse(details);
    } catch (e) {
        console.error('Error parsing details:', e);
        detailObj = {
            accurate: false,
            possibleMistranslations: false,
            idioms: false,
            tone: "Error parsing details, please retry.",
        };
    }

    return detailObj;
}

