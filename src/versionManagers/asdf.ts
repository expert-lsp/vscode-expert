// Adapted from https://github.com/Shopify/ruby-lsp/blob/main/vscode/src/ruby/asdf.ts
// Copyright (c) 2021-present Shopify Inc.
// Licensed under the MIT License: https://opensource.org/licenses/MIT

import os from "os";
import path from "path";
import * as vscode from "vscode";
import * as Logger from "../logger";
import { EnvResult, VersionManager } from "./versionManager";

export class AsdfVersionManager extends VersionManager {
	constructor(workspaceFolder: vscode.WorkspaceFolder, context: vscode.ExtensionContext) {
		super(workspaceFolder, context);
	}

	async getEnv(): Promise<EnvResult> {
		// These directories are where we can find the ASDF executable for v0.16 and above
		const possibleExecutablePaths = [
			vscode.Uri.joinPath(vscode.Uri.file("/"), "opt", "homebrew", "bin"),
			vscode.Uri.joinPath(vscode.Uri.file("/"), "usr", "local", "bin"),
		];

		const asdfInstallation = await this.findAsdfInstallation();
		const asdfPath = asdfInstallation ?? (await this.findExec(possibleExecutablePaths, "asdf"));

		// findExec returns the bare name "asdf" when it can't find the executable in any directory.
		// If we also didn't find a shell script installation, asdf is not detected.
		if (asdfInstallation === undefined && asdfPath === "asdf") {
			return { detected: false };
		}

		// If there's no extension name, then we are using the ASDF executable directly. If there is an extension, then it's
		// a shell script and we have to source it first
		const baseCommand = path.extname(asdfPath) === "" ? asdfPath : `. ${asdfPath} && asdf`;

		const elixirDir = await this.whichDir(baseCommand, "elixir");
		const erlangDir = await this.whichDir(baseCommand, "erl");

		if (elixirDir === undefined || erlangDir === undefined) {
			Logger.warn(
				`Detected asdf but could not find elixir or erlang binaries. Elixir: ${elixirDir}, Erlang: ${erlangDir}`,
			);
			return { detected: false };
		}

		return {
			detected: true,
			env: { elixirDir, erlangDir },
		};
	}

	private async whichDir(baseCommand: string, execName: string): Promise<string | undefined> {
		try {
			const { stdout } = await this.runScript(`${baseCommand} which ${execName}`);
			return path.dirname(stdout.trim());
		} catch (error: unknown) {
			Logger.debug(`asdf which ${execName} failed: ${error}`);
			return undefined;
		}
	}

	// Finds the ASDF installation URI based on what's advertised in the ASDF documentation
	private async findAsdfInstallation(): Promise<string | undefined> {
		const scriptName = path.basename(vscode.env.shell) === "fish" ? "asdf.fish" : "asdf.sh";

		// Possible ASDF installation paths as described in https://asdf-vm.com/guide/getting-started.html#_3-install-asdf.
		// In order, the methods of installation are:
		// 1. Git
		// 2. Pacman
		// 3. Homebrew M series
		// 4. Homebrew Intel series
		const possiblePaths = [
			vscode.Uri.joinPath(vscode.Uri.file(os.homedir()), ".asdf", scriptName),
			vscode.Uri.joinPath(vscode.Uri.file("/"), "opt", "asdf-vm", scriptName),
			vscode.Uri.joinPath(
				vscode.Uri.file("/"),
				"opt",
				"homebrew",
				"opt",
				"asdf",
				"libexec",
				scriptName,
			),
			vscode.Uri.joinPath(
				vscode.Uri.file("/"),
				"usr",
				"local",
				"opt",
				"asdf",
				"libexec",
				scriptName,
			),
		];

		for (const possiblePath of possiblePaths) {
			try {
				await vscode.workspace.fs.stat(possiblePath);
				return possiblePath.fsPath;
			} catch (_error: unknown) {
				// Continue looking
			}
		}

		return undefined;
	}
}
