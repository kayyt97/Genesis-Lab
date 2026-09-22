#!/usr/bin/env bash
# Linux equivalent of deploy.ps1 activation path for Cloud Agent / CI.
# Expects: built dist/, SSH access to kara@jreco.de (or $JRECO_SSH_USER).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REMOTE_USER="${JRECO_SSH_USER:-kara}"
REMOTE_HOST="${JRECO_SSH_HOST:-jreco.de}"
WEBROOT="${JRECO_WEBROOT:-/var/www/genesis-lab}"
PRODUCTION_URL="${JRECO_PRODUCTION_URL:-https://genesis.jreco.de/}"
DEPLOY_DIR="$ROOT/.deploy"
ARCHIVE="$DEPLOY_DIR/genesis-lab-dist.tar.gz"
DIST="$ROOT/dist"
REMOTE_HOME='~/genesis-lab-deploy'
SSH_OPTS=(-o IdentitiesOnly=yes -o StrictHostKeyChecking=yes)

if [[ -n "${JRECO_SSH_PRIVATE_KEY:-}" ]]; then
  KEY_FILE="$(mktemp)"
  printf '%s\n' "$JRECO_SSH_PRIVATE_KEY" >"$KEY_FILE"
  chmod 600 "$KEY_FILE"
  SSH_OPTS+=(-i "$KEY_FILE")
  cleanup() { rm -f "$KEY_FILE"; }
  trap cleanup EXIT
elif [[ -n "${JRECO_SSH_KEY_PATH:-}" ]]; then
  SSH_OPTS+=(-i "$JRECO_SSH_KEY_PATH")
fi

echo "==> Project root: $ROOT"
test -f "$ROOT/package.json"
test -d "$DIST"
test -f "$DIST/index.html"

mkdir -p "$DEPLOY_DIR"
rm -f "$ARCHIVE"
tar -czf "$ARCHIVE" -C "$DIST" .
echo "==> Archive: $ARCHIVE ($(du -h "$ARCHIVE" | cut -f1))"

echo "==> Upload to ${REMOTE_USER}@${REMOTE_HOST}"
ssh "${SSH_OPTS[@]}" "${REMOTE_USER}@${REMOTE_HOST}" "mkdir -p $REMOTE_HOME"
scp "${SSH_OPTS[@]}" "$ARCHIVE" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_HOME}/upload.tar.gz"

echo "==> Remote activate"
ssh "${SSH_OPTS[@]}" "${REMOTE_USER}@${REMOTE_HOST}" "bash -s" <<EOF
set -euo pipefail
WEBROOT='$WEBROOT'
DEPLOY_HOME=\$HOME/genesis-lab-deploy
ARCHIVE=\$DEPLOY_HOME/upload.tar.gz
STAGE=\$DEPLOY_HOME/stage
BACKUP=\$DEPLOY_HOME/backup
PREV_BACKUP=\$DEPLOY_HOME/backup.prev
case "\$WEBROOT" in /var/www/genesis-lab|/var/www/genesis-lab/) ;; *) echo bad webroot; exit 11;; esac
rm -rf "\$STAGE"; mkdir -p "\$STAGE" "\$DEPLOY_HOME"
tar -xzf "\$ARCHIVE" -C "\$STAGE"
test -f "\$STAGE/index.html"
rm -rf "\$PREV_BACKUP"
if [ -d "\$BACKUP" ]; then mv "\$BACKUP" "\$PREV_BACKUP"; fi
mkdir -p "\$BACKUP"
shopt -s dotglob nullglob
for item in "\$WEBROOT"/*; do cp -a "\$item" "\$BACKUP/"; done
shopt -u dotglob nullglob
if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete "\$STAGE"/ "\$WEBROOT"/
else
  cp -a "\$STAGE"/. "\$WEBROOT"/
fi
test -f "\$WEBROOT/index.html"
rm -rf "\$STAGE" "\$PREV_BACKUP"; rm -f "\$ARCHIVE"
echo Remote activation complete.
EOF

echo "==> Verify live"
html=$(curl -fsSL "$PRODUCTION_URL")
echo "$html" | head -20
asset=$(echo "$html" | grep -oE '/assets/index-[^"]+\.js' | head -1)
curl -fsSIL "${PRODUCTION_URL%/}$asset" | head -15
echo "DEPLOY OK commit=$(git -C "$ROOT" rev-parse HEAD) asset=$asset"
