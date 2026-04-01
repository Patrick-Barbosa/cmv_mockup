#!/bin/sh
set -eu

BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"
BACKEND_URL="${BACKEND_URL%/}"

cat > /usr/share/nginx/html/static/config.js <<EOF
// AUTO-GENERATED at container startup.
// To change this value, set BACKEND_URL on the frontend container.
window.APP_CONFIG = {
  API_BASE_URL: "${BACKEND_URL}"
};
EOF
