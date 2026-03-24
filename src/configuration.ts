import { ConfigurationTarget, workspace as vsWorkspace } from "vscode";
import * as Logger from "./logger";

// wrapped in functions b/c getConfiguration needs to be called late
const getBaseConfig = () => vsWorkspace.getConfiguration("expert.server");

const getExpertConfig = () => vsWorkspace.getConfiguration("expert");

export function getServerEnabled() {
	return getBaseConfig().get<boolean>("enabled", true);
}

export function getReleasePathOverride() {
	return getBaseConfig().get<string | undefined>("releasePathOverride", undefined);
}

export function getStartupFlagsOverride() {
	return getBaseConfig().get<string | undefined>("startupFlagsOverride", undefined);
}

export function getLogLevel() {
	return getBaseConfig().get<string>("logLevel", "info");
}

export function getFileLogLevel() {
	return getBaseConfig().get<string>("fileLogLevel", "default");
}

export function getWorkspaceSymbolsMinQueryLength() {
	return getBaseConfig().get<number>("workspaceSymbols.minQueryLength", 2);
}

export function getProjectDir(): string | undefined {
	return getBaseConfig().get<string>("projectDir");
}

export function getServerSettings() {
	const fileLogLevel = getFileLogLevel();

	return {
		logLevel: getLogLevel(),
		fileLogLevel: fileLogLevel === "default" ? null : fileLogLevel,
		projectDir: getProjectDir(),
		workspaceSymbols: {
			minQueryLength: getWorkspaceSymbolsMinQueryLength(),
		},
	};
}

export function disableAutoInstallUpdateNotification(): void {
	getExpertConfig()
		.update("notifyOnServerAutoUpdate", false, ConfigurationTarget.Global)
		.then(undefined, (e) => Logger.error(e.toString()));
}

export function getAutoInstallUpdateNotification() {
	return getExpertConfig().get<boolean>("notifyOnServerAutoUpdate", true);
}

export type VersionManager = "none" | "auto" | "asdf" | "mise";

export function getVersionManager(): VersionManager {
	return getBaseConfig().get<VersionManager>("versionManager", "auto");
}

export function getNightly() {
	return getBaseConfig().get<boolean>("nightly", false);
}
