#!/bin/bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
pub="$root/deploy/public"
node "$root/scripts/check-schools.mjs" "$root/skill/schools.json"
mkdir -p "$pub"
node "$root/scripts/build-site.mjs" "$pub"
cd "$root/deploy"
[ -d node_modules ] || npm install --no-audit --no-fund
cf deploy "$@"
