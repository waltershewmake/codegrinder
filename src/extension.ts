// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { AssignmentProvider } from "./assignmentProvider";
import * as sdk from "./sdk";
import { initializeHttpClient } from "./sdk/httpClient";
import { courseDirectory } from "./sdk/utils";
import path = require("path");

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Initialize SDK with persisted values
	const persistedHost = context.globalState.get<string>("host");
	const persistedCookie = context.globalState.get<string>("sessionCookie");
	const storagePath = context.globalStorageUri.fsPath;

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

	let getAssignment = vscode.commands.registerCommand(
		"codegrinder.getAssignment",
		async (assignment: sdk.Assignment) => {
			const course = await sdk.getCourse(assignment.courseID, true);

			// get root directory, use storage path built into vscode
			const rootDirPath = path.join(storagePath);

			// set loading state
			vscode.window.withProgress(
				{
					location: vscode.ProgressLocation.Notification,
					title: "Downloading assignment...",
					cancellable: false,
				},
				async (progress, token) => {
					token.onCancellationRequested(() => {
						console.log("User canceled the long running operation");
					});

					const assignmentDir = await sdk.downloadAssignment(
						assignment,
						course,
						rootDirPath
					);

					if (!assignmentDir) {
						vscode.window.showErrorMessage(
							"Failed to download assignment"
						);
						return;
					}

					vscode.window.showInformationMessage(
						`Successfully downloaded assignment to ${assignmentDir}`
					);

					// open folder
					await vscode.commands.executeCommand(
						"vscode.openFolder",
						vscode.Uri.file(assignmentDir)
					);

					// open terminal
					vscode.commands.executeCommand(
						"workbench.action.terminal.toggleTerminal",
						vscode.Uri.file(assignmentDir)
					);

					// switch to explorer window
					vscode.commands.executeCommand("workbench.view.explorer");
				}
			);
		}
	);

	let openSection = vscode.commands.registerCommand(
		"codegrinder.openSection",
		// open doc for section
		async (course: string, assignment: string, section: string) => {
			const assignmentPath = path.join(
				storagePath,
				courseDirectory(course),
				assignment
			);
			const sectionPath = path.join(assignmentPath, section);

			// open assignment folder
			await vscode.commands.executeCommand(
				"vscode.openFolder",
				vscode.Uri.file(assignmentPath)
			);

			// open section doc > doc.md
			vscode.commands.executeCommand(
				"vscode.open",
				vscode.Uri.file(path.join(sectionPath, "doc", "doc.md"))
			);

			// open terminal
			vscode.commands.executeCommand(
				"workbench.action.terminal.toggleTerminal",
				vscode.Uri.file(sectionPath)
			);

			// switch to explorer window
			vscode.commands.executeCommand("workbench.view.explorer");
		}
	);

	context.subscriptions.push(login);
	context.subscriptions.push(logout);

	context.subscriptions.push(getAssignment);
	context.subscriptions.push(openSection);

	const assignmentProvider = new AssignmentProvider(context);
	vscode.window.createTreeView("codegrinder", {
		treeDataProvider: assignmentProvider,
	});
}

// This method is called when your extension is deactivated
export function deactivate() {}
