import * as fs from "fs";
import { join } from "path";
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { ExtensionContext, Uri, commands, window, workspace } from "vscode";
import { LanguageClient, LanguageClientOptions, ServerOptions } from "vscode-languageclient/node";
import { URI } from "vscode-uri";
import * as Commands from "./client-commands";
import * as Configuration from "./configuration";
import * as Logger from "./logger";
import { checkAndInstall } from "./installation";

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

	let LanguageServerPath: string | undefined;

	const releasePathOverride = Configuration.getReleasePathOverride();

	if (typeof releasePathOverride === "string" && releasePathOverride.length > 0) {
		Logger.info(`starting language server from release override: "${releasePathOverride}".`);

		LanguageServerPath = releasePathOverride;
	} else {
		LanguageServerPath = await checkAndInstall(context);
	}

	const projectDir = Configuration.getProjectDirUri(workspace);

	if (LanguageServerPath !== undefined) {
		const client = await start(LanguageServerPath, projectDir);

		const registerCommand = Commands.getRegisterFunction((id, handler) => {
			context.subscriptions.push(commands.registerCommand(id, handler));
		});

		registerCommand(Commands.restartServer, { client });
		registerCommand(Commands.reindexProject, { client });
	}
}

// This method is called when your extension is deactivated
// eslint-disable-next-line @typescript-eslint/no-empty-function
export const deactivate = () => {
	// noop
};

function isExecutableFile(path: fs.PathLike): boolean {
	const stat = fs.lstatSync(path);
	let hasExecuteAccess = false;
	try {
		fs.accessSync(path, fs.constants.X_OK);
		hasExecuteAccess = true;
	} catch (_e) {
		hasExecuteAccess = false;
	}
	return stat.isFile() && hasExecuteAccess;
}

async function start(
	startScriptOrReleaseFolderPath: string,
	workspaceUri: URI,
): Promise<LanguageClient> {
	Logger.info(`Starting Expert in directory ${workspaceUri?.fsPath}`);

	const startScriptPath = isExecutableFile(startScriptOrReleaseFolderPath)
		? startScriptOrReleaseFolderPath
		: join(startScriptOrReleaseFolderPath, "start_lexical.sh");

	const serverOptions: ServerOptions = {
		command: startScriptPath,
	};

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

	Logger.info(`Starting Expert release in "${startScriptOrReleaseFolderPath}"`);

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
