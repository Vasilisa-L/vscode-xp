import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import { FileSystemHelper } from '../../helpers/fileSystemHelper';
import { ExtensionHelper } from '../../helpers/extensionHelper';
import { Correlation } from '../../models/content/correlation';
import { ContentFolder, ContentFolderType } from '../../models/content/сontentFolder';
import { Enrichment } from '../../models/content/enrichment';
import { Table } from '../../models/content/table';
import { Normalization } from '../../models/content/normalization';
import { Aggregation } from '../../models/content/aggregation';
import { Macros } from '../../models/content/macros';
import { RuleBaseItem } from '../../models/content/ruleBaseItem';
import { VsCodeApiHelper } from '../../helpers/vsCodeApiHelper';
import { API, APIState } from '../../@types/vscode.git';
import { Configuration } from '../../models/config/configuration';
import { OpenKnowledgebaseCommand } from './commands/openKnowledgebaseCommand';
import { ModularTestsListViewProvider } from '../modularTestsEditor/modularTestsListViewProvider';
import { CreateRuleViewProvider } from '../createRule/createRuleViewProvider';
import { CreateSubFolderCommand } from './commands/сreateSubFolderCommand';
import { RenameTreeItemCommand } from './commands/renameTreeItemCommand';
import { DeleteContentItemCommand } from './commands/deleteContentItemCommand';
import { CreatePackageCommand } from './commands/createPackageCommand';
import { SiemJOutputParser } from '../integrationTests/siemJOutputParser';
import { BuildAllGraphsAction } from './actions/buildAllGraphsAction';
import { PackKbPackageAction } from './actions/packKbPackageAction';
import { UnpackKbPackageAction } from './actions/unpackKbPackageAction';
import { ContentType } from '../../contentType/contentType';
import { SetContentTypeCommand } from '../../contentType/setContentTypeCommand';
import { GitHooks } from './gitHooks';
import { InitKBRootCommand } from './commands/InitKBRootCommand';

export class ContentTreeProvider implements vscode.TreeDataProvider<ContentFolder|RuleBaseItem> {

	static async init(
		config: Configuration,
		knowledgebaseDirectoryPath: string) {

		const context = config.getContext();
		const gitApi = await VsCodeApiHelper.getScmGitApiCore();

		const gitHooks = new GitHooks(gitApi, config);
		const kbTreeProvider = new ContentTreeProvider(knowledgebaseDirectoryPath, gitApi, config);

		// Обновляем дерево при смене текущей ветки.
		gitApi.onDidOpenRepository( (r) => {
			r.state.onDidChange( (e) => {
				gitHooks.update();
				kbTreeProvider.refresh();
			});
		});
	
		const kbTree = vscode.window.createTreeView(
			ContentTreeProvider.KnowledgebaseTreeId, {
				treeDataProvider: kbTreeProvider,
			}
		);
	
		vscode.window.registerTreeDataProvider(ContentTreeProvider.KnowledgebaseTreeId, kbTreeProvider);
	
		// Ручное или автоматическое обновление дерева контента
		vscode.commands.registerCommand(
			ContentTreeProvider.refreshTreeCommmand,
			async () => {
				kbTreeProvider.refresh();
			}
		);
	
		const openKnowledgebaseCommand = new OpenKnowledgebaseCommand();
		context.subscriptions.push(
			vscode.commands.registerCommand(
				OpenKnowledgebaseCommand.openKnowledgebaseCommand,
				() => { openKnowledgebaseCommand.execute(); }
			)
		);

		// Изменение выбора правила с открытием визуализацием нужных данных.
		vscode.commands.registerCommand(
			ContentTreeProvider.onRuleClickCommand,
			async (item: RuleBaseItem) : Promise<boolean> => {
	
				try {
					// Открываем код правила.
					const ruleFilePath = item.getRuleFilePath();
	
					if (ruleFilePath && !fs.existsSync(ruleFilePath)) {
						// Попытка открыть несуществующее правило. 
						// Возможно при переключении веток репозитория или ручной модификации репозитория.
						ContentTreeProvider.setSelectedItem(null);
						await vscode.commands.executeCommand(ModularTestsListViewProvider.refreshCommand);
	
						kbTreeProvider.refresh();
						return false;
					} 
	
					ContentTreeProvider.setSelectedItem(item);
	
					// Открываем код правила
					const elementUri = vscode.Uri.file(ruleFilePath);
					const contentDocument = await vscode.workspace.openTextDocument(elementUri);
					await vscode.window.showTextDocument(contentDocument);
	
					await vscode.commands.executeCommand(ModularTestsListViewProvider.refreshCommand);
	
					// Выделяем только что созданное правило.
					await kbTree.reveal(
						item, 
						{
							focus: true,
							select: true,
							expand: true 
						}
					);
				}
				catch(error) {
					return false;
				}
	
				return true;
			}
		);
	
		// Форма создания корреляции.
		await CreateRuleViewProvider.init(config);
		
		// Создание поддиректории.
		const createSubFolderCommand = new CreateSubFolderCommand();
		context.subscriptions.push(
			vscode.commands.registerCommand(
				CreateSubFolderCommand.CommandName,
				async (item: RuleBaseItem) => {
					createSubFolderCommand.execute(item);
				},
				this
			)
		);
	
		// Переименование правила.
		const renameRuleCommand = new RenameTreeItemCommand();
		context.subscriptions.push(
			vscode.commands.registerCommand(
				RenameTreeItemCommand.CommandName,
				async (item: RuleBaseItem) => {
					renameRuleCommand.execute(item);
				},
				this
			)
		);
	
		// Удаление сущности.
		const deleteSubFolderCommand = new DeleteContentItemCommand();
		context.subscriptions.push(
			vscode.commands.registerCommand(
				DeleteContentItemCommand.CommandName,
				async (item: RuleBaseItem) => {
					deleteSubFolderCommand.execute(item);
				},
				this
			)
		);
	
		const createPackageCommand = new CreatePackageCommand();
		context.subscriptions.push(
			vscode.commands.registerCommand(
				CreatePackageCommand.CommandName,
				async (item: RuleBaseItem) => {
					createPackageCommand.execute(item);
				},
				this
			)
		);

		context.subscriptions.push(
			vscode.commands.registerCommand(
				ContentTreeProvider.unpackKbPackageCommand,
				async (selectedItem: RuleBaseItem) => {
	
					if(!config.isKbOpened()) {
						ExtensionHelper.showUserInfo("Нельзя собрать схемы ТС и графы без открытия базы знаний. Сначала откройте базу знаний.");
						return;
					}
					
					const action = new UnpackKbPackageAction(config);
					await action.run(selectedItem);
				}
			)
		);
	
		context.subscriptions.push(
			vscode.commands.registerCommand(
				ContentTreeProvider.buildAllCommand,
				async (selectedItem: RuleBaseItem) => {
	
					const parser = new SiemJOutputParser();
					const bag = new BuildAllGraphsAction(config, parser);
					await bag.run();
				}
			)
		);
	
		context.subscriptions.push(
			vscode.commands.registerCommand(
				ContentTreeProvider.buildKbPackageCommand,
				async (selectedItem: RuleBaseItem) => {
					if(!config.isKbOpened()) {
						ExtensionHelper.showUserInfo("Нельзя собрать схемы ТС и графы без открытия базы знаний. Сначала откройте базу знаний.");
						return;
					}
					
					const bag = new PackKbPackageAction(config);
					await bag.run(selectedItem);
				}
			)
		);
		
	}


	constructor(private _knowledgebaseDirectoryPath: string | undefined, _gitAPI : API, private _config: Configuration) {
		this._gitAPI = _gitAPI;
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: ContentFolder|RuleBaseItem): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: ContentFolder|RuleBaseItem): Promise<(ContentFolder|RuleBaseItem)[]> {

		if (!this._knowledgebaseDirectoryPath) {
			return Promise.resolve([]);
		}

		if(!element) {
			
			// Проверка наличия workspace.
			if(!this._knowledgebaseDirectoryPath) {
				return Promise.resolve([]);
			}

			const subDirectories = FileSystemHelper.readSubDirectories(this._knowledgebaseDirectoryPath);
			this.initializeRootIfNeeded(subDirectories);

			// В случане штатной директории пакетов будет возможности создавать и собирать пакеты.
			const dirName = path.basename(this._knowledgebaseDirectoryPath);
			if (this.isContentRoot(dirName)){
				const packagesFolder = await ContentFolder.create(this._knowledgebaseDirectoryPath, ContentFolderType.ContentRoot);
				return [packagesFolder];
			}

			const packagesFolder = await ContentFolder.create(this._knowledgebaseDirectoryPath, ContentFolderType.AnotherFolder);
			return [packagesFolder];
		}

		// Получаем список поддиректорий.
		const subFolderPath = element.getDirectoryPath();
		const kbItems : (RuleBaseItem)[]= [];

		const subDirectories = FileSystemHelper.readSubDirectories(subFolderPath);
		this.notifyIfContentTypeIsSelectedIncorrectly(subDirectories);

		for(const dirName of subDirectories)
		{
			// .git, .vscode и т.д.
			// _meta штатная директория в каждом пакете
			if(dirName.startsWith(".") || dirName.toLocaleLowerCase() == "_meta") 
				continue;

			// В случане штатной директории пакетов будет возможности создавать и собирать пакеты.
			// packages может встречаться не в корне открытого контета.
			if(this.isContentRoot(dirName)) {
				const packagesDirPath = path.join(subFolderPath, dirName);
				const packagesFolder = await ContentFolder.create(packagesDirPath, ContentFolderType.ContentRoot);
				kbItems.push(packagesFolder);
				continue;
			}

			// Пакеты.
			const parentFolder = path.basename(subFolderPath).toLocaleLowerCase();
			const directoryPath = path.join(subFolderPath, dirName);
			
			if(this.isContentRoot(parentFolder)) {
				const packageFolderItem = await ContentFolder.create(directoryPath, ContentFolderType.PackageFolder);
				kbItems.push(packageFolderItem);
				continue;
			}
			
			const kbItem = await ContentTreeProvider.createContentElement(directoryPath);
			kbItems.push(kbItem);
		}

		// Подсвечиваем правила, у которых есть хотя бы один измененный файл.
		if(this._gitAPI) { 
			this.highlightsLabelForNewOrEditRules(kbItems);
		}
		
		return kbItems;
	}

	private isContentRoot(dirName: string) {
		const rootFolders = this._config.getContentRoots().map(dir => {return path.basename(dir);});
		return rootFolders.includes(dirName);
	}

	private async initializeRootIfNeeded(subDirectories: string[]) : Promise<void> {
		// Проверяем тип контента фактический и выбранный и увеломляем если что-то не так.
		// const actualContentType = ContentTypeChecker.getContentTypeBySubDirectories(subDirectories);
		// const configContentType = this._config.getContentType();
		
		// if(!actualContentType){
		// 	const answer = await vscode.window.showInformationMessage(
		// 		`Кажется, что база знаний не проинициализирована, хотите создать необходимые директории для режима ${configContentType} автоматически?`,
		// 		"Да",
		// 		"Нет");

		// 	if (answer === "Да") {		
		// 		return vscode.commands.executeCommand(InitKBRootCommand.Name, this._config, this._knowledgebaseDirectoryPath);
		// 	}
		// }
	}

	private async notifyIfContentTypeIsSelectedIncorrectly(subDirectories: string[]) : Promise<void> {
		// Проверяем тип контента фактический и выбранный и увеломляем если что-то не так.
		// const actualContentType = ContentTypeChecker.getContentTypeBySubDirectories(subDirectories);
		// const configContentType = this._config.getContentType();

		// if(actualContentType == ContentType.EDR && configContentType == ContentType.SIEM) {
		// 	const answer = await vscode.window.showInformationMessage(
		// 		"Кажется, что база знаний в формате EDR, хотите изменить тип контента? Неправильная настройка не позволит собрать пакет.",
		// 		"Да",
		// 		"Нет");

		// 	if (answer === "Да") {
		// 		return vscode.commands.executeCommand(SetContentTypeCommand.Name, ContentType.EDR);
		// 	}
		// }

		// if(actualContentType == ContentType.SIEM && configContentType == ContentType.EDR) {
		// 	const answer = await vscode.window.showInformationMessage(
		// 		"Кажется, что база знаний в формате SIEM, хотите изменить тип контента? Неправильная настройка не позволит собрать пакет.",
		// 		"Да",
		// 		"Нет");

		// 	if (answer === "Да") {
		// 		return vscode.commands.executeCommand(SetContentTypeCommand.Name, ContentType.SIEM);
		// 	}
		// }
	}

	private highlightsLabelForNewOrEditRules(items: RuleBaseItem[]) : void {
		const kbUri = vscode.Uri.file(this._knowledgebaseDirectoryPath);
		const repo = this._gitAPI.getRepository(kbUri);

		// База знаний не под git-ом.
		if(!repo) {
			return;
		}

		const changePaths = repo.state.workingTreeChanges.map( c => {
			return c.uri.fsPath.toLocaleLowerCase();
		});

		for(const item of items) {
			// В конце добавлен правильный слеш, дабы не отрабатывало на следующий случай
			// Изменилась директория \esc_profile, а выделяется \esc
			const directoryPath = item.getDirectoryPath().toLocaleLowerCase() + path.sep;

			if(changePaths.some(cp => cp.startsWith(directoryPath))) {
				item.setHighlightsLabel(item.getName());
			}
		}
	}

	public async getParent(element: RuleBaseItem) : Promise<RuleBaseItem> {

		// Дошли до корня контента, заканчиваем обход.
		const contentRoot = ContentFolderType[ContentFolderType.ContentRoot];
		if(element.contextValue === contentRoot) {
			return null;
		}

		const fullPath = element.getDirectoryPath();
		const parentPath = path.dirname(fullPath);
		const parentDirName = path.basename(parentPath);

		// Дошли до уровня пакета.
		if(parentDirName.toLocaleLowerCase() === "packages" || parentDirName === "") {
			const packageFolder = await ContentFolder.create(parentPath, ContentFolderType.ContentRoot);
			packageFolder.setName("Пакеты");

			return Promise.resolve(packageFolder);
		}

		const parentFolder = ContentFolder.create(parentPath, ContentFolderType.AnotherFolder);
		return Promise.resolve(parentFolder);
	}

	public static async createContentElement(elementDirectoryPath: string) : Promise<Correlation|Normalization|ContentFolder|Enrichment|Table|Aggregation|Macros> {

		// Маппинг типов файлов на функции создания экземпляра
		const entityCreators = { 
			".co": Correlation.parseFromDirectory,
			".en": Enrichment.parseFromDirectory, 
			".tl": Table.parseFromDirectory, 
			".xp": Normalization.parseFromDirectory,
			".agr": Aggregation.parseFromDirectory, 
			".flt": Macros.parseFromFile
		};

		// Перебираем все интересующие нас расширения и проверяем есть ли в текущем списке файлы с таким расширением
		for (const extension in entityCreators){
			const createEntityFunction = entityCreators[extension];			
			// Если в списке файлов есть файл с текущим расширением, то создаём из него нужный объект		
			const files = await fs.promises.readdir(elementDirectoryPath);	
			const entityFile = files.find(filename => filename.endsWith(extension));
			if (entityFile) {				
				return createEntityFunction(elementDirectoryPath, entityFile);
			}
		}

		return ContentFolder.create(elementDirectoryPath, ContentFolderType.AnotherFolder);
	}

	private static setSelectedItem(selectedItem : RuleBaseItem) : void {
		this._selectedItem = selectedItem;
	}

	public static getSelectedItem() : RuleBaseItem {
		return this._selectedItem;
	}

	public static async refresh() : Promise<void> {
		return vscode.commands.executeCommand(ContentTreeProvider.refreshTreeCommmand);
	}

	private _gitAPI : API;
	
	public static readonly KnowledgebaseTreeId = 'KnowledgebaseTree';
	
	public static readonly onRuleClickCommand = 'KnowledgebaseTree.onElementSelectionChange';
	public static readonly buildAllCommand = 'KnowledgebaseTree.buildAll';
	public static readonly buildKbPackageCommand = 'KnowledgebaseTree.buildKbPackage';
	public static readonly unpackKbPackageCommand = 'KnowledgebaseTree.unpackKbPackage';

	private static _selectedItem : RuleBaseItem;

	public static readonly refreshTreeCommmand = 'SiemContentEditor.refreshKbTree';

	private _onDidChangeTreeData: vscode.EventEmitter<ContentFolder|RuleBaseItem|undefined|void> = new vscode.EventEmitter<ContentFolder|RuleBaseItem|undefined|void>();
	readonly onDidChangeTreeData: vscode.Event<ContentFolder|RuleBaseItem|undefined|void> = this._onDidChangeTreeData.event;
}


