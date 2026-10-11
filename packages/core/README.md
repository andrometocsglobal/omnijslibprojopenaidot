# @omni/core 0.1.0

Original, dependency-free ESM implementation of exact integer progressions, bounded floating-point operations, sparse formula-backed sequences, and two small data structures. Requires Node 20+ for the test runner; the module itself uses standard browser JavaScript and BigInt. No external source code was copied.

## Import

```js
import { apPowerSum, apMidpoint, createSegment, powerMean } from '@omni/core';

apPowerSum({ start: 1n, step: 1n, count: 10n ** 100n, power: 2 }); // BigInt
apMidpoint({ start: 1n, step: 1n, count: 2n }); // { numerator: 3n, denominator: 2n }
const sequence = createSegment({
  kind: 'ap', start: 10n, step: 3n, count: 10n ** 50n,
  overrides: [[2n, 999n]],
});
sequence.at(2n); // 999n
sequence.sum({ from: 0n, to: 3n }); // 1022n
powerMean([1, 4, 16], 0); // approximately 4
```

## Contracts and limits

- Integer arguments accept BigInt or safe integer Numbers, never strings or implicitly rounded Numbers. Parse UI decimal strings with `BigInt(text)` before calling. Each integer input is limited to 4,096 bits, including count and index. Counts and indices are nonnegative.
- Exact AP/GP results are BigInt. Convert them to strings for display or JSON; converting to Number can lose precision. Derived exact results may exceed the input bit limit.
- AP powers are integer Numbers from **0 through 16**. Power zero means the constant polynomial 1, including at a zero term. Empty sums are zero.
- GP nontrivial exponentiation is limited to 100,000 and a conservative bound of 262,144 bits: `bitLength(abs(ratio)) * exponent + bitLength(abs(start))`. This can reject a result that would fit more tightly. Ratios 0, 1, −1 and zero starts avoid exponentiation and support enormous counts. Sum evaluation budgets exponent `count`, term evaluation budgets `index`.
- HP and power means use floating-point Numbers. Every HP result is approximate; summation returns an explicit marker. HP represents **1 / (start + step * i)**, so `start` is the initial denominator, not the initial term. Denominators and values must be positive and finite. A requested HP sum has at most 100,000 terms. HP count/index must be safe integers, even when provided as BigInt; decreasing denominators must remain positive across the entire segment. Overflow is rejected. Ordinary floating-point rounding and underflow remain possible.
- Power means accept a nonempty Array of at most 100,000 positive finite Numbers. Powers may be any Number except NaN, including ±Infinity. These are approximate, unweighted means. Powers with magnitude below 1e−300 use the geometric-mean limit to avoid subnormal division artifacts.
- Sparse overrides accept a Map or Array of `[index, value]` pairs, at most 10,000 entries. The index must be inside the segment. AP/GP replacements are integers, HP replacements positive finite Numbers. Duplicate indices use the last value. Inputs are copied; mutating the original collection cannot mutate the segment.
- Invalid types throw TypeError; invalid domains or computational budgets throw RangeError. No partial approximate answer is substituted for an over-budget exact result.

## API

| Export | Result / meaning |
| --- | --- |
| `apTerm({start, step, index})` | `start + step * index`, exact BigInt |
| `apPowerSum({start, step, count, power=1})` | Sum `(start + step*i)^power` for `0 <= i < count`, exact BigInt |
| `apMidpoint({start, step, count})` | Reduced frozen `{numerator, denominator}`: mean of first and last terms; rejects empty count |
| `gpTerm({start, ratio, index})` | `start * ratio^index`, exact BigInt; at index 0, ratio 0 gives start |
| `gpSum({start, ratio, count})` | Exact sum of first count GP terms |
| `hpTerm({start, step, index})` | Approximate Number `1 / (start + step*index)` |
| `hpSum({start, step, count})` | Frozen `{value, approximate: true, terms}` using compensated direct summation |
| `powerMean(values, power)` | Approximate Number; `−1` harmonic, `0` geometric, `1` arithmetic, `2` RMS, `−Infinity` min, `Infinity` max |
| `createSegment({kind, start, step, ratio, count, overrides=[]})` | Frozen `{kind, count, overrideCount, at, sum}`; supply step for AP/HP or ratio for GP |
| `segment.at(index)` | Replacement or formula value; rejects out-of-range index |
| `segment.sum({from=0n, to=count}={})` | Half-open range `[from,to)`; includes replacements; exact BigInt for AP/GP, marked approximate object for HP |
| `virtualWindow({count, scrollTop, rowHeight, viewportHeight, overscan=4})` | Frozen `{start, end, offset, totalHeight, clamped}`; indices BigInt, end exclusive, dimensions Number pixels |
| `lowerBound(array, target, compare?)` | First array index whose value is not less than target, or array.length |
| `new MinHeap(compare?)` | Mutable heap with `.size`, `.peek()`, `.push(value)` returning this, `.pop()` |
| `LIMITS` | Frozen public guard constants |

Segment construction is lazy. A huge GP segment can be constructed even if a later access or sum exceeds its exponent budget. An explicit replacement can be read without evaluating its original term; sum calculations still need the original baseline and respect its budget. Empty exact ranges return zero. An HP empty range returns `{value:0, approximate:true, terms:0}`.

## Exact AP algorithm

For polynomial `f(i) = (start + step*i)^power`, Newton's forward formula is

`f(i) = sum(k=0..power) Delta^k f(0) * C(i,k)`.

Summing each binomial basis term over `i=0..count−1` gives `C(count,k+1)`. Compute forward differences from just `power+1` values and accumulate

`sum(k=0..power) Delta^k f(0) * C(count,k+1)`.

Powers zero and one use direct constant-polynomial and arithmetic-series fast paths. Every operation is integer arithmetic, including the exact binomial recurrence division. No loop depends on count. The midpoint uses the rational `(2*start + (count−1)*step)/2`, reduced with integer gcd; no floating-point division enters exact computations. GP uses its exact integer geometric-series identity with separate zero/unit/alternating cases.

## Complexity (arithmetic operations versus bit cost)

| Operation | Arithmetic-operation complexity | Extra storage |
| --- | --- | --- |
| AP term | O(1) | O(1) integers |
| AP power sum | O(p² + p log p), independent of count's **numeric value** | O(p) integers |
| AP midpoint | Constant-size expression plus gcd | O(1) integers |
| GP term/sum | O(log exponent) multiplication model for exponentiation; native BigInt implementation details vary | Output-sized integers |
| HP sum | O(count), capped at 100,000 | O(1) Numbers |
| Power mean | O(values.length) | O(values.length) Numbers |
| Segment creation | O(k) overrides | O(k) |
| Segment at | Average O(1) map lookup plus formula cost | O(1) aside from BigInt output |
| Segment AP/GP range sum | One AP range formula or two GP prefix evaluations, plus O(k) override checks and affected-term evaluations | O(1) aside from outputs |
| Segment HP range sum | O(range length), capped at 100,000 | O(1) |
| Virtual window | Constant number of arithmetic operations | O(1) integers |
| Lower bound | O(log n) comparator calls | O(1) |
| Heap push/pop | O(log n) comparator calls | O(n) heap storage |
| Heap peek/size | O(1) | O(1) |

**BigInt operations are not constant-time.** Their bit cost and allocated memory depend on operand/result size, including log(count). Validation itself measures input bit length. Therefore “independent of count” describes the number of AP arithmetic operations, not constant wall time or constant bit complexity. HP has no claimed constant-time exact sum.

Default ordering for lowerBound/MinHeap uses `<` and `>`. Values must form a total order, or provide a consistent comparator returning negative/zero/positive. NaN, mixed incomparable values, and inconsistent comparators are outside these ordering APIs' contract. lowerBound assumes the array is already sorted and does not perform an O(n) verification. Empty heap peek/pop return undefined.

## Virtualization

A browser cannot represent an astronomical pixel scroll height. The helper caps the physical track at **16,000,000 px** and reports `clamped:true` when the logical list is compressed. Compressed scrolling maps the track to **1,000,000,001 discrete positions**; it cannot address every huge logical index. Use `segment.at(index)` or an explicit index-jump control when exact navigation matters. Never pretend browser scroll precision equals BigInt precision.

A partial leading row can add one trailing row beyond `ceil(viewportHeight / rowHeight)` so that zero overscan still covers the viewport. Render only `[start,end)` and place the first rendered row at `offset` in a container of `totalHeight`. The helper never materializes data. It caps visible rows at 100,000 and overscan at 1,000; viewport/row heights must be positive finite Numbers no larger than the physical height budget. The empty list has an empty window and a viewport-sized container. scrollTop is clamped to the physical track. Reading a window of GP/HP terms may independently encounter formula-domain or arithmetic-budget guards.

## Tests

```sh
node --test packages/core/test/*.test.js
```

Deterministic tests cover all 17 powers across signed starts/steps, direct-sum oracles, 100-digit-plus counts, exact midpoint fractions, GP edge cases, numeric-domain rejection, stable means across 600 orders of magnitude, sparse ranges, virtual scroll endpoints, and data structure ordering. No benchmark timing threshold is part of correctness tests.
