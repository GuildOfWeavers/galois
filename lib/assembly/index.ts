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
    getInputsPtr(): number;
    getOutputsPtr(): number;
    setModulus(mHi1: number, mHi2: number, mLo1: number, mLo2: number): void;

    newVector(length: number): number;
    addVectorElements(aRef: number, bRef: number): number;
    addVectorElements2(aRef: number, bIdx: number): number;
    subVectorElements(aRef: number, bRef: number): number;
    subVectorElements2(aRef: number, bIdx: number): number;
    mulVectorElements(aRef: number, bRef: number): number;
    mulVectorElements2(aRef: number, bIdx: number): number;
    divVectorElements(aRef: number, bRef: number): number;
    divVectorElements2(aRef: number, bIdx: number): number;
    expVectorElements(aRef: number, bRef: number): number;
    expVectorElements2(aRef: number, bIdx: number): number;
    invVectorElements(sourceRef: number): number;
    combineVectors(aRef: number, bRef: number): number;
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
    readonly inputsIdx  : number;
    readonly outputsIdx : number;

    // CONSTRUCTOR
    // ----------------------------------------------------------------------------------------
    constructor(wasm: Wasm & loader.ASUtil, modulus: bigint) {
        this.wasm = wasm;
        this.modulus = modulus;
        this.inputsIdx = (this.wasm.getInputsPtr()) >>> 3;
        this.outputsIdx = (this.wasm.getOutputsPtr()) >>> 3;

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

    addVectorElements(a: WasmVector, b: WasmVector | bigint): WasmVector {
        if (typeof b === 'bigint') {
            this.wasm.U64[this.inputsIdx] = b & 0xFFFFFFFFFFFFFFFFn;
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

    subVectorElements(a: WasmVector, b: WasmVector | bigint): WasmVector {
        if (typeof b === 'bigint') {
            this.wasm.U64[this.inputsIdx] = b & 0xFFFFFFFFFFFFFFFFn;
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

    mulVectorElements(a: WasmVector, b: WasmVector | bigint): WasmVector {
        if (typeof b === 'bigint') {
            this.wasm.U64[this.inputsIdx] = b & 0xFFFFFFFFFFFFFFFFn;
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

    divVectorElements(a: WasmVector, b: WasmVector | bigint): WasmVector {
        if (typeof b === 'bigint') {
            this.wasm.U64[this.inputsIdx] = b & 0xFFFFFFFFFFFFFFFFn;
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

    expVectorElements(a: WasmVector, b: WasmVector | bigint): WasmVector {
        if (typeof b === 'bigint') {
            this.wasm.U64[this.inputsIdx] = b & 0xFFFFFFFFFFFFFFFFn;
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

    invVectorElements(v: WasmVector): WasmVector {
        const base = this.wasm.invVectorElements(v.base);
        return new WasmVector(this.wasm, base, v.length);
    }

    combineVectors(a: WasmVector, b: WasmVector): bigint {
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
    addPolys(a: WasmVector, b: WasmVector): WasmVector {
        throw new Error('Not implemented');
    }

    subPolys(a: WasmVector, b: WasmVector): WasmVector {
        throw new Error('Not implemented');
    }

    mulPolys(a: WasmVector, b: WasmVector): WasmVector {
        throw new Error('Not implemented');
    }

    divPolys(a: WasmVector, b: WasmVector): WasmVector {
        throw new Error('Not implemented');
    }

    mulPolyByConstant(a: WasmVector, b: bigint): WasmVector {
        return this.mulVectorElements(a, b);
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
        this.wasm.U64[idx] = value & 0xFFFFFFFFFFFFFFFFn;
        this.wasm.U64[idx + 1] = value >> 64n;
    }
}