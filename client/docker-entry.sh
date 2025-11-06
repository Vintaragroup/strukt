#!/bin/sh
set -e

LOCK_HASH="$(sha1sum package-lock.json | awk '{print $1}')"
INSTALLED_HASH="$(cat node_modules/.installed_sha 2>/dev/null || echo none)"

if [ ! -d node_modules ] || [ ! -f node_modules/.installed_sha ] || [ "$LOCK_HASH" != "$INSTALLED_HASH" ]; then
  echo "[entry] Installing dependencies (lock hash change or missing node_modules)…"
  npm ci --legacy-peer-deps
  sha1sum package-lock.json | awk '{print $1}' > node_modules/.installed_sha
fi

exec npm run dev
