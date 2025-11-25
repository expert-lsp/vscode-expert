# TODO

### General Stuff:
- Replace references to Lexical with Expert.
- Update startup to match Expert's binary distribution and initialization (use the `—stdio` flag by default).
- Start with downloading nightly builds of Expert and figure out semver later on (if that's even desirable).
- Ensure the language server is properly stopped when deactivating.
- (Maybe) add commands to expressly stop and start the language server.

### Configuration Options:
- Add an option for "syntax highlighting only" mode.
  - Requested by some folks particularly when mix isn't playing nice.
  - Allows syntax highlighting in instances where the language server can't run (ex: vscode.dev).
  - Useful for folks that just needs to browse code.

- Rename 'release path override' -> 'start command override'.
  - Overwrite the entire init path + flags used.

- Add 'start flags' option.
  - Used to override the default startup flags when using the built-in distribution of Expert.

### Syntax Highlighting Grammars:
- Remove ad-hoc support for HEEx grammar here, only do Elixir and Embedded Elixir (eex).
- Direct users to download the Phoenix Framework extension for HEEx syntax hightlighting.

### Testing:
- Use Node's built-in unit testing module instead of Jest.
  - Runs way faster and removes a ton of dev dependencies.
  - We really want this extension to be as light as possible.

### DevOps:
- Ensure CI/CD is in place for all of this.
- (Maybe) Add a precommit hook that ensures staged files are always formatted.
