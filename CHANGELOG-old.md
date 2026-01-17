# Change Log

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
