# @fingerskier/pi-collab-ext

Sequential multi-model collaboration workflows for Pi.

Use it when you want one model to review, another to implement, and a final model to clean up without manually switching models between prompts.

## Install

```bash
pi install npm:@fingerskier/pi-collab-ext
```

For local development:

```bash
pi install ./packages/pi-collab-ext
# or for one run only
pi -e ./packages/pi-collab-ext
```

## Commands

### `/collab <json>`

Starts a sequential workflow. The argument can be either a JSON array of steps or an object with a `steps` array.

```text
/collab [{"model":"gpt-5.5","job":"do code review and write FINDINGS.md"},{"model":"opus-4.7","job":"implement a fix for the top issue in FINDINGS.md"},{"model":"gpt-5.5","job":"review recent changes and cleanup any related issues"}]
```

Object form:

```text
/collab {"restoreModel":true,"steps":[{"model":"anthropic/claude-opus-4-7","job":"review recent changes"}]}
```

Fields:

- `model` — model shorthand (`gpt-5.5`, `opus-4.7`) or exact `provider/model-id`.
- `job` — user prompt for that step.
- `thinkingLevel` — optional Pi thinking level for the step: `off`, `minimal`, `low`, `medium`, `high`, or `xhigh`.
- `restoreModel` — optional object-level boolean. Defaults to `false`, leaving Pi on the last step's model.

The extension switches to each step's model, sends the step as a user prompt, waits for the agent to finish, then advances to the next step. If a model selector is ambiguous, use `provider/model-id`.

### `/collab-status`

Shows the active workflow status.

### `/collab-stop [abort]`

Stops automatic advancement. Pass `abort` to also abort the current model turn.

## Notes

- Model changes apply to subsequent provider requests, not an already-running response.
- The workflow stops on provider error or abort so it does not continue after a failed step.
- Exact model availability depends on your configured Pi providers and auth.
