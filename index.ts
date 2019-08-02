// IMPORTS
// ================================================================================================
import { WasmOptions, FiniteField } from '@guildofweavers/galois';
import { PrimeField } from './lib/PrimeField';
import { WasmPrimeField128 } from './lib/optimizations';

// CONSTANTS
// ================================================================================================
const P128 = 2n**128n;
const P64 = 2n**64n;

// PUBLIC FUNCTIONS
// ================================================================================================
export function createPrimeField(modulus: bigint, wasmOptions?: WasmOptions | null): FiniteField {
    if (wasmOptions === null) {
        return new PrimeField(modulus);
    }

    if (modulus < P128 && modulus > (P128 - P64)) {
        return new WasmPrimeField128(modulus, wasmOptions);
    }
    else {
        return new PrimeField(modulus);
    }
}