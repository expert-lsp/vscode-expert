import { EnvResult, VersionManager } from "./versionManager";
import * as vscode from "vscode";
import path from "path";
import os from "os";
import * as Logger from "../logger";

export class MiseVersionManager extends VersionManager {
  constructor(workspaceFolder: vscode.WorkspaceFolder, context: vscode.ExtensionContext) {
    super(workspaceFolder, context);
  }

  async getEnv(): Promise<EnvResult> {
    const misePath = await this.findMiseInstallation();

    if (misePath === undefined) {
      return { detected: false };
    }

    const elixirDir = await this.whichDir(misePath, "elixir");
    const erlangDir = await this.whichDir(misePath, "erl");

    if (elixirDir === undefined || erlangDir === undefined) {
      Logger.warn(`Detected mise but could not find elixir or erlang binaries. Elixir: ${elixirDir}, Erlang: ${erlangDir}`);
      return { detected: false };
    }

    return {
      detected: true,
      env: { elixirDir, erlangDir },
    };
  }

  private async whichDir(misePath: string, execName: string): Promise<string | undefined> {
    try {
      const { stdout } = await this.runScript(`${misePath} which ${execName}`);
      return path.dirname(stdout.trim());
    } catch (error: any) {
      Logger.debug(`mise which ${execName} failed: ${error.message}`);
      return undefined;
    }
  }

  private async findMiseInstallation(): Promise<string | undefined> {
    // Possible mise installation paths
    //
    // 1. Installation from curl | sh (per mise.jdx.dev Getting Started)
    // 2. Homebrew M series
    // 3. Installation from `apt install mise`
    const possiblePaths = [
      vscode.Uri.joinPath(vscode.Uri.file(os.homedir()), ".local", "bin", "mise"),
      vscode.Uri.joinPath(vscode.Uri.file("/"), "opt", "homebrew", "bin", "mise"),
      vscode.Uri.joinPath(vscode.Uri.file("/"), "usr", "bin", "mise"),
    ];

    for (const possiblePath of possiblePaths) {
      try {
        await vscode.workspace.fs.stat(possiblePath);
        return possiblePath.fsPath;
      } catch (_error: any) {
        // Continue looking
      }
    }

    return undefined;
  }
}