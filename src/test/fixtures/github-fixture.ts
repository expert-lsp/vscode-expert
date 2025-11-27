import { Release as GitHubRelease } from "../../github";

const uploader = {
	login: "github-actions[bot]",
	id: 41898282,
	node_id: "MDM6Qm90NDE4OTgyODI=",
	avatar_url: "https://avatars.githubusercontent.com/in/15368?v=4",
	gravatar_id: "",
	url: "https://api.github.com/users/github-actions%5Bbot%5D",
	html_url: "https://github.com/apps/github-actions",
	followers_url: "https://api.github.com/users/github-actions%5Bbot%5D/followers",
	following_url: "https://api.github.com/users/github-actions%5Bbot%5D/following{/other_user}",
	gists_url: "https://api.github.com/users/github-actions%5Bbot%5D/gists{/gist_id}",
	starred_url: "https://api.github.com/users/github-actions%5Bbot%5D/starred{/owner}{/repo}",
	subscriptions_url: "https://api.github.com/users/github-actions%5Bbot%5D/subscriptions",
	organizations_url: "https://api.github.com/users/github-actions%5Bbot%5D/orgs",
	repos_url: "https://api.github.com/users/github-actions%5Bbot%5D/repos",
	events_url: "https://api.github.com/users/github-actions%5Bbot%5D/events{/privacy}",
	received_events_url: "https://api.github.com/users/github-actions%5Bbot%5D/received_events",
	type: "Bot",
	user_view_type: "public",
	site_admin: false,
};

/**
 * Creates a default nightly release fixture with all supported platforms
 */
export function any(): GitHubRelease {
	return nightlyRelease();
}

/**
 * Creates a nightly release with customizable timestamp
 */
export function nightlyRelease(updatedAt?: string): GitHubRelease {
	const timestamp = updatedAt || "2025-11-22T00:24:06Z";

	return {
		url: "https://api.github.com/repos/elixir-lang/expert/releases/264483024",
		assets_url: "https://api.github.com/repos/elixir-lang/expert/releases/264483024/assets",
		upload_url:
			"https://uploads.github.com/repos/elixir-lang/expert/releases/264483024/assets{?name,label}",
		html_url: "https://github.com/elixir-lang/expert/releases/tag/nightly",
		id: 264483024,
		author: {
			login: "github-actions[bot]",
			id: 41898282,
			node_id: "MDM6Qm90NDE4OTgyODI=",
			avatar_url: "https://avatars.githubusercontent.com/in/15368?v=4",
			gravatar_id: "",
			url: "https://api.github.com/users/github-actions%5Bbot%5D",
			html_url: "https://github.com/apps/github-actions",
			followers_url: "https://api.github.com/users/github-actions%5Bbot%5D/followers",
			following_url: "https://api.github.com/users/github-actions%5Bbot%5D/following{/other_user}",
			gists_url: "https://api.github.com/users/github-actions%5Bbot%5D/gists{/gist_id}",
			starred_url: "https://api.github.com/users/github-actions%5Bbot%5D/starred{/owner}{/repo}",
			subscriptions_url: "https://api.github.com/users/github-actions%5Bbot%5D/subscriptions",
			organizations_url: "https://api.github.com/users/github-actions%5Bbot%5D/orgs",
			repos_url: "https://api.github.com/users/github-actions%5Bbot%5D/repos",
			events_url: "https://api.github.com/users/github-actions%5Bbot%5D/events{/privacy}",
			received_events_url: "https://api.github.com/users/github-actions%5Bbot%5D/received_events",
			type: "Bot",
			user_view_type: "public",
			site_admin: false,
		},
		node_id: "RE_kwDOMzhD084Pw7DQ",
		tag_name: "nightly",
		target_commitish: "main",
		name: null,
		draft: false,
		immutable: false,
		prerelease: true,
		created_at: "2025-11-15T21:10:52Z",
		updated_at: timestamp,
		published_at: timestamp,
		assets: [
			{
				url: "https://api.github.com/repos/elixir-lang/expert/releases/assets/319436622",
				id: 319436622,
				node_id: "RA_kwDOMzhD084TCjdO",
				name: "expert_checksums.txt",
				label: "",
				uploader: uploader,
				content_type: "text/plain; charset=utf-8",
				state: "uploaded",
				size: 443,
				digest: "sha256:3a5baa81ab67a6612359c61d9b8f757871b617bdf48c49de493cd45aab46d97e",
				download_count: 67,
				created_at: timestamp,
				updated_at: timestamp,
				browser_download_url:
					"https://github.com/elixir-lang/expert/releases/download/nightly/expert_checksums.txt",
			},
			{
				url: "https://api.github.com/repos/elixir-lang/expert/releases/assets/319436620",
				id: 319436620,
				node_id: "RA_kwDOMzhD084TCjdM",
				name: "expert_darwin_amd64",
				label: "",
				uploader: uploader,
				content_type: "application/octet-stream",
				state: "uploaded",
				size: 32796506,
				digest: "sha256:193d48f6d7bbd04834836067c82a185c5990cc444b1413ce5b9525aad26f274d",
				download_count: 9,
				created_at: timestamp,
				updated_at: timestamp,
				browser_download_url:
					"https://github.com/elixir-lang/expert/releases/download/nightly/expert_darwin_amd64",
			},
			{
				url: "https://api.github.com/repos/elixir-lang/expert/releases/assets/319436621",
				id: 319436621,
				node_id: "RA_kwDOMzhD084TCjdN",
				name: "expert_darwin_arm64",
				label: "",
				uploader: uploader,
				content_type: "application/octet-stream",
				state: "uploaded",
				size: 32894632,
				digest: "sha256:0d2367a769384a68a598160eab4b42f2633b39dc935d28a22856a1d01fa36faa",
				download_count: 42,
				created_at: timestamp,
				updated_at: timestamp,
				browser_download_url:
					"https://github.com/elixir-lang/expert/releases/download/nightly/expert_darwin_arm64",
			},
			{
				url: "https://api.github.com/repos/elixir-lang/expert/releases/assets/319436619",
				id: 319436619,
				node_id: "RA_kwDOMzhD084TCjdL",
				name: "expert_linux_amd64",
				label: "",
				uploader: uploader,
				content_type: "application/octet-stream",
				state: "uploaded",
				size: 37836568,
				digest: "sha256:bdbe418852f3fda5a1fde760c9e00818e92134247bf52055520bf2d55108b52c",
				download_count: 38,
				created_at: timestamp,
				updated_at: timestamp,
				browser_download_url:
					"https://github.com/elixir-lang/expert/releases/download/nightly/expert_linux_amd64",
			},
			{
				url: "https://api.github.com/repos/elixir-lang/expert/releases/assets/319436623",
				id: 319436623,
				node_id: "RA_kwDOMzhD084TCjdP",
				name: "expert_linux_arm64",
				label: "",
				uploader: uploader,
				content_type: "application/octet-stream",
				state: "uploaded",
				size: 37483416,
				digest: "sha256:f94aea4b96a7f844bfaa0d1441d7d13bc9e864a39c301b522808047e8fba97b6",
				download_count: 5,
				created_at: timestamp,
				updated_at: timestamp,
				browser_download_url:
					"https://github.com/elixir-lang/expert/releases/download/nightly/expert_linux_arm64",
			},
			{
				url: "https://api.github.com/repos/elixir-lang/expert/releases/assets/319436624",
				id: 319436624,
				node_id: "RA_kwDOMzhD084TCjdQ",
				name: "expert_windows_amd64.exe",
				label: "",
				uploader: uploader,
				content_type: "application/x-msdownload",
				state: "uploaded",
				size: 41091584,
				digest: "sha256:2b6284677134e6aa4f7d26cabea47e77f02ad51b91530d1a0c5af518f1fd887d",
				download_count: 4,
				created_at: timestamp,
				updated_at: timestamp,
				browser_download_url:
					"https://github.com/elixir-lang/expert/releases/download/nightly/expert_windows_amd64.exe",
			},
		],
		tarball_url: "https://api.github.com/repos/elixir-lang/expert/tarball/nightly",
		zipball_url: "https://api.github.com/repos/elixir-lang/expert/zipball/nightly",
		body: null,
	};
}

/**
 * Creates a release with only specific platform assets (for testing unsupported platforms)
 */
export function withPlatforms(platforms: string[], updatedAt?: string): GitHubRelease {
	const release = nightlyRelease(updatedAt);

	// Filter assets to only include specified platforms
	release.assets = release.assets.filter((asset) => {
		return platforms.some((platform) => asset.name.includes(platform));
	});

	return release;
}
