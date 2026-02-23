// biome-ignore-all lint/suspicious/noEmptyBlockStatements: mocks void functions
import assert from "node:assert";
import { before, beforeEach, describe, it, type Mock, mock } from "node:test";
import {
	mockClipboard,
	mockQuickPick,
	mockWarningMessage,
	mockWindowMessages,
} from "./vscode-mock.mjs";

interface MockSpawnProcess {
	stdin: {
		write: Mock<(data: string) => boolean>;
		end: Mock<() => void>;
	};
	emitStdout: (data: Buffer) => void;
	emitClose: (code: number | null) => void;
}

type ExecResponse = { stdout: string; stderr: string } | Error;

let nextExecResponse: ExecResponse = { stdout: "", stderr: "" };
let lastSpawnProcess: MockSpawnProcess | undefined;
let binaryPathValue: string | undefined = "/test/expert";

function createMockSpawnResult() {
	const stdoutHandlers: Array<(data: Buffer) => void> = [];
	const closeHandlers: Array<(code: number | null) => void> = [];

	const stdinWrite: Mock<(data: string) => boolean> = mock.fn((_data: string) => true);
	const stdinEnd: Mock<() => void> = mock.fn(() => {});

	const proc = {
		stdin: { write: stdinWrite, end: stdinEnd },
		stdout: {
			on: (_event: string, handler: (data: Buffer) => void) => {
				stdoutHandlers.push(handler);
			},
		},
		stderr: {
			on: (_event: string, _handler: (data: Buffer) => void) => {},
		},
		on: (event: string, handler: (arg: number | null | Error) => void) => {
			if (event === "close") {
				closeHandlers.push(handler as (code: number | null) => void);
			}
		},
		emitStdout: (data: Buffer) => stdoutHandlers.forEach((h) => h(data)),
		emitClose: (code: number | null) => closeHandlers.forEach((h) => h(code)),
	};

	lastSpawnProcess = proc;
	return proc;
}

describe("Engine management", () => {
	let Engine: typeof import("../engine");

	before(async () => {
		mock.module("child_process", {
			namedExports: {
				exec: (
					_command: string,
					callback: (err: Error | null, stdout: string, stderr: string) => void,
				) => {
					const res = nextExecResponse;
					nextExecResponse = { stdout: "", stderr: "" };
					if (res instanceof Error) {
						callback(res, "", res.message);
					} else {
						callback(null, res.stdout, res.stderr);
					}
				},
				spawn: (_command: string, _args: string[], _options: unknown) => createMockSpawnResult(),
			},
		});

		mock.module("../extension", {
			namedExports: {
				getExpertBinaryPath: async () => binaryPathValue,
			},
		});

		mock.module("../logger", {
			namedExports: {
				info: () => {},
				error: () => {},
				warn: () => {},
				outputChannel: () => ({
					append: () => {},
					appendLine: () => {},
					clear: () => {},
					dispose: () => {},
					hide: () => {},
					show: () => {},
				}),
			},
		});

		Engine = await import("../engine");
	});

	beforeEach(() => {
		nextExecResponse = { stdout: "", stderr: "" };
		lastSpawnProcess = undefined;
		binaryPathValue = "/test/expert";
		mockQuickPick.nextValue = undefined;
		mockQuickPick.calls.length = 0;
		mockWarningMessage.nextResponse = "Delete";
		mockClipboard.writes.length = 0;
		mockWindowMessages.errors.length = 0;
		mockWindowMessages.info.length = 0;
	});

	describe("parseEngineList", () => {
		it("parses simple engine paths", () => {
			const output = [
				"/Users/dorgan/Library/Application Support/Expert/0.1.0/ex-1.19.1-erl-16.1.2",
				"/Users/dorgan/Library/Application Support/Expert/0.1.0-rc.0/elixir-1.18.4-erts-15.2.7.4",
			].join("\n");

			const builds = Engine.parseEngineList(output);

			assert.strictEqual(builds.length, 2);
			assert.strictEqual(
				builds[0].path,
				"/Users/dorgan/Library/Application Support/Expert/0.1.0/ex-1.19.1-erl-16.1.2",
			);
			assert.strictEqual(
				builds[1].path,
				"/Users/dorgan/Library/Application Support/Expert/0.1.0-rc.0/elixir-1.18.4-erts-15.2.7.4",
			);
		});

		it("handles empty output", () => {
			assert.strictEqual(Engine.parseEngineList("").length, 0);
		});

		it("handles output with only whitespace", () => {
			assert.strictEqual(Engine.parseEngineList("   \n\t\n   ").length, 0);
		});

		it("handles Windows paths", () => {
			const output = [
				"C:\\Users\\test\\AppData\\Local\\Expert\\0.1.0\\ex-1.19.1-erl-16.1.2",
				"C:\\Users\\test\\AppData\\Local\\Expert\\0.1.0-rc.0\\elixir-1.18.4-erts-15.2.7.4",
			].join("\n");

			const builds = Engine.parseEngineList(output);

			assert.strictEqual(builds.length, 2);
			assert.strictEqual(
				builds[0].path,
				"C:\\Users\\test\\AppData\\Local\\Expert\\0.1.0\\ex-1.19.1-erl-16.1.2",
			);
		});

		it("ignores non-path lines", () => {
			const output = [
				"Some header text",
				"/Users/dorgan/Library/Application Support/Expert/0.1.0/ex-1.19.1-erl-16.1.2",
				"More text",
				"/Users/dorgan/Library/Application Support/Expert/0.1.0-rc.0/elixir-1.18.4-erts-15.2.7.4",
			].join("\n");

			const builds = Engine.parseEngineList(output);

			assert.strictEqual(builds.length, 2);
			assert.strictEqual(
				builds[0].path,
				"/Users/dorgan/Library/Application Support/Expert/0.1.0/ex-1.19.1-erl-16.1.2",
			);
			assert.strictEqual(
				builds[1].path,
				"/Users/dorgan/Library/Application Support/Expert/0.1.0-rc.0/elixir-1.18.4-erts-15.2.7.4",
			);
		});
	});

	describe("listEngines", () => {
		it("shows error when binary not found", async () => {
			binaryPathValue = undefined;

			await Engine.listEngines();

			assert.strictEqual(mockWindowMessages.errors.length, 1);
			assert.ok((mockWindowMessages.errors[0][0] as string).includes("Expert binary not found"));
		});

		it("shows no builds message when list is empty", async () => {
			nextExecResponse = { stdout: "", stderr: "" };

			await Engine.listEngines();

			assert.strictEqual(mockWindowMessages.info.length, 1);
			assert.ok((mockWindowMessages.info[0][0] as string).includes("No engine builds found"));
		});

		it("shows builds in quick pick", async () => {
			const path1 = "/Users/dorgan/Library/Application Support/Expert/0.1.0/ex-1.19.1-erl-16.1.2";
			const path2 =
				"/Users/dorgan/Library/Application Support/Expert/0.1.0-rc.0/elixir-1.18.4-erts-15.2.7.4";
			nextExecResponse = { stdout: [path1, path2].join("\n"), stderr: "" };

			await Engine.listEngines();

			assert.strictEqual(mockQuickPick.calls.length, 1);
			const items = mockQuickPick.calls[0].items as Array<{ label: string }>;
			assert.strictEqual(items.length, 2);
			assert.ok(items[0].label.includes("0.1.0/ex-1.19.1"));
			assert.ok(items[1].label.includes("0.1.0-rc.0/elixir-1.18.4"));
		});

		it("copies path to clipboard when user selects a build", async () => {
			const testPath =
				"/Users/dorgan/Library/Application Support/Expert/0.1.0/ex-1.19.1-erl-16.1.2";
			nextExecResponse = { stdout: testPath, stderr: "" };
			mockQuickPick.nextValue = { path: testPath, label: testPath };

			await Engine.listEngines();

			assert.strictEqual(mockClipboard.writes.length, 1);
			assert.strictEqual(mockClipboard.writes[0], testPath);
		});

		it("handles exec errors", async () => {
			nextExecResponse = new Error("Command failed");

			await Engine.listEngines();

			assert.strictEqual(mockWindowMessages.errors.length, 1);
			assert.ok(
				(mockWindowMessages.errors[0][0] as string).includes("Failed to list engine builds"),
			);
		});
	});

	describe("cleanEngines", () => {
		it("shows error when binary not found", async () => {
			binaryPathValue = undefined;

			await Engine.cleanEngines();

			assert.strictEqual(mockWindowMessages.errors.length, 1);
			assert.ok((mockWindowMessages.errors[0][0] as string).includes("Expert binary not found"));
		});

		it("shows no builds message when list is empty", async () => {
			nextExecResponse = { stdout: "", stderr: "" };

			await Engine.cleanEngines();

			assert.strictEqual(mockWindowMessages.info.length, 1);
			assert.ok((mockWindowMessages.info[0][0] as string).includes("No engine builds found"));
		});

		it("displays builds in multi-select quick pick", async () => {
			const path1 = "/Users/dorgan/Library/Application Support/Expert/0.1.0/ex-1.19.1-erl-16.1.2";
			const path2 =
				"/Users/dorgan/Library/Application Support/Expert/0.1.0-rc.0/elixir-1.18.4-erts-15.2.7.4";
			nextExecResponse = { stdout: [path1, path2].join("\n"), stderr: "" };
			mockQuickPick.nextValue = [];

			await Engine.cleanEngines();

			assert.strictEqual(mockQuickPick.calls.length, 1);
			assert.strictEqual(
				(mockQuickPick.calls[0].options as { canPickMany: boolean }).canPickMany,
				true,
			);
			assert.strictEqual(mockQuickPick.calls[0].items.length, 2);
		});

		it("does nothing when user cancels selection", async () => {
			const path = "/Users/dorgan/Library/Application Support/Expert/0.1.0/ex-1.19.1-erl-16.1.2";
			nextExecResponse = { stdout: path, stderr: "" };
			mockQuickPick.nextValue = [];

			await Engine.cleanEngines();

			assert.strictEqual(lastSpawnProcess, undefined);
		});

		it("does nothing when user rejects confirmation", async () => {
			const path = "/Users/dorgan/Library/Application Support/Expert/0.1.0/ex-1.19.1-erl-16.1.2";
			nextExecResponse = { stdout: path, stderr: "" };
			mockQuickPick.nextValue = [{ path, label: path }];
			mockWarningMessage.nextResponse = undefined;

			await Engine.cleanEngines();

			assert.strictEqual(lastSpawnProcess, undefined);
		});

		it("responds Y to prompts for selected engines", async () => {
			const selectedPath =
				"/Users/dorgan/Library/Application Support/Expert/0.1.0/ex-1.19.1-erl-16.1.2";
			const unselectedPath =
				"/Users/dorgan/Library/Application Support/Expert/0.1.0-rc.0/elixir-1.18.4-erts-15.2.7.4";
			nextExecResponse = { stdout: [selectedPath, unselectedPath].join("\n"), stderr: "" };
			mockQuickPick.nextValue = [{ path: selectedPath, label: selectedPath }];

			const cleanPromise = Engine.cleanEngines();
			await flushAsync();

			const proc = lastSpawnProcess!;
			proc.emitStdout(Buffer.from(`Delete ${selectedPath}? [Yn]`));
			proc.emitClose(0);
			await cleanPromise;

			assert.ok(proc.stdin.write.mock.calls.some((c) => c.arguments[0] === "Y\n"));
		});

		it("responds n to prompts for unselected engines", async () => {
			const selectedPath =
				"/Users/dorgan/Library/Application Support/Expert/0.1.0/ex-1.19.1-erl-16.1.2";
			const unselectedPath =
				"/Users/dorgan/Library/Application Support/Expert/0.1.0-rc.0/elixir-1.18.4-erts-15.2.7.4";
			nextExecResponse = { stdout: [selectedPath, unselectedPath].join("\n"), stderr: "" };
			mockQuickPick.nextValue = [{ path: selectedPath, label: selectedPath }];

			const cleanPromise = Engine.cleanEngines();
			await flushAsync();

			const proc = lastSpawnProcess!;
			proc.emitStdout(Buffer.from(`Delete ${unselectedPath}? [Yn]`));
			proc.emitClose(0);
			await cleanPromise;

			assert.ok(proc.stdin.write.mock.calls.some((c) => c.arguments[0] === "n\n"));
		});

		it("shows success message when clean completes", async () => {
			const selectedPath =
				"/Users/dorgan/Library/Application Support/Expert/0.1.0/ex-1.19.1-erl-16.1.2";
			nextExecResponse = { stdout: selectedPath, stderr: "" };
			mockQuickPick.nextValue = [{ path: selectedPath, label: selectedPath }];

			const cleanPromise = Engine.cleanEngines();
			await flushAsync();

			lastSpawnProcess!.emitClose(0);
			await cleanPromise;

			assert.ok(mockWindowMessages.info.some((m) => (m[0] as string).includes("Deleted")));
		});

		it("shows error message when clean fails", async () => {
			const selectedPath =
				"/Users/dorgan/Library/Application Support/Expert/0.1.0/ex-1.19.1-erl-16.1.2";
			nextExecResponse = { stdout: selectedPath, stderr: "" };
			mockQuickPick.nextValue = [{ path: selectedPath, label: selectedPath }];

			const cleanPromise = Engine.cleanEngines();
			await flushAsync();

			lastSpawnProcess!.emitClose(1);
			await cleanPromise;

			assert.ok(
				mockWindowMessages.errors.some((m) =>
					(m[0] as string).includes("Failed to clean engine builds"),
				),
			);
		});
	});
});

function flushAsync(): Promise<void> {
	return new Promise((resolve) => setImmediate(resolve));
}
