export const mockConfigValues: { values: Record<string, unknown> };
export const mockUpdateCalls: { calls: Array<{ key: string; value: unknown; target: number }> };
export const mockWindowMessages: { errors: unknown[][]; info: unknown[][] };
export const ConfigurationTarget: { Global: 1; Workspace: 2; WorkspaceFolder: 3 };

interface MockUri {
	scheme: string;
	authority: string;
	path: string;
	query: string;
	fragment: string;
	fsPath: string;
	toString: () => string;
}

export const Uri: {
	file: (path: string) => MockUri;
	parse: (value: string) => MockUri;
	joinPath: (base: MockUri, ...segments: string[]) => MockUri;
};
export const window: {
	showErrorMessage: () => Promise<undefined>;
	showInformationMessage: () => Promise<undefined>;
	createOutputChannel: () => Record<string, () => void>;
};
export const l10n: { t: (message: string) => string };
export const commands: { registerCommand: () => { dispose: () => void } };
export const workspace: {
	getConfiguration: () => {
		get: <T>(key: string, defaultValue?: T) => T;
		update: (key: string, value: unknown, target: number) => Promise<void>;
		getConfiguration: () => ReturnType<typeof workspace.getConfiguration>;
	};
	workspaceFolders: Array<{ uri: { path: string } }>;
};
