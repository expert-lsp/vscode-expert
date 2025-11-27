import { runTests } from "@vscode/test-electron";
import * as path from "path";

async function main() {
	try {
		// The folder containing the Extension Manifest package.json
		// Passed to `--extensionDevelopmentPath`
		const extensionDevelopmentPath = path.resolve(__dirname, "../../");

		// The path to test runner
		// Passed to --extensionTestsPath
		const extensionTestsPath = path.resolve(__dirname, "./suite/index");

		const fixturesProjectPath = path.resolve(__dirname, "./fixtures");

		// Download VS Code, unzip it and run the integration test
		await runTests({
			// Tests fail to run with a higher version. Requires further investigation.
			// Not a huge deal, but would be nice to be able to test with latest version.
			version: "1.82.0",
			extensionDevelopmentPath,
			extensionTestsPath,
			launchArgs: [fixturesProjectPath],
		});
	} catch (err) {
		console.error("Failed to run tests", err);
		process.exit(1);
	}
}

main();
