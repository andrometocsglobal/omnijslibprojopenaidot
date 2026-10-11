/** Original implementation. No progression elements are materialized for exact sums. */
export const LIMITS = Object.freeze({maxPower: 16, maxInputBits: 4096, maxGPExponent: 100000n, maxGPResultBits: 262144, maxDirectTerms: 100000, maxOverrides: 10000, maxValues: 100000, maxVirtualHeight: 16000000});

function integer(value, name) {
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) throw new TypeError(`${name} must be a BigInt or safe integer`);
    value = BigInt(value);
  }
  if (typeof value !== 'bigint') throw new TypeError(`${name} must be a BigInt or safe integer`);
  if ((value < 0n ? -value : value).toString(2).length > LIMITS.maxInputBits) throw new RangeError(`${name} exceeds ${LIMITS.maxInputBits} bits`);
  return value;
}
function nonnegative(value, name) {
  value = integer(value, name);
  if (value < 0n) throw new RangeError(`${name} must be nonnegative`);
  return value;
}
function finite(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError(`${name} must be a finite Number`);
  return value;
}
function positive(value, name) {
  value = finite(value, name);
  if (value <= 0) throw new RangeError(`${name} must be positive`);
  return value;
}
function gcd(a, b) {
  a = a < 0n ? -a : a;
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
}
function rational(numerator, denominator) {
  const g = gcd(numerator, denominator);
  return Object.freeze({numerator: numerator / g, denominator: denominator / g});
}
function powerArgument(power) {
  if (!Number.isInteger(power) || power < 0 || power > LIMITS.maxPower) throw new RangeError(`power must be an integer from 0 to ${LIMITS.maxPower}`);
  return power;
}

export function apTerm({start, step, index}) {
  return integer(start, 'start') + integer(step, 'step') * nonnegative(index, 'index');
}

/** Sum (start + i*step)^power, i=0..count-1. Uses Newton forward differences. */
export function apPowerSum({start, step, count, power = 1}) {
  start = integer(start, 'start'); step = integer(step, 'step'); count = nonnegative(count, 'count'); powerArgument(power);
  if (count === 0n) return 0n;
  if (power === 0) return count; // Including 0^0: the constant polynomial 1.
  if (power === 1) return count * (2n * start + (count - 1n) * step) / 2n;
  const differences = Array.from({length: power + 1}, (_, i) => (start + BigInt(i) * step) ** BigInt(power));
  let choose = count, result = 0n;
  for (let order = 0; order <= power; order++) {
    result += differences[0] * choose;
    for (let i = 0; i < power - order; i++) differences[i] = differences[i + 1] - differences[i];
    choose = choose * (count - BigInt(order + 1)) / BigInt(order + 2);
  }
  return result;
}

/** Exact mean of first and last terms. Empty sequences have no midpoint. */
export function apMidpoint({start, step, count}) {
  start = integer(start, 'start'); step = integer(step, 'step'); count = nonnegative(count, 'count');
  if (count === 0n) throw new RangeError('An empty progression has no midpoint');
  return rational(2n * start + (count - 1n) * step, 2n);
}

function checkedGeometricPower(ratio, exponent, start) {
  if (exponent === 0n) return 1n;
  if (ratio === 0n) return 0n;
  if (ratio === 1n) return 1n;
  if (ratio === -1n) return exponent % 2n === 0n ? 1n : -1n;
  const bits = BigInt((ratio < 0n ? -ratio : ratio).toString(2).length);
  const startBits = BigInt((start < 0n ? -start : start).toString(2).length);
  if (exponent > LIMITS.maxGPExponent || bits * exponent + startBits > BigInt(LIMITS.maxGPResultBits)) throw new RangeError('Geometric result exceeds the configured exponent or bit budget');
  return ratio ** exponent;
}
export function gpTerm({start, ratio, index}) {
  start = integer(start, 'start'); ratio = integer(ratio, 'ratio'); index = nonnegative(index, 'index');
  if (start === 0n) return 0n;
  return start * checkedGeometricPower(ratio, index, start);
}
export function gpSum({start, ratio, count}) {
  start = integer(start, 'start'); ratio = integer(ratio, 'ratio'); count = nonnegative(count, 'count');
  if (count === 0n || start === 0n) return 0n;
  if (ratio === 1n) return start * count;
  if (ratio === 0n) return start;
  if (ratio === -1n) return count % 2n === 0n ? 0n : start;
  return start * (checkedGeometricPower(ratio, count, start) - 1n) / (ratio - 1n);
}

function hpDomain(start, step, count) {
  positive(start, 'start'); finite(step, 'step');
  if (count > BigInt(Number.MAX_SAFE_INTEGER)) throw new RangeError('HP count must be a safe integer');
  if (count > 0n) positive(start + step * Number(count - 1n), 'last reciprocal denominator');
}
export function hpTerm({start, step, index}) {
  index = nonnegative(index, 'index');
  if (index > BigInt(Number.MAX_SAFE_INTEGER)) throw new RangeError('HP index must be a safe integer');
  positive(start, 'start'); finite(step, 'step');
  const result = 1 / positive(start + step * Number(index), 'reciprocal denominator');
  if (!Number.isFinite(result)) throw new RangeError('HP value overflows Number');
  return result;
}
/** Numeric direct summation with Neumaier compensation; deliberately not called exact. */
export function hpSum({start, step, count}) {
  count = nonnegative(count, 'count'); hpDomain(start, step, count);
  if (count > BigInt(LIMITS.maxDirectTerms)) throw new RangeError(`HP direct sums are limited to ${LIMITS.maxDirectTerms} terms`);
  let sum = 0, correction = 0;
  for (let i = 0; i < Number(count); i++) {
    const value = 1 / (start + step * i), next = sum + value;
    correction += Math.abs(sum) >= Math.abs(value) ? (sum - next) + value : (value - next) + sum;
    sum = next;
  }
  const value = sum + correction;
  if (!Number.isFinite(value)) throw new RangeError('HP sum overflows Number');
  return Object.freeze({value, approximate: true, terms: Number(count)});
}

/** Generalized mean for positive finite Numbers, with p=0 and ±Infinity limits. */
export function powerMean(values, power) {
  if (!Array.isArray(values) || values.length === 0 || values.length > LIMITS.maxValues) throw new RangeError(`values must be a nonempty array with at most ${LIMITS.maxValues} entries`);
  if (typeof power !== 'number' || Number.isNaN(power)) throw new TypeError('power must be a Number (including ±Infinity)');
  let min = Infinity, max = 0, logCenter = 0;
  const logs = Array.from(values, (value, i) => {
    positive(value, `values[${i}]`); min = Math.min(min, value); max = Math.max(max, value);
    const log = Math.log(value); logCenter += log / values.length; return log;
  });
  if (power === Infinity) return max;
  if (power === -Infinity) return min;
  if (min === max) return min;
  if (Math.abs(power) < 1e-300) return Math.min(max, Math.max(min, Math.exp(logCenter)));
  const small = logs.every(log => Math.abs(power * (log - logCenter)) < 0.5);
  let logMean;
  if (small) {
    let delta = 0;
    for (const log of logs) delta += Math.expm1(power * (log - logCenter)) / logs.length;
    logMean = logCenter + Math.log1p(delta) / power;
  } else {
    const anchor = Math.log(power > 0 ? max : min);
    let sum = 0;
    for (const log of logs) sum += Math.exp(power * (log - anchor));
    logMean = anchor + Math.log(sum / logs.length) / power;
  }
  return Math.min(max, Math.max(min, Math.exp(logMean)));
}

/** Immutable formula-backed sequence, sparse exact replacements, half-open ranges. */
export function createSegment({kind, start, step, ratio, count, overrides = []}) {
  if (!['ap', 'gp', 'hp'].includes(kind)) throw new RangeError('kind must be ap, gp, or hp');
  count = nonnegative(count, 'count');
  if (kind === 'hp') hpDomain(start, step, count);
  else { start = integer(start, 'start'); if (kind === 'ap') step = integer(step, 'step'); else ratio = integer(ratio, 'ratio'); }
  if (!(overrides instanceof Map) && !Array.isArray(overrides)) throw new TypeError('overrides must be a Map or array of [index, value] pairs');
  if ((overrides.size ?? overrides.length) > LIMITS.maxOverrides) throw new RangeError('Too many sparse overrides');
  const replacements = new Map();
  for (const pair of overrides) {
    if (!Array.isArray(pair) || pair.length !== 2) throw new TypeError('Each override must be [index, value]');
    const index = nonnegative(pair[0], 'override index');
    if (index >= count) throw new RangeError('Override index is outside the segment');
    replacements.set(index, kind === 'hp' ? positive(pair[1], 'override value') : integer(pair[1], 'override value'));
  }
  function original(index) {
    return kind === 'ap' ? apTerm({start, step, index}) : kind === 'gp' ? gpTerm({start, ratio, index}) : hpTerm({start, step, index});
  }
  function at(index) {
    index = nonnegative(index, 'index');
    if (index >= count) throw new RangeError('Index is outside the segment');
    return replacements.has(index) ? replacements.get(index) : original(index);
  }
  function sum({from = 0n, to = count} = {}) {
    from = nonnegative(from, 'from'); to = nonnegative(to, 'to');
    if (from > to || to > count) throw new RangeError('Expected 0 <= from <= to <= count');
    const length = to - from;
    if (kind === 'hp') {
      if (length > BigInt(LIMITS.maxDirectTerms)) throw new RangeError(`HP direct sums are limited to ${LIMITS.maxDirectTerms} terms`);
      let value = 0, correction = 0;
      for (let index = from; index < to; index++) {
        const term = at(index), next = value + term;
        correction += Math.abs(value) >= Math.abs(term) ? (value - next) + term : (term - next) + value;
        value = next;
      }
      value += correction;
      if (!Number.isFinite(value)) throw new RangeError('HP sum overflows Number');
      return Object.freeze({value, approximate: true, terms: Number(length)});
    }
    // Evaluate AP range directly without revalidating its derived (possibly >4096-bit) first term.
    let value = kind === 'ap'
      ? length * (2n * start + (from + to - 1n) * step) / 2n
      : length === 0n ? 0n : gpSum({start, ratio, count: to}) - gpSum({start, ratio, count: from});
    for (const [index, replacement] of replacements) if (index >= from && index < to) value += replacement - original(index);
    return value;
  }
  return Object.freeze({kind, count, overrideCount: replacements.size, at, sum});
}

/** Bounded physical scroll track; compressed long lists intentionally quantize scroll positions. */
export function virtualWindow({count, scrollTop, rowHeight, viewportHeight, overscan = 4}) {
  count = nonnegative(count, 'count'); positive(rowHeight, 'rowHeight'); finite(scrollTop, 'scrollTop'); positive(viewportHeight, 'viewportHeight');
  if (!Number.isSafeInteger(overscan) || overscan < 0 || overscan > 1000) throw new RangeError('overscan must be an integer from 0 to 1000');
  if (viewportHeight > LIMITS.maxVirtualHeight || rowHeight > LIMITS.maxVirtualHeight) throw new RangeError('Viewport and row height exceed the physical scroll budget');
  const visible = Math.ceil(viewportHeight / rowHeight);
  if (!Number.isSafeInteger(visible) || visible > LIMITS.maxDirectTerms) throw new RangeError('Viewport would require too many rows');
  const capacity = BigInt(visible);
  const naturalHeight = Number(count) * rowHeight;
  const totalHeight = Math.min(LIMITS.maxVirtualHeight, Math.max(viewportHeight, naturalHeight));
  const clamped = naturalHeight > LIMITS.maxVirtualHeight;
  const maxScroll = Math.max(0, totalHeight - viewportHeight);
  const scroll = Math.min(maxScroll, Math.max(0, scrollTop));
  const maxFirst = count > capacity ? count - capacity : 0n;
  let first;
  if (clamped && maxScroll > 0) {
    // Use 1e9 discrete track positions; never convert huge logical count to Number.
    const tick = BigInt(Math.floor(scroll / maxScroll * 1e9));
    first = maxFirst * tick / 1000000000n;
  } else first = BigInt(Math.floor(scroll / rowHeight));
  if (first > maxFirst) first = maxFirst;
  const start = first > BigInt(overscan) ? first - BigInt(overscan) : 0n;
  // A fractional leading row can require one more rendered row than ceil(viewport/rowHeight).
  // Compressed tracks deliberately align the first logical row to scrollTop.
  const visibleEnd = clamped ? first + capacity : BigInt(Math.ceil((scroll + viewportHeight) / rowHeight));
  const endWithOverscan = visibleEnd + BigInt(overscan);
  const end = endWithOverscan < count ? endWithOverscan : count;
  const offset = clamped ? Math.max(0, scroll - Number(first - start) * rowHeight) : Number(start) * rowHeight;
  return Object.freeze({start, end, offset, totalHeight, clamped});
}

/** Lower-bound index in sorted arrays. Does not verify sortedness (which would be O(n)). */
export function lowerBound(values, target, compare = (a, b) => a < b ? -1 : a > b ? 1 : 0) {
  if (!Array.isArray(values) || typeof compare !== 'function') throw new TypeError('Expected an array and comparator');
  let lo = 0, hi = values.length;
  while (lo < hi) { const mid = lo + Math.floor((hi - lo) / 2); if (compare(values[mid], target) < 0) lo = mid + 1; else hi = mid; }
  return lo;
}

export class MinHeap {
  #values = []; #compare;
  constructor(compare = (a, b) => a < b ? -1 : a > b ? 1 : 0) {
    if (typeof compare !== 'function') throw new TypeError('compare must be a function'); this.#compare = compare;
  }
  get size() { return this.#values.length; }
  peek() { return this.#values[0]; }
  push(value) {
    const values = this.#values; values.push(value); let i = values.length - 1;
    while (i > 0) { const parent = Math.floor((i - 1) / 2); if (this.#compare(values[parent], values[i]) <= 0) break; [values[parent], values[i]] = [values[i], values[parent]]; i = parent; }
    return this;
  }
  pop() {
    const values = this.#values; if (!values.length) return undefined;
    const root = values[0], last = values.pop(); if (!values.length) return root;
    values[0] = last; let i = 0;
    while (2 * i + 1 < values.length) {
      let child = 2 * i + 1;
      if (child + 1 < values.length && this.#compare(values[child + 1], values[child]) < 0) child++;
      if (this.#compare(values[i], values[child]) <= 0) break;
      [values[i], values[child]] = [values[child], values[i]]; i = child;
    }
    return root;
  }
}
