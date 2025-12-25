// biome-ignore-all lint/suspicious/noExplicitAny: mocks as any

import assert from "node:assert";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, before, beforeEach, describe, it } from "node:test";
import nock from "nock";
import type { Manifest } from "../installation";
import { getExpectedAssetName } from "../platform";
import * as GithubFixture from "./fixtures/github-fixture";

const GITHUB_API = "https://api.github.com";

interface TestContext {
	tempDir: string;
	globalStateStore: Map<string, unknown>;
	context: {
		globalStorageUri: { fsPath: string };
		globalState: {
			get: (key: string) => unknown;
			update: (key: string, value: unknown) => Promise<void>;
		};
	};
}

function createTestContext(): TestContext {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "expert-test-"));
	const globalStateStore = new Map<string, unknown>();

	return {
		tempDir,
		globalStateStore,
		context: {
			globalStorageUri: { fsPath: tempDir },
			globalState: {
				get: (key: string) => globalStateStore.get(key),
				update: (key: string, value: unknown) => {
					globalStateStore.set(key, value);
					return Promise.resolve();
				},
			},
		},
	};
}

function cleanupTestContext(ctx: TestContext) {
	fs.rmSync(ctx.tempDir, { recursive: true, force: true });
}

// Module under test - imported after mocks are set up
type InstallationModule = typeof import("../installation");

describe("checkAndInstall", () => {
	let ctx: TestContext;
	let Installation: InstallationModule;

	before(async () => {
		Installation = await import("../installation");
		nock.disableNetConnect();
	});

	beforeEach(() => {
		ctx = createTestContext();
		nock.cleanAll();
	});

	afterEach(() => cleanupTestContext(ctx));

	it("installs the latest release when no prior version exists", async () => {
		const expectedAsset = getExpectedAssetName();
		const release = GithubFixture.any();
		const fakeAsset = Buffer.from("fake-binary-content");

		nock(GITHUB_API).get("/repos/elixir-lang/expert/releases/tags/nightly").reply(200, release);

		nock(GITHUB_API)
			.get(/\/repos\/elixir-lang\/expert\/releases\/assets\/\d+/)
			.reply(200, fakeAsset);

		const result = await Installation.checkAndInstall(ctx.context as any);

		// install path returned
		assert.ok(result, "Should return an install path");
		assert.ok(
			result.endsWith(expectedAsset),
			`Expected path to end with ${expectedAsset}, got ${result}`,
		);

		// distribution saved and is executable
		assert.ok(fs.existsSync(result), "Distribution should exist on disk");
		assert.deepStrictEqual(fs.readFileSync(result), fakeAsset);
		if (process.platform !== "win32") {
			const mode = fs.statSync(result).mode;
			assert.ok(mode & 0o111, "File should have execute bits set");
		}

		// manifest persisted
		const manifest = ctx.globalStateStore.get("install_manifest") as Manifest;
		assert.ok(manifest, "Manifest should be saved");
		assert.strictEqual(manifest.name, expectedAsset);
		assert.strictEqual(manifest.version, "nightly");
		assert.ok(manifest.asset_timestamp instanceof Date);
		assert.ok(manifest.release_timestamp instanceof Date);
	});

	it("downloads a new release when one is available", async () => {
		const expectedAsset = getExpectedAssetName();

		// Pre-install an "older" version
		const oldAsset = Buffer.from("old-binary");
		fs.writeFileSync(path.join(ctx.tempDir, expectedAsset), oldAsset);

		const oldDate = new Date("2025-11-20T00:00:00Z");
		ctx.globalStateStore.set("install_manifest", {
			name: expectedAsset,
			version: "nightly",
			asset_timestamp: oldDate,
			release_timestamp: oldDate,
		});

		const newRelease = GithubFixture.nightlyRelease("2025-11-22T00:24:06Z");
		const newAsset = Buffer.from("new-binary-content");

		nock(GITHUB_API).get("/repos/elixir-lang/expert/releases/tags/nightly").reply(200, newRelease);

		nock(GITHUB_API)
			.get(/\/repos\/elixir-lang\/expert\/releases\/assets\/\d+/)
			.reply(200, newAsset);

		const result = await Installation.checkAndInstall(ctx.context as any);

		// new binary was downloaded and is executable
		assert.ok(result);
		assert.deepStrictEqual(fs.readFileSync(result), newAsset);
		if (process.platform !== "win32") {
			const mode = fs.statSync(result).mode;
			assert.ok(mode & 0o111, "File should have execute bits set");
		}

		// manifest updated with new timestamps
		const manifest = ctx.globalStateStore.get("install_manifest") as Manifest;
		assert.ok(manifest.release_timestamp.getTime() > oldDate.getTime());
	});

	it("skips download when local version is up-to-date", async () => {
		const expectedAsset = getExpectedAssetName();

		// Pre-install a "current" version with future timestamp
		const existingAsset = Buffer.from("existing-binary");
		fs.writeFileSync(path.join(ctx.tempDir, expectedAsset), existingAsset);

		ctx.globalStateStore.set("install_manifest", {
			name: expectedAsset,
			version: "nightly",
			asset_timestamp: new Date("2025-12-01T00:00:00Z"),
			release_timestamp: new Date("2025-12-01T00:00:00Z"), // newer than fixture's 2025-11-22
		});

		let assetDownloaded = false;

		nock(GITHUB_API)
			.get("/repos/elixir-lang/expert/releases/tags/nightly")
			.reply(200, GithubFixture.any());

		nock(GITHUB_API)
			.get(/\/repos\/elixir-lang\/expert\/releases\/assets\/\d+/)
			.reply(200, () => {
				assetDownloaded = true;
				return Buffer.from("should-not-download");
			});

		const result = await Installation.checkAndInstall(ctx.context as any);

		// returns existing path, file unchanged
		assert.ok(result);
		assert.ok(
			result.endsWith(expectedAsset),
			`Expected path to end with ${expectedAsset}, got ${result}`,
		);
		assert.deepStrictEqual(fs.readFileSync(result), existingAsset);
		assert.strictEqual(assetDownloaded, false, "Asset should not have been downloaded");
	});

	it("falls back to existing installation when GitHub is unreachable", async () => {
		const expectedAsset = getExpectedAssetName();
		const existingAsset = Buffer.from("existing-binary");
		fs.writeFileSync(path.join(ctx.tempDir, expectedAsset), existingAsset);

		const existingManifest = {
			name: expectedAsset,
			version: "nightly",
			asset_timestamp: new Date("2025-11-20T00:00:00Z"),
			release_timestamp: new Date("2025-11-20T00:00:00Z"),
		};
		ctx.globalStateStore.set("install_manifest", existingManifest);

		nock(GITHUB_API)
			.get("/repos/elixir-lang/expert/releases/tags/nightly")
			.replyWithError("network error");

		const result = await Installation.checkAndInstall(ctx.context as any);

		// graceful fallback to existing installation
		assert.ok(result);
		assert.ok(
			result.endsWith(expectedAsset),
			`Expected path to end with ${expectedAsset}, got ${result}`,
		);
		assert.ok(fs.existsSync(result));

		// manifest unchanged
		assert.deepStrictEqual(ctx.globalStateStore.get("install_manifest"), existingManifest);
	});

	it("returns undefined and shows error when platform is unsupported", async () => {
		// Create a release that excludes the current platform
		// Use a fictional platform that won't match any real system
		const release = GithubFixture.withPlatforms(["fictional_unsupported"]);

		nock(GITHUB_API).get("/repos/elixir-lang/expert/releases/tags/nightly").reply(200, release);

		const result = await Installation.checkAndInstall(ctx.context as any);

		// no installation possible (current platform not in release)
		assert.strictEqual(result, undefined);

		// no manifest saved
		assert.strictEqual(ctx.globalStateStore.get("install_manifest"), undefined);
	});
});
