import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { Configuration } from './configuration'
import { FileNotFoundException } from '../fileNotFounException';

export class SIEMConfiguration extends Configuration {

	constructor(context : vscode.ExtensionContext) {
		super(context);
	}

	public getOutputDirectoryPath() : string {
		const extensionSettings = vscode.workspace.getConfiguration("xpConfig");
		const outputDirectoryPath = extensionSettings.get<string>("outputDirectoryPath");

		if (!outputDirectoryPath || outputDirectoryPath === ""){
			throw new FileNotFoundException(
				`Выходная директория не задана. Задайте путь к [ней](command:workbench.action.openSettings?["xpConfig.outputDirectoryPath"])`,
				outputDirectoryPath);
		}

		if (!fs.existsSync(outputDirectoryPath)){
			throw new FileNotFoundException(
				`Выходная директория не найдена по пути ${outputDirectoryPath}. Проверьте путь к [ней](command:workbench.action.openSettings?["xpConfig.outputDirectoryPath"])`,
				outputDirectoryPath);
		}

		return path.join(
			outputDirectoryPath,
			this.getOutputSpecificSubDirName()
		);
	}

	public getNormGraphFilePath() : string {
		return path.join(
			this.getOutputDirectoryPath(), 
			"formulas_graph.json"
		);
	}

	public getEnrulesGraphFilePath() : string {
		return path.join(
			this.getOutputDirectoryPath(), 
			"enrules_graph.json"
		);
	}

	public getRootByPath(directory: string): string {
		if (!directory){
			return "";
		}

		const pathEntities = directory.split(path.sep);
		const roots = this.getContentRoots().map(folder => {return path.basename(folder);});
		for (const root of roots) {
			const  packagesDirectoryIndex = pathEntities.findIndex( pe => pe.toLocaleLowerCase() === root);
			if(packagesDirectoryIndex === -1) {
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
			"corrules_graph.json"
		);
	}

	// В корневой директории лежат пакеты экспертизы
	public getContentRoots() : string[] {
		this.checkKbPath();
		return [
			path.join(
				this.getKbFullPath(), 
				this.getOutputSpecificSubDirName()
			)
		];
	}

	public getOutputSpecificSubDirName(): string {
		return "packages";
	}

	public getPackages() : string[]{
		const contentRoots = this.getContentRoots();
		const packagesDirectories = [];
		for(const root in contentRoots){
			packagesDirectories.concat(fs.readdirSync(root, { withFileTypes: true })
			.filter(dir => dir.isDirectory())
			.map(dir => dir.name));
		}		
		return packagesDirectories;
	}

	public getRequiredRootDirectories(): string[]{
		return [
			path.join("common", "rules_filters"),
			this.getOutputSpecificSubDirName()
		];
	}

	public getTablesContract() : string {
		const relative_path = path.join("knowledgebase", "contracts", "tabular_lists", "tables_contract.yaml");
		return path.join(this.getKbtBaseDirectory(), relative_path);
	}

	public getAppendixPath() : string {
		this.checkKbPath();
		const relative_path = path.join("knowledgebase", "contracts", "xp_appendix", "appendix.xp");
		return path.join(this.getKbtBaseDirectory(), relative_path);
	}

	public getRulesDirFilters() : string {
		this.checkKbPath();
		const relative_path = path.join("common", "rules_filters");
		return path.join(this.getKbFullPath(), relative_path);
	}

	public isKbOpened() : boolean {
		const requredFolders = this.getContentRoots();
		requredFolders.concat(this.getRulesDirFilters());
		
		for (const folder of requredFolders) {
			if (!fs.existsSync(folder)) {
				return false;
			}
		}
		return true;
	}
}