# Change Log

## [0.3.0](https://github.com/expert-lsp/vscode-expert/compare/v0.2.2...v0.3.0) (2026-02-20)


### Features

* allow github authentication ([#25](https://github.com/expert-lsp/vscode-expert/issues/25)) ([c89ff3a](https://github.com/expert-lsp/vscode-expert/commit/c89ff3a8787ff84639923cf119e3eeafb75ce4de))

## [0.2.2](https://github.com/expert-lsp/vscode-expert/compare/v0.2.1...v0.2.2) (2026-02-20)


### Bug Fixes

* add logs for request errors ([#23](https://github.com/expert-lsp/vscode-expert/issues/23)) ([68606dc](https://github.com/expert-lsp/vscode-expert/commit/68606dc68c7394a34b1dbf3c03b54c67f9eacfc4))

## [0.2.1](https://github.com/expert-lsp/vscode-expert/compare/v0.2.0...v0.2.1) (2026-02-19)


### Bug Fixes

* ensure only the asset for the current platform is used ([#20](https://github.com/expert-lsp/vscode-expert/issues/20)) ([761cc57](https://github.com/expert-lsp/vscode-expert/commit/761cc5747ece0d747eb02a0101a070b9903d6341)), closes [#21](https://github.com/expert-lsp/vscode-expert/issues/21)

## [0.2.0](https://github.com/expert-lsp/vscode-expert/compare/v0.1.1...v0.2.0) (2026-02-17)


### Features

* nightly option and automatically upgrade to rc or stable ([#16](https://github.com/expert-lsp/vscode-expert/issues/16)) ([e732fdb](https://github.com/expert-lsp/vscode-expert/commit/e732fdbbeb5995edab59560df27dd8af98aa81f7))

## [0.1.1](https://github.com/expert-lsp/vscode-expert/compare/v0.1.0...v0.1.1) (2026-01-28)


### Bug Fixes

* line comment definition ([#11](https://github.com/expert-lsp/vscode-expert/issues/11)) ([6a5060f](https://github.com/expert-lsp/vscode-expert/commit/6a5060f49db4e5ac8e1dbe30000c8ac516905ec6))

## [0.1.0](https://github.com/expert-lsp/vscode-expert/compare/v0.0.1...v0.1.0) (2026-01-17)


### Features

* Add a notification after auto-installing a new version of Lexical ([#81](https://github.com/expert-lsp/vscode-expert/issues/81)) ([9d401b9](https://github.com/expert-lsp/vscode-expert/commit/9d401b951b2a483d2a3a2120324e040f6b27ccb5))
* Add a reindex command ([#80](https://github.com/expert-lsp/vscode-expert/issues/80)) ([bfb2071](https://github.com/expert-lsp/vscode-expert/commit/bfb20714991fd6c9fb3c4584c67c431219eb51fb))
* Add configuration option to enable LSP tracing ([086ff4b](https://github.com/expert-lsp/vscode-expert/commit/086ff4b05a9ecd7036e2d12b23d15ddd5c28e04b))
* Add configuration option to enable LSP tracing ([848a475](https://github.com/expert-lsp/vscode-expert/commit/848a475603d29b04054a88128ddbe1769b820bbf))
* Adds a Logger module which unifies production and development logging ([#69](https://github.com/expert-lsp/vscode-expert/issues/69)) ([3397eac](https://github.com/expert-lsp/vscode-expert/commit/3397eacbffffb95a6aeba71240b115d1d423f93b))
* Allow specifying a subdirectory in which to start Lexical ([#66](https://github.com/expert-lsp/vscode-expert/issues/66)) ([5f135b1](https://github.com/expert-lsp/vscode-expert/commit/5f135b1d7e4a51713aef015ec0888726b37bad8e))
* Auto install lexical on extension activation ([5a7b1de](https://github.com/expert-lsp/vscode-expert/commit/5a7b1de0672dbb964e9bb586f57a98c31e449854))
* Download and install latest github release ([#12](https://github.com/expert-lsp/vscode-expert/issues/12)) ([f313311](https://github.com/expert-lsp/vscode-expert/commit/f313311946099ce4d4e073798609545fa05031f5))
* Fallback to installed version if installation fails ([#56](https://github.com/expert-lsp/vscode-expert/issues/56)) ([6dc0d92](https://github.com/expert-lsp/vscode-expert/commit/6dc0d92d518f05a51c8e952f1a7219d1341fc700))
* Make the extenxion's display name more descriptive ([#55](https://github.com/expert-lsp/vscode-expert/issues/55)) ([2752bbf](https://github.com/expert-lsp/vscode-expert/commit/2752bbfbcc721424c36ada87d6a6cd134a16a3ca))
* Provide restart command ([#52](https://github.com/expert-lsp/vscode-expert/issues/52)) ([9bccc97](https://github.com/expert-lsp/vscode-expert/commit/9bccc979a9df59e841dd38eb38b82c38e6c81980))
* Send EEx and HEEx documents to Lexical ([#33](https://github.com/expert-lsp/vscode-expert/issues/33)) ([bc3d465](https://github.com/expert-lsp/vscode-expert/commit/bc3d465661f647b53883304b1e0e8ff9dd671b87))
* Support installing semantic versioned release from github ([#27](https://github.com/expert-lsp/vscode-expert/issues/27)) ([cc46c00](https://github.com/expert-lsp/vscode-expert/commit/cc46c002bc63efd406d7a869c730382e3a6fe074))
* Support lexical's new packaging structure ([#40](https://github.com/expert-lsp/vscode-expert/issues/40)) ([ac651cc](https://github.com/expert-lsp/vscode-expert/commit/ac651cc9f48a2958ae4bae2159dfff861650af53))
* Use ESBuild to bundle extension ([#26](https://github.com/expert-lsp/vscode-expert/issues/26)) ([f971c2d](https://github.com/expert-lsp/vscode-expert/commit/f971c2d626d6a73c669bc8d011079e8de8b32936))


### Bug Fixes

* Change logo in README from svg to png ([#48](https://github.com/expert-lsp/vscode-expert/issues/48)) ([58e91b2](https://github.com/expert-lsp/vscode-expert/commit/58e91b2e75964e6dbe822ac53aec9f3bfa6dd323))
* Don't register heex and surface for server ([230c80c](https://github.com/expert-lsp/vscode-expert/commit/230c80cb003e870a74b4f40ceb4fe71c8dbcee9e))
* Fix auto-install failing on a fresh environment ([#8](https://github.com/expert-lsp/vscode-expert/issues/8)) ([944573f](https://github.com/expert-lsp/vscode-expert/commit/944573f6636008e1033bbc854f160cf88a9693a5))
* Fix auto-install failing with Lexical &lt;= 0.2.2 ([#41](https://github.com/expert-lsp/vscode-expert/issues/41)) ([eb9c322](https://github.com/expert-lsp/vscode-expert/commit/eb9c322bc8b454efc57319fa481ce4c556eccaaa))
* Fix lexi logo link in readme ([e7ecdb2](https://github.com/expert-lsp/vscode-expert/commit/e7ecdb28f38f1b57a439a46809012df4c3e43eec))
* Fixes restart command being unavailable if initial start failed ([#63](https://github.com/expert-lsp/vscode-expert/issues/63)) ([dfc10be](https://github.com/expert-lsp/vscode-expert/commit/dfc10bee450c8c34a6b99b5572b7c08830347bea))
* hightlighting breaks after single line doc ([#92](https://github.com/expert-lsp/vscode-expert/issues/92)) ([77ed588](https://github.com/expert-lsp/vscode-expert/commit/77ed588c2d95ca86bbd18357bcdf6167f0bcc3ee))
* Make @vscode/types version compatible with engine version ([#19](https://github.com/expert-lsp/vscode-expert/issues/19)) ([088a300](https://github.com/expert-lsp/vscode-expert/commit/088a300048ba931a5de0382f55c76cedfe2a65b7))
* Make port_wrapper.sh executable during installation ([#16](https://github.com/expert-lsp/vscode-expert/issues/16)) ([65b30b9](https://github.com/expert-lsp/vscode-expert/commit/65b30b9c5dd3fb498dd2e3f57d32974ae6aa9061))

## [0.0.23]

### Added

- Update some language configurations to match the latest from [Elixir LS](https://github.com/elixir-lsp/vscode-elixir-ls). The main changes are:
		- Adds many new common sigil-delimiter combinations as auto-closing pairs
		- Adds basic support for HEEX syntax highlighting

## [0.0.22]

### Added

- Update the Elixir grammar to the latest from [Elixir LS](https://github.com/elixir-lsp/vscode-elixir-ls). This update
  brings over ~2 years of improvements to Elixir LS' grammar to Lexical. Thanks to @probably-not!

  Here's the list of improvements brought by this upgrade, gracefully provided by @lukaszsamson:
    - unicode identifier support added
    - unicode support in atoms
    - reraise keyword
    - correct list of operator atoms
    - correct matching of defguard as function scope
    - removed pre 1.0 keywords
    - multiletter uppercase sigils
    - corrected textmate scopes for variables
    - function call matching
    - improvements to @doc and friends

## [0.0.21]

### Fixed

- Reverted markdown syntax highlighting in heredoc to maintain clearer separation between documentation and actual elixir code.

## [0.0.20]

### Fixed

- Fixed an issue where syntax highlighting would break after single-line @doc annotations. Thanks @pdm-jd!

## [0.0.19]

### Added

- Added syntax highlighting for markdown in `@doc`, `@moduledoc` and `@typedoc` modules attributes. Thanks to @SteffenDE for suggesting the solution and @Terbium-135 for implementing it.

## [0.0.18]

### Fixed

- Fixed an issue with `do`/`end` and `fn`/`end` brackets where `end` would
  mistakenly be considered a closing bracket when used as a map or struct field.

## [0.0.17]

### Added

- Added support for `do`/`end` and `fn`/`end` as brackets for VSCode, enabling
  bracket colorization and bracket navigation features.

## [0.0.16]

### Added

- Added the "Rebuild code search index" which instructs Lexical to rebuild the
  code search index for the current project.
- Added a notification after automatic installation of a new version of Lexical.
  This notification can be disabled through the ǹew
  `lexical.notifyOnServerAutoUpdate` configuration setting.

## [0.0.15]

### Added

- Added default VS Code settings to better match Elixir's official style even
  when not using Lexical's formatting functionality

## [0.0.14]

### Added

- Added the changelog to the extension bundle so it's readable directly from
  VsCode

## [0.0.13]

### Added

- Added more logging to better expose the extension's startup process

### Maintenance

- Updated all of the extension's dependencies. This should have no impact on
  users apart from a slightly smaller package.

## [0.0.12]

### Added

- The `Restart Lexical's language server` command now starts the language server
  if it isn't already running. Useful to quickly restart Lexical if initial
  start failed due to environment reasons, like an incompatible version of
  Erlang or Elixir.
- Added the `projectDir` configuration option which lets users specify a
  subdirectory in which Lexical should be started instead of the workspace root.

### Documentation

- Adds a note in the readme about lack of support for HEEx syntax highlighting
  and directs users to the Phoenix Framework extension instead.

## [0.0.11]

### Added

- Lexical is now published to the Open VSX marketplace.
- New command `Restart Lexical's language server`. Restarts the language server
  without having to reload VSCode entierely.
- Updated the extension to be more descriptive. This should help Lexical come up
  higher in marketplace search results.
- When auto-installing a new release fails during certain key operations,
  Lexical can now fallback to an already installed version rather than failing
  outright and not starting.

## [0.0.10]

### Fixed

- Fixed bad link to Lexical logo in README.

## [0.0.9]

### Added

- Add a description to the extension's manifest.
- Lexical now has a logo!
- Added a few badges to the README for important links and project status.

## [0.0.8]

### Added

- Updates the `lexical.server.releasePathOverride` configuration option to
  support specifying a path to the start script rather than a folder containing
  a Lexical release.
- Grammar improvements that exclude brackets from being matched together when
  part of string or other similar non-structural context.
- Support installing and starting Lexical versions that use the new packaging
  structure. This change should be transparent for users but ensures
  compatibility with future releases of Lexical.

### Fixed

- Improve documentation on which versions of Elixir and Erlang are supported by
  Lexical.

## [0.0.7]

### Added

- Send EEx and HEEx documents to Lexical as those are now supported.

## [0.0.6]

### Fixed

- Fix incorrect command to publish extension in README.
- Improve documentation on which versions of Elixir and Erlang are supported by
  Lexical.

## [0.0.5]

### Fixed

- Register Lexical for HEEx and Surface files as those are not supported.

## [0.0.4]

### Fixed

- Use installed release version to add execute permission to launch scripts,
  fixing an issue where only Lexical version 0.0.1 would be able to start.

## [0.0.3]

### Added

- Support for installating releases with semantic versions, rather than the
  older style of commit releases.
- Bundle extension with [esbuild](https://esbuild.github.io/), making downloaded
  bundle much smaller.

## [0.0.2]

### Added

- Documentation in README to explain features, installation, configuration,
  troubleshooting, etc.
- Ability to automatically download and install the latest release of Lexical on
  extension start.
- Configuration options:
  - `lexical.server.releasePathOverride`: Disables auto-install and manually
    provide a path to a build of Lexical.
  - `lexical.trace.server`: Traces all LSP messages between VSCode and Lexical.
- Elixir grammar to provide syntax highlihting and other basic functionality.
