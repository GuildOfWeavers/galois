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
        if (a.length !== b.length) {
            throw new Array('Cannot add vector elements: vectors have different lengths');
        }
        const base = this.wasm.addVectorElements(a.base, b.base);
        return new WasmVector(this.wasm, base, a.length);
    }
    subVectorElements(a, b) {
        if (a.length !== b.length) {
            throw new Array('Cannot subtract vector elements: vectors have different lengths');
        }
        const base = this.wasm.subVectorElements(a.base, b.base);
        return new WasmVector(this.wasm, base, a.length);
    }
    mulVectorElements(a, b) {
        if (a.length !== b.length) {
            throw new Array('Cannot multiply vector elements: vectors have different lengths');
        }
        const base = this.wasm.mulVectorElements(a.base, b.base);
        return new WasmVector(this.wasm, base, a.length);
    }
    divVectorElements(a, b) {
        if (a.length !== b.length) {
            throw new Array('Cannot divide vector elements: vectors have different lengths');
        }
        const base = this.wasm.divVectorElements(a.base, b.base);
        return new WasmVector(this.wasm, base, a.length);
    }
    expVectorElements(a, b) {
        if (a.length !== b.length) {
            throw new Array('Cannot exponentiate vector elements: vectors have different lengths');
        }
        const base = this.wasm.expVectorElements(a.base, b.base);
        return new WasmVector(this.wasm, base, a.length);
    }
    invVectorElements(v) {
        const base = this.wasm.invVectorElements(v.base);
        return new WasmVector(this.wasm, base, v.length);
    }
    combineVectors(a, b) {
        throw new Error('Not implemented');
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
        const hi = this.wasm.U64[idx];
        const lo = this.wasm.U64[idx + 1];
        return (hi << 64n) | lo;
    }
    setValue(index, value) {
        if (value > MAX_VALUE) {
            throw new TypeError(`Value cannot be greater than ${MAX_VALUE}`);
        }
        const idx = (this.base + index * VALUE_SIZE) >>> 3;
        this.wasm.U64[idx] = value >> 64n;
        this.wasm.U64[idx + 1] = value & 0xffffffffffffffffn;
    }
}
exports.WasmVector = WasmVector;
//# sourceMappingURL=index.js.map