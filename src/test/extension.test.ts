// biome-ignore-all lint/suspicious/noEmptyBlockStatements: mocks void functions
// biome-ignore-all lint/suspicious/noExplicitAny: mocks as any

import assert from "node:assert";
import { before, beforeEach, describe, it, mock } from "node:test";

// Track calls to key functions
let checkAndInstallCalled = false;
let languageClientCreated = false;
let languageClientArgs: { command?: string; args?: string[] } | undefined;

// Configuration values - set per test
let configValues: Record<string, unknown> = {};

describe("Extension activation with configuration", () => {
	before(async () => {
		// Mock vscode-languageclient
		mock.module("vscode-languageclient/node", {
			namedExports: {
				LanguageClient: class MockLanguageClient {
					constructor(
						_id: string,
						_name: string,
						serverOptions: { command: string; args?: string[] },
					) {
						languageClientCreated = true;
						languageClientArgs = serverOptions;
					}
					start() {
						return Promise.resolve();
					}
					isRunning() {
						return true;
					}
				},
			},
		});

		// Mock installation module
		mock.module("../installation", {
			namedExports: {
				checkAndInstall: async () => {
					checkAndInstallCalled = true;
					return "/installed/server/path";
				},
			},
		});

		// Mock fs for ensureDirectoryExists and isExecutableFile
		mock.module("fs", {
			namedExports: {
				existsSync: () => true,
				mkdirSync: () => {},
				lstatSync: () => ({ isFile: () => true }),
				accessSync: () => {},
				constants: { X_OK: 1 },
			},
		});

		// Mock configuration module to use our test values
		mock.module("../configuration", {
			namedExports: {
				getServerEnabled: () => configValues.enabled ?? true,
				getStartCommandOverride: () => configValues.startCommandOverride,
				getStartupFlagsOverride: () => configValues.startupFlagsOverride,
				getProjectDirUri: () => ({ path: "/test/workspace", fsPath: "/test/workspace" }),
			},
		});
	});

	beforeEach(() => {
		checkAndInstallCalled = false;
		languageClientCreated = false;
		languageClientArgs = undefined;
		configValues = {};
	});

	describe("when expert.server.enabled is false", () => {
		it("does not start language server", async () => {
			configValues = { enabled: false };

			const { activate } = await import("../extension");
			await activate({
				globalStorageUri: { fsPath: "/test/storage" },
				subscriptions: [],
			} as any);

			assert.strictEqual(languageClientCreated, false, "LanguageClient should not be created");
			assert.strictEqual(checkAndInstallCalled, false, "checkAndInstall should not be called");
		});
	});

	describe("when expert.server.startCommandOverride is set", () => {
		it("uses override path instead of auto-install", async () => {
			configValues = {
				enabled: true,
				startCommandOverride: "/custom/server/path",
			};

			const { activate } = await import("../extension");
			await activate({
				globalStorageUri: { fsPath: "/test/storage" },
				subscriptions: [],
			} as any);

			assert.strictEqual(
				checkAndInstallCalled,
				false,
				"checkAndInstall should not be called with override",
			);
			assert.strictEqual(languageClientCreated, true, "LanguageClient should be created");
		});
	});

	describe("when expert.server.startupFlagsOverride is set", () => {
		it("passes custom flags to server options", async () => {
			configValues = {
				enabled: true,
				startCommandOverride: "/server/path",
				startupFlagsOverride: "--debug --verbose",
			};

			const { activate } = await import("../extension");
			await activate({
				globalStorageUri: { fsPath: "/test/storage" },
				subscriptions: [],
			} as any);

			assert.strictEqual(languageClientCreated, true, "LanguageClient should be created");
			assert.deepStrictEqual(languageClientArgs?.args, ["--debug", "--verbose"]);
		});
	});

	describe("when no startupFlagsOverride is set", () => {
		it("uses default --stdio flag", async () => {
			configValues = {
				enabled: true,
				startCommandOverride: "/server/path",
			};

			const { activate } = await import("../extension");
			await activate({
				globalStorageUri: { fsPath: "/test/storage" },
				subscriptions: [],
			} as any);

			assert.strictEqual(languageClientCreated, true, "LanguageClient should be created");
			assert.deepStrictEqual(languageClientArgs?.args, ["--stdio"]);
		});
	});
});
