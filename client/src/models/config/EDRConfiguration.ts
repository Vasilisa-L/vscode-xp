import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { Configuration } from './configuration'
import { XpException } from '../xpException';

export class EDRConfiguration extends Configuration {
	
	public getOutputDirectoryPath(): string {
		throw new Error('Method not implemented.');
	}

	constructor(context : vscode.ExtensionContext) {
		super(context);
	}

	public getOutputSpecificSubDirName(): string {
		throw new XpException('Method not implemented.');
	}

	public getRootByPath(directory: string): string{
		if (!directory){
			return "";
		}
		const pathEntities = directory.split(path.sep);
		const roots = this.getContentRoots().map(folder => {return path.basename(folder);});
		for (const root of roots){
			const  packagesDirectoryIndex = pathEntities.findIndex( pe => pe.toLocaleLowerCase() === root);
			if(packagesDirectoryIndex === -1){
				continue;
			}

			// Удаляем лишние элементы пути и собираем результирующий путь.
			pathEntities.splice(packagesDirectoryIndex + 1);
			const packageDirectoryPath = pathEntities.join(path.sep);
			return packageDirectoryPath;
		}

		throw new Error(`Путь '${directory}' не содержит ни одну из корневых директорий: [${roots.join(", ")}].`);
	}
	
	public getCorrulesGraphFilePath() : string {
		return path.join(
			this.getOutputDirectoryPath(),
			"rules_graph.json");
	}


	// В корневой директории лежат пакеты экспертизы
	public getContentRoots() : string[] {

		this.checkKbPath();
		const basePath = path.join(this.getKbFullPath(), "rules");

		let rootDirectories = [];
		if (fs.existsSync(basePath)){		
			rootDirectories = rootDirectories.concat(fs.readdirSync(basePath, { withFileTypes: true })
				.filter(dir => dir.isDirectory())
				.map(dir => path.join(basePath, dir.name)));
		}
		return rootDirectories;
	}

	public getPackages() : string[] {
		const contentRoots = this.getContentRoots();
		const packagesDirectories = [];
		
		for(const root in contentRoots){
			packagesDirectories.concat(fs.readdirSync(root, { withFileTypes: true })
			.filter(dir => dir.isDirectory())
			.map(dir => dir.name));
		}		
		return packagesDirectories;
	}

	public getRequiredRootDirectories(): string[] {
		return [
			path.join("common", "rules_filters"),
			path.join('rules', "windows"),
			path.join('rules', "linux")
		];
	}

	public getAppendixPath() : string {
		this.checkKbPath();
		const relative_path = path.join(this._prefix, "contracts", "xp_appendix", "appendix.xp");
		return path.join(this.getKbFullPath(), relative_path);
	}

	public getTablesContract() : string {
		this.checkKbPath();
		const relative_path = path.join(this._prefix, "_extra", "tabular_lists", "tables_contract.yaml");
		return path.join(this.getKbFullPath(), relative_path);
	}

	public getRulesDirFilters() : string {
		this.checkKbPath();
		const relative_path = path.join(this._prefix, "common", "rules_filters");
		return path.join(this.getKbFullPath(), relative_path);
	}

	public isKbOpened() : boolean {
		const requredFolders = this.getContentRoots();
		requredFolders.concat(this.getRulesDirFilters());
		for (const folder of requredFolders){
			if (!fs.existsSync(folder)){
				return false;
			}
		}
		return true;
	}

	private _prefix = path.join("resources", "build-resources");
}