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
class WasmMatrix128 {
    constructor(wasm, rows, columns, base) {
        this.wasm = wasm;
        this.elementCount = rows * columns;
        this.base = base === undefined ? this.wasm.newArray(this.elementCount) : base;
        this.rowCount = rows;
        this.colCount = columns;
        this.rowSize = columns * VALUE_SIZE;
        this.byteLength = rows * this.rowSize;
    }
    get elementSize() {
        return VALUE_SIZE;
    }
    getValue(row, column) {
        const idx = (this.base + row * this.rowSize + column * VALUE_SIZE) >>> 3;
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
        const idx = (this.base + row * this.rowSize + column * VALUE_SIZE) >>> 3;
        this.wasm.U64[idx] = value & MASK_64B;
        this.wasm.U64[idx + 1] = value >> 64n;
    }
    toValues() {
        const values = new Array(this.rowCount);
        let idx = this.base >>> 3;
        for (let i = 0; i < this.rowCount; i++) {
            let row = new Array(this.colCount);
            for (let j = 0; j < this.colCount; j++, idx += 2) {
                let lo = this.wasm.U64[idx];
                let hi = this.wasm.U64[idx + 1];
                row[i] = (hi << 64n) | lo;
            }
            values[i] = row;
        }
        return values;
    }
    load(values) {
        let idx = this.base >>> 3;
        for (let i = 0; i < this.rowCount; i++) {
            let row = values[i];
            for (let j = 0; j < this.colCount; j++, idx += 2) {
                let value = row[j];
                this.wasm.U64[idx] = value & MASK_64B;
                this.wasm.U64[idx + 1] = value >> 64n;
            }
        }
    }
}
exports.WasmMatrix128 = WasmMatrix128;
//# sourceMappingURL=WasmMatrix128.js.map