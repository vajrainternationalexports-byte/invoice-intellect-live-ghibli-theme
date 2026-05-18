#!/bin/bash

# Simple script to sync changes to GitHub
# Usage: ./sync-to-github.sh [--loop]

REMOTE="live"
BRANCH="main"

sync_once() {
  echo "--- Syncing to GitHub at $(date) ---"
  git add .
  git commit -m "Auto-sync Ghibli UI: $(date)"
  git push $REMOTE $BRANCH
  echo "--- Sync Complete ---"
}

if [ "$1" == "--loop" ]; then
  echo "Starting 1-hour auto-sync loop..."
  while true; do
    sync_once
    echo "Waiting for 1 hour..."
    sleep 3600
  done
else
  sync_once
fi
