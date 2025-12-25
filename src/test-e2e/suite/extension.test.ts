import * as assert from "assert";
import * as vscode from "vscode";
import {
	activateExtension,
	Fixture,
	getFixturePath,
	type LanguageClient,
	State,
	waitForClientReady,
	waitForDiagnostics,
} from "../helpers";

describe("Extension E2E Tests", () => {
	let client: LanguageClient | undefined;

	it("should start the language server", async () => {
		// Step 1: Activate extension
		client = await activateExtension();
		assert.ok(client, "Language client should be available after activation");

		// Step 2: Wait for server to reach Running state
		await waitForClientReady(client);
		assert.strictEqual(client.state, State.Running, "Server should be in Running state");
	});

	it("should get diagnostics", async () => {
		assert.ok(client, "Client should exist from previous test");

		// Step 1: Open fixture document
		const fixturePath = getFixturePath(Fixture.Diagnostics);
		const doc = await vscode.workspace.openTextDocument(fixturePath);
		await vscode.window.showTextDocument(doc);

		// Step 2: Wait for diagnostics
		const diagnostics = await waitForDiagnostics(doc.uri);
		assert.ok(diagnostics.length > 0, "Should have received diagnostics");

		// Step 3: Verify diagnostic content
		assert.strictEqual(diagnostics.length, 1, "Should have exactly 1 diagnostic");

		const diagnostic = diagnostics[0];
		assert.strictEqual(diagnostic.message, "undefined function foo/0");
		assert.strictEqual(diagnostic.severity, vscode.DiagnosticSeverity.Error);
		assert.deepStrictEqual(
			diagnostic.range,
			new vscode.Range(new vscode.Position(2, 4), new vscode.Position(3, 0)),
		);
	});
});
