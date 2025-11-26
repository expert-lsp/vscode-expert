import { describe, it, before, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import nock from "nock";
import * as GithubFixture from "./fixtures/github-fixture";
import type { Manifest } from "../installation";

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
		const release = GithubFixture.any();
		const fakeAsset = Buffer.from("fake-binary-content");

		nock(GITHUB_API)
			.get("/repos/elixir-lang/expert/releases/tags/nightly")
			.reply(200, release);

		nock(GITHUB_API)
			.get(/\/repos\/elixir-lang\/expert\/releases\/assets\/\d+/)
			.reply(200, fakeAsset);

		const result = await Installation.checkAndInstall(ctx.context as any);

		// install path returned
		assert.ok(result, "Should return an install path");
		assert.match(result, /expert_darwin_arm64$/);

		// distribution saved
		assert.ok(fs.existsSync(result), "Distribution should exist on disk");
		assert.deepStrictEqual(fs.readFileSync(result), fakeAsset);

		// manifest persisted
		const manifest = ctx.globalStateStore.get("install_manifest") as Manifest;
		assert.ok(manifest, "Manifest should be saved");
		assert.strictEqual(manifest.name, "expert_darwin_arm64");
		assert.strictEqual(manifest.version, "nightly");
		assert.ok(manifest.asset_timestamp instanceof Date);
		assert.ok(manifest.release_timestamp instanceof Date);
	});

	it("downloads a new release when one is available", async () => {
		// Pre-install an "older" version
		const oldAsset = Buffer.from("old-binary");
		fs.writeFileSync(path.join(ctx.tempDir, "expert_darwin_arm64"), oldAsset);

		const oldDate = new Date("2025-11-20T00:00:00Z");
		ctx.globalStateStore.set("install_manifest", {
			name: "expert_darwin_arm64",
			version: "nightly",
			asset_timestamp: oldDate,
			release_timestamp: oldDate,
		});

		const newRelease = GithubFixture.nightlyRelease("2025-11-22T00:24:06Z");
		const newAsset = Buffer.from("new-binary-content");

		nock(GITHUB_API)
			.get("/repos/elixir-lang/expert/releases/tags/nightly")
			.reply(200, newRelease);

		nock(GITHUB_API)
			.get(/\/repos\/elixir-lang\/expert\/releases\/assets\/\d+/)
			.reply(200, newAsset);

		const result = await Installation.checkAndInstall(ctx.context as any);

		// new binary was downloaded
		assert.ok(result);
		assert.deepStrictEqual(fs.readFileSync(result), newAsset);

		// manifest updated with new timestamps
		const manifest = ctx.globalStateStore.get("install_manifest") as Manifest;
		assert.ok(manifest.release_timestamp.getTime() > oldDate.getTime());
	});

	it("skips download when local version is up-to-date", async () => {
		// Pre-install a "current" version with future timestamp
		const existingAsset = Buffer.from("existing-binary");
		fs.writeFileSync(path.join(ctx.tempDir, "expert_darwin_arm64"), existingAsset);

		ctx.globalStateStore.set("install_manifest", {
			name: "expert_darwin_arm64",
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
		assert.match(result, /expert_darwin_arm64$/);
		assert.deepStrictEqual(fs.readFileSync(result), existingAsset);
		assert.strictEqual(assetDownloaded, false, "Asset should not have been downloaded");
	});

	it("falls back to existing installation when GitHub is unreachable", async () => {
		const existingAsset = Buffer.from("existing-binary");
		fs.writeFileSync(path.join(ctx.tempDir, "expert_darwin_arm64"), existingAsset);

		const existingManifest = {
			name: "expert_darwin_arm64",
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
		assert.match(result, /expert_darwin_arm64$/);
		assert.ok(fs.existsSync(result));

		// manifest unchanged
		assert.deepStrictEqual(ctx.globalStateStore.get("install_manifest"), existingManifest);
	});

	it("returns undefined and shows error when platform is unsupported", async () => {
		// This test would require mocking os.arch/os.platform which is harder with Node test runner
		// For now, we test with a release that has no matching assets
		const release = GithubFixture.withPlatforms(["linux_amd64"]); // Only Linux, no darwin

		nock(GITHUB_API)
			.get("/repos/elixir-lang/expert/releases/tags/nightly")
			.reply(200, release);

		const result = await Installation.checkAndInstall(ctx.context as any);

		// no installation possible (darwin_arm64 not in release)
		assert.strictEqual(result, undefined);

		// no manifest saved
		assert.strictEqual(ctx.globalStateStore.get("install_manifest"), undefined);
	});
});
