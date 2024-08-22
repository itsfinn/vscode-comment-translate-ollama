
import axios from 'axios';
import { workspace } from 'vscode';
import { ITranslate, ITranslateOptions } from 'comment-translate-manager';

const PREFIXCONFIG = 'chatgptTranslate';

const langMaps: Map<string, string> = new Map([
    ['zh-CN', 'ZH'],
    ['zh-TW', 'ZH'],
]);
// 你好吗

function convertLang(src: string) {
    if (langMaps.has(src)) {
        return langMaps.get(src);
    }
    return src.toLocaleUpperCase();
}

export function getConfig<T>(key: string): T | undefined {
    let configuration = workspace.getConfiguration(PREFIXCONFIG);
    return configuration.get<T>(key);
}



interface ChatGPTTranslateOption {
    authKey?: string;
}

export class ChatGPTTranslate implements ITranslate {
    get maxLen(): number {
        return 3000;
    }

    private _defaultOption: ChatGPTTranslateOption;
    constructor() {
        this._defaultOption = this.createOption();
        workspace.onDidChangeConfiguration(async eventNames => {
            if (eventNames.affectsConfiguration(PREFIXCONFIG)) {
                this._defaultOption = this.createOption();
            }
        });
    }

    createOption() {
        const defaultOption:ChatGPTTranslateOption = {
            authKey: getConfig<string>('authKey'),
        };
        return defaultOption;
    }

    async translate(content: string, { to = 'auto' }: ITranslateOptions) {

        const url = `http://localhost:11434/api/chat`;

        if(!this._defaultOption.authKey) {
            throw new Error('Please check the configuration of authKey!');
        }
        let systemPrompt = "你是一个程序代码注释翻译引擎，请在保留原始段落格式的情况下翻译文本，注意识别并保留段落中的专有名词，缩写和术语以及特定的概念或表达";
        let userPrompt = `将以下英文翻译为简体中文`;
        userPrompt = `${userPrompt}:\n\n"${content}" =>`;
        const body = {
            // model: 'gpt-3.5-turbo',
            temperature: 0,
            max_tokens: 1000,
            top_p: 1,
            frequency_penalty: 1,
            presence_penalty: 1,
            messages:[
                {
                    role: "system",
                    content: systemPrompt,
                },
                { role: "user", content: userPrompt },
            ]
        };
        
        const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this._defaultOption.authKey}`,
        };

        let res = await axios.post(url,body,{
            headers
        });
        const { choices } = res.data;
        let targetTxt = choices[0].message.content.trim();
        if (targetTxt.startsWith('"') || targetTxt.startsWith("「")) {
            targetTxt = targetTxt.slice(1);
        }
        if (targetTxt.endsWith('"') || targetTxt.endsWith("」")) {
            targetTxt = targetTxt.slice(0, -1);
        }
        return targetTxt.split("\n");
    }


    link(content: string, { to = 'auto' }: ITranslateOptions) {
        let str = `http://localhost:11434/api/chat`;
        return `[ChatGPT](${str})`;
    }

    isSupported(src: string) {
        return true;
    }
}





