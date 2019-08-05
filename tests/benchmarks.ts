// IMPORTS
// ================================================================================================
import { Vector, Matrix } from '@guildofweavers/galois';
import { createPrimeField } from '../index';
import { JsVector, JsMatrix } from '../lib/structures';

// SETUP
// ================================================================================================
const modulus128 = 2n**128n - 9n * 2n**32n + 1n; // 2n**128n - 159n
const elements = 2**18;
const f1 = createPrimeField(modulus128, null);
const f2 = createPrimeField(2n**256n - 189n);

const root128 = f1.getRootOfUnity(elements);

const m1Rows = 64;
const m1Cols = 128;
const m2Rows = 128;
const m2Cols = 64;

const quartic = 4;
const quarticPolyCount = elements / quartic;

const polyDegree1 = 1024;
const polyDegree2 = 2048;

const wasm128 = createPrimeField(modulus128, { initialMemory: 256 * 1024 * 1024 }); // 128 MB

// 128 BIT FIELD JS
// ================================================================================================
console.log('128-bit prime field (JS)');

let start = Date.now();
const k  = f1.prng(40n);
const vK = f1.prng(41n, 4);
const v1 = f1.prng(42n, elements) as JsVector;
const v2 = f1.prng(43n, elements) as JsVector;
const v3 = f1.prng(44n, m1Cols) as JsVector;
const v4 = f1.prng(45n, quarticPolyCount) as JsVector;
console.log(`Generated ${elements}x2 random field elements in ${Date.now() - start} ms`);

const vp1 = f1.truncateVector(v1, polyDegree1);
const vp2 = f1.truncateVector(v2, polyDegree1);
const vp3 = f1.truncateVector(v1, polyDegree2);
const vMp1 = f1.newMatrixFrom([v1.values, v2.values]);

start = Date.now();
let temp = new Array<bigint[]>(m1Rows);
for (let i = 0; i < temp.length; i++) {
    let row = v1.values.slice(i * m1Cols, i * m1Cols + m1Cols);
    temp[i] = row;
}
const m1 = f1.newMatrixFrom(temp) as JsMatrix;

temp = new Array<bigint[]>(m1Rows);
for (let i = 0; i < temp.length; i++) {
    let row = v2.values.slice(i * m1Cols, i * m1Cols + m1Cols);
    temp[i] = row;
}
const m2 = f1.newMatrixFrom(temp) as JsMatrix;

temp = new Array<bigint[]>(m2Rows);
for (let i = 0; i < temp.length; i++) {
    let row = v2.values.slice(i * m2Cols, i * m2Cols + m2Cols);
    temp[i] = row;
}
const m3 = f1.newMatrixFrom(temp) as JsMatrix;
console.log(`Built matrixes in ${Date.now() - start} ms`);

start = Date.now();
let vXs = f1.vectorToMatrix(v1, quartic);
let vYs = f1.vectorToMatrix(v2, quartic);
console.log(`Transposed ${elements}x2 elements in ${Date.now() - start} ms`);

start = Date.now();
let vTrunc = f1.truncateVector(v4, v4.length / 2);
console.log(`Truncated ${v4.length} element vector to ${v4.length / 2} elements in ${Date.now() - start} ms`);

start = Date.now();
let vPluck = f1.pluckVector(v1, 8, v1.length / 4);
console.log(`Plucked ${v1.length} element vector ${v1.length / 4} times in ${Date.now() - start} ms`);

start = Date.now();
let vDup = f1.duplicateVector(vTrunc, 2);
console.log(`Duplicated ${vTrunc.length} element vector 2 times in ${Date.now() - start} ms`);

start = Date.now();
let vAdd = f1.addVectorElements(v1, v2);
console.log(`Computed ${elements} additions in ${Date.now() - start} ms`);

start = Date.now();
let vAdd2 = f1.addVectorElements(v1, k);
console.log(`Computed ${elements} additions (constant) in ${Date.now() - start} ms`);

start = Date.now();
let vSub = f1.subVectorElements(v1, v2);
console.log(`Computed ${elements} subtractions in ${Date.now() - start} ms`);

start = Date.now();
let vSub2 = f1.subVectorElements(v1, k);
console.log(`Computed ${elements} subtractions (constant) in ${Date.now() - start} ms`);

start = Date.now();
let vMul = f1.mulVectorElements(v1, v2);
console.log(`Computed ${elements} products in ${Date.now() - start} ms`);

start = Date.now();
let vMul2 = f1.mulVectorElements(v1, k);
console.log(`Computed ${elements} products (constant) in ${Date.now() - start} ms`);

start = Date.now();
let vDiv = f1.divVectorElements(v1, v2);
console.log(`Computed ${elements} quotients in ${Date.now() - start} ms`);

start = Date.now();
let vDiv2 = f1.divVectorElements(v1, k);
console.log(`Computed ${elements} quotients (constant) in ${Date.now() - start} ms`);

start = Date.now();
let vInv = f1.invVectorElements(v1);
console.log(`Computed ${elements} inverses in ${Date.now() - start} ms`);

start = Date.now();
let vNeg = f1.negVectorElements(v1);
console.log(`Computed ${elements} negations in ${Date.now() - start} ms`);

start = Date.now();
let vExp = f1.expVectorElements(v1, v2);
console.log(`Computed ${elements} exponents in ${Date.now() - start} ms`);

start = Date.now();
let vExp2 = f1.expVectorElements(v1, k);
console.log(`Computed ${elements} exponents (constant) in ${Date.now() - start} ms`);

start = Date.now();
let vComb = f1.combineVectors(v1, v2);
console.log(`Computed linear combination of ${elements} elements in ${Date.now() - start} ms`);

const vA = f1.matrixRowsToVectors(vMp1);
vA.push(v1); vA.push(v2);

start = Date.now();
let vCombMany = f1.combineManyVectors(vA, vK);
console.log(`Combined 4 vectors of ${elements} elements in ${Date.now() - start} ms`);

// --- Matrix operations
start = Date.now();
let vmAdd = f1.addMatrixElements(m1, m2);
console.log(`Computed element-wise addition of two ${m1Rows}x${m1Cols} matrixes in ${Date.now() - start} ms`);

start = Date.now();
let vmSub= f1.subMatrixElements(m1, m2);
console.log(`Computed element-wise subtraction of two ${m1Rows}x${m1Cols} matrixes in ${Date.now() - start} ms`);

start = Date.now();
let vmMul = f1.mulMatrixElements(m1, m2);
console.log(`Computed element-wise multiplication of two ${m1Rows}x${m1Cols} matrixes in ${Date.now() - start} ms`);

start = Date.now();
let vmDiv = f1.divMatrixElements(m1, m2);
console.log(`Computed element-wise division of two ${m1Rows}x${m1Cols} matrixes in ${Date.now() - start} ms`);

start = Date.now();
let vmmMul = f1.mulMatrixes(m1, m3);
console.log(`Computed a product of ${m1Rows}x${m1Cols} and ${m2Rows}x${m2Cols} matrixes in ${Date.now() - start} ms`);

start = Date.now();
let vMvMul = f1.mulMatrixByVector(m1, v3);
console.log(`Computed a product of ${m1Rows}x${m1Cols} and ${m1Cols}x1 vector in ${Date.now() - start} ms`);

start = Date.now();
let vMrMul = f1.mulMatrixRows(vMp1, v1);
console.log(`Computed row-wise multiplication of ${vMp1.rowCount}x${vMp1.colCount} matrix and a vector in ${Date.now() - start} ms`);

// --- Polynomial operations
start = Date.now();
const vAddPoly = f1.addPolys(vp2, vp3);
console.log(`Added ${polyDegree1}-degree polynomial to ${polyDegree2}-degree polynomial in ${Date.now() - start} ms`);

start = Date.now();
const vSubPoly = f1.subPolys(vp2, vp3);
console.log(`Subtracted ${polyDegree2}-degree polynomial from ${polyDegree1}-degree polynomial in ${Date.now() - start} ms`);

start = Date.now();
const vMulPoly = f1.mulPolys(vp1, vp2);
console.log(`Multiplied two ${polyDegree1}-degree polynomials in ${Date.now() - start} ms`);

start = Date.now();
const vDivPoly = f1.divPolys(vp3, vp2);
console.log(`Divided ${polyDegree2}-degree polynomial by ${polyDegree1}-degree polynomials in ${Date.now() - start} ms`);

// --- Polynomial interpolation
start = Date.now();
let vRoots = f1.getPowerSeries(root128, elements);
console.log(`Computed power series of ${elements} elements in ${Date.now() - start} ms`);

start = Date.now();
const vLagPoly = f1.interpolate(vp1, vp2);
console.log(`Interpolated degree ${polyDegree1} polynomial in ${Date.now() - start} ms`);

start = Date.now();
let vFftPoly = f1.interpolateRoots(vRoots, v1);
console.log(`Interpolated ${elements} roots of unity in ${Date.now() - start} ms`);

start = Date.now();
let vFftPoly2 = f1.interpolateRoots(vRoots, vMp1);
console.log(`Interpolated ${elements} roots of unity (matrix) in ${Date.now() - start} ms`);

start = Date.now();
const vQPolys = f1.interpolateQuarticBatch(vXs, vYs);
console.log(`Interpolated ${quarticPolyCount} quartic polynomials in ${Date.now() - start} ms`);

// --- Polynomial evaluation
start = Date.now();
const vEvAt = f1.evalPolyAt(vFftPoly, 42n);
console.log(`Evaluated ${elements}-degree polynomial at a single point in ${Date.now() - start} ms`);

start = Date.now();
let vFftEv = f1.evalPolyAtRoots(vFftPoly, vRoots);
console.log(`Evaluated degree ${vFftPoly.length} polynomial at ${vRoots.length} roots in ${Date.now() - start} ms`);

start = Date.now();
let vFftEv2 = f1.evalPolysAtRoots(vMp1, vRoots);
console.log(`Evaluated ${vMp1.rowCount} degree ${vMp1.colCount} polynomials at ${vRoots.length} roots in ${Date.now() - start} ms`);

start = Date.now();
const vQBatchEv = f1.evalQuarticBatch(vQPolys, v4);
console.log(`Evaluated ${quarticPolyCount} quartic polynomials in ${Date.now() - start} ms`);

console.log('-'.repeat(100));

// 128 BIT FIELD WASM
// ================================================================================================
console.log('128-bit prime field (WASM)');

start = Date.now();
const wK = wasm128.prng(41n, 4);
const w1 = wasm128.newVectorFrom(v1.values);
const w2 = wasm128.newVectorFrom(v2.values);
const w3 = wasm128.newVectorFrom(v3.values)
const w4 = wasm128.newVectorFrom(v4.values)
console.log(`Copied vectors into WASM memory in ${Date.now() - start} ms`);

let wp1 = wasm128.truncateVector(w1, polyDegree1);
let wp2 = wasm128.truncateVector(w2, polyDegree1);
let wp3 = wasm128.truncateVector(w1, polyDegree2);
let wMp1 = wasm128.newMatrixFrom(vMp1.toValues());

start = Date.now();
const mw1 = wasm128.newMatrixFrom(m1.values);
const mw2 = wasm128.newMatrixFrom(m2.values);
const mw3 = wasm128.newMatrixFrom(m3.values);
console.log(`Copied matrixes into WASM memory in ${Date.now() - start} ms`);

start = Date.now();
const wXs = wasm128.vectorToMatrix(w1, 4);
const wYs = wasm128.vectorToMatrix(w2, 4);
console.log(`Transposed ${elements} elements in ${Date.now() - start} ms`);
compareMatrixResults(vXs, wXs, 'vector transposition');
compareMatrixResults(vYs, wYs, 'vector transposition');

start = Date.now();
let wTrunc = wasm128.truncateVector(w4, w4.length / 2);
console.log(`Truncated ${w4.length} element vector to ${w4.length / 2} elements in ${Date.now() - start} ms`);
compareVectorResults(vTrunc, wTrunc, 'truncation');

start = Date.now();
let wPluck = wasm128.pluckVector(w1, 8, w1.length / 4);
console.log(`Plucked ${w1.length} element vector ${w1.length / 4} times in ${Date.now() - start} ms`);
compareVectorResults(vPluck, wPluck, 'plucking');

start = Date.now();
let wDup = wasm128.duplicateVector(wTrunc, 2);
console.log(`Duplicated ${wTrunc.length} element vector 2 times in ${Date.now() - start} ms`);
compareVectorResults(vDup, wDup, 'duplication');

start = Date.now();
let wAdd = wasm128.addVectorElements(w1, w2);
console.log(`Computed ${elements} additions in ${Date.now() - start} ms`);
compareVectorResults(vAdd, wAdd, 'addition');

start = Date.now();
let wAdd2 = wasm128.addVectorElements(w1, k);
console.log(`Computed ${elements} additions (constant) in ${Date.now() - start} ms`);
compareVectorResults(vAdd2, wAdd2, 'addition');

start = Date.now();
let wSub = wasm128.subVectorElements(w1, w2);
console.log(`Computed ${elements} subtractions in ${Date.now() - start} ms`);
compareVectorResults(vSub, wSub, 'subtraction');

start = Date.now();
let wSub2 = wasm128.subVectorElements(w1, k);
console.log(`Computed ${elements} subtractions (constant) in ${Date.now() - start} ms`);
compareVectorResults(vSub2, wSub2, 'subtraction');

start = Date.now();
let wMul = wasm128.mulVectorElements(w1, w2);
console.log(`Computed ${elements} products in ${Date.now() - start} ms`);
compareVectorResults(vMul, wMul, 'multiplication');

start = Date.now();
let wMul2 = wasm128.mulVectorElements(w1, k);
console.log(`Computed ${elements} products (constant) in ${Date.now() - start} ms`);
compareVectorResults(vMul2, wMul2, 'multiplication');

start = Date.now();
let wDiv = wasm128.divVectorElements(w1, w2);
console.log(`Computed ${elements} quotients in ${Date.now() - start} ms`);
compareVectorResults(vDiv, wDiv, 'division');

start = Date.now();
let wDiv2 = wasm128.divVectorElements(w1, k);
console.log(`Computed ${elements} quotients (constant) in ${Date.now() - start} ms`);
compareVectorResults(vDiv2, wDiv2, 'division');

start = Date.now();
let wInv = wasm128.invVectorElements(w1);
console.log(`Computed ${elements} inverses in ${Date.now() - start} ms`);
compareVectorResults(vInv, wInv, 'inverse');

start = Date.now();
let wNeg = wasm128.negVectorElements(w1);
console.log(`Computed ${elements} negations in ${Date.now() - start} ms`);
compareVectorResults(vNeg, wNeg, 'negation');

start = Date.now();
let wExp = wasm128.expVectorElements(w1, w2);
console.log(`Computed ${elements} exponents in ${Date.now() - start} ms`);
compareVectorResults(vExp, wExp, 'exponentiation');

start = Date.now();
let wExp2 = wasm128.expVectorElements(w1, k);
console.log(`Computed ${elements} exponents (constant) in ${Date.now() - start} ms`);
compareVectorResults(vExp2, wExp2, 'exponentiation');

start = Date.now();
let wComb = wasm128.combineVectors(w1, w2);
console.log(`Computed linear combination of ${elements} elements in ${Date.now() - start} ms`);

if (vComb !== wComb) {
    console.log(`> Linear combination error!`);
}

const wA = wasm128.matrixRowsToVectors(wMp1);
wA.push(w1); wA.push(w2);

start = Date.now();
let wCombMany = wasm128.combineManyVectors(wA, wK);
console.log(`Combined 4 vectors of ${elements} elements in ${Date.now() - start} ms`);
compareVectorResults(vCombMany, wCombMany, 'linear combination');

// --- Matrix operations
start = Date.now();
let wmAdd = wasm128.addMatrixElements(mw1, mw2);
console.log(`Computed element-wise addition of two ${m1Rows}x${m1Cols} matrixes in ${Date.now() - start} ms`);
compareMatrixResults(vmAdd, wmAdd, 'matrix element addition');

start = Date.now();
let wmSub= wasm128.subMatrixElements(mw1, mw2);
console.log(`Computed element-wise subtraction of two ${m1Rows}x${m1Cols} matrixes in ${Date.now() - start} ms`);
compareMatrixResults(vmSub, wmSub, 'matrix element subtraction');

start = Date.now();
let wmMul = wasm128.mulMatrixElements(mw1, mw2);
console.log(`Computed element-wise multiplication of two ${m1Rows}x${m1Cols} matrixes in ${Date.now() - start} ms`);
compareMatrixResults(vmMul, wmMul, 'matrix element multiplication');

start = Date.now();
let wmDiv = wasm128.divMatrixElements(mw1, mw2);
console.log(`Computed element-wise division of two ${m1Rows}x${m1Cols} matrixes in ${Date.now() - start} ms`);
compareMatrixResults(vmDiv, wmDiv, 'matrix element division');

start = Date.now();
let wmmMul = wasm128.mulMatrixes(mw1, mw3);
console.log(`Computed a product of ${m1Rows}x${m1Cols} and ${m2Rows}x${m2Cols} matrixes in ${Date.now() - start} ms`);
compareMatrixResults(vmmMul, wmmMul, 'matrix multiplication');

start = Date.now();
let wMvMul = wasm128.mulMatrixByVector(mw1, w3);
console.log(`Computed a product of ${m1Rows}x${m1Cols} and ${m1Cols}x1 vector in ${Date.now() - start} ms`);
compareVectorResults(vMvMul, wMvMul, 'matrix-vector multiplication');

start = Date.now();
let wMrMul = wasm128.mulMatrixRows(wMp1, w1);
console.log(`Computed row-wise multiplication of ${wMp1.rowCount}x${wMp1.colCount} matrix and a vector in ${Date.now() - start} ms`);
compareMatrixResults(vMrMul, wMrMul, 'matrix row multiplication');

// --- Polynomial operations
start = Date.now();
const wAddPoly = wasm128.addPolys(wp2, wp3);
console.log(`Added ${polyDegree1}-degree polynomial to ${polyDegree2}-degree polynomial in ${Date.now() - start} ms`);
compareVectorResults(vAddPoly, wAddPoly, 'polynomial addition');

start = Date.now();
const wSubPoly = wasm128.subPolys(wp2, wp3);
console.log(`Subtracted ${polyDegree2}-degree polynomial from ${polyDegree1}-degree polynomial in ${Date.now() - start} ms`);
compareVectorResults(vSubPoly, wSubPoly, 'polynomial subtraction');

start = Date.now();
const wMulPoly = wasm128.mulPolys(wp1, wp2);
console.log(`Multiplied two ${polyDegree1}-degree polynomials in ${Date.now() - start} ms`);
compareVectorResults(vMulPoly, wMulPoly, 'polynomial multiplication');

start = Date.now();
const wDivPoly = wasm128.divPolys(wp3, wp2);
console.log(`Divided ${polyDegree2}-degree polynomial by ${polyDegree1}-degree polynomials in ${Date.now() - start} ms`);
compareVectorResults(vDivPoly, wDivPoly, 'polynomial division');

// --- Polynomial interpolation
start = Date.now();
let wRoots = wasm128.getPowerSeries(root128, elements);
console.log(`Computed power series of ${elements} elements in ${Date.now() - start} ms`);
compareVectorResults(vRoots, wRoots, 'power series');

start = Date.now();
let wLagPoly = wasm128.interpolate(wp1, wp2);
console.log(`Interpolated degree ${polyDegree1} polynomial in ${Date.now() - start} ms`);
compareVectorResults(vLagPoly, wLagPoly, 'lagrange interpolation');

start = Date.now();
let wFftPoly = wasm128.interpolateRoots(wRoots, w1);
console.log(`Interpolated ${elements} roots of unity in ${Date.now() - start} ms`);
compareVectorResults(vFftPoly, wFftPoly, 'FFT interpolation');

start = Date.now();
let wFftPoly2 = wasm128.interpolateRoots(wRoots, wMp1);
console.log(`Interpolated ${elements} roots of unity (matrix) in ${Date.now() - start} ms`);
compareMatrixResults(vFftPoly2, wFftPoly2, 'FFT interpolation (matrix)');

start = Date.now();
let wQPolys = wasm128.interpolateQuarticBatch(wXs, wYs);
console.log(`Interpolated ${quarticPolyCount} quartic polynomials in ${Date.now() - start} ms`);
compareMatrixResults(vQPolys, wQPolys, 'quartic polynomial interpolation');

// --- Polynomial evaluation
start = Date.now();
const wEvAt = wasm128.evalPolyAt(wFftPoly, 42n);
console.log(`Evaluated ${elements}-degree polynomial at a single point in ${Date.now() - start} ms`);
if (vEvAt !== wEvAt) {
    console.log(`> Polynomial evaluation error in WASM!`);
}

start = Date.now();
let wFftEv = wasm128.evalPolyAtRoots(wFftPoly, wRoots);
console.log(`Evaluated degree ${wFftPoly.length} polynomial at ${wRoots.length} roots in ${Date.now() - start} ms`);
compareVectorResults(vFftEv, wFftEv, 'FFT polynomial evaluation');

start = Date.now();
let wFftEv2 = wasm128.evalPolysAtRoots(wMp1, wRoots);
console.log(`Evaluated ${wMp1.rowCount} degree ${wMp1.colCount} polynomials at ${wRoots.length} roots in ${Date.now() - start} ms`);
compareMatrixResults(vFftEv2, wFftEv2, 'FFT polynomial evaluation (matrix)');

start = Date.now();
const wQBatchEv = wasm128.evalQuarticBatch(wQPolys, w4);
console.log(`Evaluated ${quarticPolyCount} quartic polynomials in ${Date.now() - start} ms`);
compareVectorResults(vQBatchEv, wQBatchEv, 'quartic batch evaluation');

console.log(`WASM memory: ${(wasm128 as any).memorySize / 1024 / 1024} MB`);
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

// HELPER FUNCTIONS
// ================================================================================================
function compareVectorResults(v1: Vector, v2: Vector, operation: string) {
    if (v1.length !== v2.length) {
        console.log(`> ${operation} results are different lengths!`);
        return;
    }

    for (let i = 0; i < v1.length; i++) {
        if (v1.getValue(i) !== v2.getValue(i)) {
            console.log(`> ${operation} error in WASM at index ${i}!`);
            return;
        }
    }
}

function compareMatrixResults(m1: Matrix, m2: Matrix, operation: string) {
    if (m1.rowCount !== m2.rowCount || m1.colCount !== m2.colCount) {
        console.log(`> ${operation} results are different dimensions!`);
        return;
    }

    for (let i = 0; i < m1.rowCount; i++) {
        for (let j = 0; j < m1.colCount; j++) {
            if (m1.getValue(i, j) !== m2.getValue(i, j)) {
                console.log(`> ${operation} error in WASM at row ${i}, column ${j}!`);
                return;
            }
        }
    }
}