"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// CLASS DEFINITION
// ================================================================================================
class BinaryField {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(modulus) {
        this.modulus = modulus;
        let degree = 0;
        while (modulus !== 1n) {
            degree++;
            modulus = modulus >> 1n;
        }
        this.extensionDegree = degree;
    }
    // PUBLIC ACCESSORS
    // --------------------------------------------------------------------------------------------
    get jsField() {
        return this;
    }
    get characteristic() {
        return 2n;
    }
    get elementSize() {
        return Math.ceil(this.extensionDegree / 8);
    }
    get zero() {
        throw new Error('Not implemented');
    }
    get one() {
        throw new Error('Not implemented');
    }
    // BASIC ARITHMETIC
    // --------------------------------------------------------------------------------------------
    add(x, y) {
        return x ^ y;
    }
    sub(x, y) {
        return x ^ y;
    }
    mul(x, y) {
        const m = this.modulus;
        const h = 1n << BigInt(this.extensionDegree - 1);
        let p = 0n;
        while (x && y) {
            if (y & 1n) {
                p = p ^ x;
            }
            y = y >> 1n;
            if (x & h) {
                x = (x << 1n) ^ m;
            }
            else {
                x = x << 1n;
            }
        }
        return p;
    }
    div(x, y) {
        return this.mul(x, this.inv(y));
    }
    exp(base, exponent) {
        if (base === 0n && exponent === 0n)
            throw new TypeError('Invalid inputs');
        let result = 1n;
        while (exponent > 0n) {
            if (base === 0n)
                return 0n;
            if (exponent & 1n) {
                result = this.mul(result, base);
            }
            exponent = exponent << 1n;
            base = this.mul(base, base);
        }
        return result;
    }
    inv(value) {
        throw new Error('Not implemented');
    }
    neg(value) {
        throw new Error('Not implemented');
    }
    // RANDOMNESS
    // ----------------------------------------------------------------------------------------
    rand() {
        throw new Error('Not implemented');
    }
    prng(seed, length) {
        throw new Error('Not implemented');
    }
    // VECTOR OPERATIONS
    // --------------------------------------------------------------------------------------------
    newVector(length) {
        throw new Error('Not implemented');
    }
    newVectorFrom(values) {
        throw new Error('Not implemented');
    }
    addVectorElements(a, b) {
        throw new Error('Not implemented');
    }
    subVectorElements(a, b) {
        throw new Error('Not implemented');
    }
    mulVectorElements(a, b) {
        throw new Error('Not implemented');
    }
    divVectorElements(a, b) {
        throw new Error('Not implemented');
    }
    expVectorElements(a, b) {
        throw new Error('Not implemented');
    }
    invVectorElements(values) {
        throw new Error('Not implemented');
    }
    negVectorElements(source) {
        throw new Error('Not implemented');
    }
    combineVectors(a, b) {
        throw new Error('Not implemented');
    }
    combineManyVectors(v, k) {
        throw new Error('Not implemented');
    }
    vectorToMatrix(v, columns) {
        throw new Error('Not implemented');
    }
    vectorsToMatrix(v) {
        throw new Error('Not implemented');
    }
    pluckVector(v, skip, times) {
        throw new Error('Not implemented');
    }
    truncateVector(v, newLength) {
        throw new Error('Not implemented');
    }
    duplicateVector(v, times = 1) {
        throw new Error('Not implemented');
    }
    // MATRIX OPERATIONS
    // --------------------------------------------------------------------------------------------
    newMatrix(rows, columns) {
        throw new Error('Not implemented');
    }
    newMatrixFrom(values) {
        throw new Error('Not implemented');
    }
    addMatrixElements(a, b) {
        throw new Error('Not implemented');
    }
    subMatrixElements(a, b) {
        throw new Error('Not implemented');
    }
    mulMatrixElements(a, b) {
        throw new Error('Not implemented');
    }
    divMatrixElements(a, b) {
        throw new Error('Not implemented');
    }
    expMatrixElements(a, b) {
        throw new Error('Not implemented');
    }
    invMatrixElements(values) {
        throw new Error('Not implemented');
    }
    negMatrixElements(source) {
        throw new Error('Not implemented');
    }
    mulMatrixes(a, b) {
        throw new Error('Not implemented');
    }
    mulMatrixByVector(m, v) {
        throw new Error('Not implemented');
    }
    mulMatrixRows(m, v) {
        throw new Error('Not implemented');
    }
    matrixRowsToVectors(m) {
        throw new Error('Not implemented');
    }
    // BATCH OPERATIONS
    // --------------------------------------------------------------------------------------------
    getRootOfUnity(order) {
        throw new Error('Not implemented');
    }
    getPowerSeries(seed, length) {
        throw new Error('Not implemented');
    }
    // POLYNOMIALS
    // --------------------------------------------------------------------------------------------
    addPolys(a, b) {
        throw new Error('Not implemented');
    }
    subPolys(a, b) {
        throw new Error('Not implemented');
    }
    mulPolys(a, b) {
        throw new Error('Not implemented');
    }
    divPolys(a, b) {
        throw new Error('Not implemented');
    }
    mulPolyByConstant(a, c) {
        throw new Error('Not implemented');
    }
    evalPolyAt(p, x) {
        throw new Error('Not implemented');
    }
    evalPolyAtRoots(p, rootsOfUnity) {
        throw new Error('Not implemented');
    }
    evalPolysAtRoots(p, rootsOfUnity) {
        throw new Error('Not implemented');
    }
    evalQuarticBatch(polys, x) {
        throw new Error('Not implemented');
    }
    interpolate(xs, ys) {
        throw new Error('Not implemented');
    }
    interpolateRoots(rootsOfUnity, ys) {
        throw new Error('Not implemented');
    }
    interpolateQuarticBatch(xSets, ySets) {
        throw new Error('Not implemented');
    }
}
exports.BinaryField = BinaryField;
//# sourceMappingURL=BinaryField.js.map