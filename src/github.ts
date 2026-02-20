import { Endpoints } from "@octokit/types";
import semver, { SemVer } from "semver";
import * as Logger from "./logger";

export function parseVersion(tag: string): SemVer | null {
	return semver.parse(tag);
}

export function compareVersions(a: SemVer, b: SemVer): number {
	return semver.compare(b, a);
}

export function isStableOrRC(version: SemVer): boolean {
	if (version.prerelease.length === 0) {
		return true;
	}
	if (version.major === 0 && version.minor === 1 && version.patch === 0) {
		return version.prerelease[0] === "rc";
	}
	return false;
}

export function shouldAutoUpgradeFromRC(currentVersion: string, newVersion: string): boolean {
	const current = parseVersion(currentVersion);
	const newV = parseVersion(newVersion);

	if (!current || !newV) {
		return false;
	}

	const isRc =
		current.major === 0 &&
		current.minor === 1 &&
		current.patch === 0 &&
		current.prerelease[0] === "rc";
	const isStable = newV.prerelease.length === 0 && semver.gte(newV, "0.1.0");

	return isRc && isStable;
}

type Releases = Endpoints["GET /repos/{owner}/{repo}/releases"]["response"]["data"];

export type Release =
	Endpoints["GET /repos/{owner}/{repo}/releases/tags/{tag}"]["response"]["data"];

export type Asset =
	Endpoints["GET /repos/{owner}/{repo}/releases/tags/{tag}"]["response"]["data"]["assets"][number];

export const GITHUB_HEADERS = {
	Accept: "application/vnd.github+json",
	"X-GitHub-Api-Version": "2022-11-28",
};

function getHeaders(authToken?: string): Record<string, string> {
	const headers: Record<string, string> = { ...GITHUB_HEADERS };
	if (authToken) {
		headers.Authorization = `Bearer ${authToken}`;
	}
	return headers;
}

export async function fetchNightlyRelease(authToken?: string): Promise<Release> {
	const url = "https://api.github.com/repos/elixir-lang/expert/releases/tags/nightly";

	const response: Response = await fetch(url, { headers: getHeaders(authToken) }).catch((e) => {
		const errorMessage = e instanceof Error ? e.message : String(e);
		Logger.error(`Failed to connect to GitHub API at ${url}: ${errorMessage}`);
		throw new Error(`Failed to connect to GitHub API: ${errorMessage}`);
	});

	if (!response.ok) {
		const status = response.status;
		const statusText = response.statusText;
		const errorBody = await response.text();
		Logger.error(
			`GitHub API returned error status for nightly release: ${status} ${statusText} (URL: ${url})`,
		);
		Logger.error(`GitHub API error response body: ${errorBody}`);
		throw new Error(`GitHub API error: ${status} ${statusText} - ${url}`);
	}

	const nightly = (await response.json()) as Release;

	Logger.info(
		`Latest release is tagged "${nightly.tag_name}", published at ${nightly.published_at}`,
	);

	return nightly;
}

export async function releases(authToken?: string): Promise<Releases> {
	const url = "https://api.github.com/repos/elixir-lang/expert/releases";

	const response: Response = await fetch(url, { headers: getHeaders(authToken) }).catch((e) => {
		const errorMessage = e instanceof Error ? e.message : String(e);
		Logger.error(`Failed to connect to GitHub API at ${url}: ${errorMessage}`);
		throw new Error(`Failed to connect to GitHub API: ${errorMessage}`);
	});

	if (!response.ok) {
		const status = response.status;
		const statusText = response.statusText;
		const errorBody = await response.text();
		Logger.error(
			`GitHub API returned error status for releases list: ${status} ${statusText} (URL: ${url})`,
		);
		Logger.error(`GitHub API error response body: ${errorBody}`);
		throw new Error(`GitHub API error: ${status} ${statusText} - ${url}`);
	}

	return (await response.json()) as Releases;
}

export async function fetchStableRelease(authToken?: string): Promise<Release | null> {
	const allReleases = await releases(authToken);

	const stableReleases = allReleases.filter((release) => {
		if (release.draft) {
			return false;
		}
		const version = parseVersion(release.tag_name);
		if (!version) {
			return false;
		}
		return isStableOrRC(version);
	});

	if (stableReleases.length === 0) {
		Logger.warn("No stable releases found on GitHub");
		return null;
	}

	const sortedReleases = stableReleases.sort((a, b) => {
		const versionA = parseVersion(a.tag_name);
		const versionB = parseVersion(b.tag_name);
		if (!versionA || !versionB) {
			return 0;
		}
		return compareVersions(versionA, versionB);
	});

	const latest = sortedReleases[0];

	Logger.info(
		`Latest stable release is tagged "${latest.tag_name}", published at ${latest.published_at}`,
	);

	return latest;
}
