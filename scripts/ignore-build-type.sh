#!/bin/bash

# Only build if changes are in type app, packages/ui, packages/core, or shared dependencies
if git diff --quiet HEAD^ HEAD -- apps/type/ packages/ui/ packages/core/ package.json pnpm-lock.yaml; then
  echo "No changes affecting type app, skipping build."
  exit 0
else
  echo "Changes detected affecting type app, proceeding with build."
  exit 1
fi