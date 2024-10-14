type VoiceOption = {
    id: string;
    gender: 'male' | 'female';
    tone: string;
};

type LanguageOptions = {
    name: string;
    code: string;
    voiceOptions: VoiceOption[];
};

type Languages = {
    [key: string]: LanguageOptions;
};



export const voices: Languages = {
    'en': {
        name: 'English',
        code: 'en',
        voiceOptions: [
            {
                id: '41534e16-2966-4c6b-9670-111411def906',
                gender: 'male',
                tone: 'energetic',
            },
            {
                id: '79a125e8-cd45-4c13-8a67-188112f4dd22',
                gender: 'female',
                tone: 'elegant',
            },
        ]
    },
    'fr': {
        name: 'French',
        code: 'fr',
        voiceOptions: [
            {
                id: 'a249eaff-1e96-4d2c-b23b-12efa4f66f41',
                gender: 'female',
                tone: 'conversational',
            },
            {
                id: 'ab7c61f5-3daa-47dd-a23b-4ac0aac5f5c3',
                gender: 'male',
                tone: 'friendly',
            }
        ]
    },
    'de': {
        name: 'German',
        code: 'de',
        voiceOptions: [
            {
                id: 'fb9fcab6-aba5-49ec-8d7e-3f1100296dde',
                gender: 'male',
                tone: 'neutral',
            },
            {
                id: '3f4ade23-6eb4-4279-ab05-6a144947c4d5',
                gender: 'female',
                tone: 'neutral',
            },
        ]
    },
    'es': {
        name: 'Spanish',
        code: 'es',
        voiceOptions: [
            {
                id: 'db832ebd-3cb6-42e7-9d47-912b425adbaa',
                gender: 'female',
                tone: 'neutral',
            },
            {
                id: '15d0c2e2-8d29-44c3-be23-d585d5f154a1',
                gender: 'male',
                tone: 'neutral',
            }
        ]
    },
    'pt': {
        name: 'Portuguese',
        code: 'pt',
        voiceOptions: [
            {
                id: '700d1ee3-a641-4018-ba6e-899dcadc9e2b',
                gender: 'female',
                tone: 'neutral',
            },
            {
                id: '6a16c1f4-462b-44de-998d-ccdaa4125a0a',
                gender: 'male',
                tone: 'neutral',
            }
        ]
    },
    'zh': {
        name: 'Mandarin',
        code: 'zh',
        voiceOptions: [
            {
                id: 'e90c6678-f0d3-4767-9883-5d0ecf5894a8',
                gender: 'female',
                tone: 'neutral',
            },
            {
                id: 'eda5bbff-1ff1-4886-8ef1-4e69a77640a0',
                gender: 'male',
                tone: 'neutral',
            }
        ]
    },
    'ja': {
        name: 'Japanese',
        code: 'ja',
        voiceOptions: [
            {
                id: '2b568345-1d48-4047-b25f-7baccf842eb0',
                gender: 'female',
                tone: 'neutral',
            },
            {
                id: 'e8a863c6-22c7-4671-86ca-91cacffc038d',
                gender: 'male',
                tone: 'neutral',
            }
        ]
    },
    'hi': {
        name: 'Hindi',
        code: 'hi',
        voiceOptions: [
            {
                id: '95d51f79-c397-46f9-b49a-23763d3eaa2d',
                gender: 'female',
                tone: 'neutral',
            },
            {
                id: 'ac7ee4fa-25db-420d-bfff-f590d740aeb2',
                gender: 'male',
                tone: 'neutral',
            }
        ]
    },
    'it': {
        name: 'Italian',
        code: 'it',
        voiceOptions: [
            {
                id: '0e21713a-5e9a-428a-bed4-90d410b87f13',
                gender: 'female',
                tone: 'neutral',
            },
            {
                id: '408daed0-c597-4c27-aae8-fa0497d644bf',
                gender: 'male',
                tone: 'neutral',
            }
        ]
    },
    'ko': {
        name: 'Korean',
        code: 'ko',
        voiceOptions: [
            {
                id: '29e5f8b4-b953-4160-848f-40fae182235b',
                gender: 'female',
                tone: 'neutral',
            },
            {
                id: '57dba6ff-fe3b-479d-836e-06f5a61cb5de',
                gender: 'male',
                tone: 'neutral',
            }
        ]
    },
    'nl': {
        name: 'Dutch',
        code: 'nl',
        voiceOptions: [
            {
                id: '9e8db62d-056f-47f3-b3b6-1b05767f9176',
                gender: 'female',
                tone: 'neutral',
            },
            {
                id: '4aa74047-d005-4463-ba2e-a0d9b261fb87',
                gender: 'male',
                tone: 'neutral',
            }
        ]
    },
    'pl': {
        name: 'Polish',
        code: 'pl',
        voiceOptions: [
            {
                id: '575a5d29-1fdc-4d4e-9afa-5a9a71759864',
                gender: 'female',
                tone: 'neutral',
            },
            {
                id: '82a7fc13-2927-4e42-9b8a-bb1f9e506521',
                gender: 'male',
                tone: 'neutral',
            }
        ]
    },
    'ru': {
        name: 'Russian',
        code: 'ru',
        voiceOptions: [
            {
                id: '779673f3-895f-4935-b6b5-b031dc78b319',
                gender: 'female',
                tone: 'neutral',
            },
            {
                id: '2b3bb17d-26b9-421f-b8ca-1dd92332279f',
                gender: 'male',
                tone: 'neutral',
            }
        ]
    },
    'sv': {
        name: 'Swedish',
        code: 'sv',
        voiceOptions: [
            {
                id: 'f852eb8d-a177-48cd-bf63-7e4dcab61a36',
                gender: 'female',
                tone: 'neutral',
            },
            {
                id: '38a146c3-69d7-40ad-aada-76d5a2621758',
                gender: 'male',
                tone: 'neutral',
            }
        ]
    },
    'tr': {
        name: 'Turkish',
        code: 'tr',
        voiceOptions: [
            {
                id: '39f753ef-b0eb-41cd-aa53-2f3c284f948f',
                gender: 'female',
                tone: 'neutral',
            },
            {
                id: '5a31e4fb-f823-4359-aa91-82c0ae9a991c',
                gender: 'male',
                tone: 'neutral',
            }
        ]
    },
}