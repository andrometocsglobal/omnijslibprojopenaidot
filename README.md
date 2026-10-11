# OmniJS

An entirely client-side mathematics and data-structure laboratory, with two
reusable JavaScript packages and a responsive interface toolkit.

## Start

Node.js >=22.12 (24 recommended) and npm. Node is tooling only; the application
runs in the browser without a backend, APIs, analytics, or account.

```sh
npm ci
npm run dev                 # http://localhost:5173
npm test                    # deterministic core + UI tests
npm run build               # apps/lab/dist
npx playwright install chromium
npm run test:browser
npm run benchmark           # refresh measured results + report
```

Open `apps/lab/dist` via a static HTTP server, not a file URL. Use `npm run preview`
for a local preview at http://localhost:4173. Deploy the contents of that directory
to any static host. Relative asset paths and hash navigation support subpaths
such as GitHub Pages. Rebuild after refreshing benchmark JSON to update the UI.

## What ships

- `packages/core`: dependency-free ESM, exact BigInt AP power sums (0–16), exact
  integer GP sums, rational AP midpoints, bounded approximate HP summation,
  stable positive-domain power means, formula-backed segments with sparse
  replacements, virtual windows, lower-bound search and a min-heap.
- `packages/ui`: responsive CSS classes/tokens, React components and an optional
  vanilla tabs controller. Keyboard navigation, native dialogs, dark surfaces,
  reduced-motion behavior and TypeScript declarations.
- `apps/lab`: responsive React showcase with working calculators, exact-vs-naive
  verification, a million-term paged virtual explorer, research, measured
  comparisons and integration examples.
- `benchmarks`: seeded same-precision comparisons and raw timing samples.
- `docs`: honest research boundaries and reproducible benchmark report.

## Reuse

These packages are workspace packages, **not a claim of publication to npm**.
Generate local tarballs from the repository root and install those in your app:

```sh
npm pack -w @omni/core
npm pack -w @omni/ui
# In your own project:
# npm install /path/to/omni-core-0.1.0.tgz /path/to/omni-ui-0.1.0.tgz
```

```js
import { apPowerSum, createSegment } from '@omni/core';
const result = apPowerSum({start: 1n, step: 1n, count: 100n, power: 2});
// 338350n
const sequence = createSegment({kind: 'ap', start: 3n, step: 2n, count: 1000000n});
sequence.at(99n); // 201n
sequence.sum({from: 0n, to: 100n}); // 10200n
```

```jsx
import { Button, Card } from '@omni/ui';
import '@omni/ui/styles.css';
<Card><Button onClick={calculate}>Calculate</Button></Card>
```

See [core API](packages/core/README.md), [UI API](packages/ui/README.md),
[research](docs/research.md), and [benchmark report](docs/benchmark-report.md).

## Guarantees and boundaries

- BigInt inputs or safe integer Numbers are required for exact APIs. Never
  convert a large decimal string through Number first.
- AP sums use classical finite-difference identities. Arithmetic operation count
  avoids traversal over n, but integer bit lengths still affect time and memory.
- GP results can become enormous. The library bounds exponents and output bits.
- HP is direct floating-point summation, not exact and not constant time.
- Power means require positive finite inputs. Floating-point error remains.
- A compact descriptor is useful for known laws and sparse exceptions. It is
  not universal lossless compression or a new mathematical theorem.
- The UI caps naive verification, HP traversal and visible exploration to keep
  interaction responsive. Large production computations should use workers.
- The browser explorer uses explicit 1,000-row logical pages and renders at most
  12 rows; it avoids oversized native scroll tracks. Core virtualWindow separately
  supports bounded-height mappings for enormous counts.
- Native modal behavior requires a modern browser with HTML dialog support.
- Tests verify many deterministic cases; a finite test suite is not a universal proof.

## Validation and CI

`npm run check` runs unit tests, production build and browser tests. The browser
suite covers correct sums, invalid domains, sequence jumping, sparse overrides,
virtualized row bounds, keyboard tabs, dialog dismissal/focus, navigation and
mobile overflow. `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium` can select a
locally installed browser; otherwise Playwright uses its installed Chromium.
GitHub Actions runs the same main stages on Node 24.

## License

MIT. See [LICENSE](LICENSE) and [provenance](NOTICE.md). No external demo source
was copied without an established license.
