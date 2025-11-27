import * as fs from "fs";
import { commands, ExtensionContext, Uri, window, workspace } from "vscode";
import { LanguageClient, LanguageClientOptions, ServerOptions } from "vscode-languageclient/node";
import * as Commands from "./commands";
import * as Configuration from "./configuration";
import { checkAndInstall } from "./installation";
import * as Logger from "./logger";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: ExtensionContext): Promise<void> {
	const serverEnabled = Configuration.getServerEnabled();

	if (serverEnabled === false) {
		Logger.info(
			"Expert language server is disabled via configuration. Only syntax highlighting will be active.",
		);
		return;
	}

	ensureDirectoryExists(context.globalStorageUri);

	const serverOptions = await getServerStartupOptions(context);

	const projectDir = Configuration.getProjectDirUri(workspace);

	if (serverOptions !== undefined) {
		const languageClient = await start(serverOptions, projectDir);

		context.subscriptions.push(
			commands.registerCommand("expert.server.restart", () =>
				Commands.restartServer(languageClient),
			),
			commands.registerCommand("expert.server.reindexProject", () =>
				Commands.reindexProject(languageClient),
			),
		);
	} else {
		Logger.warn("language server startup options, will not start.");
	}
}

// This method is called when your extension is deactivated
// eslint-disable-next-line @typescript-eslint/no-empty-function
export const deactivate = () => {
	// noop
};

async function start(serverOptions: ServerOptions, workspaceUri: Uri): Promise<LanguageClient> {
	Logger.info(`Starting Expert in directory ${workspaceUri?.fsPath}`);

	const clientOptions: LanguageClientOptions = {
		outputChannel: Logger.outputChannel(),
		// Register the server for Elixir documents
		// the client will iterate through this list and chose the first matching element
		documentSelector: [
			{ language: "elixir", scheme: "file" },
			{ language: "elixir", scheme: "untitled" },
			{ language: "eex", scheme: "file" },
			{ language: "eex", scheme: "untitled" },
			{ language: "html-eex", scheme: "file" },
			{ language: "html-eex", scheme: "untitled" },
			{ language: "phoenix-heex", scheme: "file" },
			{ language: "phoenix-heex", scheme: "untitled" },
		],
		workspaceFolder: {
			index: 0,
			uri: workspaceUri,
			name: workspaceUri.path,
		},
	};

	const client = new LanguageClient("expert", "Expert", serverOptions, clientOptions);

	try {
		await client.start();
	} catch (reason) {
		window.showWarningMessage(`Failed to start Expert: ${reason}`);
	}

	return client;
}

function ensureDirectoryExists(directory: Uri) {
	if (!fs.existsSync(directory.fsPath)) {
		fs.mkdirSync(directory.fsPath, { recursive: true });
	}
}

function getStartupArgs(): string[] {
	const flagsOverride = Configuration.getStartupFlagsOverride();
	const flags =
		typeof flagsOverride === "string" && flagsOverride.length > 0 ? flagsOverride : "--stdio";
	return flags.split(/\s+/).filter(Boolean);
}

// should always log why we're returning undefined here.
async function getServerStartupOptions(
	context: ExtensionContext,
): Promise<ServerOptions | undefined> {
	const startCommandOverride = Configuration.getStartCommandOverride();

	if (typeof startCommandOverride === "string" && startCommandOverride.length > 0) {
		Logger.info(`starting language server from release override: "${startCommandOverride}".`);
		return { command: startCommandOverride, args: getStartupArgs() };
	}

	const languageServerPath = await checkAndInstall(context);
	if (typeof languageServerPath === "undefined") {
		return undefined;
	}

	return { command: languageServerPath, args: getStartupArgs() };
}
