import { runTests } from "@vscode/test-electron";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const useDownload = process.argv.includes("--download");

async function main() {
	try {
		const extensionDevelopmentPath = path.resolve(__dirname, "../../");
		const extensionTestsPath = path.resolve(__dirname, "./suite/index");
		const fixturesProjectPath = path.resolve(__dirname, "./fixtures");
		const defaultUserDataDir = path.resolve(__dirname, "../../.vscode-test/user-data");

		if (useDownload) {
			// Let extension download the binary naturally
			configureExtensionSettings(defaultUserDataDir);
		} else {
			// Use pre-existing binary
			const expertBinaryPath = getExpertBinaryPath();
			configureExtensionSettings(defaultUserDataDir, expertBinaryPath);
		}

		await runTests({
			version: "1.107.0",
			extensionDevelopmentPath,
			extensionTestsPath,
			launchArgs: [fixturesProjectPath],
		});
	} catch (err) {
		console.error("Failed to run tests", err);
		process.exit(1);
	}
}

// NOTE: duplicates logic from src/platform.ts b/c e2e tests have a separate rootDir.
function getPlatformInfo(): { platform: string; arch: string } {
	let platform = os.platform() as string;
	let arch = os.arch() as string;
	platform = platform === "win32" ? "windows" : platform;
	arch = arch === "x64" ? "amd64" : arch;
	return { platform, arch };
}

const { platform, arch } = getPlatformInfo();
const CACHE_DIR = path.resolve(__dirname, `../../.vscode-test/expert_${platform}_${arch}`);

function getExpertBinaryPath(): string {
	// Check if CACHE_DIR is the binary file itself
	if (fs.existsSync(CACHE_DIR) && fs.statSync(CACHE_DIR).isFile()) {
		console.log(`Using Expert binary: ${path.basename(CACHE_DIR)}`);
		return CACHE_DIR;
	}

	// Check for any expert_* binary in the cache dir
	if (fs.existsSync(CACHE_DIR) && fs.statSync(CACHE_DIR).isDirectory()) {
		const files = fs.readdirSync(CACHE_DIR).filter((f) => f.startsWith("expert_"));
		if (files.length > 0) {
			const binaryPath = path.join(CACHE_DIR, files[0]);
			console.log(`Using Expert binary: ${files[0]}`);
			return binaryPath;
		}
	}

	throw new Error(
		`No Expert binary found at ${CACHE_DIR}.\n` +
			`Either:\n` +
			`  - Run 'npm run test:e2e:download' to let the extension download it, or\n` +
			`  - Manually place a binary at that path.`,
	);
}

function configureExtensionSettings(userDataDir: string, expertBinaryPath?: string): void {
	const settingsDir = path.join(userDataDir, "User");
	const settingsPath = path.join(settingsDir, "settings.json");
	fs.mkdirSync(settingsDir, { recursive: true });

	const settings: Record<string, unknown> = {
		"expert.trace.server": "verbose",
	};

	if (expertBinaryPath) {
		settings["expert.server.releasePathOverride"] = expertBinaryPath;
	}

	fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

main();
