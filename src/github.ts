import { Endpoints } from "@octokit/types";
import * as Logger from "./logger";

type Releases = Endpoints["GET /repos/{owner}/{repo}/releases"]["response"]["data"];

export type Release =
	Endpoints["GET /repos/{owner}/{repo}/releases/tags/{tag}"]["response"]["data"];

export type Asset =
	Endpoints["GET /repos/{owner}/{repo}/releases/tags/{tag}"]["response"]["data"]["assets"][number];

export const GITHUB_HEADERS = {
	Accept: "application/vnd.github+json",
	"X-GitHub-Api-Version": "2022-11-28",
};

export async function fetchNightlyRelease(): Promise<Release> {
	const response = await fetch(
		"https://api.github.com/repos/elixir-lang/expert/releases/tags/nightly",
		{ headers: GITHUB_HEADERS },
	);

	const nightly = (await response.json()) as Release;

	Logger.info(`Latest release is tagged "${nightly.tag_name}", published at ${nightly.published_at}`);

	return nightly;
}

export async function releases(): Promise<Releases> {
	const response = await fetch("https://api.github.com/repos/elixir-lang/expert/releases", {
		headers: GITHUB_HEADERS,
	});

	return (await response.json()) as Releases;
}
