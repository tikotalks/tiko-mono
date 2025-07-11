#!/bin/bash

# Only build if changes are in yes-no app, packages/ui, packages/core, or shared dependencies
if git diff --quiet HEAD^ HEAD -- apps/yes-no/ packages/ui/ packages/core/ package.json pnpm-lock.yaml; then
  echo "No changes affecting yes-no app, skipping build."
  exit 0
else
  echo "Changes detected affecting yes-no app, proceeding with build."
  exit 1
fi