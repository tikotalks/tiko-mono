#!/bin/bash

# Only build if changes are in radio app, packages/ui, packages/core, or shared dependencies
if git diff --quiet HEAD^ HEAD -- apps/radio/ packages/ui/ packages/core/ package.json pnpm-lock.yaml; then
  echo "No changes affecting radio app, skipping build."
  exit 0
else
  echo "Changes detected affecting radio app, proceeding with build."
  exit 1
fi