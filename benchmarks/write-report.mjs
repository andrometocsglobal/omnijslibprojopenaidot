import {readFileSync,writeFileSync} from 'node:fs';
const r=JSON.parse(readFileSync(new URL('./results.json',import.meta.url),'utf8'));
const ns=name=>r.timings.find(t=>t.name===name).medianNsPerOperation;
const us=name=>(ns(name)/1000).toFixed(2);
const ms=name=>(ns(name)/1e6).toFixed(2);
const prefix='AP N=100000 ';
const text=`# OMNIDIM versus classical formulas and stored data

## Conclusion

The measured advantage is a compact, formula-backed representation of structured data. The AP midpoint and sum are classical arithmetic, exposed through a unified exact-integer API. This benchmark does **not** establish new mathematics, universal compression, or guaranteed business success.

A fair win: on this machine, the new core answers seeded AP range sums about ${(ns(prefix+'stored loop range sum')/ns(prefix+'OMNIDIM range sum')).toFixed(1)}× faster than scanning stored BigInts. A strong classical closed-form baseline remains much faster than the current general library implementation. A prefix array also offers fast queries, at the cost of linear preprocessing and storage.

## Measured results

Node ${r.runtime}, ${r.cpu}, ${r.platform}/${r.arch}. Seven samples after two warmups; medians below. See [raw samples](../benchmarks/results.json) and [reproduction instructions](../benchmarks/README.md).

AP: 100,000 terms, start=3, step=2; 256 seeded intervals of length 1–4,096, repeated 1,000 times per formula/prefix sample and ten times per scan sample. All timed arithmetic uses exact BigInts.

| Operation | Median |
| --- | ---: |
| New OMNIDIM range sum | ${us(prefix+'OMNIDIM range sum')} µs/query |
| Classical direct AP formula | ${us(prefix+'classical formula range sum')} µs/query |
| Classical BigInt prefix array | ${us(prefix+'prefix range sum')} µs/query |
| Stored BigInt loop | ${us(prefix+'stored loop range sum')} µs/query |
| Build stored BigInt array | ${ms(prefix+'materialize BigInt array')} ms |
| Build prefix array, after stored array exists | ${ms(prefix+'build BigInt prefix')} ms |
| Construct known-parameter OMNIDIM descriptor | ${us(prefix+'create OMNIDIM descriptor')} µs |
| Materialize all terms through OMNIDIM at() | ${ms(prefix+'OMNIDIM materialize')} ms |

GP: start=3, ratio=2, 128 terms, prefixes of length 1–128. New core ${us('GP N=128 OMNIDIM prefix query')} µs/query; classical formula ${us('GP N=128 classical formula prefix query')} µs/query. GP output size grows with exponent, so these timings must not be extrapolated to unlimited exponents.

## Storage, noise, and exceptions

For the 100,000-term AP, a benchmark-defined parameter JSON is 53 bytes versus 844,451 bytes for its decimal-string value array. Both preserve this exact sequence. The same parameter representation works with a classical AP descriptor: this is not an exclusive mathematical advantage of OMNIDIM. A Float64Array would have an 800,000-byte payload for these small values, but it has different precision capabilities from BigInt.

These are **serialized payload sizes, not JavaScript heap measurements**. Heap, object headers, closures, Map entries, allocator overhead, and peak memory are not measured. No native codec, entropy coding, or automatic pattern discovery is claimed. The benchmark supplies known parameters, and uses its own explicit decimal-string JSON to encode and reconstruct descriptors.

| 10,000-term AP plus replacements | Descriptor JSON | Value-array JSON | Descriptor full sum |
| --- | ---: | ---: | ---: |
${r.exceptions.map(e=>`| ${e.E} overrides | ${e.descriptorJsonBytes.toLocaleString('en-US')} bytes | ${e.rawDecimalStringJsonBytes.toLocaleString('en-US')} bytes | ${us(`AP N=10000 E=${e.E} full sum`)} µs |`).join('\n')}

At 10,000 replacements, every position is seeded random data: the descriptor payload is about twice the value-array payload. Its full sum takes ${ms('AP N=10000 E=10000 full sum')} ms versus ${ms('AP N=10000 E=10000 stored full scan')} ms for the stored scan. Sparse corrections are useful only while they remain sparse. The implementation scans all E overrides for a range query; it does not have an exception prefix index. No claim is made that arbitrary/noisy data compresses to a few numbers.

Benchmark-defined JSON encoding, parsing/reconstruction and materialization costs are retained in the raw results. For the all-replacement case, encoding costs ${ms('AP N=10000 E=10000 benchmark JSON encode')} ms and parse/reconstruction costs ${ms('AP N=10000 E=10000 benchmark JSON parse and reconstruct')} ms. Producing N explicit output values remains O(N); a compact descriptor cannot eliminate that output cost. Discovering a valid model from raw data requires inspecting data and is not implemented or benchmarked here.

## Correctness and precision

The script checks every term and literal sums for four AP cases, including negative values/steps and start=9,007,199,254,740,993 beyond Number's safe-integer range; three GP cases including ratios 1 and -1; range sums against an independently built exact prefix array; and four override densities including full noise. Unsafe Number input is rejected. All included checks passed. This finite test suite is evidence within these bounds, not proof for all inputs.

AP/GP arithmetic is BigInt; Number-to-BigInt conversion cannot recover precision already lost before a function call. Use BigInt literals or parse integer strings appropriately. HP is compensated floating-point direct summation and explicitly approximate, not an exact constant-time harmonic formula. HP, general power means, and browser rendering performance are outside these timings. The core has explicit power/exponent/bit/term/override caps; they must not be advertised as infinite computing.

## Fair mathematical comparison

For x_i = a + i d, the mean of endpoints is a + (n−1)d/2 and the sum is n times that midpoint. Writing a midpoint-based AP API packages the same classical identity. GP sums likewise use the classical finite geometric series. Sources: [NIST finite series](https://dlmf.nist.gov/1.2#ii) and [NIST means](https://dlmf.nist.gov/1.2#iv).

A known regular descriptor uses a fixed number of parameters; parameter bit-length still grows with representable values/counts. AP sums avoid a loop over N, but arbitrary-precision arithmetic is not constant-time in operand bits. GP exponentiation and output integer size also cost work. An ordinary regular-range object has these same representational advantages. Generic arrays, heaps, graphs, and arbitrary sorting do not become constant-space or constant-time simply by adopting this naming.

The direct baseline validates query bounds but is intentionally smaller than the production API and omits the core's full type/bit-budget validation and generic dispatch. Latency differences include that safety/generalization overhead. This shows the opportunity cost of API convenience, not a pure arithmetic theorem comparison.

## What could make it successful

A plausible initial niche is structured virtual sequences, integer schedules, regular grids, deterministic test data, and progression-heavy interactive tools where users currently materialize huge arrays. Success would require useful integration, clear exact-versus-approximate contracts, predictable limits, strong tests, and benchmarks on real customer workloads. A React-first developer experience could make standard mathematics easier and safer to use. Those are testable product hypotheses, not evidence of adoption or a guarantee of success.

## Method limits

One shared cloud host; sequential test order; no CPU pinning; V8 JIT and GC affect results. Inputs vary across seeded ranges and additive query results feed a checksum. A long batch makes fast queries measurable, but nanosecond figures are amortized batch estimates, not individual-call clock readings. Tiny constructor/zero-exception samples are especially noisy and should be read as illustrative. Repeated values allow optimization and caches; there is no cold-cache or concurrent-load claim. Setup/materialization costs are separated rather than hidden. Core entry SHA-256: ${r.coreEntrySHA256}.

The old review snapshot could not run unchanged because imported AP/GP/math modules were absent. These measurements are only of the new repository core, not the original historical implementation.
`;
writeFileSync(new URL('../docs/benchmark-report.md',import.meta.url),text);
