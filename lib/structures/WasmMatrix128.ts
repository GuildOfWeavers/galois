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

    private memU8           : Uint8Array;
    private memU64          : BigUint64Array;

    constructor(wasm: WasmPrime128, rows: number, columns: number, base?: number) {
        this.wasm = wasm;
        this.elementCount = rows * columns;
        this.base = base === undefined ? this.wasm.newArray(this.elementCount) : base;
        this.rowCount = rows;
        this.colCount = columns;
        this.rowSize = columns * VALUE_SIZE;
        this.byteLength = rows * this.rowSize;
        this.memU8 = new Uint8Array(wasm.memory.buffer);
        this.memU64 = new BigUint64Array(wasm.memory.buffer);
    }

    get elementSize(): number {
        return VALUE_SIZE;
    }

    getValue(row: number, column: number): bigint {
        if (this.memU64.buffer !== this.wasm.memory.buffer) {
            this.memU64 = new BigUint64Array(this.wasm.memory.buffer);
        }

        const idx = (this.base + row * this.rowSize + column * VALUE_SIZE) >>> 3;
        // reads a 128-bit value from WebAssembly memory (little-endian layout)
        const lo = this.memU64[idx];
        const hi = this.memU64[idx + 1];
        return (hi << 64n) | lo;
    }

    setValue(row: number, column: number, value: bigint): void {
        if (value > MAX_VALUE) {
            throw new TypeError(`Value cannot be greater than ${MAX_VALUE}`);
        }
        
        if (this.memU64.buffer !== this.wasm.memory.buffer) {
            this.memU64 = new BigUint64Array(this.wasm.memory.buffer);
        }

        // writes a 128-bit value to WebAssembly memory (little-endian layout)
        const idx = (this.base + row * this.rowSize + column * VALUE_SIZE) >>> 3;
        this.memU64[idx] = value & MASK_64B;
        this.memU64[idx + 1] = value >> 64n;
    }
    
    copyValue(row: number, column: number, destination: Buffer, offset: number): number {
        if (this.memU8.buffer !== this.wasm.memory.buffer) {
            this.memU8 = new Uint8Array(this.wasm.memory.buffer);
        }
        const idx = (this.base + row * this.rowSize + column * VALUE_SIZE);
        destination.set(this.memU8.subarray(idx, idx + VALUE_SIZE), offset);
        return VALUE_SIZE;
    }

    toValues(): bigint[][] {
        if (this.memU64.buffer !== this.wasm.memory.buffer) {
            this.memU64 = new BigUint64Array(this.wasm.memory.buffer);
        }

        const values = new Array<bigint[]>(this.rowCount);
        let idx = this.base >>> 3;
        for (let i = 0; i < this.rowCount; i++) {
            let row = new Array<bigint>(this.colCount);
            for (let j = 0; j < this.colCount; j++, idx += 2) {
                let lo = this.memU64[idx];
                let hi = this.memU64[idx + 1];
                row[j] = (hi << 64n) | lo;
            }
            values[i] = row;
        }
        return values;
    }

    toBuffer(): Buffer {
        return Buffer.from(this.wasm.memory.buffer, this.base, this.byteLength);
    }

    rowsToBuffers(indexes?: number[]): Buffer[] {
        const result = new Array<Buffer>(indexes ? indexes.length : this.rowCount);
        if (!indexes) {
            for (let i = 0, offset = this.base; i < result.length; i++, offset += this.rowSize) {
                result[i] = Buffer.from(this.wasm.memory.buffer, offset, this.rowSize);
            }
        }
        else {
            for (let i = 0; i < indexes.length; i++) {
                let offset = this.base + indexes[i] * this.rowSize;
                result[i] = Buffer.from(this.wasm.memory.buffer, offset, this.rowSize);
            }
        }
        return result;
    }

    load(values: bigint[][]): void {
        if (this.memU64.buffer !== this.wasm.memory.buffer) {
            this.memU64 = new BigUint64Array(this.wasm.memory.buffer);
        }

        let idx = this.base >>> 3;
        for (let i = 0; i < this.rowCount; i++) {
            let row = values[i];
            for (let j = 0; j < this.colCount; j++, idx += 2) {
                let value = row[j];
                this.memU64[idx] = value & MASK_64B
                this.memU64[idx + 1] = value >> 64n;
            }
        }
    }
}