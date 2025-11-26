import * as assert from "assert";
import * as vscode from "vscode";
import { Fixture, activate } from "../helpers";

suite("Extension E2E Tests", () => {
	test("Should get diagnostics", async () => {
		const [doc] = await activate(Fixture.Diagnostics);
		const actualDiagnostics = vscode.languages.getDiagnostics(doc.uri);

		assert.strictEqual(actualDiagnostics.length, 1);

		const diagnostic = actualDiagnostics[0];
		assert.strictEqual(diagnostic.message, "undefined function foo/0");
		assert.strictEqual(diagnostic.severity, vscode.DiagnosticSeverity.Error);
		assert.deepStrictEqual(
			diagnostic.range,
			new vscode.Range(new vscode.Position(2, 4), new vscode.Position(3, 0)),
		);
	});
});
