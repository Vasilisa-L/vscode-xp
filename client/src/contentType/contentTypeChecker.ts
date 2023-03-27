// import * as path from 'path';
// import { ContentType } from './contentType';

// export class ContentTypeChecker {

// 	public static getContentTypeBySubDirectories(subDirectories: string[]): ContentType | undefined {

// 		const EDRrequiredRootDirectories = EDRpathHelper.getRequiredRootDirectories().map(function(d) { 
// 			return d.split(path.sep)[0];
// 		}).filter((elem, index, self) => {
// 			return index === self.indexOf(elem);
// 		});

// 		const SIEMrequiredRootDirectories = SIEMpathHelper.getRequiredRootDirectories().map(function(d) { 
// 			return d.split(path.sep)[0];
// 		}).filter((elem, index, self) => {
// 			return index === self.indexOf(elem);
// 		});
		
// 		if (EDRrequiredRootDirectories.every(folder => subDirectories.includes(folder))) {
// 			return ContentType.EDR;
// 		}

// 		if (SIEMrequiredRootDirectories.every(folder => subDirectories.includes(folder))) {
// 			return ContentType.SIEM;
// 		}

// 		return undefined;
// 	}
// }