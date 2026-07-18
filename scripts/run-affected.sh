#!/usr/bin/env bash
# Helper script for running nx affected commands
# Usage: ./scripts/run-affected.sh <target> [additional args]

TARGET=$1
shift 1

# First check if there are any affected projects for this target
AFFECTED_PROJECTS=$(pnpm exec nx show projects --affected --target=$TARGET "$@")

# If no projects are affected, report success and exit
if [ -z "$AFFECTED_PROJECTS" ]; then
  echo "No projects affected for target: $TARGET"
  exit 0
fi

# Run the affected command with all arguments passed
pnpm exec nx affected -t $TARGET "$@"
