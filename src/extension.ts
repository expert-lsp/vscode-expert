import * as fs from "fs";
import { commands, ExtensionContext, Uri, window, workspace } from "vscode";
import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	StreamInfo,
} from "vscode-languageclient/node";
import * as Auth from "./auth";
import * as Commands from "./commands";
import * as Configuration from "./configuration";
import { checkAndInstall, checkForUpdates } from "./installation";
import * as Logger from "./logger";

let client: LanguageClient | undefined;

/**
 * Called by VSCode when starting the extension.
 * @param context Extension Context provided by Visual Studio Code.
 */
export async function activate(context: ExtensionContext): Promise<LanguageClient | undefined> {
	const serverEnabled = Configuration.getServerEnabled();

	if (serverEnabled === false) {
		Logger.info(
			"Expert language server is disabled via configuration. Only syntax highlighting will be active.",
		);
		return undefined;
	}

	ensureDirectoryExists(context.globalStorageUri);

	await Auth.initialize();

	context.subscriptions.push(
		commands.registerCommand("expert.server.checkForUpdates", () => checkForUpdates(context)),
		commands.registerCommand("expert.github.login", Commands.login),
		commands.registerCommand("expert.github.logout", Commands.logout),
	);

	const serverOptions = await getServerStartupOptions(context);
	const projectDir = Configuration.getProjectDirUri(workspace);

	if (serverOptions !== undefined) {
		client = await start(serverOptions, projectDir);

		context.subscriptions.push(
			commands.registerCommand("expert.server.start", () => Commands.start(client!)),
			commands.registerCommand("expert.server.stop", () => Commands.stop(client!)),
			commands.registerCommand("expert.server.restart", () => Commands.restart(client!)),
			commands.registerCommand("expert.server.reindex", () => Commands.reindex(client!)),
		);

		return client;
	} else {
		Logger.warn("language server startup options, will not start.");

		return undefined;
	}
}

/**
 * Called by VSCode when closing or turning off the extension otherwise.
 */
export function deactivate() {
	if (!client) {
		return undefined;
	}
	return client.stop();
}

async function start(serverOptions: ServerOptions, workspaceUri: Uri): Promise<LanguageClient> {
	Logger.info(`Starting Expert in workspace ${workspaceUri?.fsPath}`);

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
		progressOnInitialization: true,
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

function parsePortFromArgs(args: string[]): number | undefined {
	const portIndex = args.indexOf("--port");
	if (portIndex !== -1 && portIndex + 1 < args.length) {
		const port = Number.parseInt(args[portIndex + 1], 10);
		return Number.isNaN(port) ? undefined : port;
	}
	return undefined;
}

// should always log why we're returning undefined here.
async function getServerStartupOptions(
	context: ExtensionContext,
): Promise<ServerOptions | undefined> {
	const args = getStartupArgs();
	const port = parsePortFromArgs(args);

	// TCP mode: skip auto-install, server runs externally
	if (port !== undefined) {
		Logger.info(`Expert Language Server (TCP): Connecting to 127.0.0.1:${port}`);
		return () => {
			const net = require("net");
			const socket = net.connect({ host: "127.0.0.1", port });
			const result: StreamInfo = { writer: socket, reader: socket };
			return Promise.resolve(result);
		};
	}

	const releasePathOverride = Configuration.getReleasePathOverride();

	if (typeof releasePathOverride === "string" && releasePathOverride.length > 0) {
		Logger.info(`starting language server from release override: "${releasePathOverride}".`);
		return { command: releasePathOverride, args };
	}

	const languageServerPath = await checkAndInstall(context);
	if (typeof languageServerPath === "undefined") {
		return undefined;
	}

	Logger.info(`Expert Language Server:\n${languageServerPath} ${args.join(" ")}`);

	return { command: languageServerPath, args };
}
