import * as assert from "assert";
import * as vscode from "vscode";
import { activate, Fixture } from "../helpers";

describe("Extension E2E Tests", () => {
	it("should get diagnostics", async () => {
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
