#!/bin/bash

# Only build if changes are in todo app, packages/ui, packages/core, or shared dependencies
if git diff --quiet HEAD^ HEAD -- apps/todo/ packages/ui/ packages/core/ package.json pnpm-lock.yaml; then
  echo "No changes affecting todo app, skipping build."
  exit 0
else
  echo "Changes detected affecting todo app, proceeding with build."
  exit 1
fi