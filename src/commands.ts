import { ExecuteCommandRequest, type LanguageClient } from "vscode-languageclient/node";
import * as Auth from "./auth";
import * as Logger from "./logger";

export function start(client: LanguageClient) {
	if (client.isRunning()) {
		Logger.info("Expert language-client is already running.");
	} else {
		Logger.info("Starting Expert language-client...");
		client.start();
	}
}

export function stop(client: LanguageClient) {
	if (client.isRunning()) {
		Logger.info("Stopping Expert language-client...");
		client.stop();
	} else {
		Logger.info("Expert language-client has already stopped.");
	}
}

export function restart(client: LanguageClient) {
	if (client.isRunning()) {
		Logger.info("Expert language-client is already running. Restarting.");
		client.restart();
	} else {
		Logger.info("Expert client is not running. Starting.");
		client.start();
	}
}

export function reindex(client: LanguageClient) {
	if (!client.isRunning()) {
		Logger.error("Client is not running, cannot send command to server.");
		return;
	}
	client.sendRequest(ExecuteCommandRequest.type, { command: "Reindex", arguments: [] });
}

export async function login(): Promise<void> {
	await Auth.login();
}

export async function logout(): Promise<void> {
	await Auth.logout();
}
