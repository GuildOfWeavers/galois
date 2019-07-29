// IMPORTS
// ================================================================================================
import * as Wasm from '../lib/assembly';
import { PrimeField } from '../lib/PrimeField';

// SETUP
// ================================================================================================
const elements = 2**18;
const f1 = new PrimeField(2n**128n - 9n * 2n**32n + 1n); // 2n**128n - 159n
const f2 = new PrimeField(2n**256n - 189n);

const root128 = f1.getRootOfUnity(elements);

const m1Rows = 50;
const m1Cols = 100;
const m2Rows = 100;
const m2Cols = 50;

const wasm128 = Wasm.instantiate(f1.modulus);

// 128 BIT FIELD JS
// ================================================================================================
console.log('128-bit prime field (JS)');

let start = Date.now();
let v1 = f1.prng(42n, elements);
let v2 = f1.prng(43n, elements);
let v3 = f1.prng(44n, m1Cols);
console.log(`Generated ${elements}x2 random field elements in ${Date.now() - start} ms`);

start = Date.now();
let m1 = new Array<bigint[]>(m1Rows);
for (let i = 0; i < m1.length; i++) {
    let row = v1.slice(i * m1Cols, i * m1Cols + m1Cols);
    m1[i] = row;
}

let m2 = new Array<bigint[]>(m2Rows);
for (let i = 0; i < m2.length; i++) {
    let row = v2.slice(i * m2Cols, i * m2Cols + m2Cols);
    m2[i] = row;
}
console.log(`Built ${m1Rows}x${m1Cols} and ${m2Rows}x${m2Cols} matrixes in ${Date.now() - start} ms`);

start = Date.now();
let vAdd = f1.addVectorElements(v1, v2);
console.log(`Computed ${elements} additions in ${Date.now() - start} ms`);

start = Date.now();
let vSub = f1.subVectorElements(v1, v2);
console.log(`Computed ${elements} subtractions in ${Date.now() - start} ms`);

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

start = Date.now();
let vComb = f1.combineVectors(v1, v2);
console.log(`Computed linear combination of ${elements} elements in ${Date.now() - start} ms`);

start = Date.now();
let mmMul = f1.mulMatrixes(m1, m2);
console.log(`Computed a product of ${m1Rows}x${m1Cols} and ${m2Rows}x${m2Cols} matrixes in ${Date.now() - start} ms`);

start = Date.now();
let mvMul = f1.mulMatrixByVector(m1, v3);
console.log(`Computed a product of ${m1Rows}x${m1Cols} and ${m1Cols}x1 vector in ${Date.now() - start} ms`);

start = Date.now();
let vRoots = f1.getPowerSeries(root128, elements);
console.log(`Computed power series of ${elements} elements in ${Date.now() - start} ms`);

start = Date.now();
let vPolys = f1.interpolateRoots(vRoots, v1);
console.log(`Interpolated ${elements} elements in ${Date.now() - start} ms`);

console.log('-'.repeat(100));

// 128 BIT FIELD WASM
// ================================================================================================
console.log('128-bit prime field (WASM)');

start = Date.now();
const w1 = wasm128.newVector(elements);
const w2 = wasm128.newVector(elements);
const w3 = wasm128.newVector(v3.length)
for (let i = 0; i < elements; i++) {
    w1.setValue(i, v1[i]);
    w2.setValue(i, v2[i]);
}
for (let i = 0; i < v3.length; i++) {
    w3.setValue(i, v3[i]);
}
console.log(`Copied vectors into WASM memory in ${Date.now() - start} ms`);

start = Date.now();
const mw1 = wasm128.newMatrix(m1Rows, m1Cols);
const mw2 = wasm128.newMatrix(m2Rows, m2Cols);

for (let i = 0; i < m1Rows; i++) {
    for (let j = 0; j < m1Cols; j++) {
        mw1.setValue(i, j, m1[i][j]);
    }
}

for (let i = 0; i < m2Rows; i++) {
    for (let j = 0; j < m2Cols; j++) {
        mw2.setValue(i, j, m2[i][j]);
    }
}
console.log(`Copied matrixes into WASM memory in ${Date.now() - start} ms`);

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
console.log(`Computed ${elements} subtractions in ${Date.now() - start} ms`);

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
    if (vDiv[i] !== wDiv.getValue(i)) {
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

start = Date.now();
let wComb = wasm128.combineVectors(w1, w2);
console.log(`Computed linear combination of ${elements} elements in ${Date.now() - start} ms`);

if (vComb !== wComb) {
    console.log(`> Linear combination error!`);
}

start = Date.now();
let mmwMul = wasm128.mulMatrixes(mw1, mw2);
console.log(`Computed a product of ${m1Rows}x${m1Cols} and ${m2Rows}x${m2Cols} matrixes in ${Date.now() - start} ms`);

for (let i = 0; i < m1Rows; i++) {
    for (let j = 0; j < m2Cols; j++) {
        if (mmMul[i][j] !== mmwMul.getValue(i, j)) {
            console.log(`> Matrix multiplication error at [${i},${j}]!`);
        }
    }
}

start = Date.now();
let mvwMul = wasm128.mulMatrixByVector(mw1, w3);
console.log(`Computed a product of ${m1Rows}x${m1Cols} and ${m1Cols}x1 vector in ${Date.now() - start} ms`);

for (let i = 0; i < mvMul.length; i++) {
    if (mvMul[i] !== mvwMul.getValue(i)) {
        console.log(`> Matrix-vector multiplication error at index ${i}!`);
        break;
    }
}

start = Date.now();
let wRoots = wasm128.getPowerSeries(root128, elements);
console.log(`Computed power series of ${elements} elements in ${Date.now() - start} ms`);

for (let i = 0; i < elements; i++) {
    if (vRoots[i] !== wRoots.getValue(i)) {
        console.log(`> Power series error in WASM at index ${i}!`);
        break;
    }
}

start = Date.now();
let wPolys = wasm128.interpolateRoots(wRoots, w1);
console.log(`Interpolated ${elements} elements in ${Date.now() - start} ms`);

for (let i = 0; i < elements; i++) {
    if (vPolys[i] !== wPolys.getValue(i)) {
        console.log(`> Interpolation error in WASM at index ${i}!`);
        break;
    }
}

console.log('-'.repeat(100));

// 256 BIT FIELD JS
// ================================================================================================
/*
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
*/