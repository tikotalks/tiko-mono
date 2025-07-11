#!/bin/bash

# Only build if changes are in timer app, packages/ui, packages/core, or shared dependencies
if git diff --quiet HEAD^ HEAD -- apps/timer/ packages/ui/ packages/core/ package.json pnpm-lock.yaml; then
  echo "No changes affecting timer app, skipping build."
  exit 0
else
  echo "Changes detected affecting timer app, proceeding with build."
  exit 1
fi