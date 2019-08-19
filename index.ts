// IMPORTS
// ================================================================================================
import { WasmOptions, FiniteField } from '@guildofweavers/galois';
import { PrimeField } from './lib/PrimeField';
import { WasmPrimeField128 } from './lib/subfields';

// CONSTANTS
// ================================================================================================
const P128 = 2n**128n;
const P64 = 2n**64n;

// PUBLIC FUNCTIONS
// ================================================================================================
export function createPrimeField(modulus: bigint, useWasm?: boolean): FiniteField
export function createPrimeField(modulus: bigint, options?: Partial<WasmOptions>): FiniteField
export function createPrimeField(modulus: bigint, useWasmOrOptions?: boolean | Partial<WasmOptions>): FiniteField {
    if (!useWasmOrOptions) {
        return new PrimeField(modulus);
    }

    const Subfield = getPrimeSubfieldConstructor(modulus);
    if (!Subfield) {
        return new PrimeField(modulus);
    }

    const wasmOptions = normalizeWasmOptions(useWasmOrOptions);
    return new Subfield(modulus, wasmOptions);
}

// HELPER FUNCTIONS
// ================================================================================================
function getPrimeSubfieldConstructor(modulus: bigint) {
    if (modulus < P128 && modulus > (P128 - P64)) {
        return WasmPrimeField128;
    }
}

function normalizeWasmOptions(useWasmOrOptions: boolean | Partial<WasmOptions>): WasmOptions {
    if (typeof useWasmOrOptions === 'boolean') {
        return { memory: new WebAssembly.Memory({ initial: 10 }) };
    }

    const memory = useWasmOrOptions.memory || new WebAssembly.Memory({ initial: 10 });
    return { memory };
}