#!/usr/bin/env bash
set -euo pipefail

lock_hash="$(sha256sum package-lock.json | cut -d' ' -f1)"
marker="node_modules/.alloy-package-lock.sha256"
installed_hash=""

if [[ -f "$marker" ]]; then
  installed_hash="$(tr -d '\n' < "$marker")"
fi

if [[ ! -x node_modules/.bin/next || "$installed_hash" != "$lock_hash" ]]; then
  npm ci --no-audit --no-fund
  printf '%s\n' "$lock_hash" > "$marker"
fi
