#!/usr/bin/env bash
# Screenshot every fixture at every width, and compare with the committed
# baselines in test/screens/. Runs in Playwright's own image -- the version
# pinned in package.json -- so the pixels are the same here and in CI.
#
#   npm run test:screens                 compare
#   npm run test:screens:update          accept the new pixels
set -euo pipefail

version=$(node -p 'require("./package.json").devDependencies["@playwright/test"]')

exec docker run --rm --ipc=host \
  --user "$(id -u):$(id -g)" -e HOME=/tmp \
  -v "$PWD:/work" -w /work \
  "mcr.microsoft.com/playwright:v${version}-noble" \
  npx playwright test "$@"
