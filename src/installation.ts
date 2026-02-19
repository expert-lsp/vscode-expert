import { createHash } from "crypto";
import * as fs from "fs";
import { ExtensionContext, Uri, window } from "vscode";
import * as Configuration from "./configuration";
import {
	Asset,
	fetchNightlyRelease,
	fetchStableRelease,
	GITHUB_HEADERS,
	Release as GitHubRelease,
	shouldAutoUpgradeFromRC,
} from "./github";
import * as Logger from "./logger";
import { getExpectedAssetName, getPlatformInfo } from "./platform";

/**
 * Metadata to persist between restarts of the extension. Used to track which distribution of
 * Expert was installed, and compare against new releases.
 */
export interface Manifest {
	name: string;
	version: string;
	asset_timestamp: Date;
	release_timestamp: Date;
}

/**
 *
 * @param context Expert's extension context.
 * @returns Installation path if available.
 */
export async function checkAndInstall(
	context: ExtensionContext,
	attemptCount: number = 0,
): Promise<string | undefined> {
	const nightly = Configuration.getNightly();
	const manifest = context.globalState.get<Manifest>("install_manifest");

	if (manifest === undefined) {
		Logger.info(
			nightly
				? "Language server is not installed, fetching latest nightly from GitHub..."
				: "Language server is not installed, fetching latest stable release from GitHub...",
		);

		try {
			return await mustInstallLatest(context, nightly);
		} catch (e) {
			const errorMessage = e instanceof Error ? e.message : String(e);
			Logger.error("Failed to fetch Expert release: {error}", { error: errorMessage });
			showFetchFailedNotification(context, attemptCount);
			return undefined;
		}
	}

	try {
		return await compareAndInstall(context, normalizeManifest(manifest), nightly);
	} catch (e) {
		const errorMessage = e instanceof Error ? e.message : String(e);
		Logger.error("An unexpected error occurred checking for updates: {error}", {
			error: errorMessage,
		});

		const expectedAssetName = getExpectedAssetName();
		if (manifest.name.startsWith(expectedAssetName)) {
			return Uri.joinPath(context.globalStorageUri, manifest.name).fsPath;
		}

		const { platform, arch } = getPlatformInfo();
		const manifestPlatform = manifest.name.replace(/^expert_/, "").replace(/\.exe$/, "");
		showFetchFailedNotification(context, attemptCount, manifestPlatform, `${platform}_${arch}`);
		return undefined;
	}
}

function normalizeManifest(manifest: Manifest): Manifest {
	return {
		...manifest,
		asset_timestamp: new Date(manifest.asset_timestamp),
		release_timestamp: new Date(manifest.release_timestamp),
	};
}

async function mustInstallLatest(
	context: ExtensionContext,
	nightly: boolean,
): Promise<string | undefined> {
	if (nightly) {
		Logger.info("Installing nightly release...");
		return await mustInstallNightly(context);
	}
	Logger.info("Installing stable release...");
	return await mustInstallStable(context);
}

async function mustInstallNightly(context: ExtensionContext): Promise<string | undefined> {
	const nightlyRelease = await fetchNightlyRelease();

	const asset = findDistribution(nightlyRelease);

	if (asset === undefined) {
		return undefined;
	}

	const installPath = await download(asset, context);

	const manifest: Manifest = {
		name: asset.name,
		version: nightlyRelease.tag_name,
		asset_timestamp: new Date(asset.updated_at),
		release_timestamp: new Date(nightlyRelease.updated_at as string),
	};

	await context.globalState.update("install_manifest", manifest);

	return installPath;
}

async function mustInstallStable(context: ExtensionContext): Promise<string | undefined> {
	const stableRelease = await fetchStableRelease();

	if (stableRelease === null) {
		Logger.info("No stable release found, installing nightly release instead...");
		return await mustInstallNightly(context);
	}

	const asset = findDistribution(stableRelease);

	if (asset === undefined) {
		return undefined;
	}

	const installPath = await download(asset, context);

	const manifest: Manifest = {
		name: asset.name,
		version: stableRelease.tag_name,
		asset_timestamp: new Date(asset.updated_at),
		release_timestamp: new Date(stableRelease.updated_at as string),
	};

	await context.globalState.update("install_manifest", manifest);

	return installPath;
}

// have a local installation, compare it against latest GitHub release and install any updates.
async function compareAndInstall(
	context: ExtensionContext,
	manifest: Manifest,
	nightly: boolean,
): Promise<string | undefined> {
	if (nightly) {
		return await compareAndInstallNightly(context, manifest);
	}
	return await compareAndInstallStable(context, manifest);
}

async function compareAndInstallNightly(
	context: ExtensionContext,
	manifest: Manifest,
): Promise<string | undefined> {
	Logger.info("Checking for nightly updates...");
	const nightlyRelease = await fetchNightlyRelease();
	const asset = findDistribution(nightlyRelease);

	if (asset === undefined) {
		return undefined;
	}
	const installPath = Uri.joinPath(context.globalStorageUri, asset.name).fsPath;

	let checksumMatches = false;
	let hasChecksums = false;
	const checksumsAsset = nightlyRelease.assets.find((releaseAsset) =>
		releaseAsset.name.includes("checksums"),
	);
	if (checksumsAsset && fs.existsSync(installPath)) {
		try {
			const checksumsText = await fetchChecksumsText(checksumsAsset);
			const checksums = parseChecksums(checksumsText);
			const expectedHash = checksums.get(asset.name);
			if (expectedHash) {
				hasChecksums = true;
				const localHash = sha256File(installPath);
				checksumMatches = localHash === expectedHash;
			}
		} catch (e) {
			const errorMessage = e instanceof Error ? e.message : String(e);
			Logger.warn("Failed to read checksums for nightly release: {error}", {
				error: errorMessage,
			});
		}
	}

	if (fs.existsSync(installPath)) {
		if (hasChecksums && checksumMatches) {
			Logger.info(
				`Checksums match for nightly ${manifest.version}; using installed version, no download needed`,
			);
			return installPath;
		}
		if (hasChecksums && !checksumMatches) {
			Logger.info("Downloading new nightly release - checksum mismatch");
		} else if (!hasChecksums) {
			Logger.info("Downloading new nightly release - checksums unavailable");
		} else {
			Logger.info("Downloading new nightly release");
		}
	} else {
		Logger.info("Downloading new nightly release - no local installation found");
	}

	const downloadedPath = await download(asset, context);

	const newManifest: Manifest = {
		name: asset.name,
		version: nightlyRelease.tag_name,
		asset_timestamp: new Date(asset.updated_at),
		release_timestamp: new Date(nightlyRelease.updated_at as string),
	};

	await context.globalState.update("install_manifest", newManifest);

	notifyAutoInstallSuccess(newManifest.version);

	return downloadedPath;
}

async function compareAndInstallStable(
	context: ExtensionContext,
	manifest: Manifest,
): Promise<string | undefined> {
	Logger.info("Checking for stable updates...");
	const stableRelease = await fetchStableRelease();

	if (stableRelease === null) {
		Logger.info("No stable release found, checking for nightly updates instead...");
		return await compareAndInstallNightly(context, manifest);
	}

	const currentVersion = manifest.version;
	const newVersion = stableRelease.tag_name;

	const needsUpdate =
		currentVersion !== newVersion || shouldAutoUpgradeFromRC(currentVersion, newVersion);

	if (!needsUpdate && manifest.name.startsWith(getExpectedAssetName())) {
		Logger.info(`Using currently installed stable version (${currentVersion}), no download needed`);
		const installPath = Uri.joinPath(context.globalStorageUri, manifest.name);
		return installPath.fsPath;
	}

	Logger.info(`Downloading stable release ${newVersion}...`);
	const asset = findDistribution(stableRelease);

	if (asset === undefined) {
		return undefined;
	}

	const installPath = await download(asset, context);

	const newManifest: Manifest = {
		name: asset.name,
		version: stableRelease.tag_name,
		asset_timestamp: new Date(asset.updated_at),
		release_timestamp: new Date(stableRelease.updated_at as string),
	};

	await context.globalState.update("install_manifest", newManifest);

	notifyAutoInstallSuccess(newManifest.version);

	return installPath;
}

function findDistribution(release: GitHubRelease) {
	const { platform, arch } = getPlatformInfo();

	const asset = release.assets.find((asset) => asset.name.startsWith(`expert_${platform}_${arch}`));

	if (asset === undefined) {
		window.showErrorMessage(
			`No distribution of Expert is available for your platform: ${platform}_${arch}`,
		);

		return undefined;
	}

	return asset;
}

async function download(asset: Asset, context: ExtensionContext) {
	const res = await fetch(asset.url, {
		headers: {
			...GITHUB_HEADERS,
			Accept: "application/octet-stream",
		},
	});
	const buf = Buffer.from(await res.arrayBuffer());

	const installPath = Uri.joinPath(context.globalStorageUri, asset.name);

	fs.writeFileSync(installPath.fsPath, buf);
	fs.chmodSync(installPath.fsPath, 0o755);

	return installPath.fsPath;
}

async function fetchChecksumsText(asset: Asset): Promise<string> {
	const res = await fetch(asset.url, {
		headers: {
			...GITHUB_HEADERS,
			Accept: "application/octet-stream",
		},
	});

	return await res.text();
}

function parseChecksums(checksums: string): Map<string, string> {
	const map = new Map<string, string>();
	const lines = checksums.split("\n");
	for (const line of lines) {
		const trimmed = line.trim();
		if (trimmed.length === 0) {
			continue;
		}
		const parts = trimmed.split(/\s+/);
		if (parts.length < 2) {
			continue;
		}
		const hash = parts[0];
		const rawName = parts[parts.length - 1];
		const name = rawName.replace(/^\.\//, "");
		map.set(name, hash);
	}
	return map;
}

function sha256File(filePath: string): string {
	const fileBuffer = fs.readFileSync(filePath);
	return createHash("sha256").update(fileBuffer).digest("hex");
}

export async function checkForUpdates(context: ExtensionContext): Promise<string | undefined> {
	const result = await checkAndInstall(context);

	if (result !== undefined) {
		const manifest = context.globalState.get<Manifest>("install_manifest");
		window.showInformationMessage(`Expert is up to date (${manifest?.version ?? "unknown"}).`);
	}

	return result;
}

function showFetchFailedNotification(
	context: ExtensionContext,
	attemptCount: number,
	manifestPlatform?: string,
	currentPlatform?: string,
) {
	const attempt = attemptCount > 0 ? ` (Attempt #${attemptCount + 1})` : "";

	const message =
		manifestPlatform && currentPlatform
			? `Current Expert binary is for ${manifestPlatform} but you're on ${currentPlatform}. Failed to download correct version${attempt}.`
			: `Failed to fetch Expert release${attempt}.`;

	const retry = "Retry";
	window.showErrorMessage(message, retry).then((selected) => {
		if (selected === retry) {
			checkAndInstall(context, attemptCount + 1);
		}
	});
}

function notifyAutoInstallSuccess(version: string) {
	if (!Configuration.getAutoInstallUpdateNotification()) {
		return;
	}

	const disableNotificationMessage = "Disable this notification";
	const releaseUrl = `https://github.com/elixir-lang/expert/releases/tag/${version}`;
	const message = `Expert was automatically updated to version ${version}. See [what's new](${releaseUrl}).`;

	window.showInformationMessage(message, disableNotificationMessage).then((fulfilledValue) => {
		if (fulfilledValue === disableNotificationMessage) {
			Configuration.disableAutoInstallUpdateNotification();
		}
	});
}
