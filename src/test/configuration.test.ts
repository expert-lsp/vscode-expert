import { describe, it, before, beforeEach } from "node:test";
import assert from "node:assert";
import { Uri } from "vscode";
import { mockConfigValues, mockUpdateCalls } from "./vscode-mock.mjs";
import * as WorkspaceFixture from "./fixtures/workspace-fixture";

type ConfigurationModule = typeof import("../configuration");

describe("Configuration", () => {
	let Configuration: ConfigurationModule;

	before(async () => {
		Configuration = await import("../configuration");
	});

	beforeEach(() => {
		mockConfigValues.values = {};
		mockUpdateCalls.calls = [];
	});

	describe("getServerEnabled", () => {
		it("returns true by default when not configured", () => {
			assert.strictEqual(Configuration.getServerEnabled(), true);
		});

		it("returns true when explicitly enabled", () => {
			mockConfigValues.values = { enabled: true };
			assert.strictEqual(Configuration.getServerEnabled(), true);
		});

		it("returns false when explicitly disabled", () => {
			mockConfigValues.values = { enabled: false };
			assert.strictEqual(Configuration.getServerEnabled(), false);
		});
	});

	describe("getStartCommandOverride", () => {
		it("returns undefined by default when not configured", () => {
			assert.strictEqual(Configuration.getStartCommandOverride(), undefined);
		});

		it("returns the configured path", () => {
			mockConfigValues.values = { startCommandOverride: "/path/to/custom/expert_distribution" };
			assert.strictEqual(
				Configuration.getStartCommandOverride(),
				"/path/to/custom/expert_distribution",
			);
		});
	});

	describe("getStartupFlagsOverride", () => {
		it("returns undefined by default when not configured", () => {
			assert.strictEqual(Configuration.getStartupFlagsOverride(), undefined);
		});

		it("returns the configured flags", () => {
			mockConfigValues.values = { startupFlagsOverride: "--debug --verbose" };
			assert.strictEqual(Configuration.getStartupFlagsOverride(), "--debug --verbose");
		});
	});

	describe("getAutoInstallUpdateNotification", () => {
		it("returns true by default when not configured", () => {
			assert.strictEqual(Configuration.getAutoInstallUpdateNotification(), true);
		});

		it("returns false when explicitly disabled", () => {
			mockConfigValues.values = { notifyOnServerAutoUpdate: false };
			assert.strictEqual(Configuration.getAutoInstallUpdateNotification(), false);
		});
	});

	describe("disableAutoInstallUpdateNotification", () => {
		it("calls update with correct parameters", () => {
			Configuration.disableAutoInstallUpdateNotification();

			assert.strictEqual(mockUpdateCalls.calls.length, 1);
			assert.deepStrictEqual(mockUpdateCalls.calls[0], {
				key: "notifyOnServerAutoUpdate",
				value: false,
				target: 1, // ConfigurationTarget.Global
			});
		});
	});

	describe("getProjectDirUri", () => {
		it("returns the workspace URI when project dir is not configured", () => {
			const workspace = WorkspaceFixture.withUri(Uri.file("/stub"));

			const projectDirUri = Configuration.getProjectDirUri(workspace);

			assert.strictEqual(projectDirUri.fsPath, "/stub");
			assert.strictEqual(projectDirUri.scheme, "file");
		});

		it("returns the full directory URI when project dir is configured", () => {
			const workspace = WorkspaceFixture.withUri(Uri.file("/stub"));
			mockConfigValues.values = { projectDir: "subdirectory" };

			const projectDirUri = Configuration.getProjectDirUri(workspace);

			assert.strictEqual(projectDirUri.fsPath, "/stub/subdirectory");
			assert.strictEqual(projectDirUri.scheme, "file");
		});
	});
});
