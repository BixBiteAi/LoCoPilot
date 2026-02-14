#!/usr/bin/env bash

set -e

if [[ "$OSTYPE" == "darwin"* ]]; then
	realpath() { [[ $1 = /* ]] && echo "$1" || echo "$PWD/${1#./}"; }
	ROOT=$(dirname "$(dirname "$(realpath "$0")")")
else
	ROOT=$(dirname "$(dirname "$(readlink -f $0)")")
fi

cd "$ROOT"

# Function to cleanup watch processes on exit
cleanup() {
	echo ""
	echo "Stopping watch processes..."
	npm run kill-watch-clientd 2>/dev/null || true
	npm run kill-watch-extensionsd 2>/dev/null || true
	exit 0
}

# Trap Ctrl+C and cleanup
trap cleanup SIGINT SIGTERM

echo "Starting development environment..."
echo "This will:"
echo "  1. Start watch tasks (auto-compile on file changes)"
echo "  2. Launch the app"
echo ""
echo "Press Ctrl+C to stop everything"
echo ""

# Start watch tasks in background using daemon
echo "Starting watch tasks..."
npm run watch-clientd &
WATCH_CLIENT_PID=$!

npm run watch-extensionsd &
WATCH_EXTENSIONS_PID=$!

# Wait a bit for initial compilation
echo "Waiting for initial compilation..."
sleep 5

# Check if watch processes are still running
if ! kill -0 $WATCH_CLIENT_PID 2>/dev/null; then
	echo "Warning: watch-client process may have failed to start"
fi

if ! kill -0 $WATCH_EXTENSIONS_PID 2>/dev/null; then
	echo "Warning: watch-extensions process may have failed to start"
fi

echo ""
echo "Watch tasks are running. Starting app..."
echo ""

# Run the app
./scripts/code.sh "$@"

# Cleanup when app exits
cleanup
