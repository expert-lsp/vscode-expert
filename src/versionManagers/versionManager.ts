// Adapted from https://github.com/Shopify/ruby-lsp/blob/main/vscode/src/ruby/versionManager.ts
// Copyright (c) 2021-present Shopify Inc.
// Licensed under the MIT License: https://opensource.org/licenses/MIT

import * as vscode from "vscode";
import { exec } from "child_process";
import { promisify } from "util";
import os from "os";
import * as Logger from "../logger";

export interface Env {
  elixirDir: string | undefined;
  erlangDir: string | undefined;
}

export type EnvResult =
  | { detected: false }
  | { detected: true; env: Env }
  | { detected: "error"; message: string };

export abstract class VersionManager {
  protected readonly workspaceFolder: vscode.WorkspaceFolder;
  protected readonly context: vscode.ExtensionContext;

  constructor(workspaceFolder: vscode.WorkspaceFolder, context: vscode.ExtensionContext) {
    this.workspaceFolder = workspaceFolder;
    this.context = context;
  }

  abstract getEnv(): Promise<EnvResult>;
  // Tries to find `execName` within the given directories. Prefers the executables found in the given directories over
  // finding the executable in the PATH
  protected async findExec(directories: vscode.Uri[], execName: string) {
    for (const uri of directories) {
      try {
        const fullUri = vscode.Uri.joinPath(uri, execName);
        await vscode.workspace.fs.stat(fullUri);
        Logger.debug(`Found ${execName} executable at ${uri.fsPath}`);
        return fullUri.fsPath;
      } catch (_error: any) {
        // continue searching
      }
    }

    return execName;
  }

  // Runs the given command in the workspace folder, using the user's preferred shell and inheriting the current
  // process environment
  protected runScript(command: string) {
    let shell: string | undefined;

    // If the user has configured a default shell, we use that one since they are probably sourcing their version
    // manager scripts in that shell's configuration files. On Windows, we never set the shell no matter what to ensure
    // that activation runs on `cmd.exe` and not PowerShell, which avoids complex quoting and escaping issues.
    if (vscode.env.shell.length > 0 && os.platform() !== "win32") {
      shell = vscode.env.shell;
    }

    Logger.debug(`Running command: \`${command}\` in ${this.workspaceFolder.uri.fsPath} using shell: ${shell}`);

    return this.asyncExec(command, {
      cwd: this.workspaceFolder.uri.fsPath,
      shell,
      env: process.env,
    });
  }

  protected async asyncExec(command: string, options: object) {
    return promisify(exec)(command, options);
  }
}

export async function resolveEnv(
  setting: "none" | "auto" | "asdf" | "mise",
  workspaceFolder: vscode.WorkspaceFolder,
  context: vscode.ExtensionContext,
): Promise<EnvResult> {

  if (setting === "none") {
    Logger.info("Version manager integration disabled via configuration.");
    return { detected: false };
  }

  const isAuto = setting === "auto";

  if (setting === "mise" || isAuto) {
    const { MiseVersionManager } = await import("./mise");
    const result = await new MiseVersionManager(workspaceFolder, context).getEnv();
    if (result.detected) {
      Logger.info(isAuto ? "Detected version manager: mise" : "Using configured version manager: mise");
      return result;
    }
    if (!isAuto) {
      return { detected: "error", message: "Configured version manager 'mise' was not found." };
    }
  }

  if (setting === "asdf" || isAuto) {
    const { AsdfVersionManager } = await import("./asdf");
    const result = await new AsdfVersionManager(workspaceFolder, context).getEnv();
    if (result.detected) {
      Logger.info(isAuto ? "Detected version manager: asdf" : "Using configured version manager: asdf");
      return result;
    }
    if (!isAuto) {
      return { detected: "error", message: "Configured version manager 'asdf' was not found." };
    }
  }

  Logger.info("No version manager detected, using system environment.");
  return { detected: false };
}