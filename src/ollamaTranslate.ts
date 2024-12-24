
import axios from 'axios';
import * as vscode from 'vscode';
import { ITranslate, ITranslateOptions } from 'comment-translate-manager';

const PREFIXCONFIG = 'vscode-comment-translate-ollama';

const langMaps: Map<string, string> = new Map([
    ['zh-CN', 'ZH'],
    ['zh-TW', 'ZH'],
]);

function convertLang(src: string) {
    if (langMaps.has(src)) {
        return langMaps.get(src);
    }
    return src.toLocaleUpperCase();
}


interface OllamaTranslateOption {
    systemPrompt: string;
    userPrompt: string;
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
        vscode.workspace.onDidChangeConfiguration(async eventNames => {
            if (eventNames.affectsConfiguration(PREFIXCONFIG)) {
                console.log("updateOption: ", this._defaultOption)
                this._defaultOption = this.createOption();
            }
        });
    }

    createOption() {
        console.log("createOption")
        const defaultOption: OllamaTranslateOption = {
            systemPrompt: "你是一个程序代码注释翻译引擎。代码文件包含了多种编程语言编写的代码，其中涉及到 Golang、Rust、C 以及 Node.js 等语言。无论是单行注释（例如在 Golang 中以//开头、C 语言中以//或/* */包裹等形式），还是多行注释（像在 Rust 里/* */形式等），都请准确识别并翻译成符合中文表达习惯、语义清晰的内容，同时要保留原注释在代码中的位置以及相应的格式，确保翻译后的代码依然能够正常被相应的编译器或解释器识别并运行，尽量贴合代码上下文准确翻译每一条注释的含义。",
            userPrompt: "请将以下代码中的注释翻译为中文",
        };
        return defaultOption;
    }

    async translate(content: string, { to = 'auto' }: ITranslateOptions) {

        console.log("translate start")
        const url = `http://localhost:11434/api/chat`;

        let userPrompt =  this._defaultOption.userPrompt;
        let systemPrompt = this._defaultOption.systemPrompt;

        let prompt = `${userPrompt}:\n\n"${content}" =>`;
        const body = {
            stream: false,
            model: "llama3.1",
            temperature: 0,
            max_tokens: 1000,
            top_p: 1,
            frequency_penalty: 1,
            presence_penalty: 1,
            messages: [
                {
                    role: "system",
                    content: systemPrompt,
                },
                { role: "user", content: prompt },
            ]
        };

        const headers = {
            "Content-Type": "application/json",
        };

        let res = await axios.post(url, body, {
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
        return `[Ollama](${str})`;
    }

    isSupported(src: string) {
        console.log("isSupported")
        return true;
    }
}





