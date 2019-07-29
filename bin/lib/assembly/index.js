"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTS
// ================================================================================================
const fs = require("fs");
const loader = require("assemblyscript/lib/loader");
// CONSTANTS
// ================================================================================================
const VALUE_BITS = 128;
const VALUE_SIZE = VALUE_BITS / 8;
const MAX_VALUE = 2n ** BigInt(VALUE_BITS) - 1n;
const MASK_32B = 0xffffffffn;
const MASK_64B = 0xffffffffffffffffn;
// PUBLIC MODULE
// ================================================================================================
function instantiate(modulus, options) {
    let initialMemPages = 10;
    if (options) {
        initialMemPages = Math.ceil(options.initialMemory / 1024 / 64);
    }
    const wasm = loader.instantiateBuffer(fs.readFileSync(`${__dirname}/prime128.wasm`), {
        env: {
            memory: new WebAssembly.Memory({ initial: initialMemPages })
        }
    });
    return new Wasm128(wasm, modulus);
}
exports.instantiate = instantiate;
class Wasm128 {
    // CONSTRUCTOR
    // ----------------------------------------------------------------------------------------
    constructor(wasm, modulus) {
        this.wasm = wasm;
        this.modulus = modulus;
        this.inputsIdx = (this.wasm.getInputsPtr()) >>> 3;
        this.outputsIdx = (this.wasm.getOutputsPtr()) >>> 3;
        // set modulus in WASM module
        const mLo2 = Number.parseInt((modulus & MASK_32B));
        const mLo1 = Number.parseInt(((modulus >> 32n) & MASK_32B));
        const mHi2 = Number.parseInt(((modulus >> 64n) & MASK_32B));
        const mHi1 = Number.parseInt(((modulus >> 96n) & MASK_32B));
        this.wasm.setModulus(mHi1, mHi2, mLo1, mLo2);
    }
    // PUBLIC ACCESSORS
    // ----------------------------------------------------------------------------------------
    get memorySize() {
        return this.wasm.U8.byteLength;
    }
    // VECTOR OPERATIONS
    // ----------------------------------------------------------------------------------------
    newVector(length) {
        return new WasmVector(this.wasm, length);
    }
    destroyVector(v) {
        throw new Error('Not implemented');
    }
    addVectorElements(a, b) {
        if (typeof b === 'bigint') {
            this.wasm.U64[this.inputsIdx] = b & MASK_64B;
            this.wasm.U64[this.inputsIdx + 1] = b >> 64n;
            const base = this.wasm.addArrayElements2(a.base, 0, a.length);
            return new WasmVector(this.wasm, a.length, base);
        }
        else {
            if (a.length !== b.length) {
                throw new Error('Cannot add vector elements: vectors have different lengths');
            }
            const base = this.wasm.addArrayElements(a.base, b.base, a.length);
            return new WasmVector(this.wasm, a.length, base);
        }
    }
    subVectorElements(a, b) {
        if (typeof b === 'bigint') {
            this.wasm.U64[this.inputsIdx] = b & MASK_64B;
            this.wasm.U64[this.inputsIdx + 1] = b >> 64n;
            const base = this.wasm.subArrayElements2(a.base, 0, a.length);
            return new WasmVector(this.wasm, a.length, base);
        }
        else {
            if (a.length !== b.length) {
                throw new Error('Cannot subtract vector elements: vectors have different lengths');
            }
            const base = this.wasm.subArrayElements(a.base, b.base, a.length);
            return new WasmVector(this.wasm, a.length, base);
        }
    }
    mulVectorElements(a, b) {
        if (typeof b === 'bigint') {
            this.wasm.U64[this.inputsIdx] = b & MASK_64B;
            this.wasm.U64[this.inputsIdx + 1] = b >> 64n;
            const base = this.wasm.mulArrayElements2(a.base, 0, a.length);
            return new WasmVector(this.wasm, a.length, base);
        }
        else {
            if (a.length !== b.length) {
                throw new Error('Cannot multiply vector elements: vectors have different lengths');
            }
            const base = this.wasm.mulArrayElements(a.base, b.base, a.length);
            return new WasmVector(this.wasm, a.length, base);
        }
    }
    divVectorElements(a, b) {
        if (typeof b === 'bigint') {
            this.wasm.U64[this.inputsIdx] = b & MASK_64B;
            this.wasm.U64[this.inputsIdx + 1] = b >> 64n;
            const base = this.wasm.divArrayElements2(a.base, 0, a.length);
            return new WasmVector(this.wasm, a.length, base);
        }
        else {
            if (a.length !== b.length) {
                throw new Error('Cannot divide vector elements: vectors have different lengths');
            }
            const base = this.wasm.divArrayElements(a.base, b.base, a.length);
            return new WasmVector(this.wasm, a.length, base);
        }
    }
    expVectorElements(a, b) {
        if (typeof b === 'bigint') {
            this.wasm.U64[this.inputsIdx] = b & MASK_64B;
            this.wasm.U64[this.inputsIdx + 1] = b >> 64n;
            const base = this.wasm.expArrayElements2(a.base, 0, a.length);
            return new WasmVector(this.wasm, a.length, base);
        }
        else {
            if (a.length !== b.length) {
                throw new Error('Cannot exponentiate vector elements: vectors have different lengths');
            }
            const base = this.wasm.expArrayElements(a.base, b.base, a.length);
            return new WasmVector(this.wasm, a.length, base);
        }
    }
    invVectorElements(v) {
        const base = this.wasm.invArrayElements(v.base, v.length);
        return new WasmVector(this.wasm, v.length, base);
    }
    combineVectors(a, b) {
        if (a.length !== b.length) {
            throw new Error('Cannot combine vectors: vectors have different lengths');
        }
        const outputPos = this.wasm.combineVectors(a.base, b.base, a.length);
        const lo = this.wasm.U64[this.outputsIdx + outputPos];
        const hi = this.wasm.U64[this.outputsIdx + outputPos + 1];
        return (hi << 64n) | lo;
    }
    // MATRIX OPERATIONS
    // ----------------------------------------------------------------------------------------
    newMatrix(rows, columns) {
        return new WasmMatrix(this.wasm, rows, columns);
    }
    destroyMatrix(v) {
        throw new Error('Not implemented');
    }
    addMatrixElements(a, b) {
        if (typeof b === 'bigint') {
            this.wasm.U64[this.inputsIdx] = b & MASK_64B;
            this.wasm.U64[this.inputsIdx + 1] = b >> 64n;
            const base = this.wasm.addArrayElements2(a.base, 0, a.elementCount);
            return new WasmMatrix(this.wasm, a.rowCount, a.colCount, base);
        }
        else {
            if (a.rowCount !== b.rowCount || a.colCount !== b.colCount) {
                throw new Error('Cannot add matrix elements: matrixes have different dimensions');
            }
            const base = this.wasm.addArrayElements(a.base, b.base, a.elementCount);
            return new WasmMatrix(this.wasm, a.rowCount, a.colCount, base);
        }
    }
    subMatrixElements(a, b) {
        if (typeof b === 'bigint') {
            this.wasm.U64[this.inputsIdx] = b & MASK_64B;
            this.wasm.U64[this.inputsIdx + 1] = b >> 64n;
            const base = this.wasm.subArrayElements2(a.base, 0, a.elementCount);
            return new WasmMatrix(this.wasm, a.rowCount, a.colCount, base);
        }
        else {
            if (a.rowCount !== b.rowCount || a.colCount !== b.colCount) {
                throw new Error('Cannot subtract matrix elements: matrixes have different dimensions');
            }
            const base = this.wasm.subArrayElements(a.base, b.base, a.elementCount);
            return new WasmMatrix(this.wasm, a.rowCount, a.colCount, base);
        }
    }
    mulMatrixElements(a, b) {
        if (typeof b === 'bigint') {
            this.wasm.U64[this.inputsIdx] = b & MASK_64B;
            this.wasm.U64[this.inputsIdx + 1] = b >> 64n;
            const base = this.wasm.mulArrayElements2(a.base, 0, a.elementCount);
            return new WasmMatrix(this.wasm, a.rowCount, a.colCount, base);
        }
        else {
            if (a.rowCount !== b.rowCount || a.colCount !== b.colCount) {
                throw new Error('Cannot multiply matrix elements: matrixes have different dimensions');
            }
            const base = this.wasm.mulArrayElements(a.base, b.base, a.elementCount);
            return new WasmMatrix(this.wasm, a.rowCount, a.colCount, base);
        }
    }
    divMatrixElements(a, b) {
        if (typeof b === 'bigint') {
            this.wasm.U64[this.inputsIdx] = b & MASK_64B;
            this.wasm.U64[this.inputsIdx + 1] = b >> 64n;
            const base = this.wasm.divArrayElements2(a.base, 0, a.elementCount);
            return new WasmMatrix(this.wasm, a.rowCount, a.colCount, base);
        }
        else {
            if (a.rowCount !== b.rowCount || a.colCount !== b.colCount) {
                throw new Error('Cannot divide matrix elements: matrixes have different dimensions');
            }
            const base = this.wasm.divArrayElements(a.base, b.base, a.elementCount);
            return new WasmMatrix(this.wasm, a.rowCount, a.colCount, base);
        }
    }
    expMatrixElements(a, b) {
        if (typeof b === 'bigint') {
            this.wasm.U64[this.inputsIdx] = b & MASK_64B;
            this.wasm.U64[this.inputsIdx + 1] = b >> 64n;
            const base = this.wasm.expArrayElements2(a.base, 0, a.elementCount);
            return new WasmMatrix(this.wasm, a.rowCount, a.colCount, base);
        }
        else {
            if (a.rowCount !== b.rowCount || a.colCount !== b.colCount) {
                throw new Error('Cannot exponentiate matrix elements: matrixes have different dimensions');
            }
            const base = this.wasm.expArrayElements(a.base, b.base, a.elementCount);
            return new WasmMatrix(this.wasm, a.rowCount, a.colCount, base);
        }
    }
    invMatrixElements(v) {
        const base = this.wasm.invArrayElements(v.base, v.elementCount);
        return new WasmMatrix(this.wasm, v.rowCount, v.colCount, base);
    }
    mulMatrixes(a, b) {
        const n = a.rowCount;
        const m = a.colCount;
        const p = b.colCount;
        if (m !== b.rowCount) {
            throw new Error(`Cannot compute a product of ${a}x${m} and ${b.rowCount}x${p} matrixes`);
        }
        const base = this.wasm.mulMatrixes(a.base, b.base, n, m, p);
        return new WasmMatrix(this.wasm, n, p, base);
    }
    mulMatrixByVector(a, b) {
        const n = a.rowCount;
        const m = a.colCount;
        const p = 1;
        if (m !== b.length) {
            throw new Error(`Cannot compute a product of ${a}x${m} matrix and ${b.length}x1 vector`);
        }
        const base = this.wasm.mulMatrixes(a.base, b.base, n, m, p);
        return new WasmVector(this.wasm, n, base);
    }
    // OTHER OPERATIONS
    // ----------------------------------------------------------------------------------------
    getPowerSeries(seed, length) {
        this.wasm.U64[this.inputsIdx] = seed & MASK_64B;
        this.wasm.U64[this.inputsIdx + 1] = seed >> 64n;
        const base = this.wasm.getPowerSeries(length, 0);
        return new WasmVector(this.wasm, length, base);
    }
    // BASIC POLYNOMIAL OPERATIONS
    // ----------------------------------------------------------------------------------------
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
    mulPolyByConstant(a, b) {
        return this.mulVectorElements(a, b);
    }
    evalPolyAtRoots(p, rootsOfUnity) {
        const base = this.wasm.evalPolyAtRoots(p.base, rootsOfUnity.base, p.length, rootsOfUnity.length);
        return new WasmVector(this.wasm, p.length, base);
    }
    interpolateRoots(rootsOfUnity, ys) {
        const base = this.wasm.interpolateRoots(rootsOfUnity.base, ys.base, ys.length);
        return new WasmVector(this.wasm, ys.length, base);
    }
}
exports.Wasm128 = Wasm128;
// VECTOR CLASS
// ================================================================================================
class WasmVector {
    constructor(wasm, length, base) {
        this.wasm = wasm;
        this.base = base === undefined ? this.wasm.newArray(length) : base;
        this.length = length;
        this.byteLength = length * VALUE_SIZE;
    }
    getValue(index) {
        const idx = (this.base + index * VALUE_SIZE) >>> 3;
        // reads a 128-bit value from WebAssembly memory (little-endian layout)
        const lo = this.wasm.U64[idx];
        const hi = this.wasm.U64[idx + 1];
        return (hi << 64n) | lo;
    }
    setValue(index, value) {
        if (value > MAX_VALUE) {
            throw new TypeError(`Value cannot be greater than ${MAX_VALUE}`);
        }
        // writes a 128-bit value to WebAssembly memory (little-endian layout)
        const idx = (this.base + index * VALUE_SIZE) >>> 3;
        this.wasm.U64[idx] = value & MASK_64B;
        this.wasm.U64[idx + 1] = value >> 64n;
    }
}
exports.WasmVector = WasmVector;
// MATRIX CLASS
// ================================================================================================
class WasmMatrix {
    constructor(wasm, rows, columns, base) {
        this.wasm = wasm;
        this.elementCount = rows * columns;
        this.base = base === undefined ? this.wasm.newArray(this.elementCount) : base;
        this.rowCount = rows;
        this.colCount = columns;
        this.rowSze = columns * VALUE_SIZE;
        this.byteLength = rows * this.rowSze;
    }
    getValue(row, column) {
        const idx = (this.base + row * this.rowSze + column * VALUE_SIZE) >>> 3;
        // reads a 128-bit value from WebAssembly memory (little-endian layout)
        const lo = this.wasm.U64[idx];
        const hi = this.wasm.U64[idx + 1];
        return (hi << 64n) | lo;
    }
    setValue(row, column, value) {
        if (value > MAX_VALUE) {
            throw new TypeError(`Value cannot be greater than ${MAX_VALUE}`);
        }
        // writes a 128-bit value to WebAssembly memory (little-endian layout)
        const idx = (this.base + row * this.rowSze + column * VALUE_SIZE) >>> 3;
        this.wasm.U64[idx] = value & MASK_64B;
        this.wasm.U64[idx + 1] = value >> 64n;
    }
}
exports.WasmMatrix = WasmMatrix;
//# sourceMappingURL=index.js.map