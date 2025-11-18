#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${PROJECT_ROOT}"

: "${APP_ENV:=prod}"
: "${APP_DEBUG:=0}"

php bin/console app:plantations:process --env="${APP_ENV}" "$@"

