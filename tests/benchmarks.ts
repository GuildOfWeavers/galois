// IMPORTS
// ================================================================================================
import * as Wasm from '../lib/assembly';
import { PrimeField } from '../lib/PrimeField';

// SETUP
// ================================================================================================
const elements = 100000;
const f1 = new PrimeField(2n**128n - 159n);
const f2 = new PrimeField(2n**256n - 189n);

const wasm128 = Wasm.instantiate(f1.modulus);

// 128 BIT FIELD JS
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
let vDiv = f1.divVectorElements(v1, v2);
console.log(`Computed ${elements} quotients in ${Date.now() - start} ms`);

start = Date.now();
let vInv = f1.invVectorElements(v1);
console.log(`Computed ${elements} inverses in ${Date.now() - start} ms`);

start = Date.now();
let vExp = f1.expVectorElements(v1, v2);
console.log(`Computed ${elements} exponents in ${Date.now() - start} ms`);

console.log('-'.repeat(100));

// 128 BIT FIELD WASM
// ================================================================================================
console.log('128-bit prime field (WASM)');

start = Date.now();
const w1 = wasm128.newVector(elements);
const w2 = wasm128.newVector(elements);
for (let i = 0; i < elements; i++) {
    w1.setValue(i, v1[i]);
    w2.setValue(i, v2[i]);
}
console.log(`Copied vectors into WASM memory in ${Date.now() - start} ms`);

start = Date.now();
let wAdd = wasm128.addVectorElements(w1, w2);
console.log(`Computed ${elements} additions in ${Date.now() - start} ms`);

for (let i = 0; i < elements; i++) {
    if (vAdd[i] !== wAdd.getValue(i)) {
        console.log(`> Addition error in WASM at index ${i}!`);
        break;
    }
}

start = Date.now();
let wSub = wasm128.subVectorElements(w1, w2);
console.log(`Computed ${elements} subtractions vectors in ${Date.now() - start} ms`);

for (let i = 0; i < elements; i++) {
    if (vSub[i] !== wSub.getValue(i)) {
        console.log(`> Subtraction error in WASM at index ${i}!`);
        break;
    }
}

start = Date.now();
let wMul = wasm128.mulVectorElements(w1, w2);
console.log(`Computed ${elements} products in ${Date.now() - start} ms`);

for (let i = 0; i < elements; i++) {
    if (vMul[i] !== wMul.getValue(i)) {
        console.log(`> Multiplication error in WASM at index ${i}!`);
        break;
    }
}

start = Date.now();
let wDiv = wasm128.divVectorElements(w1, w2);
console.log(`Computed ${elements} quotients in ${Date.now() - start} ms`);

for (let i = 0; i < elements; i++) {
    if (vMul[i] !== wMul.getValue(i)) {
        console.log(`> Division error in WASM at index ${i}!`);
        break;
    }
}

start = Date.now();
let wInv = wasm128.invVectorElements(w1);
console.log(`Computed ${elements} inverses in ${Date.now() - start} ms`);

for (let i = 0; i < elements; i++) {
    if (vInv[i] !== wInv.getValue(i)) {
        console.log(`> Inversion error in WASM at index ${i}!`);
        break;
    }
}

start = Date.now();
let wExp = wasm128.expVectorElements(w1, w2);
console.log(`Computed ${elements} exponents in ${Date.now() - start} ms`);

for (let i = 0; i < elements; i++) {
    if (vExp[i] !== wExp.getValue(i)) {
        console.log(`> Exponentiation error in WASM at index ${i}!`);
        break;
    }
}

console.log('-'.repeat(100));

// 256 BIT FIELD JS
// ================================================================================================
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
vDiv = f1.divVectorElements(v1, v2);
console.log(`Computed ${elements} quotients in ${Date.now() - start} ms`);

start = Date.now();
vInv = f2.invVectorElements(v1);
console.log(`Computed ${elements} inverses in ${Date.now() - start} ms`);

start = Date.now();
vExp = f2.expVectorElements(v1, v2);
console.log(`Computed ${elements} exponents in ${Date.now() - start} ms`);

console.log('done!');