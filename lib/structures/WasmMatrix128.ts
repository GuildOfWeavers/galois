// IMPORTS
// ================================================================================================
import { Matrix } from "@guildofweavers/galois";
import { WasmPrime128 } from "../assembly";

// CONSTANTS
// ================================================================================================
const VALUE_BITS = 128;
const VALUE_SIZE = VALUE_BITS / 8;
const MAX_VALUE = 2n**BigInt(VALUE_BITS) - 1n;
const MASK_64B = 0xFFFFFFFFFFFFFFFFn;

// CLASS DEFINITION
// ================================================================================================
export class WasmMatrix128 implements Matrix {

    readonly wasm           : WasmPrime128;
    readonly base           : number;

    readonly rowCount       : number;
    readonly colCount       : number;
    readonly elementCount   : number;
    readonly byteLength     : number;
    readonly rowSize        : number;

    constructor(wasm: WasmPrime128, rows: number, columns: number, base?: number) {
        this.wasm = wasm;
        this.elementCount = rows * columns;
        this.base = base === undefined ? this.wasm.newArray(this.elementCount) : base;
        this.rowCount = rows;
        this.colCount = columns;
        this.rowSize = columns * VALUE_SIZE;
        this.byteLength = rows * this.rowSize;
    }

    get elementSize(): number {
        return VALUE_SIZE;
    }

    getValue(row: number, column: number): bigint {
        const idx = (this.base + row * this.rowSize + column * VALUE_SIZE) >>> 3;
        // reads a 128-bit value from WebAssembly memory (little-endian layout)
        const lo = this.wasm.U64[idx];
        const hi = this.wasm.U64[idx + 1];
        return (hi << 64n) | lo;
    }

    setValue(row: number, column: number, value: bigint): void {
        if (value > MAX_VALUE) {
            throw new TypeError(`Value cannot be greater than ${MAX_VALUE}`);
        }
        // writes a 128-bit value to WebAssembly memory (little-endian layout)
        const idx = (this.base + row * this.rowSize + column * VALUE_SIZE) >>> 3;
        this.wasm.U64[idx] = value & MASK_64B
        this.wasm.U64[idx + 1] = value >> 64n;
    }

    toValues(): bigint[][] {
        const values = new Array<bigint[]>(this.rowCount);
        let idx = this.base >>> 3;
        for (let i = 0; i < this.rowCount; i++) {
            let row = new Array<bigint>(this.colCount);
            for (let j = 0; j < this.colCount; j++, idx += 2) {
                let lo = this.wasm.U64[idx];
                let hi = this.wasm.U64[idx + 1];
                row[i] = (hi << 64n) | lo;
            }
            values[i] = row;
        }
        return values;
    }

    load(values: bigint[][]): void {
        let idx = this.base >>> 3;
        for (let i = 0; i < this.rowCount; i++) {
            let row = values[i];
            for (let j = 0; j < this.colCount; j++, idx += 2) {
                let value = row[j];
                this.wasm.U64[idx] = value & MASK_64B
                this.wasm.U64[idx + 1] = value >> 64n;
            }
        }
    }
}