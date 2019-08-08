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

    constructor(wasm: WasmPrime128, length: number, base?: number) {
        this.wasm = wasm;
        this.base = base === undefined ? this.wasm.newArray(length) : base;
        this.length = length;
        this.byteLength = length * VALUE_SIZE;
    }

    get elementSize(): number {
        return VALUE_SIZE;
    }

    getValue(index: number): bigint {
        const idx = (this.base + index * VALUE_SIZE) >>> 3;
        // reads a 128-bit value from WebAssembly memory (little-endian layout)
        const lo = this.wasm.U64[idx];
        const hi = this.wasm.U64[idx + 1];
        return (hi << 64n) | lo;
    }

    setValue(index: number, value: bigint): void {
        if (value > MAX_VALUE) {
            throw new TypeError(`Value cannot be greater than ${MAX_VALUE}`);
        }
        // writes a 128-bit value to WebAssembly memory (little-endian layout)
        const idx = (this.base + index * VALUE_SIZE) >>> 3;
        this.wasm.U64[idx] = value & MASK_64B;
        this.wasm.U64[idx + 1] = value >> 64n;
    }

    toValues(): bigint[] {
        const values = new Array<bigint>(this.length);
        let idx = this.base >>> 3;
        for (let i = 0; i < this.length; i++, idx += 2) {
            let lo = this.wasm.U64[idx];
            let hi = this.wasm.U64[idx + 1];
            values[i] = (hi << 64n) | lo;
        }
        return values;
    }

    copyValue(index: number, destination: Buffer, offset: number): number {
        const idx = (this.base + index * VALUE_SIZE);
        destination.set(this.wasm.U8.slice(idx, idx + VALUE_SIZE), offset);
        return VALUE_SIZE;
    }

    load(values: bigint[]): void {
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