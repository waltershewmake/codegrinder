// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { AssignmentProvider } from "./assignmentProvider";
import * as sdk from "./sdk";
import { initializeHttpClient } from "./sdk/httpClient";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Initialize SDK with persisted values
	const persistedHost = context.globalState.get<string>("host");
	const persistedCookie = context.globalState.get<string>("sessionCookie");

	if (persistedHost && persistedCookie) {
		sdk.setHost(persistedHost, context);
		sdk.setSessionCookie(persistedCookie, context);
		initializeHttpClient(persistedHost, persistedCookie);
	}

	let login = vscode.commands.registerCommand(
		"codegrinder.login",
		async () => {
			const loginCode = await vscode.window.showInputBox({
				prompt:
					"Please paste the login code from a Canvas assignment page. It should look something like:\n\n" +
					"grind login some.servername.edu 8chrcode\n\n" +
					"Note: this is normally only necessary once per semester",
				placeHolder: "Login code",
				ignoreFocusOut: true,
			});

			if (loginCode) {
				sdk.login(loginCode, context)
					.then((user) => {
						vscode.window.showInformationMessage(
							`Successfully logged in! Welcome, ${user.name}`
						);
						assignmentProvider.refresh();
					})
					.catch((error) => {
						vscode.window.showErrorMessage(
							`Failed to login. ${error}`
						);
					});
			}
		}
	);

	let logout = vscode.commands.registerCommand(
		"codegrinder.logout",
		async () => {
			if (!sdk.isLoggedIn(context)) {
				vscode.window.showInformationMessage("You are not logged in!");
				return;
			}

			sdk.logout(context);
			vscode.window.showInformationMessage("Successfully logged out!");
			assignmentProvider.refresh();
		}
	);

	context.subscriptions.push(login);
	context.subscriptions.push(logout);

	const assignmentProvider = new AssignmentProvider(context);
	vscode.window.createTreeView("codegrinder", {
		treeDataProvider: assignmentProvider,
	});
}

// This method is called when your extension is deactivated
export function deactivate() {}
