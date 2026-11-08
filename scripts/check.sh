#!/usr/bin/env bash
# Runs every check and prints one line per step. Shows the output only for a failing step.
set -u

steps=(
  "pnpm format"
  "pnpm lint"
  "pnpm typecheck"
  "pnpm build"
  "pnpm test"
  "pnpm --filter @businessos/api test:e2e"
)

for step in "${steps[@]}"; do
  if output=$($step 2>&1); then
    summary=$(echo "$output" | grep -E "Tests +[0-9]+ passed" | tail -n 3 | sed -E 's/^[^ ]+ +//' | tr '\n' ';')
    echo "PASS  $step  $summary"
  else
    echo "FAIL  $step"
    echo "$output" | tail -n 70
    exit 1
  fi
done
echo "ALL CHECKS PASSED"
