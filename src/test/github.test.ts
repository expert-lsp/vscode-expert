import assert from "node:assert";
import { describe, it } from "node:test";
import { compareVersions, isStableOrRC, parseVersion, shouldAutoUpgradeFromRC } from "../github";

describe("Version parsing", () => {
	describe("parseVersion", () => {
		it("parses stable versions correctly", () => {
			const v = parseVersion("0.1.0");
			assert.ok(v);
			assert.strictEqual(v.major, 0);
			assert.strictEqual(v.minor, 1);
			assert.strictEqual(v.patch, 0);
			assert.deepStrictEqual(v.prerelease, []);
		});

		it("parses versions with v prefix", () => {
			const v = parseVersion("v0.2.3");
			assert.ok(v);
			assert.strictEqual(v.major, 0);
			assert.strictEqual(v.minor, 2);
			assert.strictEqual(v.patch, 3);
			assert.deepStrictEqual(v.prerelease, []);
		});

		it("parses release candidates", () => {
			const v = parseVersion("0.1.0-rc.1");
			assert.ok(v);
			assert.strictEqual(v.major, 0);
			assert.strictEqual(v.minor, 1);
			assert.strictEqual(v.patch, 0);
			assert.deepStrictEqual(v.prerelease, ["rc", 1]);
		});

		it("parses beta versions", () => {
			const v = parseVersion("0.2.0-beta.3");
			assert.ok(v);
			assert.strictEqual(v.major, 0);
			assert.strictEqual(v.minor, 2);
			assert.strictEqual(v.patch, 0);
			assert.deepStrictEqual(v.prerelease, ["beta", 3]);
		});

		it("returns null for invalid versions", () => {
			assert.strictEqual(parseVersion("invalid"), null);
			assert.strictEqual(parseVersion("nightly"), null);
			assert.strictEqual(parseVersion("1.0"), null);
			assert.strictEqual(parseVersion("1"), null);
		});
	});

	describe("compareVersions", () => {
		it("compares major versions for descending sort", () => {
			const v1 = parseVersion("1.0.0")!;
			const v2 = parseVersion("0.9.9")!;
			assert.strictEqual(compareVersions(v1, v2), -1);
			assert.strictEqual(compareVersions(v2, v1), 1);
		});

		it("compares minor versions for descending sort", () => {
			const v1 = parseVersion("0.2.0")!;
			const v2 = parseVersion("0.1.9")!;
			assert.strictEqual(compareVersions(v1, v2), -1);
			assert.strictEqual(compareVersions(v2, v1), 1);
		});

		it("compares patch versions for descending sort", () => {
			const v1 = parseVersion("0.1.2")!;
			const v2 = parseVersion("0.1.1")!;
			assert.strictEqual(compareVersions(v1, v2), -1);
			assert.strictEqual(compareVersions(v2, v1), 1);
		});

		it("stable comes before prerelease in descending sort", () => {
			const stable = parseVersion("0.1.0")!;
			const rc = parseVersion("0.1.0-rc.1")!;
			assert.strictEqual(compareVersions(stable, rc), -1);
			assert.strictEqual(compareVersions(rc, stable), 1);
		});

		it("compares prerelease versions for descending sort", () => {
			const rc1 = parseVersion("0.1.0-rc.1")!;
			const rc2 = parseVersion("0.1.0-rc.2")!;
			assert.strictEqual(compareVersions(rc2, rc1), -1);
			assert.strictEqual(compareVersions(rc1, rc2), 1);
		});

		it("compares rc prerelease numbers numerically", () => {
			const rc2 = parseVersion("0.1.0-rc.2")!;
			const rc10 = parseVersion("0.1.0-rc.10")!;
			assert.ok(compareVersions(rc10, rc2) < 0);
			assert.ok(compareVersions(rc2, rc10) > 0);
		});

		it("equal versions return 0", () => {
			const v1 = parseVersion("0.1.0")!;
			const v2 = parseVersion("0.1.0")!;
			assert.strictEqual(compareVersions(v1, v2), 0);
		});
	});

	describe("isStableOrRC", () => {
		it("returns true for stable versions", () => {
			const v = parseVersion("0.1.0")!;
			assert.strictEqual(isStableOrRC(v), true);
		});

		it("returns true for 0.1.0 release candidates", () => {
			const v = parseVersion("0.1.0-rc.1")!;
			assert.strictEqual(isStableOrRC(v), true);
		});

		it("returns false for other prerelease versions", () => {
			const beta = parseVersion("0.2.0-beta.1")!;
			const alpha = parseVersion("0.3.0-alpha.1")!;
			const rc = parseVersion("0.2.0-rc.1")!;
			assert.strictEqual(isStableOrRC(beta), false);
			assert.strictEqual(isStableOrRC(alpha), false);
			assert.strictEqual(isStableOrRC(rc), false);
		});
	});

	describe("shouldAutoUpgradeFromRC", () => {
		it("returns true when upgrading from 0.1.0-rc.X to 0.1.0 stable", () => {
			assert.strictEqual(shouldAutoUpgradeFromRC("0.1.0-rc.1", "0.1.0"), true);
			assert.strictEqual(shouldAutoUpgradeFromRC("0.1.0-rc.5", "0.1.0"), true);
		});

		it("returns false for same version", () => {
			assert.strictEqual(shouldAutoUpgradeFromRC("0.1.0", "0.1.0"), false);
			assert.strictEqual(shouldAutoUpgradeFromRC("0.1.0-rc.1", "0.1.0-rc.1"), false);
		});

		it("returns false for other version combinations", () => {
			assert.strictEqual(shouldAutoUpgradeFromRC("0.1.0", "0.2.0"), false);
			assert.strictEqual(shouldAutoUpgradeFromRC("0.2.0-rc.1", "0.2.0"), false);
		});

		it("returns true when upgrading from 0.1.0-rc.X to later stable versions", () => {
			assert.strictEqual(shouldAutoUpgradeFromRC("0.1.0-rc.1", "0.1.1"), true);
			assert.strictEqual(shouldAutoUpgradeFromRC("0.1.0-rc.1", "0.2.0"), true);
		});

		it("returns false for invalid versions", () => {
			assert.strictEqual(shouldAutoUpgradeFromRC("invalid", "0.1.0"), false);
			assert.strictEqual(shouldAutoUpgradeFromRC("0.1.0-rc.1", "invalid"), false);
		});
	});
});
