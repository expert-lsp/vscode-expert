// biome-ignore-all lint/suspicious/noExplicitAny: mocks as any

import assert from "node:assert";
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, before, beforeEach, describe, it } from "node:test";
import nock from "nock";
import type { Manifest } from "../installation";
import { getExpectedAssetName, getPlatformInfo } from "../platform";
import * as GithubFixture from "./fixtures/github-fixture";
import { mockConfigValues, mockWindowMessages } from "./vscode-mock.mjs";

const GITHUB_API = "https://api.github.com";
const CHECKSUMS_ASSET_ID = 319436622;

function checksumsContent(assetName: string, data: Buffer) {
	const hash = createHash("sha256").update(data).digest("hex");
	return `${hash}  ${assetName}\n`;
}

function getWrongPlatformAssetName(): string {
	const expected = getExpectedAssetName();
	return expected.includes("linux") ? "expert_darwin_arm64" : "expert_linux_amd64";
}

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

type InstallationModule = typeof import("../installation");

describe("checkAndInstall", () => {
	let ctx: TestContext;
	let Installation: InstallationModule;

	before(async () => {
		mockConfigValues.values["nightly"] = true;
		mockConfigValues.values["notifyOnServerAutoUpdate"] = false;

		Installation = await import("../installation");
		nock.disableNetConnect();
	});

	beforeEach(() => {
		ctx = createTestContext();
		nock.cleanAll();
		mockConfigValues.values["nightly"] = true;
	});

	afterEach(() => cleanupTestContext(ctx));

	describe("nightly channel", () => {
		it("installs the latest nightly when no prior version exists", async () => {
			const expectedAsset = getExpectedAssetName();
			const release = GithubFixture.any();
			const fakeAsset = Buffer.from("fake-binary-content");

			nock(GITHUB_API).get("/repos/elixir-lang/expert/releases/tags/nightly").reply(200, release);

			nock(GITHUB_API)
				.get(/\/repos\/elixir-lang\/expert\/releases\/assets\/\d+/)
				.reply(200, fakeAsset);

			const result = await Installation.checkAndInstall(ctx.context as any);

			assert.ok(result, "Should return an install path");
			assert.ok(
				result.endsWith(expectedAsset),
				`Expected path to end with ${expectedAsset}, got ${result}`,
			);

			assert.ok(fs.existsSync(result), "Distribution should exist on disk");
			assert.deepStrictEqual(fs.readFileSync(result), fakeAsset);
			if (process.platform !== "win32") {
				const mode = fs.statSync(result).mode;
				assert.ok(mode & 0o111, "File should have execute bits set");
			}

			const manifest = ctx.globalStateStore.get("install_manifest") as Manifest;
			assert.ok(manifest, "Manifest should be saved");
			assert.strictEqual(manifest.name, expectedAsset);
			assert.strictEqual(manifest.version, "nightly");
			assert.ok(manifest.asset_timestamp instanceof Date);
			assert.ok(manifest.release_timestamp instanceof Date);
		});

		it("downloads a new release when one is available", async () => {
			const expectedAsset = getExpectedAssetName();

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

			nock(GITHUB_API)
				.get("/repos/elixir-lang/expert/releases/tags/nightly")
				.reply(200, newRelease);
			nock(GITHUB_API)
				.get(`/repos/elixir-lang/expert/releases/assets/${CHECKSUMS_ASSET_ID}`)
				.reply(200, checksumsContent(expectedAsset, newAsset));

			nock(GITHUB_API)
				.get(/\/repos\/elixir-lang\/expert\/releases\/assets\/\d+/)
				.reply(200, newAsset);

			const result = await Installation.checkAndInstall(ctx.context as any);

			assert.ok(result);
			assert.deepStrictEqual(fs.readFileSync(result), newAsset);
			if (process.platform !== "win32") {
				const mode = fs.statSync(result).mode;
				assert.ok(mode & 0o111, "File should have execute bits set");
			}

			const manifest = ctx.globalStateStore.get("install_manifest") as Manifest;
			assert.ok(manifest.release_timestamp.getTime() > oldDate.getTime());
		});

		it("skips download when local version is up-to-date", async () => {
			const expectedAsset = getExpectedAssetName();

			const existingAsset = Buffer.from("existing-binary");
			fs.writeFileSync(path.join(ctx.tempDir, expectedAsset), existingAsset);

			ctx.globalStateStore.set("install_manifest", {
				name: expectedAsset,
				version: "nightly",
				asset_timestamp: new Date("2025-12-01T00:00:00Z"),
				release_timestamp: new Date("2025-12-01T00:00:00Z"),
			});

			let assetDownloaded = false;

			nock(GITHUB_API)
				.get("/repos/elixir-lang/expert/releases/tags/nightly")
				.reply(200, GithubFixture.any());
			nock(GITHUB_API)
				.get(`/repos/elixir-lang/expert/releases/assets/${CHECKSUMS_ASSET_ID}`)
				.reply(200, checksumsContent(expectedAsset, existingAsset));

			nock(GITHUB_API)
				.get(/\/repos\/elixir-lang\/expert\/releases\/assets\/\d+/)
				.reply(200, () => {
					assetDownloaded = true;
					return Buffer.from("should-not-download");
				});

			const result = await Installation.checkAndInstall(ctx.context as any);

			assert.ok(result);
			assert.ok(
				result.endsWith(expectedAsset),
				`Expected path to end with ${expectedAsset}, got ${result}`,
			);
			assert.deepStrictEqual(fs.readFileSync(result), existingAsset);
			assert.strictEqual(assetDownloaded, false, "Asset should not have been downloaded");
		});
	});

	describe("stable channel", () => {
		beforeEach(() => {
			mockConfigValues.values["nightly"] = false;
		});

		it("installs the latest stable release when no prior version exists", async () => {
			const expectedAsset = getExpectedAssetName();
			const releases = GithubFixture.multipleReleases();
			const fakeAsset = Buffer.from("fake-binary-content");

			nock(GITHUB_API).get("/repos/elixir-lang/expert/releases").reply(200, releases);

			nock(GITHUB_API)
				.get(/\/repos\/elixir-lang\/expert\/releases\/assets\/\d+/)
				.reply(200, fakeAsset);

			const result = await Installation.checkAndInstall(ctx.context as any);

			assert.ok(result, "Should return an install path");
			assert.ok(
				result.endsWith(expectedAsset),
				`Expected path to end with ${expectedAsset}, got ${result}`,
			);
			assert.ok(fs.existsSync(result), "Distribution should exist on disk");
			const manifest = ctx.globalStateStore.get("install_manifest") as Manifest;
			assert.ok(manifest, "Manifest should be saved");
			assert.strictEqual(manifest.name, expectedAsset);
			assert.strictEqual(manifest.version, "0.3.0");
		});

		it("updates to newer stable version", async () => {
			const expectedAsset = getExpectedAssetName();
			const oldAsset = Buffer.from("old-binary");
			fs.writeFileSync(path.join(ctx.tempDir, expectedAsset), oldAsset);

			ctx.globalStateStore.set("install_manifest", {
				name: expectedAsset,
				version: "0.1.0",
				asset_timestamp: new Date("2025-11-15T00:00:00Z"),
				release_timestamp: new Date("2025-11-15T00:00:00Z"),
			});

			const releases = GithubFixture.multipleReleases();
			const newAsset = Buffer.from("new-binary-content");

			nock(GITHUB_API).get("/repos/elixir-lang/expert/releases").reply(200, releases);

			nock(GITHUB_API)
				.get(/\/repos\/elixir-lang\/expert\/releases\/assets\/\d+/)
				.reply(200, newAsset);

			const result = await Installation.checkAndInstall(ctx.context as any);

			assert.ok(result);
			assert.deepStrictEqual(fs.readFileSync(result), newAsset);
			const manifest = ctx.globalStateStore.get("install_manifest") as Manifest;
			assert.strictEqual(manifest.version, "0.3.0");
		});

		it("skips download when already on latest stable", async () => {
			const expectedAsset = getExpectedAssetName();
			const existingAsset = Buffer.from("existing-binary");
			fs.writeFileSync(path.join(ctx.tempDir, expectedAsset), existingAsset);

			ctx.globalStateStore.set("install_manifest", {
				name: expectedAsset,
				version: "0.3.0",
				asset_timestamp: new Date("2025-12-10T00:00:00Z"),
				release_timestamp: new Date("2025-12-10T00:00:00Z"),
			});

			const releases = GithubFixture.multipleReleases();
			let assetDownloaded = false;

			nock(GITHUB_API).get("/repos/elixir-lang/expert/releases").reply(200, releases);

			nock(GITHUB_API)
				.get(/\/repos\/elixir-lang\/expert\/releases\/assets\/\d+/)
				.reply(200, () => {
					assetDownloaded = true;
					return Buffer.from("should-not-download");
				});

			const result = await Installation.checkAndInstall(ctx.context as any);

			assert.ok(result);
			assert.deepStrictEqual(fs.readFileSync(result), existingAsset);
			assert.strictEqual(assetDownloaded, false, "Asset should not have been downloaded");
		});

		it("auto-upgrades from 0.1.0-rc.X to 0.1.0 stable", async () => {
			const expectedAsset = getExpectedAssetName();
			const oldAsset = Buffer.from("rc-binary");
			fs.writeFileSync(path.join(ctx.tempDir, expectedAsset), oldAsset);

			ctx.globalStateStore.set("install_manifest", {
				name: expectedAsset,
				version: "0.1.0-rc.1",
				asset_timestamp: new Date("2025-11-10T00:00:00Z"),
				release_timestamp: new Date("2025-11-10T00:00:00Z"),
			});

			const releases = [
				GithubFixture.stableRelease("0.1.0", "2025-11-15T00:00:00Z"),
				GithubFixture.releaseCandidate(2, "2025-11-20T00:00:00Z"),
				GithubFixture.releaseCandidate(1, "2025-11-10T00:00:00Z"),
			];
			const newAsset = Buffer.from("stable-binary");

			nock(GITHUB_API).get("/repos/elixir-lang/expert/releases").reply(200, releases);

			nock(GITHUB_API)
				.get(/\/repos\/elixir-lang\/expert\/releases\/assets\/\d+/)
				.reply(200, newAsset);

			const result = await Installation.checkAndInstall(ctx.context as any);

			assert.ok(result);
			assert.deepStrictEqual(fs.readFileSync(result), newAsset);
			const manifest = ctx.globalStateStore.get("install_manifest") as Manifest;
			assert.strictEqual(manifest.version, "0.1.0");
		});

		it("installs 0.1.0-rc.X when no stable 0.1.0 exists", async () => {
			const expectedAsset = getExpectedAssetName();
			const releases = [
				GithubFixture.releaseCandidate(2, "2025-11-20T00:00:00Z"),
				GithubFixture.releaseCandidate(1, "2025-11-10T00:00:00Z"),
			];
			const fakeAsset = Buffer.from("rc-binary");

			nock(GITHUB_API).get("/repos/elixir-lang/expert/releases").reply(200, releases);

			nock(GITHUB_API)
				.get(/\/repos\/elixir-lang\/expert\/releases\/assets\/\d+/)
				.reply(200, fakeAsset);

			const result = await Installation.checkAndInstall(ctx.context as any);

			assert.ok(result, `Should return an install path ending with ${expectedAsset}`);
			assert.ok(result?.includes(expectedAsset), "Result should contain expected asset name");
			const manifest = ctx.globalStateStore.get("install_manifest") as Manifest;
			assert.ok(manifest, "Manifest should be saved");
			assert.strictEqual(manifest.version, "0.1.0-rc.2");
		});
	});

	describe("error handling", () => {
		it("falls back to existing installation when GitHub is unreachable (nightly)", async () => {
			mockConfigValues.values["nightly"] = true;
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

			assert.ok(result);
			assert.ok(
				result.endsWith(expectedAsset),
				`Expected path to end with ${expectedAsset}, got ${result}`,
			);
			assert.ok(fs.existsSync(result));
			assert.deepStrictEqual(ctx.globalStateStore.get("install_manifest"), existingManifest);
		});

		it("falls back to existing when GitHub is unreachable (stable)", async () => {
			mockConfigValues.values["nightly"] = false;
			const expectedAsset = getExpectedAssetName();
			const existingAsset = Buffer.from("existing-binary");
			fs.writeFileSync(path.join(ctx.tempDir, expectedAsset), existingAsset);

			const existingManifest = {
				name: expectedAsset,
				version: "0.1.0",
				asset_timestamp: new Date("2025-11-15T00:00:00Z"),
				release_timestamp: new Date("2025-11-15T00:00:00Z"),
			};
			ctx.globalStateStore.set("install_manifest", existingManifest);

			nock(GITHUB_API).get("/repos/elixir-lang/expert/releases").replyWithError("network error");

			const result = await Installation.checkAndInstall(ctx.context as any);

			assert.ok(result);
			assert.ok(result?.endsWith(expectedAsset));
			assert.deepStrictEqual(ctx.globalStateStore.get("install_manifest"), existingManifest);
		});

		it("falls back to nightly when no stable release available", async () => {
			mockConfigValues.values["nightly"] = false;
			const expectedAsset = getExpectedAssetName();
			const release = GithubFixture.any();
			const fakeAsset = Buffer.from("fake-binary-content");

			nock(GITHUB_API).get("/repos/elixir-lang/expert/releases").reply(200, []);
			nock(GITHUB_API).get("/repos/elixir-lang/expert/releases/tags/nightly").reply(200, release);
			nock(GITHUB_API)
				.get(/\/repos\/elixir-lang\/expert\/releases\/assets\/\d+/)
				.reply(200, fakeAsset);

			const result = await Installation.checkAndInstall(ctx.context as any);

			assert.ok(result);
			assert.ok(result?.endsWith(expectedAsset));
		});

		it("returns undefined and shows error when platform is unsupported", async () => {
			mockConfigValues.values["nightly"] = true;
			const release = GithubFixture.withPlatforms(["fictional_unsupported"]);

			nock(GITHUB_API).get("/repos/elixir-lang/expert/releases/tags/nightly").reply(200, release);

			const result = await Installation.checkAndInstall(ctx.context as any);

			assert.strictEqual(result, undefined);
			assert.strictEqual(ctx.globalStateStore.get("install_manifest"), undefined);
		});

		it("shows notification when no manifest and GitHub is unreachable", async () => {
			mockConfigValues.values["nightly"] = true;
			mockWindowMessages.errors.length = 0;

			nock(GITHUB_API)
				.get("/repos/elixir-lang/expert/releases/tags/nightly")
				.replyWithError("network error");

			const result = await Installation.checkAndInstall(ctx.context as any);

			assert.strictEqual(result, undefined);
			assert.strictEqual(mockWindowMessages.errors.length, 1);
			assert.strictEqual(mockWindowMessages.errors[0][0], "Failed to fetch Expert release.");
			assert.strictEqual(mockWindowMessages.errors[0][1], "Retry");
		});

		it("shows platform mismatch notification when manifest has wrong platform and GitHub is unreachable", async () => {
			mockConfigValues.values["nightly"] = true;
			mockWindowMessages.errors.length = 0;

			const wrongAsset = getWrongPlatformAssetName();
			ctx.globalStateStore.set("install_manifest", {
				name: wrongAsset,
				version: "nightly",
				asset_timestamp: new Date("2025-11-20T00:00:00Z"),
				release_timestamp: new Date("2025-11-20T00:00:00Z"),
			});

			nock(GITHUB_API)
				.get("/repos/elixir-lang/expert/releases/tags/nightly")
				.replyWithError("network error");

			const result = await Installation.checkAndInstall(ctx.context as any);

			const { platform, arch } = getPlatformInfo();
			const manifestPlatform = wrongAsset.replace(/^expert_/, "");

			assert.strictEqual(result, undefined);
			assert.strictEqual(mockWindowMessages.errors.length, 1);
			assert.strictEqual(
				mockWindowMessages.errors[0][0],
				`Current Expert binary is for ${manifestPlatform} but you're on ${platform}_${arch}. Failed to download correct version.`,
			);
			assert.strictEqual(mockWindowMessages.errors[0][1], "Retry");
		});

		it("re-downloads correct binary when manifest has wrong platform and GitHub is reachable", async () => {
			mockConfigValues.values["nightly"] = false;

			const wrongAsset = getWrongPlatformAssetName();
			const expectedAsset = getExpectedAssetName();
			ctx.globalStateStore.set("install_manifest", {
				name: wrongAsset,
				version: "0.3.0",
				asset_timestamp: new Date("2025-12-10T00:00:00Z"),
				release_timestamp: new Date("2025-12-10T00:00:00Z"),
			});

			const releases = GithubFixture.multipleReleases();
			const newAsset = Buffer.from("correct-platform-binary");

			nock(GITHUB_API).get("/repos/elixir-lang/expert/releases").reply(200, releases);
			nock(GITHUB_API)
				.get(/\/repos\/elixir-lang\/expert\/releases\/assets\/\d+/)
				.reply(200, newAsset);

			const result = await Installation.checkAndInstall(ctx.context as any);

			assert.ok(result);
			assert.strictEqual(path.basename(result), expectedAsset);
			assert.deepStrictEqual(fs.readFileSync(result), newAsset);

			const manifest = ctx.globalStateStore.get("install_manifest") as Manifest;
			assert.strictEqual(manifest.name, expectedAsset);
		});
	});
});
