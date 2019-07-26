// IMPORTS
// ================================================================================================
import * as fs from 'fs';
import * as loader from 'assemblyscript/lib/loader';

// CONSTANTS
// ================================================================================================
const VALUE_BITS = 128;
const VALUE_SIZE = VALUE_BITS / 8;
const MAX_VALUE = 2n**BigInt(VALUE_BITS) - 1n;

// WASM MODULE
// ================================================================================================
interface Wasm {
    setModulus(mHi1: number, mHi2: number, mLo1: number, mLo2: number): void;

    newVector(length: number): number;
    addVectorElements(v1Ref: number, v2Ref: number): number;
    subVectorElements(v1Ref: number, v2Ref: number): number;
    mulVectorElements(v1Ref: number, v2Ref: number): number;
    divVectorElements(v1Ref: number, v2Ref: number): number;
    expVectorElements(v1Ref: number, v2Ref: number): number;
    invVectorElements(sourceRef: number): number;
}

// PUBLIC MODULE
// ================================================================================================
export function instantiate(modulus: bigint): Wasm128 {
    const wasm = loader.instantiateBuffer<Wasm>(fs.readFileSync(`${__dirname}/prime128.wasm`));
    return new Wasm128(wasm, modulus);
}

export class Wasm128 {

    readonly modulus    : bigint;
    readonly wasm       : Wasm & loader.ASUtil;

    // CONSTRUCTOR
    // ----------------------------------------------------------------------------------------
    constructor(wasm: Wasm & loader.ASUtil, modulus: bigint) {
        this.wasm = wasm;
        this.modulus = modulus;

        // set modulus in WASM module
        const mLo2 = Number.parseInt((modulus & 0xFFFFFFFFn) as any);
        const mLo1 = Number.parseInt(((modulus >> 32n) & 0xFFFFFFFFn) as any);
        const mHi2 = Number.parseInt(((modulus >> 64n) & 0xFFFFFFFFn) as any);
        const mHi1 = Number.parseInt(((modulus >> 96n) & 0xFFFFFFFFn) as any);
        this.wasm.setModulus(mHi1, mHi2, mLo1, mLo2);
    }

    // VECTOR OPERATIONS
    // ----------------------------------------------------------------------------------------
    newVector(length: number): WasmVector {
        const base = this.wasm.newVector(length);
        return new WasmVector(this.wasm, base, length);
    }

    destroyVector(v: WasmVector): void {
        throw new Error('Not implemented');
    }

    addVectorElements(a: WasmVector, b: WasmVector): WasmVector {
        if (a.length !== b.length) {
            throw new Array('Cannot add vector elements: vectors have different lengths');
        }
        const base = this.wasm.addVectorElements(a.base, b.base);
        return new WasmVector(this.wasm, base, a.length);
    }

    subVectorElements(a: WasmVector, b: WasmVector): WasmVector {
        if (a.length !== b.length) {
            throw new Array('Cannot subtract vector elements: vectors have different lengths');
        }
        const base = this.wasm.subVectorElements(a.base, b.base);
        return new WasmVector(this.wasm, base, a.length);
    }

    mulVectorElements(a: WasmVector, b: WasmVector): WasmVector {
        if (a.length !== b.length) {
            throw new Array('Cannot multiply vector elements: vectors have different lengths');
        }
        const base = this.wasm.mulVectorElements(a.base, b.base);
        return new WasmVector(this.wasm, base, a.length);
    }

    divVectorElements(a: WasmVector, b: WasmVector): WasmVector {
        if (a.length !== b.length) {
            throw new Array('Cannot divide vector elements: vectors have different lengths');
        }
        const base = this.wasm.divVectorElements(a.base, b.base);
        return new WasmVector(this.wasm, base, a.length);
    }

    expVectorElements(a: WasmVector, b: WasmVector): WasmVector {
        if (a.length !== b.length) {
            throw new Array('Cannot exponentiate vector elements: vectors have different lengths');
        }
        const base = this.wasm.expVectorElements(a.base, b.base);
        return new WasmVector(this.wasm, base, a.length);
    }

    invVectorElements(v: WasmVector): WasmVector {
        const base = this.wasm.invVectorElements(v.base);
        return new WasmVector(this.wasm, base, v.length);
    }

    combineVectors(a: WasmVector, b: WasmVector): bigint {
        throw new Error('Not implemented');
    }
}

// VECTOR CLASS
// ================================================================================================
export class WasmVector {

    readonly wasm           : Wasm & loader.ASUtil;
    readonly base           : number;

    readonly length         : number;
    readonly byteLength     : number;

    constructor(wasm: Wasm & loader.ASUtil, base: number, length: number) {
        this.wasm = wasm;
        this.base = base;
        this.length = length;
        this.byteLength = length * VALUE_SIZE;
    }

    getValue(index: number): bigint {
        const idx = (this.base + index * VALUE_SIZE) >>> 3;
        const hi = this.wasm.U64[idx];
        const lo = this.wasm.U64[idx + 1];
        return (hi << 64n) | lo;
    }

    setValue(index: number, value: bigint): void {
        if (value > MAX_VALUE) {
            throw new TypeError(`Value cannot be greater than ${MAX_VALUE}`);
        }
        const idx = (this.base + index * VALUE_SIZE) >>> 3;
        this.wasm.U64[idx] = value >> 64n;
        this.wasm.U64[idx + 1] = value & 0xFFFFFFFFFFFFFFFFn;
    }
}