#!/bin/bash

# Only build if changes are in cards app, packages/ui, packages/core, or shared dependencies
if git diff --quiet HEAD^ HEAD -- apps/cards/ packages/ui/ packages/core/ package.json pnpm-lock.yaml; then
  echo "No changes affecting cards app, skipping build."
  exit 0
else
  echo "Changes detected affecting cards app, proceeding with build."
  exit 1
fi