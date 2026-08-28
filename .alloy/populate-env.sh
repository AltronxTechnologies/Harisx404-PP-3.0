#!/usr/bin/env bash
# Idempotent env bootstrap for Alloy sandbox sessions.
# - Reads real values from the current process environment when available.
# - Never overwrites non-placeholder values already present in .env.local.
# - Fills only local-dev-safe defaults required to boot.
set -euo pipefail

cd "$(dirname "$0")/.."

ENV_FILE=".env.local"
touch "$ENV_FILE"

is_placeholder() {
  case "$1" in
    "" | *your_* | *placeholder* | *_here) return 0 ;;
    *) return 1 ;;
  esac
}

current_value() {
  grep -E "^$1=" "$ENV_FILE" | tail -n 1 | cut -d= -f2- | tr -d '"' || true
}

set_var() {
  local key="$1"
  local value="$2"
  local existing
  existing="$(current_value "$key")"
  if is_placeholder "$existing"; then
    if grep -qE "^${key}=" "$ENV_FILE"; then
      sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
    else
      printf '%s=%s\n' "$key" "$value" >> "$ENV_FILE"
    fi
  fi
}

# Preserve supplied credentials. Blank values intentionally activate the
# application's static fallback content instead of contacting a fake service.
set_var NEXT_PUBLIC_SUPABASE_URL "${NEXT_PUBLIC_SUPABASE_URL:-}"
set_var NEXT_PUBLIC_SUPABASE_ANON_KEY "${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}"
set_var SUPABASE_SERVICE_ROLE_KEY "${SUPABASE_SERVICE_ROLE_KEY:-}"
set_var GOOGLE_AI_API_KEY "${GOOGLE_AI_API_KEY:-}"
set_var NEXT_PUBLIC_SITE_URL "${NEXT_PUBLIC_SITE_URL:-http://localhost:3000}"
set_var NEXT_PUBLIC_SITE_NAME "${NEXT_PUBLIC_SITE_NAME:-\"Muhammad Haris | Full-Stack Engineer\"}"
set_var IS_ALLOY "${IS_ALLOY:-false}"

echo "populate-env: $ENV_FILE ready"
