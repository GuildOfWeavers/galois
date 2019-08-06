"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PrimeField_1 = require("./lib/PrimeField");
const subfields_1 = require("./lib/subfields");
// CONSTANTS
// ================================================================================================
const P128 = 2n ** 128n;
const P64 = 2n ** 64n;
// PUBLIC FUNCTIONS
// ================================================================================================
function createPrimeField(modulus, wasmOptions) {
    if (wasmOptions === null) {
        return new PrimeField_1.PrimeField(modulus);
    }
    if (modulus < P128 && modulus > (P128 - P64)) {
        return new subfields_1.WasmPrimeField128(modulus, wasmOptions);
    }
    else {
        if (wasmOptions !== undefined) {
            throw new Error(`WASM optimization is not available for fields with modulus ${modulus}`);
        }
        return new PrimeField_1.PrimeField(modulus);
    }
}
exports.createPrimeField = createPrimeField;
//# sourceMappingURL=index.js.map