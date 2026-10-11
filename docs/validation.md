# Release validation

Snapshot: v0.1.0, 2026-10-11.

## Passed in the build workspace

- Fresh `npm ci` from the committed lockfile.
- `npm ls --all`: complete dependency tree.
- 17 deterministic Node test groups, including AP oracle sweeps across all
  supported exponents, GP edge cases, HP/mean domains, sparse sequences,
  virtualization regression, search/heap and vanilla tab controls.
- `npm run build`: production static bundle generated.
- Benchmark correctness checks and report source SHA match the final core.
- Both `npm pack --dry-run` outputs contain the intended API files and LICENSE.
- Independent source audit and AP/virtual-window oracle checks.
- No runtime requests, analytics, secrets or external font/image dependencies.

## Browser execution limitation in this workspace

The Playwright suite is provided in `tests/lab.spec.js`. Local Chromium could not
start because this execution sandbox denies the Unix socket required by its
process singleton. An approved escalation had the same platform restriction.
A supported cloud-browser attempt could not reach the executor's local preview
address (`ERR_CONNECTION_REFUSED`). Neither failure is a passed browser test.

GitHub Actions is configured to run the suite with its supported Chromium
installation. Its result for the published commit must be checked separately.
The suite includes desktop/mobile layouts, exact math, invalid inputs, sequence
jumping/scroll reset, sparse exceptions, tabs, modal Escape/focus restoration,
and navigation. Screenshots are uploaded with the CI browser-report artifact.
