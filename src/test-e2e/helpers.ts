import * as path from "path";
import * as vscode from "vscode";

export enum Fixture {
	Diagnostics = "diagnostics",
}

/**
 * Waits for diagnostics to appear for a given URI.
 * @param uri The document URI to wait for diagnostics on
 * @param timeoutMs Maximum time to wait (default 30 seconds)
 * @returns Promise that resolves when diagnostics are available
 */
function waitForDiagnostics(uri: vscode.Uri, timeoutMs = 30000): Promise<vscode.Diagnostic[]> {
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
 * Activates the vscode.lsp-sample extension
 */
export async function activate(
	fixture: Fixture,
): Promise<[vscode.TextDocument, vscode.TextEditor]> {
	const fixturesProjectPath = path.resolve(__dirname, "./fixtures");

	// The extensionId is `publisher.name` from package.json
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const ext = vscode.extensions.getExtension("expert-lsp.expert")!;
	await ext.activate();
	try {
		const fixtureFilePath = path.resolve(fixturesProjectPath, "./lib/", `${fixture}.ex`);

		const doc = await vscode.workspace.openTextDocument(fixtureFilePath);
		const editor = await vscode.window.showTextDocument(doc);
		await waitForDiagnostics(doc.uri);

		return [doc, editor];
	} catch (e) {
		console.error(e);
		throw e;
	}
}
