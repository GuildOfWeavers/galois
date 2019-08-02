// IMPORTS
// ================================================================================================
import { PrimeField } from './lib/PrimeField';

// PUBLIC FUNCTIONS
// ================================================================================================
function createPrimeField(modulus: bigint) {
    return new PrimeField(modulus);
}