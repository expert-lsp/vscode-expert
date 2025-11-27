import path = require("path");

import { ConfigurationTarget, Uri, workspace as vsWorkspace, WorkspaceConfiguration } from "vscode";
import * as Logger from "./logger";

// wrapped in functions b/c getConfiguration needs to be called late
const getBaseConfig = () => vsWorkspace.getConfiguration("expert.server");

const getExpertConfig = () => getBaseConfig().getConfiguration("expert") as WorkspaceConfiguration;

export function getServerEnabled() {
	return getBaseConfig().get<boolean>("enabled", true);
}

export function getStartCommandOverride() {
	return getBaseConfig().get<string | undefined>("startCommandOverride", undefined);
}

export function getStartupFlagsOverride() {
	return getBaseConfig().get<string | undefined>("startupFlagsOverride", undefined);
}

export function getProjectDirUri(workspace: typeof vsWorkspace): Uri {
	const projectDirConfig = getBaseConfig().get<string>("projectDir");

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const workspacePath = workspace.workspaceFolders![0].uri.path;

	if (typeof projectDirConfig === "string") {
		const fullDirectoryPath = path.join(workspacePath, projectDirConfig);
		return Uri.file(fullDirectoryPath);
	}

	return Uri.file(workspacePath);
}

export function disableAutoInstallUpdateNotification(): void {
	getExpertConfig()
		.update("notifyOnServerAutoUpdate", false, ConfigurationTarget.Global)
		.then(undefined, (e) => Logger.error(e.toString()));
}

export function getAutoInstallUpdateNotification() {
	return getExpertConfig().get<boolean>("notifyOnServerAutoUpdate", true);
}
