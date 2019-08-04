"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// CONSTANTS
// ================================================================================================
const VALUE_BITS = 128;
const VALUE_SIZE = VALUE_BITS / 8;
const MAX_VALUE = 2n ** BigInt(VALUE_BITS) - 1n;
const MASK_64B = 0xffffffffffffffffn;
// CLASS DEFINITION
// ================================================================================================
class WasmVector128 {
    constructor(wasm, length, baseOrSource) {
        this.wasm = wasm;
        if (typeof baseOrSource === 'number') {
            this.base = baseOrSource;
        }
        else if (baseOrSource) {
            let elementsToCopy = Math.min(length, baseOrSource.length);
            this.base = this.wasm.newArray(length, baseOrSource.base, elementsToCopy);
        }
        else {
            this.base = this.wasm.newArray(length, 0, 0);
        }
        this.length = length;
        this.byteLength = length * VALUE_SIZE;
    }
    get elementSize() {
        return VALUE_SIZE;
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
    toValues() {
        const values = new Array(this.length);
        let idx = this.base >>> 3;
        for (let i = 0; i < this.length; i++, idx += 2) {
            let lo = this.wasm.U64[idx];
            let hi = this.wasm.U64[idx + 1];
            values[i] = (hi << 64n) | lo;
        }
        return values;
    }
    load(values) {
        if (values.length !== this.length) {
            throw new Error(`Cannot load values: vector length must match the number of values`);
        }
        let idx = this.base >>> 3;
        for (let i = 0; i < this.length; i++, idx += 2) {
            let value = values[i];
            this.wasm.U64[idx] = value & MASK_64B;
            this.wasm.U64[idx + 1] = value >> 64n;
        }
    }
}
exports.WasmVector128 = WasmVector128;
//# sourceMappingURL=WasmVector128.js.map