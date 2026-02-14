#!/usr/bin/env bash
# Create Linux .deb and .rpm packages. Run on Linux only.
# Requires: LoCoPilot-linux-x64 (or other arch) folder in the parent of this repo.
# Run from LoCoPilot: ./scripts/build-and-ship-linux.sh

set -e

ROOT=$(dirname "$(dirname "$(readlink -f "$0" 2>/dev/null || echo "$0")")")
cd "$ROOT"

echo "Building LoCoPilot Linux packages..."
echo ""

echo "[1/4] Prepare .deb (x64)..."
npm run gulp vscode-linux-x64-prepare-deb

echo "[2/4] Build .deb (x64)..."
npm run gulp vscode-linux-x64-build-deb

echo "[3/4] Prepare .rpm (x64)..."
npm run gulp vscode-linux-x64-prepare-rpm

echo "[4/4] Build .rpm (x64)..."
npm run gulp vscode-linux-x64-build-rpm

echo ""
echo "Done. Packages:"
echo "  .deb: .build/linux/deb/"
echo "  .rpm: .build/linux/rpm/"
echo ""
echo "For other arches (e.g. arm64), run:"
echo "  npm run gulp vscode-linux-arm64-prepare-deb && npm run gulp vscode-linux-arm64-build-deb"
echo "  npm run gulp vscode-linux-arm64-prepare-rpm && npm run gulp vscode-linux-arm64-build-rpm"
