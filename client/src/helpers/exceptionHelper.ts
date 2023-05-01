import { FileSystemException } from '../models/fileSystemException';
import { XpException } from '../models/xpException';
import { IncorrectFieldFillingException } from '../views/incorrectFieldFillingException';
import { ExtensionHelper } from './extensionHelper';

export class ExceptionHelper {
	public static async show(error: Error, userInfo?: string) {
		const errorType = error.constructor.name;

		switch(errorType)  {
			case XpException.name : 
			case FileSystemException.name : 
			case IncorrectFieldFillingException.name :  {
				const typedError = error as XpException;
				return ExtensionHelper.showNonCriticalError(typedError.message, error);
			}
			default: {
				if(userInfo) {
					return ExtensionHelper.showError(userInfo, error);
				}
				return ExtensionHelper.showError("Неожиданная ошибка, обратитесь к разработчикам.", error);
			}
		}
	}
}
