import * as vscode from "vscode";
import {
	Event,
	EventEmitter,
	TreeDataProvider,
	TreeItem,
	TreeItemCollapsibleState,
} from "vscode";
import * as sdk from "./sdk";

export class AssignmentProvider implements TreeDataProvider<TreeItem> {
	private _onDidChangeTreeData: EventEmitter<TreeItem | undefined> =
		new EventEmitter<TreeItem | undefined>();
	readonly onDidChangeTreeData: Event<TreeItem | undefined> =
		this._onDidChangeTreeData.event;
	private context: vscode.ExtensionContext;

	constructor(context: vscode.ExtensionContext) {
		this.context = context;
	}

	getTreeItem(element: TreeItem): TreeItem {
		return element;
	}

	getChildren(element?: TreeItem): Thenable<TreeItem[]> {
		if (!sdk.isLoggedIn(this.context)) {
			// Replace with your actual login check
			vscode.window
				.showInformationMessage(
					"Please log in to view assignments.",
					"Login"
				)
				.then((selection) => {
					if (selection === "Login") {
						vscode.commands.executeCommand("codegrinder.login");
					}
				});
			return Promise.resolve([]);
		}

		if (!element) {
			// Fetch assignments using 'grind list' and create TreeItems
			return Promise.resolve([
				new TreeItem("Assignment 1", TreeItemCollapsibleState.None),
				new TreeItem("Assignment 2", TreeItemCollapsibleState.None),
				// ...
			]);
		}
		return Promise.resolve([]);
	}

	refresh(): void {
		this._onDidChangeTreeData.fire(undefined);
	}
}
