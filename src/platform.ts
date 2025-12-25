import * as os from "os";

export type Platform =
	| "aix"
	| "darwin"
	| "freebsd"
	| "linux"
	| "openbsd"
	| "sunos"
	| "win32"
	| "windows";

export type Architecture =
	| "amd64" // == x64
	| "arm"
	| "arm64"
	| "ia32"
	| "loong64"
	| "mips"
	| "mipsel"
	| "ppc"
	| "ppc64"
	| "riscv64"
	| "s390"
	| "s390x"
	| "x64";

export interface PlatformInfo {
	platform: string;
	arch: string;
}

/**
 * Returns the current platform and architecture, using the aliases
 * expected by Expert's CI pipeline (win32 -> windows, x64 -> amd64).
 */
export function getPlatformInfo(): PlatformInfo {
	let platform = os.platform() as string;
	let arch = os.arch() as string;

	// Swap in the aliases currently used by Expert's CI pipeline
	platform = platform === "win32" ? "windows" : platform;
	arch = arch === "x64" ? "amd64" : arch;

	return { platform, arch };
}

/**
 * Returns the expected asset name for the current platform (e.g., "expert_darwin_arm64").
 */
export function getExpectedAssetName(): string {
	const { platform, arch } = getPlatformInfo();
	return `expert_${platform}_${arch}`;
}
