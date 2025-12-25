import * as path from "path";
import * as vscode from "vscode";
import { type LanguageClient, State } from "vscode-languageclient/node";

// Re-export State for use in tests
export { State };
export type { LanguageClient };

export enum Fixture {
	Diagnostics = "diagnostics",
}

/**
 * Activates the Expert extension and returns the language client.
 */
export async function activateExtension(): Promise<LanguageClient | undefined> {
	const ext = vscode.extensions.getExtension("expert-lsp.expert")!;
	return (await ext.activate()) as LanguageClient | undefined;
}

/**
 * Waits for the language client to reach the Running state.
 */
export function waitForClientReady(client: LanguageClient, timeoutMs = 30000): Promise<void> {
	if (client.state === State.Running) {
		return Promise.resolve();
	}
	
	return new Promise((resolve, reject) => {
		const timeout = setTimeout(() => {
			disposable.dispose();
			reject(new Error(`Server init timeout. State: ${State[client.state]}`));
		}, timeoutMs);

		const disposable = client.onDidChangeState((e) => {
			if (e.newState === State.Running) {
				clearTimeout(timeout);
				disposable.dispose();
				resolve();
			}
		});
	});
}

/**
 * Waits for diagnostics to appear for a given URI.
 */
export function waitForDiagnostics(
	uri: vscode.Uri,
	timeoutMs = 15000,
): Promise<vscode.Diagnostic[]> {
	return new Promise((resolve, reject) => {
		const timeout = setTimeout(() => {
			disposable.dispose();
			reject(new Error(`Timeout waiting for diagnostics on ${uri.fsPath}`));
		}, timeoutMs);

		// Check if diagnostics already exist
		const existing = vscode.languages.getDiagnostics(uri);
		if (existing.length > 0) {
			clearTimeout(timeout);
			resolve(existing);
			return;
		}

		// Listen for diagnostic changes
		const disposable = vscode.languages.onDidChangeDiagnostics((event) => {
			const hasOurUri = event.uris.some((u) => u.toString() === uri.toString());
			if (hasOurUri) {
				const diagnostics = vscode.languages.getDiagnostics(uri);
				if (diagnostics.length > 0) {
					clearTimeout(timeout);
					disposable.dispose();
					resolve(diagnostics);
				}
			}
		});
	});
}

/**
 * Returns the path to a fixture file.
 */
export function getFixturePath(fixture: Fixture): string {
	const fixturesProjectPath = path.resolve(__dirname, "./fixtures");
	return path.resolve(fixturesProjectPath, "./lib/", `${fixture}.ex`);
}
