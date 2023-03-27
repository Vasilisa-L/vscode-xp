import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

import { Guid } from 'guid-typescript';
import { FileNotFoundException } from '../fileNotFounException';
import { XpException} from '../xpException';
import { ContentType } from '../../contentType/contentType';
import { Localization } from '../content/localization';
import { config } from '../../extension';

export enum OsType {
	Windows,
	Linux,
	Mac
}

export abstract class Configuration {

	public constructor(context: vscode.ExtensionContext) {

		this._context = context;
		this._kbFullPath =
			(vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
			? vscode.workspace.workspaceFolders[0].uri.fsPath
			: undefined;

		const contentType = this.getContentType();
		this.setContentType(contentType);

		const extentionName = this.getExtentionDisplayName();
		this._outputChannel = vscode.window.createOutputChannel(extentionName);

		this._diagnosticCollection = vscode.languages.createDiagnosticCollection(extentionName);
		context.subscriptions.push(this._diagnosticCollection);
	}

	// Специфика СЗИ
	public abstract getCorrulesGraphFilePath(rootFolder: string) : string;
	public abstract getRootByPath(directory: string): string;
	public abstract getTablesContract() : string;
	public abstract getContentRoots() : string[];
	public abstract getPackages() : string[];
	public abstract getRequiredRootDirectories(): string[];
	public abstract getAppendixPath() : string;
	public abstract getRulesDirFilters() : string;
	public abstract isKbOpened() : boolean;
	public abstract getOutputDirectoryPath() : string;

	protected abstract getOutputSpecificSubDirName(): string;


	protected checkKbPath() : void {
		if(!this._kbFullPath) {
			throw new XpException(`База знаний не открыта.`);
		}
	
		if(!fs.existsSync(this._kbFullPath)) {
			throw new FileNotFoundException(`Некорректный путь '${this._kbFullPath}'`, this._kbFullPath);
		}
	}

	public getKbFullPath() : string {
		return this._kbFullPath;
	}

	public setContentType(contentType: ContentType) {
		this._contentType = contentType;
		this._context.workspaceState.update("ContentType", contentType);
	}

	public getDiagnosticCollection() : vscode.DiagnosticCollection {
		return this._diagnosticCollection;
	}

	public getOutputChannel() : vscode.OutputChannel {
		return this._outputChannel;
	}

	public getExtentionMode() : vscode.ExtensionMode {
		return this._context.extensionMode;
	}

	public getContext() : vscode.ExtensionContext {
		return this._context;
	}

	public getExtentionUri() : vscode.Uri {
		return this._context.extensionUri;
	}

	public getExtentionPath() : string {
		return this._context.extensionPath;
	}

	public getExtentionDisplayName() : string {
		return "eXtraction and Processing";
	}

	public getOsType() : OsType {
		const osType = os.platform();
		switch(osType) {
			case "win32" : return OsType.Windows;
			case "linux" : return OsType.Linux;
			case "darwin" : return OsType.Mac;
			default: throw new Error("Платформа не поддеживается.");
		}
	}

	/**
	 * Возвращает путь к директории со всеми SDK утилитами.
	 * @returns путь к директории со всеми SDK утилитами.
	 */
	public getKbtBaseDirectory(): string {
		const configuration = vscode.workspace.getConfiguration("xpConfig");
		const basePath = configuration.get<string>("kbtBaseDirectory");
		this.checkKbtToolPath("KBT", basePath);

		return basePath;
	}

	/**
	 * Возвращает внутреннее имя расширения.
	 * @returns внутреннее имя расширения.
	 */
	public getExtentionSettingsPrefix() : string {
		// TODO: обновить после переименования
		return "siem";
	}

	public getResoucesUri() : vscode.Uri {
		const templatesUri = vscode.Uri.joinPath(this.getExtentionUri(), "templates");
		return templatesUri;
	}

	public getContentType(): ContentType {
		const contentTypeString = this._context.workspaceState.get<string>("ContentType");
		const contentType : ContentType = ContentType[contentTypeString];
		return contentType;
	}

	public getSiemjPath() : string {
		const osType = this.getOsType();
		
		let appName = "";
		switch(osType) {
			case OsType.Windows: appName = "siemj.exe"; break;
			case OsType.Linux: appName = "siemj"; break;

			default: throw new XpException("Платформа не поддерживается.");
		}

		let fullPath = path.join(this.getKbtBaseDirectory(), "extra-tools", "siemj", appName);
		this.checkKbtToolPath(appName, fullPath);

		return fullPath;
	}

	public getRccCli() : string {
		let appName = "";
		switch(this.getOsType()) {
			case OsType.Windows: appName = "rcc.exe"; break;
			case OsType.Linux: appName = "rcc"; break;

			default: throw new XpException("Платформа не поддерживается.");
		}

		const fullPath = path.join(this.getKbtBaseDirectory(), "xp-sdk", "cli", appName);
		this.checkKbtToolPath(appName, fullPath);

		return fullPath;
	}

	public getMkTablesPath() : string {
		let appName = "";
		switch(this.getOsType()) {
			case OsType.Windows: appName = "mktables.exe"; break;
			case OsType.Linux: appName = "mktables"; break;

			default: throw new XpException("Платформа не поддерживается.");
		}

		const fullPath = path.join(this.getKbtBaseDirectory(), "build-tools", appName);
		this.checkKbtToolPath(appName, fullPath);

		return fullPath;
	}

	public getFPTAFillerPath() : string {
		let appName = "";
		switch(this.getOsType()) {
			case OsType.Windows: appName = "fpta_filler.exe"; break;
			case OsType.Linux: appName = "fpta_filler"; break;

			default: throw new XpException("Платформа не поддерживается.");
		}

		const fullPath = path.join(this.getKbtBaseDirectory(), "xp-sdk", appName);
		this.checkKbtToolPath(appName, appName);

		return fullPath;
	}

	public getLocalizationBuilder() : string {
		let appName = "";
		switch(this.getOsType()) {
			case OsType.Windows: appName = "build_l10n_rules.exe"; break;
			case OsType.Linux: appName = "build_l10n_rules"; break;
			
			default: throw new XpException("Платформа не поддерживается.");
		}

		const fullPath = path.join(this.getKbtBaseDirectory(), "build-tools", appName);
		this.checkKbtToolPath(appName, fullPath);

		return fullPath;
	}

	public getSiemKBTests() : string {
		let appName = "";
		switch(this.getOsType()) {
			case OsType.Windows: appName = "siemkb_tests.exe"; break;
			case OsType.Linux: appName = "siemkb_tests"; break;

			default: throw new XpException("Платформа не поддерживается.");
		}

		const fullPath = path.join(this.getKbtBaseDirectory(), "build-tools", appName);
		this.checkKbtToolPath(appName, fullPath);

		return fullPath;
	}

	public getNormalizerCli() : string {
		let appName = "";
		switch(this.getOsType()) {
			case OsType.Windows: appName = "normalizer-cli.exe"; break;
			case OsType.Linux: appName = "normalizer-cli"; break;

			default: throw new XpException("Платформа не поддеживается.");
		}

		const fullPath = path.join(this.getKbtBaseDirectory(), "xp-sdk", "cli", appName);
		this.checkKbtToolPath(appName, fullPath);

		return fullPath;
	}

	public getKbPackFullPath() : string {
		let appName = "";
		switch(this.getOsType()) {
			case OsType.Windows: appName = "kbpack.exe"; break;
			case OsType.Linux: appName = "kbpack"; break;

			default: throw new XpException("Платформа не поддеживается.");
		}

		const fullPath = path.join(this.getKbtBaseDirectory(), "extra-tools", "kbpack", appName);
		this.checkKbtToolPath(appName, fullPath);

		return fullPath;
	}

	public getEcatestFullPath() : string {
		let appName = "";
		switch(this.getOsType()) {
			case OsType.Windows: appName = "ecatest.exe"; break;
			case OsType.Linux: appName = "ecatest"; break;

			default: throw new XpException("Платформа не поддеживается.");
		}

		const fullPath = path.join(this.getKbtBaseDirectory(), "build-tools", appName);
		this.checkKbtToolPath(appName, fullPath);

		return fullPath;
	}

	public getCorrelationDefaultsFilePath() : string {
		return path.join(this.getOutputDirectoryPath(), "correlation_defaults.json");
	}

	public getSchemaFullPath() : string {
		return path.join(this.getOutputDirectoryPath(), "schema.json");
	}

	public getNormEventsFilePath() : string {
		return path.join(this.getOutputDirectoryPath(), "norm_events.json");
	}

	public getEnrichEventsFilePath() : string {
		return path.join(this.getOutputDirectoryPath(), "enrich_events.json");
	}

	public getCorrEventsFilePath() : string {
		return path.join(this.getOutputDirectoryPath(), "corr_events.json");
	}

	public getNormGraphFilePath() : string {
		return path.join(
			this.getOutputDirectoryPath(),
			this.getOutputSpecificSubDirName(),
			"formulas_graph.json"
		);
	}

	public getEnrulesGraphFilePath() : string {
		return path.join(
			this.getOutputDirectoryPath(), 
			this.getOutputSpecificSubDirName(),
			"enrules_graph.json"
		);
	}

	public getFptaDbFilePath() : string {
		return path.join(this.getOutputDirectoryPath(), "fpta_db.db");
	}

	public getTmpDirectoryPath() : string {
		return path.join(this.getOutputDirectoryPath(), "temp");
	}

	public getTmpSiemjConfigPath() : string {
		return path.join(this.getTmpDirectoryPath(), "siemj.conf");
	}

	public getRandTmpSubDirectoryPath() : string {
		return path.join(this.getTmpDirectoryPath(), Guid.create().toString());
	}


	public getSiemSdkDirectoryPath() : string {
		const dirName = "xp-sdk";
		const fullPath = path.join(this.getKbtBaseDirectory(), dirName);
		this.checkKbtToolPath(dirName, fullPath);

		return fullPath;
	}

	public getBuildToolsDirectoryFullPath() : string {
		const dirName = "build-tools";
		const fullPath = path.join(this.getKbtBaseDirectory(), dirName);
		this.checkKbtToolPath(dirName, fullPath);

		return fullPath;
	}

	/**
	 * Возвращает путь к файлу описания таксономии. 
	 * @returns путь к файлу описания таксономии.
	 */
	public getTaxonomyFullPath() : string {
		const taxonomyFileName = "taxonomy.json";
		const fullPath = path.join(this.getKbtBaseDirectory(), "knowledgebase", "contracts", "taxonomy", taxonomyFileName);
		this.checkKbtToolPath(taxonomyFileName, fullPath);
		
		return fullPath;
	}

	/**
	 * Возращает путь к директории с таксономией. 
	 * @returns путь к директории с таксономией.
	 */
	public getTaxonomyDirPath() : string {
		const taxonomyDirName = "taxonomy";
		const fullPath = path.join(this.getKbtBaseDirectory(), "knowledgebase", "contracts", taxonomyDirName);
		this.checkKbtToolPath(taxonomyDirName, fullPath);
		
		return fullPath;
	}

	/**
	 * Префикс ObjectId, определяющий тип создаваемого контента.
	 * @returns префикс создаваемого контента.
	 */
	public getContentPrefix() : string {
		const configuration = vscode.workspace.getConfiguration("xpConfig");
		const taxonomyFullPath = configuration.get<string>("contentPrefix");
		return taxonomyFullPath;
	}

	/**
	 * Возвращает путь к файлу русской локализации таксономии. 
	 * @returns путь к файлу русской локализации таксономии.
	 */
	public getTaxonomyRuLocalizationFullPath() : string {
		const taxonomyFullPath = this.getTaxonomyFullPath();

		const taxonomyDirectoryPath = path.dirname(taxonomyFullPath);
		const ruLocalizationFilePath = path.join(
			taxonomyDirectoryPath, 
			Localization.LOCALIZATIONS_DIRNAME, 
			Localization.RU_LOCALIZATION_FILENAME);
			
		return ruLocalizationFilePath;
	}

	private checkKbtToolPath(name : string, fullPath : string) : void {
		if (!fullPath || fullPath === ""){
			throw new FileNotFoundException(
				`Путь к '${name}' не найден. Проверьте [настройки](command:workbench.action.openSettings?["xpConfig.kbtBaseDirectory"])`,
				 fullPath);
		}

		if (!fs.existsSync(fullPath)){
			throw new FileNotFoundException(
				`Путь к ${fullPath} не найден. Проверьте [настройки](command:workbench.action.openSettings?["xpConfig.kbtBaseDirectory"])`,
				 fullPath);
		}
	}

	public static get() {
		if(!config) {
			throw new XpException("Конфигурация расширения не получена. Возможно, она не была инициализирована.");
		}
        return config;
    }

	private _kbFullPath: string;

	private _contentType: ContentType;

	private _outputChannel : vscode.OutputChannel;

	private _context: vscode.ExtensionContext;

	private _diagnosticCollection: vscode.DiagnosticCollection;
}