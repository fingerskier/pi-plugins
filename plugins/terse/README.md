# Terse Pi Plugin

Pi package port of [`terse-claude-plugin`](https://github.com/fingerskier/terse-claude-plugin).

Terse mode is an ultra-compressed communication style: smart-caveman voice, no filler, no pleasantries, technical accuracy preserved.

## Install

```bash
pi install ./plugins/terse
# or one run only
pi -e ./plugins/terse
```

## Usage

- `/terse` expands the prompt template that activates terse mode for the session.
- `/skill:terse` loads the full skill instructions.

No extension or external runtime is required.
