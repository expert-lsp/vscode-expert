// Mock vscode module for tests
import path from "node:path";

export const Uri = {
	joinPath: (base, ...segments) => ({ fsPath: path.join(base.fsPath, ...segments) }),
};

export const window = {
	showErrorMessage: () => Promise.resolve(undefined),
	showInformationMessage: () => Promise.resolve(undefined),
	createOutputChannel: () => ({
		append: () => {},
		appendLine: () => {},
		clear: () => {},
		dispose: () => {},
		hide: () => {},
		show: () => {},
		info: () => {},
		warn: () => {},
		error: () => {},
		debug: () => {},
		trace: () => {},
	}),
};

export const l10n = {
	t: (message) => message,
};
