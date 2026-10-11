// Classical baselines, independent of the library under test.
export class ClassicalAP {
  constructor(a, d, n) { this.a = a; this.d = d; this.n = n; }
  at(i) { if (!Number.isSafeInteger(i) || i < 0 || i >= this.n) throw new RangeError('index'); return this.a + this.d * i; }
  rangeSum(lo, hi) { if (lo < 0 || hi >= this.n || hi < lo) throw new RangeError('range'); return (hi-lo+1) * ((this.a + lo*this.d) + (this.a + hi*this.d)) / 2; }
}
export class ClassicalGP {
  constructor(a, r, n) { this.a = a; this.r = r; this.n = n; }
  at(i) { if (!Number.isSafeInteger(i) || i < 0 || i >= this.n) throw new RangeError('index'); return this.a * this.r ** i; }
  rangeSum(lo, hi) { if (lo < 0 || hi >= this.n || hi < lo) throw new RangeError('range'); const k=hi-lo+1; return this.a*this.r**lo*(this.r===1?k:Math.expm1(k*Math.log(this.r))/Math.expm1(Math.log(this.r))); }
}
export function prefixArray(xs) { const p=new Float64Array(xs.length+1); for(let i=0;i<xs.length;i++) p[i+1]=p[i]+xs[i]; return p; }
export function scan(xs,lo,hi) { let s=0; for(let i=lo;i<=hi;i++) s+=xs[i]; return s; }
export function rng(seed=0x5eed1234) { return () => { seed=(Math.imul(seed,1664525)+1013904223)>>>0; return seed/4294967296; }; }
export function median(xs) { return [...xs].sort((a,b)=>a-b)[Math.floor(xs.length/2)]; }
export class ClassicalBigAP {
  constructor(a,d,n) { this.a=a;this.d=d;this.n=n; }
  at(i) { if(i<0n||i>=this.n) throw new RangeError('index'); return this.a+this.d*i; }
  sum({from=0n,to=this.n}={}) { if(from<0n||to>this.n||to<from)throw new RangeError('range'); const k=to-from;return k*(2n*this.a+(from+to-1n)*this.d)/2n; }
}
export class ClassicalBigGP {
  constructor(a,r,n){this.a=a;this.r=r;this.n=n;}
  at(i){if(i<0n||i>=this.n)throw new RangeError('index');return this.a*this.r**i;}
  sum({from=0n,to=this.n}={}){if(from<0n||to>this.n||to<from)throw new RangeError('range');const k=to-from;return this.r===1n?this.a*k:this.a*this.r**from*(this.r**k-1n)/(this.r-1n);}
}
