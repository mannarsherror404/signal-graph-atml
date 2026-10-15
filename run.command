#!/bin/zsh

emulate -L zsh
unsetopt BG_NICE

APP_DIR="${0:A:h}"
SITE_URL="http://127.0.0.1:3000"

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Node.js and npm are required. Install Node.js 22.13 or newer, then try again."
  read -r "?Press Return to close."
  exit 1
fi

if ! node -e 'const [major, minor] = process.versions.node.split(".").map(Number); process.exit(major > 22 || (major === 22 && minor >= 13) ? 0 : 1)' ; then
  echo "Node.js 22.13 or newer is required. Installed: $(node --version)"
  read -r "?Press Return to close."
  exit 1
fi

cd "$APP_DIR" || exit 1

if [[ ! -x node_modules/.bin/vinext ]]; then
  echo "Installing project dependencies (internet is needed for this first setup)..."
  npm ci --no-audit --no-fund || {
    echo "Dependency installation failed. Check your internet connection and try again."
    read -r "?Press Return to close."
    exit 1
  }
fi

if [[ ! -f frontend/dist/server/index.js ]]; then
  echo "Building the site for this checkout..."
  npm run build || {
    echo "The build failed. Check the error above and try again."
    read -r "?Press Return to close."
    exit 1
  }
fi

site_is_ready() {
  curl --silent --fail --max-time 2 "$SITE_URL" 2>/dev/null |
    grep --quiet "Signal Graph"
}

if site_is_ready; then
  echo "Signal Graph News is already running."
  open "$SITE_URL"
  exit 0
fi

if nc -z 127.0.0.1 3000 >/dev/null 2>&1; then
  echo "Port 3000 is in use by another application. Stop it, then try again."
  read -r "?Press Return to close."
  exit 1
fi

echo "Starting Signal Graph News..."
echo "Keep this Terminal window open while using the site."

(
  for attempt in {1..60}; do
    if site_is_ready; then
      echo "Signal Graph News is ready."
      open "$SITE_URL"
      exit 0
    fi
    sleep 1
  done
  echo "The server did not become ready. Check the error shown above."
) &
WAITER_PID=$!

npm run start
STATUS=$?
kill "$WAITER_PID" 2>/dev/null || true

if [[ "$STATUS" -ne 0 && "$STATUS" -ne 130 ]]; then
  echo
  echo "The server stopped with an error."
  read -r "?Press Return to close."
fi

exit "$STATUS"
