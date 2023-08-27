import {
	Event,
	EventEmitter,
	TreeDataProvider,
	TreeItem,
	TreeItemCollapsibleState,
} from "vscode";

export class AssignmentProvider implements TreeDataProvider<TreeItem> {
	private _onDidChangeTreeData: EventEmitter<TreeItem | undefined> =
		new EventEmitter<TreeItem | undefined>();
	readonly onDidChangeTreeData: Event<TreeItem | undefined> =
		this._onDidChangeTreeData.event;

	getTreeItem(element: TreeItem): TreeItem {
		return element;
	}

	getChildren(element?: TreeItem): Thenable<TreeItem[]> {
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
