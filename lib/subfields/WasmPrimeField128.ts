// IMPORTS
// ================================================================================================
import { FiniteField, Vector, Matrix, WasmOptions } from '@guildofweavers/galois';
import { WasmPrime128, instantiatePrime128 } from '../assembly';
import { PrimeField } from '../PrimeField';
import { WasmVector128, WasmMatrix128 } from '../structures';
import { isPowerOf2, } from '../utils';

// CONSTANTS
// ================================================================================================
const MASK_32B = 0xFFFFFFFFn;
const MASK_64B = 0xFFFFFFFFFFFFFFFFn;

// CLASS DEFINITION
// ================================================================================================
export class WasmPrimeField128 implements FiniteField {

    readonly wasm           : WasmPrime128;
    readonly jsField        : PrimeField;
    readonly elementSize    : number;

    readonly inputsIdx      : number;
    readonly outputsIdx     : number;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(modulus: bigint, options?: WasmOptions) {
        this.wasm = instantiatePrime128(options);
        this.inputsIdx = this.wasm.getInputsPtr() >>> 3;
        this.outputsIdx = this.wasm.getOutputsPtr() >>> 3;
        this.jsField = new PrimeField(modulus);
        this.elementSize = this.jsField.elementSize;

        // set modulus in WASM module
        const mLo2 = Number.parseInt((modulus & MASK_32B) as any);
        const mLo1 = Number.parseInt(((modulus >> 32n) & MASK_32B) as any);
        const mHi2 = Number.parseInt(((modulus >> 64n) & MASK_32B) as any);
        const mHi1 = Number.parseInt(((modulus >> 96n) & MASK_32B) as any);
        this.wasm.setModulus(mHi1, mHi2, mLo1, mLo2);
    }

    // PUBLIC ACCESSORS
    // --------------------------------------------------------------------------------------------
    get characteristic(): bigint {
        return this.jsField.modulus;
    }

    get extensionDegree(): number {
        return 1;
    }

    get zero(): bigint {
        return 0n
    }

    get one(): bigint {
        return 1n;
    }

    // BASIC ARITHMETIC
    // --------------------------------------------------------------------------------------------
    mod(value: bigint): bigint {
        return this.jsField.mod(value);
    }

    add(x: bigint, y: bigint): bigint {
        return this.jsField.add(x, y);
    }

    sub(x: bigint, y: bigint): bigint {
        return this.jsField.sub(x, y);
    }

    mul(x: bigint, y: bigint): bigint {
        return this.jsField.mul(x, y);
    }

    div(x: bigint, y: bigint) {
        return this.jsField.div(x, y);
    }

    exp(base: bigint, exponent: bigint): bigint {
        return this.jsField.exp(base, exponent);
    }

    inv(a: bigint): bigint {
        return this.jsField.inv(a);
    }

    // RANDOMNESS
    // --------------------------------------------------------------------------------------------
    rand(): bigint {
        return this.jsField.rand();
    }

    prng(seed: bigint | Buffer): bigint
    prng(seed: bigint | Buffer, length?: number): WasmVector128;
    prng(seed: bigint | Buffer, length?: number): WasmVector128 | bigint {
        if (length === undefined) {
            return this.jsField.prng(seed);
        }
        const result = this.jsField.prng(seed, length);
        return this.newVectorFrom(result.values);
    }

    // VECTOR OPERATIONS
    // --------------------------------------------------------------------------------------------
    newVector(length: number): WasmVector128 {
        return new WasmVector128(this.wasm, length);
    }

    newVectorFrom(values: bigint[]): WasmVector128 {
        const result = new WasmVector128(this.wasm, values.length);
        result.load(values);
        return result;
    }

    addVectorElements(a: Vector, b: bigint | Vector): WasmVector128 {
        if (typeof b === 'bigint') {
            this.loadInput(b, 0);
            const aw = a as WasmVector128;
            const result = this.newVector(a.length);
            this.wasm.addArrayElements2(aw.base, 0, result.base, a.length);
            return result;
        }
        else {
            if (a.length !== b.length) {
                throw new Error('Cannot add vector elements: vectors have different lengths');
            }
            const aw = a as WasmVector128, bw = b as WasmVector128;
            const result = this.newVector(a.length);
            this.wasm.addArrayElements1(aw.base, bw.base, result.base, a.length);
            return result;
        }
    }

    subVectorElements(a: Vector, b: bigint | Vector): WasmVector128 {
        if (typeof b === 'bigint') {
            this.loadInput(b, 0);
            const aw = a as WasmVector128;
            const result = this.newVector(a.length);
            this.wasm.subArrayElements2(aw.base, 0, result.base, a.length);
            return result;
        }
        else {
            if (a.length !== b.length) {
                throw new Error('Cannot subtract vector elements: vectors have different lengths');
            }
            const aw = a as WasmVector128, bw = b as WasmVector128;
            const result = this.newVector(a.length);
            this.wasm.subArrayElements1(aw.base, bw.base, result.base, a.length);
            return result;
        }
    }

    mulVectorElements(a: Vector, b: bigint | Vector): WasmVector128 {
        if (typeof b === 'bigint') {
            this.loadInput(b, 0);
            const aw = a as WasmVector128;
            const result = this.newVector(a.length);
            this.wasm.mulArrayElements2(aw.base, 0, result.base, a.length);
            return result;
        }
        else {
            if (a.length !== b.length) {
                throw new Error('Cannot multiply vector elements: vectors have different lengths');
            }
            const aw = a as WasmVector128, bw = b as WasmVector128;
            const result = this.newVector(a.length);
            this.wasm.mulArrayElements1(aw.base, bw.base, result.base, a.length);
            return result;
        }
    }

    divVectorElements(a: Vector, b: bigint | Vector): WasmVector128 {
        if (typeof b === 'bigint') {
            this.loadInput(b, 0);
            const aw = a as WasmVector128;
            const base = this.wasm.divArrayElements2(aw.base, 0, a.length);
            return new WasmVector128(this.wasm, a.length, base);
        }
        else {
            if (a.length !== b.length) {
                throw new Error('Cannot divide vector elements: vectors have different lengths');
            }
            const aw = a as WasmVector128, bw = b as WasmVector128;
            const base = this.wasm.divArrayElements(aw.base, bw.base, a.length);
            return new WasmVector128(this.wasm, a.length, base);
        }
    }

    expVectorElements(a: Vector, b: bigint | Vector): WasmVector128 {
        if (typeof b === 'bigint') {
            this.loadInput(b, 0);
            const aw = a as WasmVector128;
            const result = this.newVector(a.length);
            this.wasm.expArrayElements2(aw.base, 0, result.base, a.length);
            return result;
        }
        else {
            if (a.length !== b.length) {
                throw new Error('Cannot exponentiate vector elements: vectors have different lengths');
            }
            const aw = a as WasmVector128, bw = b as WasmVector128;
            const result = this.newVector(a.length);
            this.wasm.expArrayElements1(aw.base, bw.base, result.base, a.length);
            return result;
        }
    }

    invVectorElements(source: Vector): WasmVector128 {
        const sw = source as WasmVector128;
        const base = this.wasm.invArrayElements(sw.base, sw.length);
        return new WasmVector128(this.wasm, sw.length, base);
    }

    combineVectors(a: Vector, b: Vector): bigint {
        if (a.length !== b.length) {
            throw new Error('Cannot combine vectors: vectors have different lengths');
        }
        const aw = a as WasmVector128, bw = b as WasmVector128;
        const idx = this.wasm.combineVectors(aw.base, bw.base, a.length);
        return this.readOutput(idx);
    }

    combineManyVectors(v: Vector[], k: Vector): WasmVector128 {
        throw new Error('Not implemented'); // TODO
    }

    pluckVector(v: Vector, skip: number, times: number): WasmVector128 {
        throw new Error('Not implemented'); // TODO
    }

    truncateVector(v: Vector, newLength: number): WasmVector128 {
        throw new Error('Not implemented'); //TODO
    }

    duplicateVector(v: Vector, times = 1): WasmVector128 {
        throw new Error('Not implemented'); //TODO
    }

    vectorToMatrix(v: Vector, columns: number): WasmMatrix128 {
        const rowCount = v.length / columns;
        if (!Number.isInteger(rowCount)) {
            throw new Error('Number of columns does not evenly divide vector length');
        }
        const vw = v as WasmVector128;
        const result = this.newMatrix(rowCount, columns);
        this.wasm.transposeArray(vw.base, result.base, rowCount, columns);
        return result;
    }

    // MATRIX OPERATIONS
    // --------------------------------------------------------------------------------------------
    newMatrix(rows: number, columns: number): WasmMatrix128 {
        return new WasmMatrix128(this.wasm, rows, columns);
    }

    newMatrixFrom(values: bigint[][]): WasmMatrix128 {
        const rows = values.length;
        const columns = values[0].length;
        const result = new WasmMatrix128(this.wasm, rows, columns);
        result.load(values);
        return result;
    }

    addMatrixElements(a: Matrix, b: bigint | Matrix): WasmMatrix128 {
        if (typeof b === 'bigint') {
            this.loadInput(b, 0);
            const aw = a as WasmMatrix128;
            const result = this.newMatrix(a.rowCount, a.colCount);
            this.wasm.addArrayElements2(aw.base, 0, result.base, aw.elementCount);
            return result;
        }
        else {
            if (a.rowCount !== b.rowCount || a.colCount !== b.colCount) {
                throw new Error('Cannot add matrix elements: matrixes have different dimensions');
            }
            const aw = a as WasmMatrix128, bw = b as WasmMatrix128;
            const result = this.newMatrix(a.rowCount, a.colCount);
            this.wasm.addArrayElements1(aw.base, bw.base, result.base, aw.elementCount);
            return result;
        }
    }
    
    subMatrixElements(a: Matrix, b: bigint | Matrix): WasmMatrix128 {
        if (typeof b === 'bigint') {
            this.loadInput(b, 0);
            const aw = a as WasmMatrix128;
            const result = this.newMatrix(a.rowCount, a.colCount);
            this.wasm.subArrayElements2(aw.base, 0, result.base, aw.elementCount);
            return result;
        }
        else {
            if (a.rowCount !== b.rowCount || a.colCount !== b.colCount) {
                throw new Error('Cannot subtract matrix elements: matrixes have different dimensions');
            }
            const aw = a as WasmMatrix128, bw = b as WasmMatrix128;
            const result = this.newMatrix(a.rowCount, a.colCount);
            this.wasm.subArrayElements1(aw.base, bw.base, result.base, aw.elementCount);
            return result;
        }
    }

    mulMatrixElements(a: Matrix, b: bigint | Matrix): WasmMatrix128 {
        if (typeof b === 'bigint') {
            this.loadInput(b, 0);
            const aw = a as WasmMatrix128;
            const result = this.newMatrix(a.rowCount, a.colCount);
            this.wasm.mulArrayElements2(aw.base, 0, result.base, aw.elementCount);
            return result;
        }
        else {
            if (a.rowCount !== b.rowCount || a.colCount !== b.colCount) {
                throw new Error('Cannot multiply matrix elements: matrixes have different dimensions');
            }
            const aw = a as WasmMatrix128, bw = b as WasmMatrix128;
            const result = this.newMatrix(a.rowCount, a.colCount);
            this.wasm.mulArrayElements1(aw.base, bw.base, result.base, aw.elementCount);
            return result;
        }
    }

    divMatrixElements(a: Matrix, b: bigint | Matrix): WasmMatrix128 {
        if (typeof b === 'bigint') {
            this.loadInput(b, 0);
            const aw = a as WasmMatrix128;
            const base = this.wasm.divArrayElements2(aw.base, 0, aw.elementCount);
            return new WasmMatrix128(this.wasm, a.rowCount, a.colCount, base);
        }
        else {
            if (a.rowCount !== b.rowCount || a.colCount !== b.colCount) {
                throw new Error('Cannot divide matrix elements: matrixes have different dimensions');
            }
            const aw = a as WasmMatrix128, bw = b as WasmMatrix128;
            const base = this.wasm.divArrayElements(aw.base, bw.base, aw.elementCount);
            return new WasmMatrix128(this.wasm, a.rowCount, a.colCount, base);
        }
    }

    expMatrixElements(a: Matrix, b: bigint | Matrix): WasmMatrix128 {
        if (typeof b === 'bigint') {
            this.loadInput(b, 0);
            const aw = a as WasmMatrix128;
            const result = this.newMatrix(a.rowCount, a.colCount);
            this.wasm.expArrayElements2(aw.base, 0, result.base, aw.elementCount);
            return result;
        }
        else {
            if (a.rowCount !== b.rowCount || a.colCount !== b.colCount) {
                throw new Error('Cannot exponentiate matrix elements: matrixes have different dimensions');
            }
            const aw = a as WasmMatrix128, bw = b as WasmMatrix128;
            const result = this.newMatrix(a.rowCount, a.colCount);
            this.wasm.expArrayElements1(aw.base, bw.base, result.base, aw.elementCount);
            return result;
        }
    }

    invMatrixElements(source: Matrix): WasmMatrix128 {
        const sw = source as WasmMatrix128;
        const base = this.wasm.invArrayElements(sw.base, sw.elementCount);
        return new WasmMatrix128(this.wasm, sw.rowCount, sw.colCount, base);
    }

    mulMatrixes(a: Matrix, b: Matrix): WasmMatrix128 {
        const n = a.rowCount, m = a.colCount, p = b.colCount;
        if (m !== b.rowCount) {
            throw new Error(`Cannot compute a product of ${a}x${m} and ${b.rowCount}x${p} matrixes`);
        }

        const aw = a as WasmMatrix128, bw = b as WasmMatrix128;
        const result = this.newMatrix(n, p);
        this.wasm.mulMatrixes(aw.base, bw.base, result.base, n, m, p);
        return result;
    }

    mulMatrixByVector(a: Matrix, b: Vector): WasmVector128 {
        const n = a.rowCount, m = a.colCount, p = 1;
        if (m !== b.length) {
            throw new Error(`Cannot compute a product of ${a}x${m} matrix and ${b.length}x1 vector`);
        }

        const aw = a as WasmMatrix128, bw = b as WasmVector128;
        const result = this.newVector(n);
        this.wasm.mulMatrixes(aw.base, bw.base, result.base, n, m, p);
        return result;
    }

    mulMatrixRows(a: Matrix, b: Vector): WasmMatrix128 {
        if (a.colCount !== b.length) {
            throw new Error('Number of columns must be the same as vector length');
        }

        const aw = a as WasmMatrix128, bw = b as WasmVector128;
        const result = new WasmMatrix128(this.wasm, a.rowCount, a.colCount);
        let aRef = aw.base, rRef = result.base;
        for (let i = 0; i < a.rowCount; i++) {
            this.wasm.mulArrayElements1(aRef, bw.base, rRef, b.length);
            aRef += result.rowSize;
            rRef += result.rowSize;
        }
        return result;
    }

    matrixRowsToVectors(m: Matrix): WasmVector128[] {
        const result = new Array<WasmVector128>(m.rowCount);
        const mw = m as WasmMatrix128;
        let vBase = mw.base;
        for (let i = 0; i < m.rowCount; i++, vBase += mw.rowSize) {
            result[i] = new WasmVector128(this.wasm, m.colCount, vBase);
        }
        return result;
    }

    // OTHER OPERATIONS
    // --------------------------------------------------------------------------------------------
    getRootOfUnity(order: number): bigint {
        return this.jsField.getRootOfUnity(order);
    }

    getPowerSeries(seed: bigint, length: number): WasmVector128 {
        this.loadInput(seed, 0);
        const result = this.newVector(length);
        this.wasm.getPowerSeries(0, result.base, length);
        return result;
    }

    // POLYNOMIALS
    // --------------------------------------------------------------------------------------------
    addPolys(a: Vector, b: Vector): WasmVector128 {
        // TODO: improve
        let result: WasmVector128;
        if (a.length > b.length) {
            let newB = new WasmVector128(this.wasm, a.length, b as WasmVector128);
            result = this.addVectorElements(a, newB);
            this.wasm.__release(newB.base);
        }
        else if (a.length < b.length) {
            let newA = new WasmVector128(this.wasm, b.length, a as WasmVector128);
            result = this.addVectorElements(newA, b);
            this.wasm.__release(newA.base);
        }
        else {
            result = this.addVectorElements(a, b);
        }
        return result;
    }

    subPolys(a: Vector, b: Vector): WasmVector128 {
        // TODO: improve
        let result: WasmVector128;
        if (a.length > b.length) {
            let newB = new WasmVector128(this.wasm, a.length, b as WasmVector128);
            result = this.subVectorElements(a, newB);
            this.wasm.__release(newB.base);
        }
        else if (a.length < b.length) {
            let newA = new WasmVector128(this.wasm, b.length, a as WasmVector128);
            result = this.subVectorElements(newA, b);
            this.wasm.__release(newA.base);
        }
        else {
            result = this.subVectorElements(a, b);
        }
        return result;
    }

    mulPolys(a: Vector, b: Vector): WasmVector128 {
        const aw = a as WasmVector128, bw = b as WasmVector128;
        const result = this.newVector(a.length + b.length - 1);
        this.wasm.mulPolys(aw.base, bw.base, result.base, a.length, b.length);
        return result;
    }

    divPolys(a: Vector, b: Vector): WasmVector128 {
        const aLength = lastNonZeroIndex(a)! + 1;
        const bLength = lastNonZeroIndex(b)! + 1;
        if (aLength < bLength) {
            throw new Error('Cannot divide by polynomial of higher order');
        }

        const aw = a as WasmVector128, bw = b as WasmVector128;
        const diffLength = aLength - bLength;
        const result = this.newVector(diffLength + 1);
        this.wasm.divPolys(aw.base, bw.base, result.base, aLength, bLength);
        return result;
    }

    mulPolyByConstant(a: Vector, b: bigint): WasmVector128 {
        return this.mulVectorElements(a, b);
    }

    // POLYNOMIAL EVALUATION
    // --------------------------------------------------------------------------------------------
    evalPolyAt(p: Vector, x: bigint): bigint {
        this.loadInput(x, 0);
        const pw = p as WasmVector128;
        const idx = this.wasm.evalPolyAt(pw.base, 0, p.length);
        return this.readOutput(idx);
    }

    evalPolyAtRoots(p: Vector, rootsOfUnity: Vector): WasmVector128 {
        if (!isPowerOf2(rootsOfUnity.length)) {
            throw new Error('Number of roots of unity must be a power of 2');
        }
        if (p.length > rootsOfUnity.length) {
            throw new Error('Polynomial degree must be smaller than or equal to the number of roots of unity');
        }

        const pw = p as WasmVector128, xw = rootsOfUnity as WasmVector128;
        const base = this.wasm.evalPolyAtRoots(pw.base, xw.base, pw.length, xw.length);
        return new WasmVector128(this.wasm, p.length, base);
    }

    evalPolysAtRoots(p: Matrix, rootsOfUnity: Vector): WasmMatrix128 {
        if (!isPowerOf2(rootsOfUnity.length)) {
            throw new Error('Number of roots of unity must be a power of 2');
        }
        if (p.colCount > rootsOfUnity.length) {
            throw new Error('Polynomial degree must be smaller than or equal to the number of roots of unity');
        }

        throw new Error('Not implemented'); // TODO
    }

    evalQuarticBatch(polys: Matrix, xs: Vector): WasmVector128 {
        if (polys.colCount !== 4) {
            throw new Error('Quartic polynomials must have exactly 4 terms');
        }
        else if (polys.rowCount !== xs.length) {
            throw new Error('Number of quartic polynomials must be the same as the number of x coordinates');
        }

        const pw = polys as WasmMatrix128, xw = xs as WasmVector128;
        const result = this.newVector(polys.rowCount);
        this.wasm.evalQuarticBatch(pw.base, xw.base, result.base, polys.rowCount);
        return result;
    }

    // POLYNOMIAL INTERPOLATION
    // --------------------------------------------------------------------------------------------
    interpolate(xs: Vector, ys: Vector): WasmVector128
    interpolate(xs: Vector, ys: Matrix): WasmMatrix128
    interpolate(xs: Vector, ys: Vector | Matrix): WasmVector128 | WasmMatrix128 {
        if (ys instanceof WasmVector128) {
            if (xs.length !== ys.length) {
                throw new Error('');    // TODO
            }
            const xw = xs as WasmVector128;
            const base = this.wasm.interpolate(xw.base, ys.base, xs.length);
            return new WasmVector128(this.wasm, xs.length + 1, base);
        }
        else if (ys instanceof WasmMatrix128) {
            if(xs.length !== ys.rowCount) {
                throw new Error('');    // TODO
            }
            throw new Error('Not implemented');
        }
        else {
            throw new Error(`y-coordinates object is invalid`);
        }
    }

    interpolateRoots(rootsOfUnity: Vector, ys: Vector): WasmVector128
    interpolateRoots(rootsOfUnity: Vector, ys: Matrix): WasmMatrix128
    interpolateRoots(rootsOfUnity: Vector, ys: Vector | Matrix): WasmVector128 | WasmMatrix128 {
        if (!isPowerOf2(rootsOfUnity.length)) {
            throw new Error('Number of roots of unity must be a power of 2');
        }

        const rw = rootsOfUnity as WasmVector128;
        if (ys instanceof WasmVector128) {
            if (rootsOfUnity.length !== ys.length) {
                throw new Error('');    // TODO
            }
            const result = new WasmVector128(this.wasm, rootsOfUnity.length);
            this.wasm.interpolateRoots(rw.base, ys.base, result.base, ys.length);
            return result;
        }
        else if (ys instanceof WasmMatrix128) {
            if(rootsOfUnity.length !== ys.rowCount) {
                throw new Error('');    // TODO
            }
            const result = new WasmMatrix128(this.wasm, ys.rowCount, ys.colCount);
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

    interpolateQuarticBatch(xSets: Matrix, ySets: Matrix): WasmMatrix128 {
        if (xSets.colCount !== 4 || ySets.colCount !== 4) {
            throw new Error('X and Y coordinate matrixes must have 4 values per row');
        }
        else if (xSets.rowCount !== ySets.rowCount) {
            throw new Error('X and Y coordinate matrixes must have the same number of rows');
        }
        const xw = xSets as WasmMatrix128, yw = ySets as WasmMatrix128;
        const result = this.newMatrix(xw.rowCount, xw.colCount);
        this.wasm.interpolateQuarticBatch(xw.base, yw.base, result.base, xw.rowCount);
        return result;
    }

    // HELPER METHODS
    // --------------------------------------------------------------------------------------------
    private loadInput(value: bigint, index: number): void {
        this.wasm.U64[this.inputsIdx + index] = value & MASK_64B
        this.wasm.U64[this.inputsIdx + index + 1] = value >> 64n;
    }

    private readOutput(index: number): bigint {
        const lo = this.wasm.U64[this.outputsIdx + index];
        const hi = this.wasm.U64[this.outputsIdx + index + 1];
        return (hi << 64n) | lo;
    }
}

// HELPER FUNCTIONS
// ================================================================================================
function lastNonZeroIndex(values: Vector) {
    for (let i = values.length - 1; i >= 0; i--) {
        if (values.getValue(i) !== 0n) return i;
    }
}