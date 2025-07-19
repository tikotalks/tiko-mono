#!/bin/bash

# Check if commit message contains force build trigger
COMMIT_MSG=$(git log -1 --pretty=%B)
if echo "$COMMIT_MSG" | grep -qE '\[build-all\]|\[force-build\]|\[build-ui-docs\]'; then
  echo "Force build trigger detected in commit message, proceeding with build."
  exit 1
fi

# Check if commit message contains skip trigger
if echo "$COMMIT_MSG" | grep -qE '\[skip-ci\]|\[skip-build\]|\[skip-ui-docs\]'; then
  echo "Skip build trigger detected in commit message, skipping build."
  exit 0
fi

# Only build if changes are in ui-docs app, packages/ui, or shared dependencies
if git diff --quiet HEAD^ HEAD -- apps/ui-docs/ packages/ui/ package.json pnpm-lock.yaml; then
  echo "No changes affecting ui-docs app, skipping build."
  exit 0
else
  echo "Changes detected affecting ui-docs app, proceeding with build."
  exit 1
fi