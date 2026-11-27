#!/usr/bin/env bash
# Generate one illustration per school with the local Codex CLI, then write web JPEGs.
# Usage: scripts/gen-images.sh [id...]   (default: every id in skill/schools.json, file order)
# Resumable: ids whose .cache/images/<id>.png already exists are not regenerated.
# Env: JOBS (default 3), CODEX (default codex), CODEX_MODEL (default gpt-6-sol).
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
JOBS="${JOBS:-3}"
CODEX="${CODEX:-codex}"
CODEX_MODEL="${CODEX_MODEL:-gpt-6-sol}"
IMG="$ROOT/.cache/images"
LOGS="$ROOT/.cache/logs"
OUT="$ROOT/site/img"
mkdir -p "$IMG" "$LOGS" "$OUT"

# PNG -> 1200px JPEG; drop quality if the file comes out heavier than ~320 KB.
convert() {
  local id="$1" q size
  for q in 72 60 50 40; do
    sips -Z 1200 -s format jpeg -s formatOptions "$q" "$IMG/$id.png" --out "$OUT/$id.jpg" >/dev/null || return 1
    size=$(stat -f %z "$OUT/$id.jpg")
    [ "$size" -le 327680 ] && break
  done
  echo "$id: jpeg q=$q ${size} bytes"
}

run_codex() {
  local id="$1" spec extra=""
  spec="$(node "$ROOT/scripts/gen-images.mjs" "$id")" || return 1
  # Optional per-id hint for retries after QA (not part of the canonical prompt).
  [ -s "$ROOT/.cache/extra/$id.txt" ] && extra="
Additional requirements: $(cat "$ROOT/.cache/extra/$id.txt")"
  (cd "$ROOT" && "$CODEX" exec -m "$CODEX_MODEL" -s workspace-write --skip-git-repo-check \
    "Use your built-in image generation tool to create exactly one image from this spec:

$spec$extra

Then copy the PNG produced by YOUR image generation call in this session (it is saved under ~/.codex/generated_images/<this session id>/; other sessions are generating in parallel, so never pick the newest file globally) to $IMG/$id.png. Do not modify any other file." </dev/null)
}

# Parallel sessions can grab each other's output, so take the PNG from this run's own
# ~/.codex/generated_images/<session id>/ directory and overwrite whatever Codex copied.
adopt_session_png() {
  local id="$1" log="$2" sid own
  sid="$(grep '^session id:' "$log" | tail -1 | awk '{print $3}')"
  [ -n "$sid" ] || return 0
  own="$(ls -t "$HOME/.codex/generated_images/$sid/"*.png 2>/dev/null | head -1)"
  if [ -n "$own" ]; then
    cmp -s "$own" "$IMG/$id.png" || { echo "$id: replacing copied PNG with session $sid output" >>"$log"; cp "$own" "$IMG/$id.png"; }
  fi
}

one() {
  local id="$1" log="$LOGS/$1.log" attempt
  if [ ! -s "$IMG/$id.png" ]; then
    : >"$log"
    for attempt in 1 2; do
      echo "=== $(date '+%F %T') attempt $attempt" >>"$log"
      run_codex "$id" >>"$log" 2>&1
      adopt_session_png "$id" "$log"
      [ -s "$IMG/$id.png" ] && break
      if [ "$attempt" = 1 ] && grep -qiE 'rate.?limit|quota|usage limit|429|too many requests' "$log"; then
        echo "$id: rate limited, waiting 60s" | tee -a "$log"
        sleep 60
      else
        break
      fi
    done
    if [ ! -s "$IMG/$id.png" ]; then
      echo "$id: FAILED (see $log)"
      return 1
    fi
  fi
  if [ ! -s "$OUT/$id.jpg" ] || [ "$IMG/$id.png" -nt "$OUT/$id.jpg" ]; then
    convert "$id" | tee -a "$log"
  else
    echo "$id: already done"
  fi
}

if [ "${1:-}" = "--one" ]; then
  one "$2"
  exit $?
fi

if [ "$#" -gt 0 ]; then ids=("$@"); else ids=($(node "$ROOT/scripts/gen-images.mjs" --ids)); fi
printf '%s\n' "${ids[@]}" | xargs -P "$JOBS" -I{} "$0" --one {}
status=$?

missing=()
for id in "${ids[@]}"; do [ -s "$OUT/$id.jpg" ] || missing+=("$id"); done
if [ "${#missing[@]}" -gt 0 ]; then
  echo "missing: ${missing[*]}"
  exit 1
fi
echo "all ${#ids[@]} images present in site/img"
exit $status
