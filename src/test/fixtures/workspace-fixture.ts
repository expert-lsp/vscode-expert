import type { Uri, workspace as vsWorkspace } from "vscode";

export function withUri(uri: Uri): typeof vsWorkspace {
	return {
		workspaceFolders: [{ uri }],
	} as unknown as typeof vsWorkspace;
}
