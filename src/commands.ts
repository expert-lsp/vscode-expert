import { ExecuteCommandRequest, type LanguageClient } from "vscode-languageclient/node";
import * as Logger from "./logger";

export function restartServer(client: LanguageClient) {
	if (client.isRunning()) {
		Logger.info("Expert client is already running. Restarting.");
		client.restart();
	} else {
		Logger.info("Expert client is not running. Starting.");
		client.start();
	}
}

export function reindexProject(client: LanguageClient) {
	if (!client.isRunning()) {
		Logger.error("Client is not running, cannot send command to server.");
		return;
	}
	client.sendRequest(ExecuteCommandRequest.type, { command: "Reindex", arguments: [] });
}
