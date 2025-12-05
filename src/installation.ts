import * as fs from "fs";
import * as os from "os";
import { ExtensionContext, Uri, window } from "vscode";
import * as Configuration from "./configuration";
import { Asset, fetchNightlyRelease, GITHUB_HEADERS, Release as GitHubRelease } from "./github";
import * as Logger from "./logger";

export type Platform =
	| "aix"
	| "darwin"
	| "freebsd"
	| "linux"
	| "openbsd"
	| "sunos"
	| "win32"
	| "windows";

export type Architecture =
	| "amd64" // == x64
	| "arm"
	| "arm64"
	| "ia32"
	| "loong64"
	| "mips"
	| "mipsel"
	| "ppc"
	| "ppc64"
	| "riscv64"
	| "s390"
	| "s390x"
	| "x64";

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
export async function checkAndInstall(context: ExtensionContext): Promise<string | undefined> {
	const manifest = context.globalState.get<Manifest>("install_manifest");

	if (manifest === undefined) {
		Logger.info("Language server is not installed, fetching latest release from GitHub...");

		return await mustInstallLatest(context);
	}

	Logger.info("Checking GitHub for new releases...");

	try {
		return await compareAndInstall(context, manifest);
	} catch (e) {
		const errorMessage = e instanceof Error ? e.message : String(e);
		Logger.error("An unexpected error occurred checking for updates: {error}", {
			error: errorMessage,
		});

		return Uri.joinPath(context.globalStorageUri, manifest.name).fsPath;
	}
}

// have no local installation, so we must install from GitHub releases.
async function mustInstallLatest(context: ExtensionContext): Promise<string | undefined> {
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

// have a local installation, compare it against latest GitHub release and install any updates.
async function compareAndInstall(
	context: ExtensionContext,
	manifest: Manifest,
): Promise<string | undefined> {
	const nightlyRelease = await fetchNightlyRelease();
	const lastNightlyUpdate = new Date(nightlyRelease.updated_at as string);

	if (manifest.release_timestamp > lastNightlyUpdate) {
		const installPath = Uri.joinPath(context.globalStorageUri, manifest.name);

		return installPath.fsPath;
	}

	const asset = findDistribution(nightlyRelease);

	if (asset === undefined) {
		return undefined;
	}

	const installPath = await download(asset, context);

	const newManifest: Manifest = {
		name: asset.name,
		version: nightlyRelease.tag_name,
		asset_timestamp: new Date(asset.updated_at),
		release_timestamp: new Date(nightlyRelease.updated_at as string),
	};

	await context.globalState.update("install_manifest", newManifest);

	notifyAutoInstallSuccess();

	return installPath;
}

function findDistribution(release: GitHubRelease) {
	let arch = os.arch() as Architecture;
	let platform = os.platform() as Platform;

	// swap in the aliases currently used by Expert's CI pipeline
	platform = platform === "win32" ? "windows" : platform;
	arch = arch === "x64" ? "amd64" : arch;

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

function notifyAutoInstallSuccess() {
	const disableNotificationMessage = "Disable this notification";
	// const serializedVersion = ReleaseVersion.serialize(version);
	const releaseUrl = `https://github.com/elixir-lang/expert/releases/tag/nightly`;
	// const message = `Expert was automatically updated to version ${serializedVersion}. See [what's new](${releaseUrl}).`;
	const message = `Expert was automatically updated to the latest nightly version. See [what's new](${releaseUrl}).`;

	window.showInformationMessage(message, disableNotificationMessage).then((fulfilledValue) => {
		if (fulfilledValue === disableNotificationMessage) {
			Configuration.disableAutoInstallUpdateNotification();
		}
	});
}
