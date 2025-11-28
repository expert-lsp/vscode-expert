import { downloadAndUnzipVSCode } from "@vscode/test-electron";
import { spawn } from "child_process";
import * as path from "path";

async function main() {
	const extensionDevelopmentPath = path.resolve(__dirname, "../../");
	const fixturesProjectPath = path.resolve(__dirname, "./fixtures");
	const userDataDir = path.resolve(__dirname, "../../.vscode-test/user-data");

	// Download VS Code (same version as E2E tests)
	const vscodeExecutablePath = await downloadAndUnzipVSCode("1.82.0");

	console.log("Launching VSCode sandbox...");
	console.log(`  Extension: ${extensionDevelopmentPath}`);
	console.log(`  Workspace: ${fixturesProjectPath}`);

	// Launch VSCode with isolation flags
	const child = spawn(
		vscodeExecutablePath,
		[
			"--extensionDevelopmentPath=" + extensionDevelopmentPath,
			"--user-data-dir=" + userDataDir,
			"--disable-extensions",
			"--skip-welcome",
			"--skip-release-notes",
			"--disable-workspace-trust",
			fixturesProjectPath,
		],
		{
			stdio: "inherit",
			detached: false,
		},
	);

	// Forward termination signals to child
	const cleanup = () => child.kill();

	process.on("SIGINT", cleanup);
	process.on("SIGTERM", cleanup);

	// Wait for VSCode to close
	await new Promise<void>((resolve) => {
		child.on("close", () => resolve());
		child.on("error", () => resolve());
	});

	process.off("SIGINT", cleanup);
	process.off("SIGTERM", cleanup);
}

main().catch((err) => {
	console.error("Failed to launch sandbox:", err);
	process.exit(1);
});
