import test from 'node:test';
import assert from 'node:assert/strict';
import {apTerm, apPowerSum, apMidpoint, gpTerm, gpSum, hpTerm, hpSum, powerMean, createSegment, virtualWindow, lowerBound, MinHeap, LIMITS} from '../index.js';
const close = (a, b, tolerance = 1e-12) => assert.ok(Math.abs(a - b) <= tolerance * Math.max(Math.abs(b), Number.MIN_VALUE), `${a} != ${b}`);

test('AP exact finite differences agree with direct summation across powers and signed domains', () => {
  for (let start = -3n; start <= 3n; start++) for (let step = -2n; step <= 2n; step++) for (let count = 0n; count <= 20n; count++) for (let power = 0; power <= 16; power++) {
    let expected = 0n;
    for (let i = 0n; i < count; i++) expected += (start + step * i) ** BigInt(power);
    assert.equal(apPowerSum({start, step, count, power}), expected);
  }
});
test('AP huge count uses exact identities and p=0 convention', () => {
  const count = 10n ** 120n;
  assert.equal(apPowerSum({start: 1n, step: 1n, count}), count * (count + 1n) / 2n);
  assert.equal(apPowerSum({start: 1n, step: 1n, count, power: 2}), count * (count + 1n) * (2n * count + 1n) / 6n);
  assert.equal(apPowerSum({start: 1n, step: 1n, count, power: 3}), (count * (count + 1n) / 2n) ** 2n);
  assert.equal(apPowerSum({start: 0n, step: 0n, count, power: 0}), count);
  assert.equal(apPowerSum({start: -2n, step: 0n, count, power: 16}), count * 65536n);
  const high = apPowerSum({start: 3n, step: -2n, count, power: 16});
  assert.equal(high - apPowerSum({start: 3n, step: -2n, count: count - 1n, power: 16}), (3n - 2n * (count - 1n)) ** 16n);
});
test('AP terms and normalized rational midpoints', () => {
  assert.equal(apTerm({start: 4, step: -3, index: 2n}), -2n);
  assert.deepEqual(apMidpoint({start: 1, step: 1, count: 2}), {numerator: 3n, denominator: 2n});
  assert.deepEqual(apMidpoint({start: -3, step: 1, count: 2}), {numerator: -5n, denominator: 2n});
  assert.deepEqual(apMidpoint({start: -2, step: 1, count: 5}), {numerator: 0n, denominator: 1n});
  assert.throws(() => apMidpoint({start: 0, step: 1, count: 0}), RangeError);
});
test('integer validation and explicit computational bounds', () => {
  for (const bad of [1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '3', null, true]) assert.throws(() => apTerm({start: bad, step: 1, index: 0}), TypeError);
  assert.throws(() => apTerm({start: 1n << 4096n, step: 1, index: 0}), RangeError);
  assert.throws(() => apPowerSum({start: 0, step: 1, count: -1}), RangeError);
  for (const power of [-1, 17, 1.5, NaN, 2n]) assert.throws(() => apPowerSum({start: 0, step: 1, count: 5, power}), RangeError);
  assert.throws(() => gpTerm({start: 1, ratio: 2, index: LIMITS.maxGPExponent + 1n}), RangeError);
  assert.throws(() => gpSum({start: 1, ratio: 1n << 1000n, count: 1000}), RangeError);
});
test('GP exact sums match direct summation and every special ratio', () => {
  for (let start = -3n; start <= 3n; start++) for (let ratio = -4n; ratio <= 4n; ratio++) for (let count = 0n; count <= 30n; count++) {
    let sum = 0n, term = start;
    for (let i = 0n; i < count; i++) { assert.equal(gpTerm({start, ratio, index: i}), term); sum += term; term *= ratio; }
    assert.equal(gpSum({start, ratio, count}), sum);
  }
  const count = 10n ** 100n;
  assert.equal(gpSum({start: 8, ratio: 1, count}), 8n * count);
  assert.equal(gpSum({start: 8, ratio: -1, count}), 0n);
  assert.equal(gpSum({start: 8, ratio: -1, count: count + 1n}), 8n);
  assert.equal(gpSum({start: 8, ratio: 0, count}), 8n);
  assert.equal(gpTerm({start: 8, ratio: 0, index: 0}), 8n);
  assert.equal(gpTerm({start: 8, ratio: 0, index: count}), 0n);
  assert.equal(gpSum({start: 0, ratio: 99, count}), 0n);
});
test('HP is bounded, approximate, and positive-domain only', () => {
  assert.deepEqual(hpSum({start: 1, step: 1, count: 0}), {value: 0, approximate: true, terms: 0});
  close(hpSum({start: 1, step: 1, count: 3}).value, 11 / 6);
  assert.equal(hpSum({start: 2, step: 0, count: 100000}).value, 50000);
  close(hpSum({start: 4, step: -1, count: 3}).value, 1 / 4 + 1 / 3 + 1 / 2);
  assert.equal(hpTerm({start: 1, step: 1, index: 3}), 0.25);
  assert.throws(() => hpSum({start: 1, step: 1, count: 100001}), RangeError);
  for (const start of [0, -1, Infinity, NaN, 1n]) assert.throws(() => hpSum({start, step: 1, count: 2}));
  assert.throws(() => hpSum({start: 2, step: -1, count: 3}), RangeError);
  assert.throws(() => hpTerm({start: Number.MIN_VALUE, step: 0, index: 0}), RangeError);
  assert.throws(() => hpTerm({start: 1, step: 1, index: 10n ** 30n}), RangeError);
});
test('power mean covers named means, limits, monotonicity and extreme values', () => {
  const values = [1, 4, 16];
  close(powerMean(values, 1), 7); close(powerMean(values, 0), 4);
  close(powerMean(values, -1), 3 / (1 + 0.25 + 1 / 16));
  close(powerMean(values, 2), Math.sqrt(273 / 3));
  assert.equal(powerMean(values, Infinity), 16); assert.equal(powerMean(values, -Infinity), 1);
  close(powerMean(values, 1e-14), 4); close(powerMean(values, -1e-14), 4);
  close(powerMean(values, Number.MIN_VALUE), 4);
  const powers = [-1e308, -10, -1, 0, 1, 10, 1e308];
  const means = powers.map(p => powerMean([1e-300, 1e300], p));
  for (let i = 1; i < means.length; i++) assert.ok(means[i] >= means[i - 1]);
  close(powerMean([1e-300, 1e300], 0), 1);
  close(powerMean([Number.MAX_VALUE, Number.MAX_VALUE], 1), Number.MAX_VALUE);
  for (const values of [[], [0], [-1], [NaN], [Infinity], [1, undefined], Array(2)]) assert.throws(() => powerMean(values, 1));
  assert.throws(() => powerMean([1], NaN), TypeError);
});
test('formula-backed exact segments and sparse overrides agree with materialized oracle', () => {
  for (const kind of ['ap', 'gp']) for (const step of [-2, 0, 2]) {
    const options = {kind, start: 3, step, ratio: step, count: 20, overrides: [[0, 99], [4, -80], [19, 700]]};
    const segment = createSegment(options);
    const values = Array.from({length: 20}, (_, i) => segment.at(i));
    assert.equal(segment.overrideCount, 3);
    assert.ok(Object.isFrozen(segment));
    for (let from = 0; from <= 20; from++) for (let to = from; to <= 20; to++) assert.equal(segment.sum({from, to}), values.slice(from, to).reduce((a, b) => a + b, 0n));
  }
  const count = 10n ** 100n;
  const segment = createSegment({kind: 'ap', start: 1, step: 1, count, overrides: [[count - 1n, -1n]]});
  assert.equal(segment.at(count - 1n), -1n);
  assert.equal(segment.sum(), count * (count + 1n) / 2n - count - 1n);
  assert.equal(segment.sum({from: count - 2n}), count - 2n);
});
test('segment override copy, duplicate last-write-wins, range errors and HP', () => {
  const overrides = new Map([[1n, 9n]]);
  const s = createSegment({kind: 'ap', start: 1, step: 1, count: 3, overrides}); overrides.set(1n, 100n);
  assert.equal(s.at(1), 9n); assert.equal(s.sum(), 13n);
  const dup = createSegment({kind: 'ap', start: 0, step: 1, count: 2, overrides: [[0, 3], [0, 8]]});
  assert.equal(dup.overrideCount, 1); assert.equal(dup.at(0), 8n);
  for (const i of [-1, 3]) assert.throws(() => s.at(i), RangeError);
  for (const range of [{from: 2, to: 1}, {from: 0, to: 4}, {from: -1}]) assert.throws(() => s.sum(range), RangeError);
  assert.throws(() => createSegment({kind: 'wrong', start: 1, step: 1, count: 1}), RangeError);
  assert.throws(() => createSegment({kind: 'ap', start: 1, step: 1, count: 2, overrides: [[2, 0]]}), RangeError);
  const hp = createSegment({kind: 'hp', start: 1, step: 1, count: 4, overrides: [[1, 10]]});
  close(hp.sum().value, 1 + 10 + 1 / 3 + 1 / 4);
  assert.equal(hp.sum().approximate, true); assert.equal(hp.sum({from: 1, to: 2}).value, 10);
  assert.throws(() => createSegment({kind: 'hp', start: 1, step: 1, count: 100001}).sum(), RangeError);
});
test('virtual windows bound allocations for normal and astronomical counts', () => {
  const common = {scrollTop: 320, rowHeight: 32, viewportHeight: 320, overscan: 2};
  assert.deepEqual(virtualWindow({count: 100, ...common}), {start: 8n, end: 22n, offset: 256, totalHeight: 3200, clamped: false});
  const empty = virtualWindow({count: 0, ...common}); assert.equal(empty.start, 0n); assert.equal(empty.end, 0n);
  for (const count of [1n, 10n, 100n, 10n ** 100n, 1n << 4000n]) for (const scrollTop of [-1, 0, 100000, 1e30]) {
    const w = virtualWindow({count, ...common, scrollTop});
    assert.ok(w.start >= 0n && w.end <= count && w.end >= w.start);
    assert.ok(w.end - w.start <= 14n); assert.ok(Number.isFinite(w.totalHeight));
  }
  const huge = 10n ** 100n;
  assert.equal(virtualWindow({count: huge, ...common, scrollTop: 1e30}).end, huge);
  assert.throws(() => virtualWindow({count: 10, ...common, rowHeight: 0}), RangeError);
  assert.throws(() => virtualWindow({count: 10, ...common, overscan: 0.5}), RangeError);
  assert.throws(() => virtualWindow({count: 10, ...common, rowHeight: 1e-300}), RangeError);
});
test('lower bound and heap maintain order with duplicates and custom comparators', () => {
  assert.equal(lowerBound([], 1), 0);
  for (const [target, expected] of [[0, 0], [1, 0], [2, 1], [3, 3], [8, 4]]) assert.equal(lowerBound([1, 2, 2, 4], target), expected);
  const heap = new MinHeap(); const values = [5, -1, 8, 5, 0, 10, -8];
  values.forEach(value => heap.push(value)); assert.equal(heap.peek(), -8); assert.equal(heap.size, values.length);
  assert.deepEqual(values.map(() => heap.pop()), [...values].sort((a, b) => a - b)); assert.equal(heap.pop(), undefined);
  const maxHeap = new MinHeap((a, b) => b - a); [1, 3, 2].forEach(v => maxHeap.push(v)); assert.deepEqual([maxHeap.pop(), maxHeap.pop(), maxHeap.pop()], [3, 2, 1]);
});

test('virtual window includes the trailing partial row with zero overscan', () => {
  assert.deepEqual(virtualWindow({count: 100, scrollTop: 39, rowHeight: 40, viewportHeight: 100, overscan: 0}),
    {start: 0n, end: 4n, offset: 0, totalHeight: 4000, clamped: false});
  for (const scrollTop of [0, 0.1, 19, 39, 40, 40.1, 101, 3899, 3900]) {
    const window = virtualWindow({count: 100, scrollTop, rowHeight: 40, viewportHeight: 100, overscan: 0});
    assert.ok(window.offset <= scrollTop, 'rendered window begins before viewport');
    assert.ok(Number(window.end) * 40 >= scrollTop + 100, 'rendered window covers viewport bottom');
    assert.ok(window.end - window.start <= 4n, 'at most one extra partial row');
  }
});
