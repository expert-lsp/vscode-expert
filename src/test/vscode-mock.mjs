// biome-ignore-all lint/suspicious/noEmptyBlockStatements: mocks void functions
// biome-ignore-all lint/suspicious/noExplicitAny: mocks as any

// Mock vscode module for tests
import path from "node:path";

// Mutable configuration for tests
export const mockConfigValues = { values: {} };

export const ConfigurationTarget = {
	Global: 1,
	Workspace: 2,
	WorkspaceFolder: 3,
};

// URI implementation matching vscode.Uri API
function createUri(scheme, authority, path, query, fragment) {
	const fsPath = scheme === "file" ? path : "";
	return {
		scheme,
		authority,
		path,
		query,
		fragment,
		fsPath,
		toString: () => {
			if (scheme === "file") {
				return `file://${path}`;
			}
			let result = `${scheme}://`;
			if (authority) result += authority;
			result += path;
			if (query) result += `?${query}`;
			if (fragment) result += `#${fragment}`;
			return result;
		},
	};
}

export const Uri = {
	file: (filePath) => createUri("file", "", filePath, "", ""),
	parse: (value) => {
		const url = new URL(value);
		return createUri(
			url.protocol.replace(":", ""),
			url.host,
			url.pathname,
			url.search.replace("?", ""),
			url.hash.replace("#", ""),
		);
	},
	joinPath: (base, ...segments) => {
		// Support both full Uri objects and simple { fsPath } objects from test contexts
		const basePath = base.path ?? base.fsPath;
		return createUri(
			base.scheme ?? "file",
			base.authority ?? "",
			path.join(basePath, ...segments),
			base.query ?? "",
			base.fragment ?? "",
		);
	},
};

export const window = {
	showErrorMessage: (...args) => {
		mockWindowMessages.errors.push(args);
		return Promise.resolve(undefined);
	},
	showInformationMessage: (...args) => {
		mockWindowMessages.info.push(args);
		return Promise.resolve(undefined);
	},
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

export const commands = {
	registerCommand: () => ({ dispose: () => {} }),
};

// Track update calls for assertions
export const mockUpdateCalls = { calls: [] };

// Track window message calls for assertions
export const mockWindowMessages = { errors: [], info: [] };

export const workspace = {
	getConfiguration: () => {
		const config = {
			get: (key, defaultValue) =>
				key in mockConfigValues.values ? mockConfigValues.values[key] : defaultValue,
			update: (key, value, target) => {
				mockUpdateCalls.calls.push({ key, value, target });
				return Promise.resolve();
			},
			getConfiguration: () => config,
		};
		return config;
	},
	workspaceFolders: [{ uri: { path: "/test/workspace" } }],
};
