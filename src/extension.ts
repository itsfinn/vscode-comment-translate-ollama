import { ITranslateRegistry } from 'comment-translate-manager';
import * as vscode from 'vscode';
import { OllamaTranslate } from './ollamaTranslate';

export function activate(context: vscode.ExtensionContext) {
	
    console.log('Congratulations, your extension "comment-translate-ollama" is now active!')
	//Expose the plug-in
	return {
        extendTranslate: function (registry: ITranslateRegistry) {
            registry('ollama', OllamaTranslate);
        }
    };
}

// this method is called when your extension is deactivated
export function deactivate() {}
