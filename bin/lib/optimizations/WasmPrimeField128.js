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
    inv(a) {
        return this.jsField.inv(a);
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
            const base = this.wasm.addArrayElements2(aw.base, 0, a.length);
            return new structures_1.WasmVector128(this.wasm, a.length, base);
        }
        else {
            if (a.length !== b.length) {
                throw new Error('Cannot add vector elements: vectors have different lengths');
            }
            const aw = a, bw = b;
            const base = this.wasm.addArrayElements(aw.base, bw.base, a.length);
            return new structures_1.WasmVector128(this.wasm, a.length, base);
        }
    }
    subVectorElements(a, b) {
        if (typeof b === 'bigint') {
            this.loadInput(b, 0);
            const aw = a;
            const base = this.wasm.subArrayElements2(aw.base, 0, a.length);
            return new structures_1.WasmVector128(this.wasm, a.length, base);
        }
        else {
            if (a.length !== b.length) {
                throw new Error('Cannot subtract vector elements: vectors have different lengths');
            }
            const aw = a, bw = b;
            const base = this.wasm.subArrayElements(aw.base, bw.base, a.length);
            return new structures_1.WasmVector128(this.wasm, a.length, base);
        }
    }
    mulVectorElements(a, b) {
        if (typeof b === 'bigint') {
            this.loadInput(b, 0);
            const aw = a;
            const base = this.wasm.mulArrayElements2(aw.base, 0, a.length);
            return new structures_1.WasmVector128(this.wasm, a.length, base);
        }
        else {
            if (a.length !== b.length) {
                throw new Error('Cannot multiply vector elements: vectors have different lengths');
            }
            const aw = a, bw = b;
            const base = this.wasm.mulArrayElements(aw.base, bw.base, a.length);
            return new structures_1.WasmVector128(this.wasm, a.length, base);
        }
    }
    divVectorElements(a, b) {
        if (typeof b === 'bigint') {
            this.loadInput(b, 0);
            const aw = a;
            const base = this.wasm.divArrayElements2(aw.base, 0, a.length);
            return new structures_1.WasmVector128(this.wasm, a.length, base);
        }
        else {
            if (a.length !== b.length) {
                throw new Error('Cannot divide vector elements: vectors have different lengths');
            }
            const aw = a, bw = b;
            const base = this.wasm.divArrayElements(aw.base, bw.base, a.length);
            return new structures_1.WasmVector128(this.wasm, a.length, base);
        }
    }
    expVectorElements(a, b) {
        if (typeof b === 'bigint') {
            this.loadInput(b, 0);
            const aw = a;
            const base = this.wasm.expArrayElements2(aw.base, 0, a.length);
            return new structures_1.WasmVector128(this.wasm, a.length, base);
        }
        else {
            if (a.length !== b.length) {
                throw new Error('Cannot exponentiate vector elements: vectors have different lengths');
            }
            const aw = a, bw = b;
            const base = this.wasm.expArrayElements(aw.base, bw.base, a.length);
            return new structures_1.WasmVector128(this.wasm, a.length, base);
        }
    }
    invVectorElements(source) {
        const sw = source;
        const base = this.wasm.invArrayElements(sw.base, sw.length);
        return new structures_1.WasmVector128(this.wasm, sw.length, base);
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
        throw new Error('Not implemented'); // TODO
    }
    pluckVector(v, skip, times) {
        throw new Error('Not implemented'); // TODO
    }
    truncateVector(v, newLength) {
        throw new Error('Not implemented'); //TODO
    }
    duplicateVector(v, times = 1) {
        throw new Error('Not implemented'); //TODO
    }
    vectorToMatrix(v, columns) {
        const rowCount = v.length / columns;
        if (!Number.isInteger(rowCount)) {
            throw new Error('Number of columns does not evenly divide vector length');
        }
        const vw = v;
        const base = this.wasm.transposeArray(vw.base, rowCount, columns);
        return new structures_1.WasmMatrix128(this.wasm, rowCount, columns, base);
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
            const base = this.wasm.addArrayElements2(aw.base, 0, aw.elementCount);
            return new structures_1.WasmMatrix128(this.wasm, a.rowCount, a.colCount, base);
        }
        else {
            if (a.rowCount !== b.rowCount || a.colCount !== b.colCount) {
                throw new Error('Cannot add matrix elements: matrixes have different dimensions');
            }
            const aw = a, bw = b;
            const base = this.wasm.addArrayElements(aw.base, bw.base, aw.elementCount);
            return new structures_1.WasmMatrix128(this.wasm, a.rowCount, a.colCount, base);
        }
    }
    subMatrixElements(a, b) {
        if (typeof b === 'bigint') {
            this.loadInput(b, 0);
            const aw = a;
            const base = this.wasm.subArrayElements2(aw.base, 0, aw.elementCount);
            return new structures_1.WasmMatrix128(this.wasm, a.rowCount, a.colCount, base);
        }
        else {
            if (a.rowCount !== b.rowCount || a.colCount !== b.colCount) {
                throw new Error('Cannot subtract matrix elements: matrixes have different dimensions');
            }
            const aw = a, bw = b;
            const base = this.wasm.subArrayElements(aw.base, bw.base, aw.elementCount);
            return new structures_1.WasmMatrix128(this.wasm, a.rowCount, a.colCount, base);
        }
    }
    mulMatrixElements(a, b) {
        if (typeof b === 'bigint') {
            this.loadInput(b, 0);
            const aw = a;
            const base = this.wasm.mulArrayElements2(aw.base, 0, aw.elementCount);
            return new structures_1.WasmMatrix128(this.wasm, a.rowCount, a.colCount, base);
        }
        else {
            if (a.rowCount !== b.rowCount || a.colCount !== b.colCount) {
                throw new Error('Cannot multiply matrix elements: matrixes have different dimensions');
            }
            const aw = a, bw = b;
            const base = this.wasm.mulArrayElements(aw.base, bw.base, aw.elementCount);
            return new structures_1.WasmMatrix128(this.wasm, a.rowCount, a.colCount, base);
        }
    }
    divMatrixElements(a, b) {
        if (typeof b === 'bigint') {
            this.loadInput(b, 0);
            const aw = a;
            const base = this.wasm.divArrayElements2(aw.base, 0, aw.elementCount);
            return new structures_1.WasmMatrix128(this.wasm, a.rowCount, a.colCount, base);
        }
        else {
            if (a.rowCount !== b.rowCount || a.colCount !== b.colCount) {
                throw new Error('Cannot divide matrix elements: matrixes have different dimensions');
            }
            const aw = a, bw = b;
            const base = this.wasm.divArrayElements(aw.base, bw.base, aw.elementCount);
            return new structures_1.WasmMatrix128(this.wasm, a.rowCount, a.colCount, base);
        }
    }
    expMatrixElements(a, b) {
        if (typeof b === 'bigint') {
            this.loadInput(b, 0);
            const aw = a;
            const base = this.wasm.expArrayElements2(aw.base, 0, aw.elementCount);
            return new structures_1.WasmMatrix128(this.wasm, a.rowCount, a.colCount, base);
        }
        else {
            if (a.rowCount !== b.rowCount || a.colCount !== b.colCount) {
                throw new Error('Cannot exponentiate matrix elements: matrixes have different dimensions');
            }
            const aw = a, bw = b;
            const base = this.wasm.expArrayElements(aw.base, bw.base, aw.elementCount);
            return new structures_1.WasmMatrix128(this.wasm, a.rowCount, a.colCount, base);
        }
    }
    invMatrixElements(source) {
        const sw = source;
        const base = this.wasm.invArrayElements(sw.base, sw.elementCount);
        return new structures_1.WasmMatrix128(this.wasm, sw.rowCount, sw.colCount, base);
    }
    mulMatrixes(a, b) {
        const n = a.rowCount, m = a.colCount, p = b.colCount;
        if (m !== b.rowCount) {
            throw new Error(`Cannot compute a product of ${a}x${m} and ${b.rowCount}x${p} matrixes`);
        }
        const aw = a, bw = b;
        const base = this.wasm.mulMatrixes(aw.base, bw.base, n, m, p);
        return new structures_1.WasmMatrix128(this.wasm, n, p, base);
    }
    mulMatrixByVector(a, b) {
        const n = a.rowCount, m = a.colCount, p = 1;
        if (m !== b.length) {
            throw new Error(`Cannot compute a product of ${a}x${m} matrix and ${b.length}x1 vector`);
        }
        const aw = a, bw = b;
        const base = this.wasm.mulMatrixes(aw.base, bw.base, n, m, p);
        return new structures_1.WasmVector128(this.wasm, n, base);
    }
    mulMatrixRows(a, b) {
        if (a.colCount !== b.length) {
            throw new Error('Number of columns must be the same as vector length');
        }
        const aw = a, bw = b;
        const result = new structures_1.WasmMatrix128(this.wasm, a.rowCount, a.colCount);
        let aRef = aw.base, rRef = result.base;
        for (let i = 0; i < a.rowCount; i++) {
            this.wasm.mulArrayElements3(aRef, bw.base, rRef, b.length);
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
        const base = this.wasm.getPowerSeries(length, 0);
        return new structures_1.WasmVector128(this.wasm, length, base);
    }
    // POLYNOMIALS
    // --------------------------------------------------------------------------------------------
    addPolys(a, b) {
        // TODO: improve
        let result;
        if (a.length > b.length) {
            let newB = new structures_1.WasmVector128(this.wasm, a.length, b);
            result = this.addVectorElements(a, newB);
            this.wasm.__release(newB.base);
        }
        else if (a.length < b.length) {
            let newA = new structures_1.WasmVector128(this.wasm, b.length, a);
            result = this.addVectorElements(newA, b);
            this.wasm.__release(newA.base);
        }
        else {
            result = this.addVectorElements(a, b);
        }
        return result;
    }
    subPolys(a, b) {
        // TODO: improve
        let result;
        if (a.length > b.length) {
            let newB = new structures_1.WasmVector128(this.wasm, a.length, b);
            result = this.subVectorElements(a, newB);
            this.wasm.__release(newB.base);
        }
        else if (a.length < b.length) {
            let newA = new structures_1.WasmVector128(this.wasm, b.length, a);
            result = this.subVectorElements(newA, b);
            this.wasm.__release(newA.base);
        }
        else {
            result = this.subVectorElements(a, b);
        }
        return result;
    }
    mulPolys(a, b) {
        const aw = a, bw = b;
        const base = this.wasm.mulPolys(aw.base, bw.base, a.length, b.length);
        return new structures_1.WasmVector128(this.wasm, a.length + b.length - 1, base);
    }
    divPolys(a, b) {
        const aLength = lastNonZeroIndex(a) + 1;
        const bLength = lastNonZeroIndex(b) + 1;
        if (aLength < bLength) {
            throw new Error('Cannot divide by polynomial of higher order');
        }
        const aw = a, bw = b;
        const diffLength = aLength - bLength;
        const base = this.wasm.divPolys(aw.base, bw.base, aLength, bLength);
        return new structures_1.WasmVector128(this.wasm, diffLength + 1, base);
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
        const base = this.wasm.evalPolyAtRoots(pw.base, xw.base, pw.length, xw.length);
        return new structures_1.WasmVector128(this.wasm, p.length, base);
    }
    evalPolysAtRoots(p, rootsOfUnity) {
        if (!utils_1.isPowerOf2(rootsOfUnity.length)) {
            throw new Error('Number of roots of unity must be a power of 2');
        }
        if (p.colCount > rootsOfUnity.length) {
            throw new Error('Polynomial degree must be smaller than or equal to the number of roots of unity');
        }
        throw new Error('Not implemented'); // TODO
    }
    evalQuarticBatch(polys, xs) {
        if (polys.colCount !== 4) {
            throw new Error('Quartic polynomials must have exactly 4 terms');
        }
        else if (polys.rowCount !== xs.length) {
            throw new Error('Number of quartic polynomials must be the same as the number of x coordinates');
        }
        const pw = polys, xw = xs;
        const base = this.wasm.evalQuarticBatch(pw.base, xw.base, polys.rowCount);
        return new structures_1.WasmVector128(this.wasm, polys.rowCount, base);
    }
    interpolate(xs, ys) {
        if (ys instanceof structures_1.WasmVector128) {
            if (xs.length !== ys.length) {
                throw new Error(''); // TODO
            }
            const xw = xs;
            const base = this.wasm.interpolate(xw.base, ys.base, xs.length);
            return new structures_1.WasmVector128(this.wasm, xs.length + 1, base);
        }
        else if (ys instanceof structures_1.WasmMatrix128) {
            if (xs.length !== ys.rowCount) {
                throw new Error(''); // TODO
            }
            throw new Error('Not implemented');
        }
        else {
            throw new Error(`y-coordinates object is invalid`);
        }
    }
    interpolateRoots(rootsOfUnity, ys) {
        if (!utils_1.isPowerOf2(rootsOfUnity.length)) {
            throw new Error('Number of roots of unity must be a power of 2');
        }
        const rw = rootsOfUnity;
        if (ys instanceof structures_1.WasmVector128) {
            if (rootsOfUnity.length !== ys.length) {
                throw new Error(''); // TODO
            }
            const result = new structures_1.WasmVector128(this.wasm, rootsOfUnity.length);
            this.wasm.interpolateRoots(rw.base, ys.base, result.base, ys.length);
            return result;
        }
        else if (ys instanceof structures_1.WasmMatrix128) {
            if (rootsOfUnity.length !== ys.rowCount) {
                throw new Error(''); // TODO
            }
            const result = new structures_1.WasmMatrix128(this.wasm, ys.rowCount, ys.colCount);
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
            throw new Error(''); // TODO
        }
        else if (xSets.rowCount !== ySets.rowCount) {
            throw new Error(''); // TODO
        }
        const xw = xSets, yw = ySets;
        const base = this.wasm.interpolateQuarticBatch(xw.base, yw.base, xw.rowCount);
        return new structures_1.WasmMatrix128(this.wasm, xw.rowCount, xw.colCount, base);
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