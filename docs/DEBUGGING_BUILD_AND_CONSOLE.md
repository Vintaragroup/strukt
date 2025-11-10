# Debugging Build Metadata and Console Noise

This guide helps you verify you’re on the correct build and tame noisy console output while developing.

## Build metadata in the UI

The Status bar now shows a compact build badge: `version  short-sha`. Hover it to see:

- Branch
- Build time (ISO)

If SHA/branch show `unknown`, your container likely doesn’t have a Git checkout or environment variables.

### Supplying metadata without Git

Set the following environment variables before starting the client build:

- `GIT_SHA` or `COMMIT_SHA` — short or full commit sha
- `GIT_BRANCH` — current branch name

Vite will pick these up and inject them into the app. Examples:

```zsh
export GIT_SHA=$(git rev-parse --short HEAD)
export GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
# then run your build/dev command
```

## Console logs from node changes

The change logger is now gated and debounced by default. Enable it only when needed:

- Query flag: `?changeLogs=1` (enables), and optional `&changeLogsVerbose=1` (per-change details)
- Env flags: `VITE_CHANGE_LOGGER=on`, optional `VITE_CHANGE_LOGGER_VERBOSE=on`

When enabled, the logger batches within ~75 ms and prints a single line of counts per burst.

## Repeated `content_script.js` errors

Messages like the following are typically from a browser extension (e.g., autocomplete/AI helpers) and not from this app:

```
Unchecked runtime.lastError: A listener indicated an asynchronous response by returning true, but the message channel closed ...
content_script.js:1 Uncaught TypeError: Cannot read properties of undefined (reading 'control')
```

Remediation:

- Try an Incognito window or a clean browser profile with extensions disabled.
- If the errors disappear, they originate from an extension and can be ignored while debugging the app.
- Our app namespaces its own logs with `[strukt-*]` so you can filter quickly in DevTools.

## Quick checklist

- Status bar shows version/sha, hover reveals branch and build time.
- If SHA/branch are `unknown`, supply `GIT_SHA` and `GIT_BRANCH` (no Git needed inside container).
- Enable change logs only when necessary via `?changeLogs=1` or `VITE_CHANGE_LOGGER=on`.
- Ignore `content_script.js` errors if they vanish in Incognito (extension noise).
