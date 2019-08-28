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
    constructor(modulus: bigint, options: WasmOptions) {
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

    get isOptimized(): boolean {
        return true;
    }

    get zero(): bigint {
        return 0n
    }

    get one(): bigint {
        return 1n;
    }

    get memorySize(): number {
        return this.wasm.U8.byteLength;
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

    inv(value: bigint): bigint {
        return this.jsField.inv(value);
    }

    neg(value: bigint): bigint {
        return this.jsField.neg(value);
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
            const result = this.newVector(a.length);
            this.wasm.divArrayElements2(aw.base, 0, result.base, a.length);
            return result;
        }
        else {
            if (a.length !== b.length) {
                throw new Error('Cannot divide vector elements: vectors have different lengths');
            }
            const aw = a as WasmVector128, bw = b as WasmVector128;
            const result = this.newVector(a.length);
            this.wasm.divArrayElements1(aw.base, bw.base, result.base, a.length);
            return result;
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
        const result = this.newVector(sw.length);
        this.wasm.invArrayElements(sw.base, result.base, sw.length);
        return result;
    }

    negVectorElements(source: Vector): WasmVector128 {
        const sw = source as WasmVector128;
        const result = this.newVector(sw.length);
        this.wasm.negArrayElements(sw.base, result.base, sw.length);
        return result;
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
        if (v.length != k.length) {
            throw new Error('Number of vectors must be the same as the number of coefficients');
        }

        const vw = v as WasmVector128[], kw = k as WasmVector128;
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

    pluckVector(v: Vector, skip: number, times: number): WasmVector128 {
        const vw = v as WasmVector128;
        const result = this.newVector(times);
        this.wasm.pluckArray(vw.base, result.base, skip, vw.length, result.length);
        return result;
    }

    truncateVector(v: Vector, newLength: number): WasmVector128 {
        if (v.length < newLength) {
            newLength = v.length;
        }
        const vw = v as WasmVector128;
        const result = this.newVector(newLength);
        this.wasm.copyArrayElements(vw.base, result.base, newLength);
        return result;
    }

    duplicateVector(v: Vector, times = 1): WasmVector128 {
        let currentLength = v.length;
        const resultLength = currentLength << times;
        const result = this.newVector(resultLength);
        
        const vw = v as WasmVector128;
        this.wasm.copyArrayElements(vw.base, result.base, currentLength);

        while (currentLength < resultLength) {
            let offset = currentLength * result.elementSize;
            this.wasm.copyArrayElements(result.base, result.base + offset, currentLength);
            currentLength = currentLength << 1;
        }
        
        return result;
    }

    transposeVector(v: Vector, columns: number, step = 1): WasmMatrix128 {
        const rowCount = (v.length / step) / columns;
        if (!Number.isInteger(rowCount)) {
            throw new Error('Number of columns does not evenly divide vector length');
        }
        const vw = v as WasmVector128;
        const result = this.newMatrix(rowCount, columns);
        this.wasm.transposeArray(vw.base, result.base, rowCount, columns, step);
        return result;
    }

    splitVector(v: Vector, rows: number): WasmMatrix128 {
        const colCount = v.length / rows;
        if (!Number.isInteger(colCount)) {
            throw new Error('Number of rows does not evenly divide vector length');
        }

        const vw = v as WasmVector128;
        return new WasmMatrix128(this.wasm, rows, colCount, vw.base);
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

    newMatrixFromVectors(v: Vector[]): WasmMatrix128 {
        const rowCount = v.length;
        let colCount = 0;
        for (let row of v) {
            if (colCount < row.length) {
                colCount = row.length;
            }
        }

        const result = this.newMatrix(rowCount, colCount);
        let resRef = result.base;
        for (let i = 0; i < v.length; i++) {
            let vw = v[i] as WasmVector128;
            this.wasm.copyArrayElements(vw.base, resRef, vw.length);
            resRef += result.rowSize;
        }

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
            const result = this.newMatrix(a.rowCount, a.colCount);
            this.wasm.divArrayElements2(aw.base, 0, result.base, aw.elementCount);
            return result;
        }
        else {
            if (a.rowCount !== b.rowCount || a.colCount !== b.colCount) {
                throw new Error('Cannot divide matrix elements: matrixes have different dimensions');
            }
            const aw = a as WasmMatrix128, bw = b as WasmMatrix128;
            const result = this.newMatrix(a.rowCount, a.colCount);
            this.wasm.divArrayElements1(aw.base, bw.base, result.base, aw.elementCount);
            return result;
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
        const result = this.newMatrix(sw.rowCount, sw.colCount);
        this.wasm.invArrayElements(sw.base, result.base, sw.elementCount);
        return result;
    }

    negMatrixElements(source: Matrix): WasmMatrix128 {
        const sw = source as WasmMatrix128;
        const result = this.newMatrix(sw.rowCount, sw.colCount);
        this.wasm.negArrayElements(sw.base, result.base, sw.elementCount);
        return result;
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
        const result = this.newMatrix(a.rowCount, a.colCount);
        let aRef = aw.base, rRef = result.base;
        for (let i = 0; i < a.rowCount; i++) {
            this.wasm.mulArrayElements1(aRef, bw.base, rRef, b.length);
            aRef += result.rowSize;
            rRef += result.rowSize;
        }
        return result;
    }

    subMatrixElementsFromVectors(v: Vector[], m: Matrix): WasmMatrix128 {
        if (v.length !== m.rowCount) {
            throw new Error('Cannot subtract matrix elements from vectors: parameters have different number of rows');
        }
        const mw = m as WasmMatrix128;
        const result = this.newMatrix(m.rowCount, m.colCount);
        let bRef = mw.base, resRef = result.base;
        for (let i = 0; i < mw.rowCount; i++) {
            let vw = v[i] as WasmVector128;
            if (vw.length !== result.colCount) {
                throw new Error('Cannot subtract matrix elements from vectors: parameters have different number of columns');
            }
            this.wasm.subArrayElements1(vw.base, bRef, resRef, result.colCount);
            bRef += result.rowSize;
            resRef += result.rowSize;
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
        let result: WasmVector128;
        let aw = a as WasmVector128, bw = b as WasmVector128;
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

    subPolys(a: Vector, b: Vector): WasmVector128 {
        const resultLength = Math.max(a.length, b.length);
        const result = this.newVector(resultLength);
        
        const aw = a as WasmVector128, bw = b as WasmVector128;
        this.wasm.negArrayElements(bw.base, result.base, bw.length);
        this.wasm.addPolys(result.base, aw.base, result.base, result.length, aw.length);

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
        const result = this.newVector(xw.length);
        this.wasm.evalPolyAtRoots(pw.base, xw.base, result.base, pw.length, xw.length);
        return result;
    }

    evalPolysAtRoots(p: Matrix, rootsOfUnity: Vector): WasmMatrix128 {
        if (!isPowerOf2(rootsOfUnity.length)) {
            throw new Error('Number of roots of unity must be a power of 2');
        }
        if (p.colCount > rootsOfUnity.length) {
            throw new Error('Polynomial degree must be smaller than or equal to the number of roots of unity');
        }

        const pw = p as WasmMatrix128, xw = rootsOfUnity as WasmVector128;
        const result = this.newMatrix(p.rowCount, xw.length);
        let pRef = pw.base, resRef = result.base;
        for (let i = 0; i < p.rowCount; i++) {
            this.wasm.evalPolyAtRoots(pRef, xw.base, resRef, pw.colCount, xw.length);
            pRef += pw.rowSize;
            resRef += result.rowSize;
        }
        return result;
    }

    evalQuarticBatch(polys: Matrix, x: bigint | Vector): WasmVector128 {
        if (polys.colCount !== 4) {
            throw new Error('Quartic polynomials must have exactly 4 terms');
        }

        const pw = polys as WasmMatrix128;
        if (typeof x === 'bigint') {
            this.loadInput(x, 0);
            const result = this.newVector(polys.rowCount);
            this.wasm.evalQuarticBatch2(pw.base, 0, result.base, polys.rowCount);
            return result;
        }
        else {
            if (polys.rowCount !== x.length) {
                throw new Error('Number of quartic polynomials must be the same as the number of x coordinates');
            }
            const xw = x as WasmVector128;
            const result = this.newVector(polys.rowCount);
            this.wasm.evalQuarticBatch1(pw.base, xw.base, result.base, polys.rowCount);
            return result;
        }
    }

    // POLYNOMIAL INTERPOLATION
    // --------------------------------------------------------------------------------------------
    interpolate(xs: Vector, ys: Vector): WasmVector128 {
        if (xs.length !== ys.length) {
            throw new Error('Number of x and y coordinates must be the same');
        }
        const xw = xs as WasmVector128, yw = ys as WasmVector128;
        const result = this.newVector(xs.length);
        this.wasm.interpolate(xw.base, yw.base, result.base, xs.length);
        return result;
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
                throw new Error('Number of roots of unity must be the same as the number of y coordinates');
            }
            const result = this.newVector(rootsOfUnity.length);
            this.wasm.interpolateRoots(rw.base, ys.base, result.base, ys.length);
            return result;
        }
        else if (ys instanceof WasmMatrix128) {
            if(rootsOfUnity.length !== ys.colCount) {
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
        let idx = this.inputsIdx + (index << 1);
        this.wasm.U64[idx] = value & MASK_64B
        this.wasm.U64[idx + 1] = value >> 64n;
    }

    private readOutput(index: number): bigint {
        let idx = this.outputsIdx + (index << 1);
        const lo = this.wasm.U64[idx];
        const hi = this.wasm.U64[idx + 1];
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