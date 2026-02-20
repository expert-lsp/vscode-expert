<!-- Can replace these with the proper shields at a later date.
[![Discord](https://img.shields.io/badge/Discord-5865F3?style=flat&logo=discord&logoColor=white&link=https://discord.gg/FvdkuVyted)](https://discord.gg/FvdkuVyted)
![GitHub Workflow Status (with event)](https://img.shields.io/github/actions/workflow/status/lexical-lsp/vscode-lexical/workflow.yml)
[![Number of installs](https://img.shields.io/visual-studio-marketplace/i/lexical-lsp.lexical)](https://marketplace.visualstudio.com/items?itemName=lexical-lsp.lexical) -->

# Expert

The official language extension for Expert, Elixir's offical language server.

## ⚠️ Early Access ⚠️

Expert is currently in pre-1.0 early access. Pull requests and issues are welcome in the offical [GitHub repo](https://github.com/elixir-lang/expert). 

## Features

The Expert extension consists of the following components and features:

### Syntax Highlighting Grammars

TextMate grammars that provide syntax highlighting for Elixir source code files (`.ex` and `.exs`), including Embedded Elixir (`*.eex`). For syntax highlighting in HTML-aware Embedded Elixir (`*.heex`), please install the [Phoenix Framework extension](https://marketplace.visualstudio.com/items?itemName=phoenixframework.phoenix).

### Expert Language Server

* Code completions
* On-Demand code formatting (triggered by `Alt + Shift + F` hotkey or enabling `editor.formatOnSave`)
* Diagnostics (In-editor annotations of compiler warnings and errors)
* Code actions (extract to variable, extract to alias, etc)
* Symbol search (`Command + T` hotkey)
* File outlines
* Go to definition/reference
* In-editor documentation (on completion and hover)

## Using the extension

Expert releases are currently published nightly. This extension will automatically download and install the latest relased from GitHub when starting up.

Alternatively, you may opt to build Expert from source and point this extension at it via the [`expert.server.releasePathOverride` configuration option](#expertserverreleasepathoverride).

## Configuration

### expert.server.releasePathOverride

Tells the extension to use a local release of the Expert language server instead of the automatically installed one. This path should point to Expert's executable, typically located at `/path/to/expert/apps/expert/burrito_out/expert_darwin_arm64`.


### expert.notifyOnServerAutoUpdate

Controls whether notifications are shown after automatic installs of new Expert versions. Defaults to `true`.

### expert.server.nightly

When set to `true`, the extension will install the latest nightly release of Expert instead of stable releases. Nightly builds contain the latest features but may be less stable. Defaults to `false`.

> [!NOTE]
> During the 0.1.0 release cycle, 0.1.0 release candidates are considered stable releases and will be installed when this setting is `false`.

### Editor Configuration

The extension provides a language configuration for Elixir which marks `do`/`end` and `fn`/`end` as brackets. Among other things, this enables colorization of `do`/`end` and `fn`/`end` with VSCode's `editor.bracketPairColorization.enabled` setting. While this can be helpful when searching for a `do`'s corresponding `end`, some users may prefer to use the standard keyword coloring, while still highlighting parenthesis and other brackets. This can be achieved by adding the following to your VSCode configuration.

```jsonc
"editor.bracketPairColorization.enabled": true,
"[elixir]": {
  "editor.language.colorizedBracketPairs": [
    ["{", "}"],
    ["[", "]"],
    ["(", ")"]
  ]
}
```

### Compatability

Expert tentatively targets support for Elixir `>= 1.15.3` and OTP `>= 25.0`.

## Troubleshooting

Expert outputs logs to two different files:

- `expert.log`: Contains logs for the language server node, which handles all the LSP communication, code intelligence, etc.
- `project.log`: Contains logs for the project node, which handles loading and compiling your project.

Additionally, the Expert channel in VSCode's Output tab may contain some pertinent information, notably if/when Expert fails to start before log files are initialized.

### Frequent issues and questions

#### I'm not getting syntax highlighting for HEEx

The syntax highlighting grammar for HEEx (`~H` sigils and `*.heex` files) is maintained and provided by the [Phoenix Framework extension](https://marketplace.visualstudio.com/items?itemName=phoenixframework.phoenix). While HEEx is quite similar to EEx, it isn't part of Elixir's standard library.

#### I'm getting rate limited by GitHub when the extension tries to download Expert releases

If you are hitting Github's rate limits for unauthenticated users when the extension tries to download Expert releases, you can log in with Github.
Open the command palette (`Command + Shift + P`), search for "Expert: Sign in with GitHub", and follow the instructions.

### Support

If you have questions or need help, please refer to one of the following channels:

<!--
* The [issues on the vscode-expert project](https://github.com/elixir-lang/vscode-expert/issues)
* The [issues on the Expert project](https://github.com/elixir-lang/vscode-expert/issues)
-->
* The `#editor-tooling` channel in the [Elixir Discord server](https://discord.gg/elixir)

### Acknowledgements

The Expert extension was derived from the [vscode-lexical plugin](https://github.com/lexical-lsp/vscode-lexical) authored by Étienne Lévesque (aka [Blond11516](https://github.com/Blond11516)).
