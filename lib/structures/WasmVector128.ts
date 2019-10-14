// IMPORTS
// ================================================================================================
import { Vector } from "@guildofweavers/galois";
import { WasmPrime128 } from "../assembly";

// CONSTANTS
// ================================================================================================
const VALUE_BITS = 128;
const VALUE_SIZE = VALUE_BITS / 8;
const MAX_VALUE = 2n**BigInt(VALUE_BITS) - 1n;
const MASK_64B = 0xFFFFFFFFFFFFFFFFn;

// CLASS DEFINITION
// ================================================================================================
export class WasmVector128 implements Vector {

    readonly wasm           : WasmPrime128;
    readonly base           : number;

    readonly length         : number;
    readonly byteLength     : number;

    private memU8           : Uint8Array;
    private memU64          : BigUint64Array;

    constructor(wasm: WasmPrime128, length: number, base?: number) {
        this.wasm = wasm;
        this.base = base === undefined ? this.wasm.newArray(length) : base;
        this.length = length;
        this.byteLength = length * VALUE_SIZE;
        this.memU8 = new Uint8Array(wasm.memory.buffer);
        this.memU64 = new BigUint64Array(wasm.memory.buffer);
    }

    get elementSize(): number {
        return VALUE_SIZE;
    }

    getValue(index: number): bigint {
        if (this.memU64.buffer !== this.wasm.memory.buffer) {
            this.memU64 = new BigUint64Array(this.wasm.memory.buffer);
        }
        const idx = (this.base + index * VALUE_SIZE) >>> 3;
        // reads a 128-bit value from WebAssembly memory (little-endian layout)
        const lo = this.memU64[idx];
        const hi = this.memU64[idx + 1];
        return (hi << 64n) | lo;
    }

    setValue(index: number, value: bigint): void {
        if (value > MAX_VALUE) {
            throw new TypeError(`Value cannot be greater than ${MAX_VALUE}`);
        }

        if (this.memU64.buffer !== this.wasm.memory.buffer) {
            this.memU64 = new BigUint64Array(this.wasm.memory.buffer);
        }

        // writes a 128-bit value to WebAssembly memory (little-endian layout)
        const idx = (this.base + index * VALUE_SIZE) >>> 3;
        this.memU64[idx] = value & MASK_64B;
        this.memU64[idx + 1] = value >> 64n;
    }

    copyValue(index: number, destination: Buffer, offset: number): number {
        if (this.memU8.buffer !== this.wasm.memory.buffer) {
            this.memU8 = new Uint8Array(this.wasm.memory.buffer);
        }
        const idx = (this.base + index * VALUE_SIZE);
        destination.set(this.memU8.subarray(idx, idx + VALUE_SIZE), offset);
        return VALUE_SIZE;
    }

    toValues(): bigint[] {
        if (this.memU64.buffer !== this.wasm.memory.buffer) {
            this.memU64 = new BigUint64Array(this.wasm.memory.buffer);
        }

        const values = new Array<bigint>(this.length);
        let idx = this.base >>> 3;
        for (let i = 0; i < this.length; i++, idx += 2) {
            let lo = this.memU64[idx];
            let hi = this.memU64[idx + 1];
            values[i] = (hi << 64n) | lo;
        }
        return values;
    }

    toBuffer(startIdx = 0, elementCount?: number): Buffer {
        const offset = this.base + startIdx * this.elementSize;
        const length = elementCount === undefined 
            ? this.byteLength - startIdx * this.elementSize
            : elementCount * this.elementSize;
        return Buffer.from(this.wasm.memory.buffer, offset, length);
    }

    load(values: bigint[]): void {
        if (values.length !== this.length) {
            throw new Error(`Cannot load values: vector length must match the number of values`);
        }

        if (this.memU64.buffer !== this.wasm.memory.buffer) {
            this.memU64 = new BigUint64Array(this.wasm.memory.buffer);
        }

        let idx = this.base >>> 3;
        for (let i = 0; i < this.length; i++, idx += 2) {
            let value = values[i];
            this.memU64[idx] = value & MASK_64B;
            this.memU64[idx + 1] = value >> 64n;
        }
    }
}