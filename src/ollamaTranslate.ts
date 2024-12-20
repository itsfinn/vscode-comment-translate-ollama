
import axios from 'axios';
import { workspace } from 'vscode';
import { ITranslate, ITranslateOptions } from 'comment-translate-manager';

const PREFIXCONFIG = 'ollamaTranslate';

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



interface OllamaTranslateOption {
}

export class OllamaTranslate implements ITranslate {
    get maxLen(): number {
        console.log("maxLen")
        return 3000;
    }

    private _defaultOption: OllamaTranslateOption;
    constructor() {
        console.log("constructor")
        this._defaultOption = this.createOption();
        workspace.onDidChangeConfiguration(async eventNames => {
            if (eventNames.affectsConfiguration(PREFIXCONFIG)) {
                this._defaultOption = this.createOption();
            }
        });
    }

    createOption() {
        console.log("createOption")
        const defaultOption:OllamaTranslateOption = {        };
        return defaultOption;
    }

    async translate(content: string, { to = 'auto' }: ITranslateOptions) {

        console.log("translate start")
        const url = `http://localhost:11434/api/chat`;

        let systemPrompt = "你是一个程序代码注释翻译引擎，请在保留原始段落格式的情况下翻译文本，注意识别并保留段落中的专有名词，缩写和术语以及特定的概念或表达";
        let userPrompt = `将以下英文翻译为简体中文`;
        userPrompt = `${userPrompt}:\n\n"${content}" =>`;
        const body = {
            stream: false,
            model: "llama3.1",
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
        };

        let res = await axios.post(url,body,{
            headers
        });
        console.log("res: ", res)
        // const { choices } = res.data;
        // console.log("res.data: ", res.data)
        let targetTxt = res.data.message.content.trim();
        console.log("targetTxt: ", targetTxt)
        if (targetTxt.startsWith('"') || targetTxt.startsWith("「")) {
            targetTxt = targetTxt.slice(1);
        }
        if (targetTxt.endsWith('"') || targetTxt.endsWith("」")) {
            targetTxt = targetTxt.slice(0, -1);
        }
        return targetTxt.split("\n");
    }


    link(content: string, { to = 'auto' }: ITranslateOptions) {
        console.log("link")
        let str = `http://localhost:11434/api/chat`;
        return `[ChatGPT](${str})`;
    }

    isSupported(src: string) {
        console.log("isSupported")
        return true;
    }
}





