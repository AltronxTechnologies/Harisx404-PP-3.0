#!/usr/bin/env bash
set -euo pipefail

env_file=".env.local"
touch "$env_file"

append_if_blank() {
  local key="$1"
  local value="$2"
  local current=""

  if [[ -s "$env_file" ]]; then
    current="$(grep -E "^${key}=" "$env_file" | tail -n 1 | cut -d= -f2- || true)"
  fi
  if [[ -z "$current" && -n "$value" ]]; then
    printf '%s=%s\n' "$key" "$value" >> "$env_file"
  fi
}

append_if_blank "IS_ALLOY" "${IS_ALLOY:-true}"
append_if_blank "ADMIN_EMAIL" "${ADMIN_EMAIL:-itsharis.tech@gmail.com}"
