// IMPORTS
// ================================================================================================
import { PrimeField } from '../lib/PrimeField';

// SETUP
// ================================================================================================
const elements = 1000000;
const f1 = new PrimeField(2n**128n - 159n);
const f2 = new PrimeField(2n**256n - 189n);

// 128 BIT FIELD
// ================================================================================================
console.log('128-bit prime field (JS)');

let start = Date.now();
let v1 = f1.prng(42n, elements);
let v2 = f1.prng(43n, elements);
console.log(`Generated ${elements}x2 random field elements in ${Date.now() - start} ms`);

start = Date.now();
let vAdd = f1.addVectorElements(v1, v2);
console.log(`Computed ${elements} additions in ${Date.now() - start} ms`);

start = Date.now();
let vSub = f1.subVectorElements(v1, v2);
console.log(`Computed ${elements} subtractions vectors in ${Date.now() - start} ms`);

start = Date.now();
let vMul = f1.mulVectorElements(v1, v2);
console.log(`Computed ${elements} products in ${Date.now() - start} ms`);

start = Date.now();
let vInv = f1.invVectorElements(v1);
console.log(`Computed ${elements} inverses in ${Date.now() - start} ms`);

start = Date.now();
let vExp = f1.expVectorElements(v1.slice(0, 1000), v2.slice(0, 1000));
console.log(`Computed 1000 exponents in ${Date.now() - start} ms`);

// 256 BIT FIELD
// ================================================================================================
console.log('-'.repeat(100));
console.log('256-bit prime field (JS)');

start = Date.now();
v1 = f2.prng(42n, elements);
v2 = f2.prng(43n, elements);
console.log(`Generated ${elements}x2 random field elements in ${Date.now() - start} ms`);

start = Date.now();
vAdd = f2.addVectorElements(v1, v2);
console.log(`Computed ${elements} additions in ${Date.now() - start} ms`);

start = Date.now();
vSub = f2.subVectorElements(v1, v2);
console.log(`Computed ${elements} subtractions vectors in ${Date.now() - start} ms`);

start = Date.now();
vMul = f2.mulVectorElements(v1, v2);
console.log(`Computed ${elements} products in ${Date.now() - start} ms`);

start = Date.now();
vInv = f2.invVectorElements(v1);
console.log(`Computed ${elements} inverses in ${Date.now() - start} ms`);

start = Date.now();
vExp = f2.expVectorElements(v1.slice(0, 1000), v2.slice(0, 1000));
console.log(`Computed vector element exponents in ${Date.now() - start} ms`);

console.log('done!');