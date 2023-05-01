import * as vscode from 'vscode';
import { Configuration } from '../models/configuration';

export class ExtensionHelper {
	/**
	 * Получить путь к открытому файлу
	 * @returns путь к открытому файлу или undefined
	 */
	public static getOpenedFilePath() : string {
		const openedFilePath = vscode.window.activeTextEditor?.document?.fileName;
		return openedFilePath;
	}

	static showErrorAndThrowError(errorMessage:string) {
		vscode.window.showErrorMessage(errorMessage);
		throw new Error(errorMessage);
	}

	static showUserInfo(infoMessage:string) : Thenable<string> {
		return vscode.window.showInformationMessage(infoMessage);
	}

	static showWarning(message:string) {
		vscode.window.showWarningMessage(message);
	}

	static showUserError(infoMessage:string) : Thenable<string> {
		return vscode.window.showErrorMessage(infoMessage);
	}

	static showError(defaultMessage: string, error: Error) {

		ExtensionHelper.showNonCriticalError(defaultMessage, error);

		if(error.message || error.stack) {
			Configuration.get().getOutputChannel().show();
		}
	}

	static showNonCriticalError(userMessage: string, error: Error) {

		vscode.window.showErrorMessage(userMessage);

		const outputChannel = Configuration.get().getOutputChannel();

		if(error.message) {
			const message = `Message: ${error.message}`;
			outputChannel.appendLine(message);
			console.log(error.message);
		}

		if(error.stack) {
			const stack = `Stack Trace: ${error.stack}`;
			outputChannel.appendLine(stack);
			console.log(error.stack);
		}
	}
}