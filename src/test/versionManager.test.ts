// biome-ignore-all lint/suspicious/noExplicitAny: mocks as any

import assert from "node:assert";
import { before, describe, it, mock } from "node:test";

let mockMiseDetected = false;
let mockAsdfDetected = false;
let mockMiseEnv = {};
let mockAsdfEnv = {};

describe("resolveEnv", () => {
	before(async () => {
		mock.module("../versionManagers/mise", {
			namedExports: {
				MiseVersionManager: class {
					async getEnv() {
						if (mockMiseDetected) {
							return { detected: true, env: mockMiseEnv };
						}
						return { detected: false };
					}
				},
			},
		});

		mock.module("../versionManagers/asdf", {
			namedExports: {
				AsdfVersionManager: class {
					async getEnv() {
						if (mockAsdfDetected) {
							return { detected: true, env: mockAsdfEnv };
						}
						return { detected: false };
					}
				},
			},
		});
	});

	const workspaceFolder = { uri: { path: "/test" } } as any;
	const context = {} as any;

	it("returns not detected when setting is 'none'", async () => {
		const { resolveEnv } = await import("../versionManagers/versionManager");
		const result = await resolveEnv("none", workspaceFolder, context);

		assert.deepStrictEqual(result, { detected: false });
	});

	it("returns detected env when auto-detecting mise", async () => {
		mockMiseDetected = true;
		mockMiseEnv = { elixirDir: "/mise/bin", erlangDir: "/mise/bin" };

		const { resolveEnv } = await import("../versionManagers/versionManager");
		const result = await resolveEnv("auto", workspaceFolder, context);

		assert.strictEqual(result.detected, true);
		assert.deepStrictEqual((result as any).env, {
			elixirDir: "/mise/bin",
			erlangDir: "/mise/bin",
		});

		mockMiseDetected = false;
	});

	it("falls back to asdf when mise is not detected in auto mode", async () => {
		mockMiseDetected = false;
		mockAsdfDetected = true;
		mockAsdfEnv = { elixirDir: "/asdf/bin", erlangDir: "/asdf/bin" };

		const { resolveEnv } = await import("../versionManagers/versionManager");
		const result = await resolveEnv("auto", workspaceFolder, context);

		assert.strictEqual(result.detected, true);
		assert.deepStrictEqual((result as any).env, {
			elixirDir: "/asdf/bin",
			erlangDir: "/asdf/bin",
		});

		mockAsdfDetected = false;
	});

	it("returns error when configured manager is not found", async () => {
		mockMiseDetected = false;

		const { resolveEnv } = await import("../versionManagers/versionManager");
		const result = await resolveEnv("mise", workspaceFolder, context);

		assert.strictEqual(result.detected, "error");
		assert.match((result as any).message, /mise/);
	});

	it("returns not detected when auto finds nothing", async () => {
		mockMiseDetected = false;
		mockAsdfDetected = false;

		const { resolveEnv } = await import("../versionManagers/versionManager");
		const result = await resolveEnv("auto", workspaceFolder, context);

		assert.deepStrictEqual(result, { detected: false });
	});
});
