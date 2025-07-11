#!/bin/bash

# Only build if changes are in ui-docs app, packages/ui, or shared dependencies
if git diff --quiet HEAD^ HEAD -- apps/ui-docs/ packages/ui/ package.json pnpm-lock.yaml; then
  echo "No changes affecting ui-docs app, skipping build."
  exit 0
else
  echo "Changes detected affecting ui-docs app, proceeding with build."
  exit 1
fi