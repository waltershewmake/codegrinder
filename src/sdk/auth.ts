import * as vscode from "vscode";
import { httpClient, initializeHttpClient } from "./httpClient";
import { getUser } from "./user";
import { check_version } from "./utils";

let sessionCookie: string | null;
let host: string | null;

export function setHost(newHost: string, context: vscode.ExtensionContext) {
	host = newHost;
	context.globalState.update("host", newHost);
	initializeHttpClient(newHost, sessionCookie);
}

export function setSessionCookie(
	cookie: string,
	context: vscode.ExtensionContext
) {
	sessionCookie = cookie;
	context.globalState.update("sessionCookie", cookie);
	initializeHttpClient(host, cookie);
}

export function getHost(context: vscode.ExtensionContext): string | null {
	return context.globalState.get<string>("host") || host;
}

export function isLoggedIn(context: vscode.ExtensionContext): boolean {
	return !!getSessionCookie(context);
}

export function getSessionCookie(
	context: vscode.ExtensionContext
): string | null {
	return context.globalState.get<string>("sessionCookie") || sessionCookie;
}

export async function login(
	loginCode: string,
	context: vscode.ExtensionContext
) {
	let fields = loginCode.split(" ");
	if (fields.length !== 4 || fields[0] !== "grind" || fields[1] !== "login") {
		throw new Error(
			"The login code you supplied does not look right.\n\nCopy the login code directly from a Canvas assignment page."
		);
	}

	setHost(fields[2], context);

	let session = await httpClient
		.get("/users/session", {
			params: {
				key: fields[3],
			},
		})
		.then((session) => {
			if (!session.data.cookie) {
				throw new Error();
			}

			return session.data;
		})
		.catch(() => {
			throw new Error(
				"Make sure you use a fresh login code (no more than 5 minutes old)."
			);
		});

	setSessionCookie(session.cookie, context);

	check_version();

	// check if able to get user
	const user = getUser(true);

	return user;
}

export async function logout(context: vscode.ExtensionContext) {
	context.globalState.update("sessionCookie", undefined);
	context.globalState.update("host", undefined);
	sessionCookie = null;
	host = null;
}
