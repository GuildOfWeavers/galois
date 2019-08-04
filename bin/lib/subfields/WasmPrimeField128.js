"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assembly_1 = require("../assembly");
const PrimeField_1 = require("../PrimeField");
const structures_1 = require("../structures");
const utils_1 = require("../utils");
// CONSTANTS
// ================================================================================================
const MASK_32B = 0xffffffffn;
const MASK_64B = 0xffffffffffffffffn;
// CLASS DEFINITION
// ================================================================================================
class WasmPrimeField128 {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(modulus, options) {
        this.wasm = assembly_1.instantiatePrime128(options);
        this.inputsIdx = this.wasm.getInputsPtr() >>> 3;
        this.outputsIdx = this.wasm.getOutputsPtr() >>> 3;
        this.jsField = new PrimeField_1.PrimeField(modulus);
        this.elementSize = this.jsField.elementSize;
        // set modulus in WASM module
        const mLo2 = Number.parseInt((modulus & MASK_32B));
        const mLo1 = Number.parseInt(((modulus >> 32n) & MASK_32B));
        const mHi2 = Number.parseInt(((modulus >> 64n) & MASK_32B));
        const mHi1 = Number.parseInt(((modulus >> 96n) & MASK_32B));
        this.wasm.setModulus(mHi1, mHi2, mLo1, mLo2);
    }
    // PUBLIC ACCESSORS
    // --------------------------------------------------------------------------------------------
    get characteristic() {
        return this.jsField.modulus;
    }
    get extensionDegree() {
        return 1;
    }
    get zero() {
        return 0n;
    }
    get one() {
        return 1n;
    }
    get memorySize() {
        return this.wasm.U8.byteLength;
    }
    // BASIC ARITHMETIC
    // --------------------------------------------------------------------------------------------
    mod(value) {
        return this.jsField.mod(value);
    }
    add(x, y) {
        return this.jsField.add(x, y);
    }
    sub(x, y) {
        return this.jsField.sub(x, y);
    }
    mul(x, y) {
        return this.jsField.mul(x, y);
    }
    div(x, y) {
        return this.jsField.div(x, y);
    }
    exp(base, exponent) {
        return this.jsField.exp(base, exponent);
    }
    inv(value) {
        return this.jsField.inv(value);
    }
    neg(value) {
        return this.jsField.neg(value);
    }
    // RANDOMNESS
    // --------------------------------------------------------------------------------------------
    rand() {
        return this.jsField.rand();
    }
    prng(seed, length) {
        if (length === undefined) {
            return this.jsField.prng(seed);
        }
        const result = this.jsField.prng(seed, length);
        return this.newVectorFrom(result.values);
    }
    // VECTOR OPERATIONS
    // --------------------------------------------------------------------------------------------
    newVector(length) {
        return new structures_1.WasmVector128(this.wasm, length);
    }
    newVectorFrom(values) {
        const result = new structures_1.WasmVector128(this.wasm, values.length);
        result.load(values);
        return result;
    }
    addVectorElements(a, b) {
        if (typeof b === 'bigint') {
            this.loadInput(b, 0);
            const aw = a;
            const result = this.newVector(a.length);
            this.wasm.addArrayElements2(aw.base, 0, result.base, a.length);
            return result;
        }
        else {
            if (a.length !== b.length) {
                throw new Error('Cannot add vector elements: vectors have different lengths');
            }
            const aw = a, bw = b;
            const result = this.newVector(a.length);
            this.wasm.addArrayElements1(aw.base, bw.base, result.base, a.length);
            return result;
        }
    }
    subVectorElements(a, b) {
        if (typeof b === 'bigint') {
            this.loadInput(b, 0);
            const aw = a;
            const result = this.newVector(a.length);
            this.wasm.subArrayElements2(aw.base, 0, result.base, a.length);
            return result;
        }
        else {
            if (a.length !== b.length) {
                throw new Error('Cannot subtract vector elements: vectors have different lengths');
            }
            const aw = a, bw = b;
            const result = this.newVector(a.length);
            this.wasm.subArrayElements1(aw.base, bw.base, result.base, a.length);
            return result;
        }
    }
    mulVectorElements(a, b) {
        if (typeof b === 'bigint') {
            this.loadInput(b, 0);
            const aw = a;
            const result = this.newVector(a.length);
            this.wasm.mulArrayElements2(aw.base, 0, result.base, a.length);
            return result;
        }
        else {
            if (a.length !== b.length) {
                throw new Error('Cannot multiply vector elements: vectors have different lengths');
            }
            const aw = a, bw = b;
            const result = this.newVector(a.length);
            this.wasm.mulArrayElements1(aw.base, bw.base, result.base, a.length);
            return result;
        }
    }
    divVectorElements(a, b) {
        if (typeof b === 'bigint') {
            this.loadInput(b, 0);
            const aw = a;
            const result = this.newVector(a.length);
            this.wasm.divArrayElements2(aw.base, 0, result.base, a.length);
            return result;
        }
        else {
            if (a.length !== b.length) {
                throw new Error('Cannot divide vector elements: vectors have different lengths');
            }
            const aw = a, bw = b;
            const result = this.newVector(a.length);
            this.wasm.divArrayElements1(aw.base, bw.base, result.base, a.length);
            return result;
        }
    }
    expVectorElements(a, b) {
        if (typeof b === 'bigint') {
            this.loadInput(b, 0);
            const aw = a;
            const result = this.newVector(a.length);
            this.wasm.expArrayElements2(aw.base, 0, result.base, a.length);
            return result;
        }
        else {
            if (a.length !== b.length) {
                throw new Error('Cannot exponentiate vector elements: vectors have different lengths');
            }
            const aw = a, bw = b;
            const result = this.newVector(a.length);
            this.wasm.expArrayElements1(aw.base, bw.base, result.base, a.length);
            return result;
        }
    }
    invVectorElements(source) {
        const sw = source;
        const result = this.newVector(sw.length);
        this.wasm.invArrayElements(sw.base, result.base, sw.length);
        return result;
    }
    negVectorElements(source) {
        const sw = source;
        const result = this.newVector(sw.length);
        this.wasm.negArrayElements(sw.base, result.base, sw.length);
        return result;
    }
    combineVectors(a, b) {
        if (a.length !== b.length) {
            throw new Error('Cannot combine vectors: vectors have different lengths');
        }
        const aw = a, bw = b;
        const idx = this.wasm.combineVectors(aw.base, bw.base, a.length);
        return this.readOutput(idx);
    }
    combineManyVectors(v, k) {
        if (v.length != k.length) {
            throw new Error('Number of vectors must be the same as the number of coefficients');
        }
        const vw = v, kw = k;
        const vRef = this.wasm.newRefArray(v.length);
        const vIdx = vRef >>> 3;
        for (let i = 0; i < vw.length; i++) {
            this.wasm.U64[vIdx + i] = BigInt(vw[i].base);
        }
        const resultLength = v[0].length;
        const result = this.newVector(resultLength);
        this.wasm.combineManyVectors(vRef, kw.base, result.base, resultLength, k.length);
        return result;
    }
    pluckVector(v, skip, times) {
        const vw = v;
        const result = this.newVector(times);
        this.wasm.pluckArray(vw.base, result.base, skip, vw.length, result.length);
        return result;
    }
    truncateVector(v, newLength) {
        if (v.length < newLength) {
            newLength = v.length;
        }
        const vw = v;
        const result = this.newVector(newLength);
        this.wasm.copyArrayElements(vw.base, result.base, newLength);
        return result;
    }
    duplicateVector(v, times = 1) {
        let currentLength = v.length;
        const resultLength = currentLength << times;
        const result = this.newVector(resultLength);
        while (currentLength < resultLength) {
            let offset = currentLength * result.elementSize;
            this.wasm.copyArrayElements(result.base, result.base + offset, currentLength);
            currentLength = currentLength << 1;
        }
        return result;
    }
    vectorToMatrix(v, columns) {
        const rowCount = v.length / columns;
        if (!Number.isInteger(rowCount)) {
            throw new Error('Number of columns does not evenly divide vector length');
        }
        const vw = v;
        const result = this.newMatrix(rowCount, columns);
        this.wasm.transposeArray(vw.base, result.base, rowCount, columns);
        return result;
    }
    // MATRIX OPERATIONS
    // --------------------------------------------------------------------------------------------
    newMatrix(rows, columns) {
        return new structures_1.WasmMatrix128(this.wasm, rows, columns);
    }
    newMatrixFrom(values) {
        const rows = values.length;
        const columns = values[0].length;
        const result = new structures_1.WasmMatrix128(this.wasm, rows, columns);
        result.load(values);
        return result;
    }
    addMatrixElements(a, b) {
        if (typeof b === 'bigint') {
            this.loadInput(b, 0);
            const aw = a;
            const result = this.newMatrix(a.rowCount, a.colCount);
            this.wasm.addArrayElements2(aw.base, 0, result.base, aw.elementCount);
            return result;
        }
        else {
            if (a.rowCount !== b.rowCount || a.colCount !== b.colCount) {
                throw new Error('Cannot add matrix elements: matrixes have different dimensions');
            }
            const aw = a, bw = b;
            const result = this.newMatrix(a.rowCount, a.colCount);
            this.wasm.addArrayElements1(aw.base, bw.base, result.base, aw.elementCount);
            return result;
        }
    }
    subMatrixElements(a, b) {
        if (typeof b === 'bigint') {
            this.loadInput(b, 0);
            const aw = a;
            const result = this.newMatrix(a.rowCount, a.colCount);
            this.wasm.subArrayElements2(aw.base, 0, result.base, aw.elementCount);
            return result;
        }
        else {
            if (a.rowCount !== b.rowCount || a.colCount !== b.colCount) {
                throw new Error('Cannot subtract matrix elements: matrixes have different dimensions');
            }
            const aw = a, bw = b;
            const result = this.newMatrix(a.rowCount, a.colCount);
            this.wasm.subArrayElements1(aw.base, bw.base, result.base, aw.elementCount);
            return result;
        }
    }
    mulMatrixElements(a, b) {
        if (typeof b === 'bigint') {
            this.loadInput(b, 0);
            const aw = a;
            const result = this.newMatrix(a.rowCount, a.colCount);
            this.wasm.mulArrayElements2(aw.base, 0, result.base, aw.elementCount);
            return result;
        }
        else {
            if (a.rowCount !== b.rowCount || a.colCount !== b.colCount) {
                throw new Error('Cannot multiply matrix elements: matrixes have different dimensions');
            }
            const aw = a, bw = b;
            const result = this.newMatrix(a.rowCount, a.colCount);
            this.wasm.mulArrayElements1(aw.base, bw.base, result.base, aw.elementCount);
            return result;
        }
    }
    divMatrixElements(a, b) {
        if (typeof b === 'bigint') {
            this.loadInput(b, 0);
            const aw = a;
            const result = this.newMatrix(a.rowCount, a.colCount);
            this.wasm.divArrayElements2(aw.base, 0, result.base, aw.elementCount);
            return result;
        }
        else {
            if (a.rowCount !== b.rowCount || a.colCount !== b.colCount) {
                throw new Error('Cannot divide matrix elements: matrixes have different dimensions');
            }
            const aw = a, bw = b;
            const result = this.newMatrix(a.rowCount, b.rowCount);
            this.wasm.divArrayElements1(aw.base, bw.base, result.base, aw.elementCount);
            return result;
        }
    }
    expMatrixElements(a, b) {
        if (typeof b === 'bigint') {
            this.loadInput(b, 0);
            const aw = a;
            const result = this.newMatrix(a.rowCount, a.colCount);
            this.wasm.expArrayElements2(aw.base, 0, result.base, aw.elementCount);
            return result;
        }
        else {
            if (a.rowCount !== b.rowCount || a.colCount !== b.colCount) {
                throw new Error('Cannot exponentiate matrix elements: matrixes have different dimensions');
            }
            const aw = a, bw = b;
            const result = this.newMatrix(a.rowCount, a.colCount);
            this.wasm.expArrayElements1(aw.base, bw.base, result.base, aw.elementCount);
            return result;
        }
    }
    invMatrixElements(source) {
        const sw = source;
        const result = this.newMatrix(sw.rowCount, sw.colCount);
        this.wasm.invArrayElements(sw.base, result.base, sw.elementCount);
        return result;
    }
    negMatrixElements(source) {
        const sw = source;
        const result = this.newMatrix(sw.rowCount, sw.colCount);
        this.wasm.negArrayElements(sw.base, result.base, sw.elementCount);
        return result;
    }
    mulMatrixes(a, b) {
        const n = a.rowCount, m = a.colCount, p = b.colCount;
        if (m !== b.rowCount) {
            throw new Error(`Cannot compute a product of ${a}x${m} and ${b.rowCount}x${p} matrixes`);
        }
        const aw = a, bw = b;
        const result = this.newMatrix(n, p);
        this.wasm.mulMatrixes(aw.base, bw.base, result.base, n, m, p);
        return result;
    }
    mulMatrixByVector(a, b) {
        const n = a.rowCount, m = a.colCount, p = 1;
        if (m !== b.length) {
            throw new Error(`Cannot compute a product of ${a}x${m} matrix and ${b.length}x1 vector`);
        }
        const aw = a, bw = b;
        const result = this.newVector(n);
        this.wasm.mulMatrixes(aw.base, bw.base, result.base, n, m, p);
        return result;
    }
    mulMatrixRows(a, b) {
        if (a.colCount !== b.length) {
            throw new Error('Number of columns must be the same as vector length');
        }
        const aw = a, bw = b;
        const result = this.newMatrix(a.rowCount, a.colCount);
        let aRef = aw.base, rRef = result.base;
        for (let i = 0; i < a.rowCount; i++) {
            this.wasm.mulArrayElements1(aRef, bw.base, rRef, b.length);
            aRef += result.rowSize;
            rRef += result.rowSize;
        }
        return result;
    }
    matrixRowsToVectors(m) {
        const result = new Array(m.rowCount);
        const mw = m;
        let vBase = mw.base;
        for (let i = 0; i < m.rowCount; i++, vBase += mw.rowSize) {
            result[i] = new structures_1.WasmVector128(this.wasm, m.colCount, vBase);
        }
        return result;
    }
    // OTHER OPERATIONS
    // --------------------------------------------------------------------------------------------
    getRootOfUnity(order) {
        return this.jsField.getRootOfUnity(order);
    }
    getPowerSeries(seed, length) {
        this.loadInput(seed, 0);
        const result = this.newVector(length);
        this.wasm.getPowerSeries(0, result.base, length);
        return result;
    }
    // POLYNOMIALS
    // --------------------------------------------------------------------------------------------
    addPolys(a, b) {
        let result;
        let aw = a, bw = b;
        if (aw.length >= bw.length) {
            result = this.newVector(aw.length);
            this.wasm.addPolys(aw.base, bw.base, result.base, aw.length, bw.length);
        }
        else {
            result = this.newVector(b.length);
            this.wasm.addPolys(bw.base, aw.base, result.base, bw.length, aw.length);
        }
        return result;
    }
    subPolys(a, b) {
        const resultLength = Math.max(a.length, b.length);
        const result = this.newVector(resultLength);
        const aw = a, bw = b;
        this.wasm.negArrayElements(bw.base, result.base, bw.length);
        this.wasm.addPolys(result.base, aw.base, result.base, result.length, aw.length);
        return result;
    }
    mulPolys(a, b) {
        const aw = a, bw = b;
        const result = this.newVector(a.length + b.length - 1);
        this.wasm.mulPolys(aw.base, bw.base, result.base, a.length, b.length);
        return result;
    }
    divPolys(a, b) {
        const aLength = lastNonZeroIndex(a) + 1;
        const bLength = lastNonZeroIndex(b) + 1;
        if (aLength < bLength) {
            throw new Error('Cannot divide by polynomial of higher order');
        }
        const aw = a, bw = b;
        const diffLength = aLength - bLength;
        const result = this.newVector(diffLength + 1);
        this.wasm.divPolys(aw.base, bw.base, result.base, aLength, bLength);
        return result;
    }
    mulPolyByConstant(a, b) {
        return this.mulVectorElements(a, b);
    }
    // POLYNOMIAL EVALUATION
    // --------------------------------------------------------------------------------------------
    evalPolyAt(p, x) {
        this.loadInput(x, 0);
        const pw = p;
        const idx = this.wasm.evalPolyAt(pw.base, 0, p.length);
        return this.readOutput(idx);
    }
    evalPolyAtRoots(p, rootsOfUnity) {
        if (!utils_1.isPowerOf2(rootsOfUnity.length)) {
            throw new Error('Number of roots of unity must be a power of 2');
        }
        if (p.length > rootsOfUnity.length) {
            throw new Error('Polynomial degree must be smaller than or equal to the number of roots of unity');
        }
        const pw = p, xw = rootsOfUnity;
        const result = this.newVector(xw.length);
        this.wasm.evalPolyAtRoots(pw.base, xw.base, result.base, pw.length, xw.length);
        return result;
    }
    evalPolysAtRoots(p, rootsOfUnity) {
        if (!utils_1.isPowerOf2(rootsOfUnity.length)) {
            throw new Error('Number of roots of unity must be a power of 2');
        }
        if (p.colCount > rootsOfUnity.length) {
            throw new Error('Polynomial degree must be smaller than or equal to the number of roots of unity');
        }
        const pw = p, xw = rootsOfUnity;
        const result = this.newMatrix(p.rowCount, xw.length);
        let pRef = pw.base, resRef = result.base;
        for (let i = 0; i < p.rowCount; i++) {
            this.wasm.evalPolyAtRoots(pRef, xw.base, resRef, pw.colCount, xw.length);
            pRef += pw.rowSize;
            resRef += result.rowSize;
        }
        return result;
    }
    evalQuarticBatch(polys, xs) {
        if (polys.colCount !== 4) {
            throw new Error('Quartic polynomials must have exactly 4 terms');
        }
        else if (polys.rowCount !== xs.length) {
            throw new Error('Number of quartic polynomials must be the same as the number of x coordinates');
        }
        const pw = polys, xw = xs;
        const result = this.newVector(polys.rowCount);
        this.wasm.evalQuarticBatch(pw.base, xw.base, result.base, polys.rowCount);
        return result;
    }
    // POLYNOMIAL INTERPOLATION
    // --------------------------------------------------------------------------------------------
    interpolate(xs, ys) {
        if (xs.length !== ys.length) {
            throw new Error('Number of x and y coordinates must be the same');
        }
        const xw = xs, yw = ys;
        const result = this.newVector(xs.length);
        this.wasm.interpolate(xw.base, yw.base, result.base, xs.length);
        return result;
    }
    interpolateRoots(rootsOfUnity, ys) {
        if (!utils_1.isPowerOf2(rootsOfUnity.length)) {
            throw new Error('Number of roots of unity must be a power of 2');
        }
        const rw = rootsOfUnity;
        if (ys instanceof structures_1.WasmVector128) {
            if (rootsOfUnity.length !== ys.length) {
                throw new Error('Number of roots of unity must be the same as the number of y coordinates');
            }
            const result = this.newVector(rootsOfUnity.length);
            this.wasm.interpolateRoots(rw.base, ys.base, result.base, ys.length);
            return result;
        }
        else if (ys instanceof structures_1.WasmMatrix128) {
            if (rootsOfUnity.length !== ys.rowCount) {
                throw new Error('Number of roots of unity must be the same as the number of y coordinates');
            }
            const result = this.newMatrix(ys.rowCount, ys.colCount);
            let yRef = ys.base, resRef = result.base;
            for (let i = 0; i < ys.rowCount; i++) {
                this.wasm.interpolateRoots(rw.base, yRef, resRef, ys.colCount);
                yRef += result.rowSize;
                resRef += result.rowSize;
            }
            return result;
        }
        else {
            throw new Error(`y-coordinates object is invalid`);
        }
    }
    interpolateQuarticBatch(xSets, ySets) {
        if (xSets.colCount !== 4 || ySets.colCount !== 4) {
            throw new Error('X and Y coordinate matrixes must have 4 values per row');
        }
        else if (xSets.rowCount !== ySets.rowCount) {
            throw new Error('X and Y coordinate matrixes must have the same number of rows');
        }
        const xw = xSets, yw = ySets;
        const result = this.newMatrix(xw.rowCount, xw.colCount);
        this.wasm.interpolateQuarticBatch(xw.base, yw.base, result.base, xw.rowCount);
        return result;
    }
    // HELPER METHODS
    // --------------------------------------------------------------------------------------------
    loadInput(value, index) {
        this.wasm.U64[this.inputsIdx + index] = value & MASK_64B;
        this.wasm.U64[this.inputsIdx + index + 1] = value >> 64n;
    }
    readOutput(index) {
        const lo = this.wasm.U64[this.outputsIdx + index];
        const hi = this.wasm.U64[this.outputsIdx + index + 1];
        return (hi << 64n) | lo;
    }
}
exports.WasmPrimeField128 = WasmPrimeField128;
// HELPER FUNCTIONS
// ================================================================================================
function lastNonZeroIndex(values) {
    for (let i = values.length - 1; i >= 0; i--) {
        if (values.getValue(i) !== 0n)
            return i;
    }
}
//# sourceMappingURL=WasmPrimeField128.js.map