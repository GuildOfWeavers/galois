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

const m1Rows = 64;
const m1Cols = 128;
const m2Rows = 128;
const m2Cols = 64;

const quartic = 4;
const quarticPolyCount = elements / quartic;

const polyDegree1 = 1024;
const polyDegree2 = 2048;

const wasm128 = Wasm.instantiate(f1.modulus, { initialMemory: 128 * 1024 * 1024 }); // 128 MB

// 128 BIT FIELD JS
// ================================================================================================
console.log('128-bit prime field (JS)');

let start = Date.now();
let v1 = f1.prng(42n, elements);
let v2 = f1.prng(43n, elements);
let v3 = f1.prng(44n, m1Cols);
let v4 = f1.prng(45n, quarticPolyCount);
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

console.log(`Built matrixes in ${Date.now() - start} ms`);

start = Date.now();
let vXs = f1.vectorToMatrix(v1, quartic);
let vYs = f1.vectorToMatrix(v2, quartic);
console.log(`Transposed ${elements}x2 elements in ${Date.now() - start} ms`);

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
const vPoly1 = f1.interpolate(v1.slice(0, polyDegree1), v2.slice(0, polyDegree1));
console.log(`Interpolated degree ${polyDegree1} polynomial in ${Date.now() - start} ms`);

start = Date.now();
let vPoly2 = f1.interpolateRoots(vRoots, v1);
console.log(`Interpolated ${elements} roots of unity in ${Date.now() - start} ms`);

start = Date.now();
let vValues = f1.evalPolyAtRoots(vPoly2, vRoots);
console.log(`Evaluated degree ${elements} polynomial in ${Date.now() - start} ms`);

start = Date.now();
const vQPolys = f1.interpolateQuarticBatch(vXs, vYs);
console.log(`Interpolated ${quarticPolyCount} quartic polynomials in ${Date.now() - start} ms`);

start = Date.now();
const vEv = f1.evalQuarticBatch(vQPolys, v4);
console.log(`Evaluated ${quarticPolyCount} quartic polynomials in ${Date.now() - start} ms`);

start = Date.now();
const vMulPoly = f1.mulPolys(v1.slice(0, polyDegree1), v2.slice(0, polyDegree1));
console.log(`Multiplied two ${polyDegree1}-degree polynomials in ${Date.now() - start} ms`);

start = Date.now();
const vDivPoly = f1.divPolys(v1.slice(0, polyDegree2), v2.slice(0, polyDegree1));
console.log(`Divided ${polyDegree2}-degree polynomial by ${polyDegree1}-degree polynomials in ${Date.now() - start} ms`);

start = Date.now();
const vEvAt = f1.evalPolyAt(vPoly2, 42n);
console.log(`Evaluated ${elements}-degree polynomial at a single point in ${Date.now() - start} ms`);

console.log('-'.repeat(100));

// 128 BIT FIELD WASM
// ================================================================================================
console.log('128-bit prime field (WASM)');

start = Date.now();
const w1 = wasm128.newVectorFrom(v1);
const w2 = wasm128.newVectorFrom(v2);
const w3 = wasm128.newVectorFrom(v3)
const w4 = wasm128.newVectorFrom(v4)
console.log(`Copied vectors into WASM memory in ${Date.now() - start} ms`);

start = Date.now();
const mw1 = wasm128.newMatrixFrom(m1);
const mw2 = wasm128.newMatrixFrom(m2);
console.log(`Copied matrixes into WASM memory in ${Date.now() - start} ms`);

start = Date.now();
const wXs = wasm128.vectorToMatrix(w1, 4);
const wYs = wasm128.vectorToMatrix(w2, 4);
console.log(`Transposed ${elements} elements in ${Date.now() - start} ms`);

for (let i = 0; i < quarticPolyCount; i++) {
    for (let j = 0; j < quartic; j++) {
        if (vXs[i][j] !== wXs.getValue(i, j)) {
            console.log(`> Transposition error in WASM at index ${i}!`);
            break;
        }
    }
}

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

let wp1 = wasm128.newVectorFrom(v1.slice(0, polyDegree1));
let wp2 = wasm128.newVectorFrom(v2.slice(0, polyDegree1));

start = Date.now();
let wPoly1 = wasm128.interpolate(wp1, wp2);
console.log(`Interpolated degree ${polyDegree1} polynomial in ${Date.now() - start} ms`);

for (let i = 0; i < vPoly1.length; i++) {
    if (vPoly1[i] !== wPoly1.getValue(i)) {
        console.log(`> Interpolation error in WASM at index ${i}!`);
        break;
    }
}

start = Date.now();
let wPoly2 = wasm128.interpolateRoots(wRoots, w1);
console.log(`Interpolated ${elements} roots of unity in ${Date.now() - start} ms`);

for (let i = 0; i < elements; i++) {
    if (vPoly2[i] !== wPoly2.getValue(i)) {
        console.log(`> Interpolation error in WASM at index ${i}!`);
        break;
    }
}

start = Date.now();
let wValues = wasm128.evalPolyAtRoots(wPoly2, wRoots);
console.log(`Evaluated degree ${elements} polynomial in ${Date.now() - start} ms`);

for (let i = 0; i < elements; i++) {
    if (vValues[i] !== wValues.getValue(i)) {
        console.log(`> Evaluation error in WASM at index ${i}!`);
        break;
    }
}

start = Date.now();
let wQPolys = wasm128.interpolateQuarticBatch(wXs, wYs);
console.log(`Interpolated ${quarticPolyCount} quartic polynomials in ${Date.now() - start} ms`);

for (let i = 0; i < quarticPolyCount; i++) {
    for (let j = 0; j < quartic; j++) {
        if (vQPolys[i][j] !== wQPolys.getValue(i, j)) {
            console.log(`> Quartic batch interpolation error in WASM at index ${i}!`);
            break;
        }
    }
}

start = Date.now();
const wEv = wasm128.evalQuarticBatch(wQPolys, w4);
console.log(`Evaluated ${quarticPolyCount} quartic polynomials in ${Date.now() - start} ms`);

for (let i = 0; i < quarticPolyCount; i++) {
    if (vEv[i] !== wEv.getValue(i)) {
        console.log(`> Quartic batch evaluation error in WASM at index ${i}!`);
        break;
    }
}

start = Date.now();
const wMulPoly = wasm128.mulPolys(wp1, wp2);
console.log(`Multiplied two ${polyDegree1}-degree polynomials in ${Date.now() - start} ms`);

for (let i = 0; i < vMulPoly.length; i++) {
    if (vMulPoly[i] !== wMulPoly.getValue(i)) {
        console.log(`> Polynomial multiplication error in WASM at index ${i}!`);
        break;
    }
}

let wp3 = wasm128.newVectorFrom(v1.slice(0, polyDegree2));

start = Date.now();
const wDivPoly = wasm128.divPolys(wp3, wp2);
console.log(`Divided ${polyDegree2}-degree polynomial by ${polyDegree1}-degree polynomials in ${Date.now() - start} ms`);

for (let i = 0; i < vDivPoly.length; i++) {
    if (vDivPoly[i] !== wDivPoly.getValue(i)) {
        console.log(`> Polynomial division error in WASM at index ${i}!`);
        break;
    }
}

start = Date.now();
const wEvAt = wasm128.evalPolyAt(wPoly2, 42n);
console.log(`Evaluated ${elements}-degree polynomial at a single point in ${Date.now() - start} ms`);

if (vEvAt !== wEvAt) {
    console.log(`> Polynomial evaluation error in WASM!`);
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