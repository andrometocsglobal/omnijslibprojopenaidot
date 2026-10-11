import {performance} from 'node:perf_hooks';
import {writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import os from 'node:os';
import assert from 'node:assert/strict';
import {ClassicalBigAP,ClassicalBigGP,rng,median} from './baselines.mjs';
import {createSegment,apPowerSum,gpSum} from '../packages/core/index.js';
const SEED=0x5eed1234, REPEATS=7, WARMUPS=2;
let sink=0n;
const timings=[];
function measure(name,fn,ops=1){const samples=[];for(let r=-WARMUPS;r<REPEATS;r++){const t=performance.now();const result=fn();const ms=performance.now()-t;if(typeof result==='bigint')sink^=result;else if(typeof result==='string')sink^=BigInt(result.length);if(r>=0)samples.push(ms);}const row={name,operationsPerSample:ops,samplesMs:samples,medianMs:median(samples),medianNsPerOperation:median(samples)*1e6/ops};timings.push(row);return row;}
const checks=[];
assert.throws(()=>createSegment({kind:'ap',start:Number.MAX_SAFE_INTEGER+2,step:1n,count:2n}));
checks.push({kind:'unsafe Number input rejection',passed:true});
for(const [a,d,n] of [[3n,2n,1000n],[-7n,3n,100n],[19n,-2n,100n],[9007199254740993n,3n,1000n]]){
 const seg=createSegment({kind:'ap',start:a,step:d,count:n}),ref=new ClassicalBigAP(a,d,n);let total=0n;for(let i=0n;i<n;i++){assert.equal(seg.at(i),ref.at(i));total+=ref.at(i);}assert.equal(seg.sum(),total);assert.equal(apPowerSum({start:a,step:d,count:n,power:1}),total);for(let i=0n;i<n;i+=7n){const to=i+9n<n?i+9n:n;assert.equal(seg.sum({from:i,to}),ref.sum({from:i,to}));}checks.push({kind:'AP',a:String(a),d:String(d),count:String(n),passed:true});
}
for(const [a,r,n] of [[3n,2n,128n],[7n,1n,1000n],[3n,-1n,1000n]]){const seg=createSegment({kind:'gp',start:a,ratio:r,count:n}),ref=new ClassicalBigGP(a,r,n);let total=0n;for(let i=0n;i<n;i++){assert.equal(seg.at(i),ref.at(i));total+=ref.at(i);}assert.equal(seg.sum(),total);assert.equal(gpSum({start:a,ratio:r,count:n}),total);checks.push({kind:'GP',a:String(a),r:String(r),count:String(n),passed:true});}
const storage=[];
for(const N of [10000,100000]){
 const n=BigInt(N),a=3n,d=2n,ref=new ClassicalBigAP(a,d,n),seg=createSegment({kind:'ap',start:a,step:d,count:n});
 let xs,prefix;
 measure(`AP N=${N} materialize BigInt array`,()=>{xs=Array.from({length:N},(_,i)=>a+d*BigInt(i));return xs[N-1];});
 measure(`AP N=${N} build BigInt prefix`,()=>{prefix=new Array(N+1);prefix[0]=0n;for(let i=0;i<N;i++)prefix[i+1]=prefix[i]+xs[i];return prefix[N];});
 measure(`AP N=${N} create OMNIDIM descriptor`,()=>{let s;for(let k=0;k<1000;k++)s=createSegment({kind:'ap',start:a,step:d,count:n});return s.at(0n);},1000);
 measure(`AP N=${N} create classical descriptor`,()=>{let s;for(let k=0;k<1000;k++)s=new ClassicalBigAP(a,d,n);return s.at(0n);},1000);
 const random=rng(SEED),queries=Array.from({length:256},()=>{const from=Math.floor(random()*(N-4096));return {from,to:from+1+Math.floor(random()*4096)};});
 for(const q of queries){const arg={from:BigInt(q.from),to:BigInt(q.to)};assert.equal(seg.sum(arg),prefix[q.to]-prefix[q.from]);}
 const bigQueries=queries.map(q=>({from:BigInt(q.from),to:BigInt(q.to)}));
 const batch=(f,qs,reps)=>()=>{let out=0n;for(let r=0;r<reps;r++)for(const q of qs)out+=f(q);return out;};
 measure(`AP N=${N} OMNIDIM range sum`,batch(q=>seg.sum(q),bigQueries,1000),256000);
 measure(`AP N=${N} classical formula range sum`,batch(q=>ref.sum(q),bigQueries,1000),256000);
 measure(`AP N=${N} prefix range sum`,batch(q=>prefix[q.to]-prefix[q.from],queries,1000),256000);
 measure(`AP N=${N} stored loop range sum`,batch(q=>{let v=0n;for(let i=q.from;i<q.to;i++)v+=xs[i];return v;},queries,10),2560);
 measure(`AP N=${N} OMNIDIM materialize`,()=>{const out=Array.from({length:N},(_,i)=>seg.at(BigInt(i)));return out[N-1];});
 const json=JSON.stringify({kind:'ap',start:String(a),step:String(d),count:String(n)}),rawJson=JSON.stringify(xs.map(String));
 storage.push({N,descriptorSchema:'benchmark-defined decimal-string JSON, not a library codec',descriptorJsonBytes:Buffer.byteLength(json),materializedDecimalStringJsonBytes:Buffer.byteLength(rawJson),float64PayloadBytesOnly:N*8,heapBytesMeasured:false});
}
const exceptions=[];
for(const E of [0,100,1000,10000]) {
 const N=10000, random=rng(SEED), pairs=Array.from({length:E},(_,i)=>[BigInt(i),BigInt(Math.floor(random()*1000000))]);
 let seg;
 measure(`AP N=${N} E=${E} construct overrides`,()=>{seg=createSegment({kind:'ap',start:3n,step:2n,count:BigInt(N),overrides:pairs});return seg.at(0n);});
 let expected=new ClassicalBigAP(3n,2n,BigInt(N)).sum();for(const [i,v] of pairs)expected+=v-(3n+2n*i);
 assert.equal(seg.sum(),expected);
 measure(`AP N=${N} E=${E} full sum`,()=>seg.sum());
 measure(`AP N=${N} E=${E} benchmark JSON encode`,()=>JSON.stringify({kind:'ap',start:'3',step:'2',count:String(N),overrides:pairs.map(([i,v])=>[String(i),String(v)])}));
 const serialized=JSON.stringify({kind:'ap',start:'3',step:'2',count:String(N),overrides:pairs.map(([i,v])=>[String(i),String(v)])});
 const raw=Array.from({length:N},(_,i)=>3n+2n*BigInt(i));for(const [i,v]of pairs)raw[Number(i)]=v;
 measure(`AP N=${N} E=${E} stored full scan`,()=>{let s=0n;for(const x of raw)s+=x;return s;});
 exceptions.push({N,E,rawDecimalStringJsonBytes:Buffer.byteLength(JSON.stringify(raw.map(String))),overrideDistribution:E===N?'seeded independent random replacement at every position':'first E positions replaced with seeded random integers',correct:true,descriptorJsonBytes:Buffer.byteLength(serialized)});
 measure(`AP N=${N} E=${E} benchmark JSON parse and reconstruct`,()=>{const x=JSON.parse(serialized);const restored=createSegment({...x,start:BigInt(x.start),step:BigInt(x.step),count:BigInt(x.count),overrides:x.overrides.map(([i,v])=>[BigInt(i),BigInt(v)])});return restored.at(0n);});
}
const gp=createSegment({kind:'gp',start:3n,ratio:2n,count:128n}),gpRef=new ClassicalBigGP(3n,2n,128n);
const gqs=Array.from({length:128},(_,i)=>({from:0n,to:BigInt(i+1)}));
for(const [name,fn] of [['OMNIDIM',q=>gp.sum(q)],['classical formula',q=>gpRef.sum(q)]])measure(`GP N=128 ${name} prefix query`,()=>{let out=0n;for(let r=0;r<2000;r++)for(const q of gqs)out+=fn(q);return out;},256000);
const corePath=new URL('../packages/core/index.js',import.meta.url);
const result={generatedAt:new Date().toISOString(),runtime:process.version,v8:process.versions.v8,platform:process.platform,arch:process.arch,cpu:os.cpus()[0]?.model,logicalCPUs:os.cpus().length,coreEntrySHA256:createHash('sha256').update(readFileSync(corePath)).digest('hex'),seed:SEED,warmups:WARMUPS,repeats:REPEATS,method:'single process; elapsed wall-clock performance.now; checksum consumes results; sequential benchmark order; no CPU pinning; no cross-machine inference',bounds:{APcounts:[10000,100000],rangeQueries:256,rangeLengths:[1,4096],queryBatchRepetitions:1000,GPcount:128,GP_ratio:'2'},checks,storage,exceptions,timings,checksum:String(sink),limitations:['Heap usage not measured: serialized payload is not runtime memory.','No fit/codec API measured; descriptors begin with known parameters.','BigInt complexity depends on operand bits.','Microbenchmarks are JIT, runtime and host dependent.']};
writeFileSync(new URL('./results.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
