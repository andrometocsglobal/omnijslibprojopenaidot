# Mathematics, scope and possible impact

## Exact AP powers

For f(k) = (a + kd)^p, with integer a, d and p in 0..16, the implementation
constructs forward differences at k=0. Newton's finite expansion gives
f(k) = sum_j Delta^j f(0) C(k,j). Summing the binomial basis with the hockey-stick
identity gives sum_{k=0}^{n-1} f(k) = sum_j Delta^j f(0) C(n,j+1).
All intermediate values are BigInt. p=0 uses the constant polynomial 1,
including at zero. p=1 has the familiar direct arithmetic-sum fast path.

This is classical finite-difference mathematics. Related Bernoulli-polynomial
power-sum identities are documented by [NIST DLMF 24.4(iii)](https://dlmf.nist.gov/24.4#iii).
The implementation uses the binomial basis rather than Bernoulli numbers.
For p>1, there are O(p²) difference operations plus bounded binomial evaluations,
not a traversal of n terms. BigInt bit costs grow with the data and output size.

## GP, HP and means

Integer GP sums use a(r^n-1)/(r-1), with empty, zero and unit-ratio cases handled
explicitly. Integer exponentiation and large output size are not constant-cost.
Bounds prevent unchecked huge allocations.

HP terms 1/(a+kd) are computed as Numbers with positive denominators, using
bounded direct compensated summation. This implementation does not use a
digamma function or claim an elementary closed form. Special-function context
is available in [NIST DLMF 5.9](https://dlmf.nist.gov/5.9).

Power means connect harmonic, geometric, arithmetic and quadratic means on
positive values. The implementation uses logarithmic scaling for stability;
results remain floating-point approximations.

## Representation versus compression

A formula-backed segment stores a generating law and explicit replacements.
This can represent an arbitrarily long *known structured* sequence without
materializing each element, within the library's resource limits. It cannot
recover arbitrary input data from a guessed law. Exceptions require storage,
and range sums scan exceptions. No fitting, discovery or codec is shipped.

The million-term explorer demonstrates logical size, not a million-element
allocation. It uses bounded pages plus virtualization and exact index lookup.

## Potential real-world impact

**Demonstrated prototype outcomes:** exact AP/GP arithmetic, direct indexed
access without materialization, sparse corrections, transparent verification,
and measurable trade-offs against classical formulas and stored arrays.

**Plausible applications:** reducing unnecessary arrays in structured analytics;
compact transport of known regular signals; inspectable scientific tools;
interactive mathematical education; and reusable, accessible interfaces.

**Untested hypotheses:** production cost or energy savings, improved research
outcomes, and broad adoption. Real workloads and controlled experiments must
establish these. A simpler direct formula is faster in several measured cases.
This project’s value depends on clear contracts, trustworthy integration and
actual users, rather than an unprecedented theorem or guaranteed world change.

## Evidence

See [measured benchmark report](benchmark-report.md). It separates setup,
queries, explicit materialization, sparse exception density and serialization.
Finite oracle tests establish exact agreement on their tested inputs; they are
not by themselves a proof for every possible input.
