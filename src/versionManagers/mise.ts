import { EnvResult, VersionManager } from "./versionManager";
import * as vscode from "vscode";
import os from "os";

export class MiseVersionManager extends VersionManager {
  constructor(workspaceFolder: vscode.WorkspaceFolder, context: vscode.ExtensionContext) {
    super(workspaceFolder, context);
  }

  async getEnv(): Promise<EnvResult> {
    const misePath = await this.findMiseInstallation();

    if (misePath === undefined) {
      return { detected: false };
    }

    const {stdout: elixirPath} = await this.runScript(`${misePath} which elixir`);
    const {stdout: erlangPath} = await this.runScript(`${misePath} which erlang`);

    return {
      detected: true,
      env: {
        elixirPath: elixirPath.trim(),
        erlangPath: erlangPath.trim(),
      },
    };
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