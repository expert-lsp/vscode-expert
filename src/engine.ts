import { exec as execCb, spawn } from "child_process";
import * as vscode from "vscode";
import { getExpertBinaryPath } from "./extension";
import * as Logger from "./logger";

function exec(command: string): Promise<{ stdout: string; stderr: string }> {
	return new Promise((resolve, reject) => {
		execCb(command, (err, stdout, stderr) => {
			if (err) {
				reject(err);
			} else {
				resolve({ stdout, stderr });
			}
		});
	});
}

interface EngineBuild {
	path: string;
}

export function parseEngineList(output: string): EngineBuild[] {
	return output
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line.startsWith("/") || /^[A-Za-z]:\\/.test(line))
		.map((line) => ({ path: line }));
}

export async function listEngines(): Promise<void> {
	const binaryPath = await getExpertBinaryPath();
	if (!binaryPath) {
		vscode.window.showErrorMessage(
			"Expert binary not found. Please ensure the language server is installed.",
		);
		return;
	}

	Logger.info("Listing expert engine builds...");

	let stdout: string;
	try {
		({ stdout } = await exec(`"${binaryPath}" engine ls`));
	} catch (e) {
		const errorMsg = e instanceof Error ? e.message : String(e);
		Logger.error(`Failed to list engines: ${errorMsg}`);
		vscode.window.showErrorMessage(`Failed to list engine builds: ${errorMsg}`);
		return;
	}

	const builds = parseEngineList(stdout);
	if (builds.length === 0) {
		vscode.window.showInformationMessage("No engine builds found.");
		return;
	}

	const items = builds.map((build) => ({
		label: build.path,
		path: build.path,
	}));

	const selection = await vscode.window.showQuickPick(items, {
		canPickMany: false,
		placeHolder: `Found ${builds.length} engine build${builds.length === 1 ? "" : "s"} (select to copy path)`,
		title: "Expert Engine Builds",
	});

	if (selection) {
		await vscode.env.clipboard.writeText(selection.path);
		vscode.window.showInformationMessage(`Copied path to clipboard: ${selection.path}`);
		Logger.info(`User selected and copied engine path: ${selection.label}`);
	}
}

export async function cleanEngines(): Promise<void> {
	const binaryPath = await getExpertBinaryPath();
	if (!binaryPath) {
		vscode.window.showErrorMessage(
			"Expert binary not found. Please ensure the language server is installed.",
		);
		return;
	}

	Logger.info("Fetching expert engine builds for cleanup...");

	let stdout: string;
	try {
		({ stdout } = await exec(`"${binaryPath}" engine ls`));
	} catch (e) {
		const errorMsg = e instanceof Error ? e.message : String(e);
		Logger.error(`Failed to list engines: ${errorMsg}`);
		vscode.window.showErrorMessage(`Failed to fetch engine builds: ${errorMsg}`);
		return;
	}

	const builds = parseEngineList(stdout);
	if (builds.length === 0) {
		vscode.window.showInformationMessage("No engine builds found.");
		return;
	}

	const items = builds.map((build) => ({
		label: build.path,
		path: build.path,
		picked: false,
	}));

	const selections = await vscode.window.showQuickPick(items, {
		canPickMany: true,
		placeHolder: "Select engine builds to delete (use space to toggle selection)",
		title: "Clean Expert Engine Builds",
	});

	if (!selections || selections.length === 0) {
		Logger.info("No engine builds selected for cleanup.");
		return;
	}

	const confirmed = await vscode.window.showWarningMessage(
		`Delete ${selections.length} engine build${selections.length === 1 ? "" : "s"}?`,
		{ modal: true },
		"Delete",
	);

	if (confirmed !== "Delete") {
		Logger.info("Engine cleanup cancelled by user.");
		return;
	}

	const pathsToDelete = new Set(selections.map((s: { path: string }) => s.path));
	Logger.info(`Will delete ${pathsToDelete.size} selected engine build(s), skipping others`);

	await runClean(binaryPath, pathsToDelete, selections.length);
}

function runClean(binaryPath: string, pathsToDelete: Set<string>, count: number): Promise<void> {
	return new Promise((resolve) => {
		// Don't pass paths - expert clean ignores args and always prompts for all engines
		const childProcess = spawn(`"${binaryPath}"`, ["engine", "clean"], {
			shell: true,
			stdio: ["pipe", "pipe", "pipe"],
		});

		let buffer = "";

		childProcess.stdout.on("data", (data: Buffer) => {
			const text = data.toString();
			buffer += text;
			Logger.info(`Engine clean: ${text}`);

			const promptMatch = buffer.match(/Delete\s+(.+?)\?\s*\[Yn\]/);
			if (promptMatch) {
				const enginePath = promptMatch[1].trim();
				if (pathsToDelete.has(enginePath)) {
					Logger.info(`Confirming deletion for: ${enginePath}`);
					childProcess.stdin.write("Y\n");
				} else {
					Logger.info(`Skipping: ${enginePath}`);
					childProcess.stdin.write("n\n");
				}
				buffer = "";
			}
		});

		childProcess.stderr.on("data", (data: Buffer) => {
			Logger.error(`Engine clean error: ${data.toString()}`);
		});

		childProcess.on("close", (code: number | null) => {
			childProcess.stdin.end();

			if (code === 0) {
				Logger.info(`Successfully processed ${count} engine build${count === 1 ? "" : "s"}`);
				vscode.window.showInformationMessage(
					`Deleted ${count} engine build${count === 1 ? "" : "s"}.`,
				);
			} else {
				Logger.error(`Engine clean failed with exit code ${code}`);
				vscode.window.showErrorMessage(
					"Failed to clean engine builds. Check output channel for details.",
				);
			}

			resolve();
		});

		childProcess.on("error", (err: Error) => {
			Logger.error(`Failed to spawn engine clean process: ${err.message}`);
			vscode.window.showErrorMessage(`Failed to start cleanup process: ${err.message}`);
			resolve();
		});
	});
}
