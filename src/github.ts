import * as Logger from "./logger";
import { Endpoints } from "@octokit/types";

export type Release =
	Endpoints["GET /repos/{owner}/{repo}/releases/tags/{tag}"]["response"]["data"];

export type Asset =
	Endpoints["GET /repos/{owner}/{repo}/releases/tags/{tag}"]["response"]["data"]["assets"][number];

export const GITHUB_HEADERS = {
	Accept: "application/vnd.github+json",
	"X-GitHub-Api-Version": "2022-11-28",
};

export async function fetchNightlyRelease() {
	const response = await fetch(
		"https://api.github.com/repos/elixir-lang/expert/releases/tags/nightly",
		{ headers: GITHUB_HEADERS },
	);

	const nightly = (await response.json()) as Release;

	Logger.info(`Latest release is "${nightly.name}"`);

	return nightly;
}
