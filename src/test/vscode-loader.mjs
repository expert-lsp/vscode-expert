// Loader to redirect "vscode" imports to mock
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const mockPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "vscode-mock.mjs");

// CJS hook (for tsx)
const require = createRequire(import.meta.url);
const Module = require("module");
const orig = Module._resolveFilename;
Module._resolveFilename = (req, ...args) =>
	req === "vscode" ? mockPath : orig.call(Module, req, ...args);
