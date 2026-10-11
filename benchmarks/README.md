# Reproduce the fair comparison

From the repository root, run `node benchmarks/run.mjs`. It requires only Node, imports the actual new core at `packages/core/index.js`, checks correctness before timing, and writes raw repeated timings to `benchmarks/results.json`.

The baseline is not only a naive loop: `baselines.mjs` includes the same classical closed-form AP/GP formulas and prefix sums. All timed arithmetic comparisons use BigInt on both sides. A Number/Float64 payload is labeled separately because it cannot represent every tested integer exactly.

Run on an otherwise idle host and repeat across supported Node versions before relying on small latency differences. Seven timing samples follow two warm-up samples per case. Query intervals are seeded and inputs vary within each timed batch; returned results feed a checksum. Timing includes callback and checksum overhead, intentionally equally present across query paths. It is not a browser, end-to-end application, or concurrent-load benchmark. Values are consumed but V8 optimization effects cannot be eliminated by a microbenchmark.

No historical library benchmark is claimed: the provided historical JS review snapshot lacks imported `ap.js`, `gp.js`, and `math.js`. No files are patched to impersonate those missing implementations.

JSON payload counts are measurements of a small explicitly defined benchmark representation, not a library codec, compressed binary format, actual heap, or peak memory. Known formula parameters are supplied at construction; recognizing a pattern from raw data requires reading the data and is not timed as an implemented feature.
