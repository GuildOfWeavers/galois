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
// PUBLIC MODULE
// ================================================================================================
function instantiate(modulus) {
    const wasm = loader.instantiateBuffer(fs.readFileSync(`${__dirname}/prime128.wasm`));
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
        const mLo2 = Number.parseInt((modulus & 0xffffffffn));
        const mLo1 = Number.parseInt(((modulus >> 32n) & 0xffffffffn));
        const mHi2 = Number.parseInt(((modulus >> 64n) & 0xffffffffn));
        const mHi1 = Number.parseInt(((modulus >> 96n) & 0xffffffffn));
        this.wasm.setModulus(mHi1, mHi2, mLo1, mLo2);
    }
    // VECTOR OPERATIONS
    // ----------------------------------------------------------------------------------------
    newVector(length) {
        const base = this.wasm.newVector(length);
        return new WasmVector(this.wasm, base, length);
    }
    destroyVector(v) {
        throw new Error('Not implemented');
    }
    addVectorElements(a, b) {
        if (typeof b === 'bigint') {
            this.wasm.U64[this.inputsIdx] = b & 0xffffffffffffffffn;
            this.wasm.U64[this.inputsIdx + 1] = b >> 64n;
            const base = this.wasm.addVectorElements2(a.base, 0);
            return new WasmVector(this.wasm, base, a.length);
        }
        else {
            if (a.length !== b.length) {
                throw new Array('Cannot add vector elements: vectors have different lengths');
            }
            const base = this.wasm.addVectorElements(a.base, b.base);
            return new WasmVector(this.wasm, base, a.length);
        }
    }
    subVectorElements(a, b) {
        if (typeof b === 'bigint') {
            this.wasm.U64[this.inputsIdx] = b & 0xffffffffffffffffn;
            this.wasm.U64[this.inputsIdx + 1] = b >> 64n;
            const base = this.wasm.subVectorElements2(a.base, 0);
            return new WasmVector(this.wasm, base, a.length);
        }
        else {
            if (a.length !== b.length) {
                throw new Array('Cannot subtract vector elements: vectors have different lengths');
            }
            const base = this.wasm.subVectorElements(a.base, b.base);
            return new WasmVector(this.wasm, base, a.length);
        }
    }
    mulVectorElements(a, b) {
        if (typeof b === 'bigint') {
            this.wasm.U64[this.inputsIdx] = b & 0xffffffffffffffffn;
            this.wasm.U64[this.inputsIdx + 1] = b >> 64n;
            const base = this.wasm.mulVectorElements2(a.base, 0);
            return new WasmVector(this.wasm, base, a.length);
        }
        else {
            if (a.length !== b.length) {
                throw new Array('Cannot multiply vector elements: vectors have different lengths');
            }
            const base = this.wasm.mulVectorElements(a.base, b.base);
            return new WasmVector(this.wasm, base, a.length);
        }
    }
    divVectorElements(a, b) {
        if (typeof b === 'bigint') {
            this.wasm.U64[this.inputsIdx] = b & 0xffffffffffffffffn;
            this.wasm.U64[this.inputsIdx + 1] = b >> 64n;
            const base = this.wasm.divVectorElements2(a.base, 0);
            return new WasmVector(this.wasm, base, a.length);
        }
        else {
            if (a.length !== b.length) {
                throw new Array('Cannot divide vector elements: vectors have different lengths');
            }
            const base = this.wasm.divVectorElements(a.base, b.base);
            return new WasmVector(this.wasm, base, a.length);
        }
    }
    expVectorElements(a, b) {
        if (typeof b === 'bigint') {
            this.wasm.U64[this.inputsIdx] = b & 0xffffffffffffffffn;
            this.wasm.U64[this.inputsIdx + 1] = b >> 64n;
            const base = this.wasm.expVectorElements2(a.base, 0);
            return new WasmVector(this.wasm, base, a.length);
        }
        else {
            if (a.length !== b.length) {
                throw new Array('Cannot exponentiate vector elements: vectors have different lengths');
            }
            const base = this.wasm.expVectorElements(a.base, b.base);
            return new WasmVector(this.wasm, base, a.length);
        }
    }
    invVectorElements(v) {
        const base = this.wasm.invVectorElements(v.base);
        return new WasmVector(this.wasm, base, v.length);
    }
    combineVectors(a, b) {
        if (a.length !== b.length) {
            throw new Array('Cannot combine vectors: vectors have different lengths');
        }
        const outputPos = this.wasm.combineVectors(a.base, b.base);
        const lo = this.wasm.U64[this.outputsIdx + outputPos];
        const hi = this.wasm.U64[this.outputsIdx + outputPos + 1];
        return (hi << 64n) | lo;
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
}
exports.Wasm128 = Wasm128;
// VECTOR CLASS
// ================================================================================================
class WasmVector {
    constructor(wasm, base, length) {
        this.wasm = wasm;
        this.base = base;
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
        this.wasm.U64[idx] = value & 0xffffffffffffffffn;
        this.wasm.U64[idx + 1] = value >> 64n;
    }
}
exports.WasmVector = WasmVector;
//# sourceMappingURL=index.js.map