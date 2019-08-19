"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PrimeField_1 = require("./lib/PrimeField");
const subfields_1 = require("./lib/subfields");
// CONSTANTS
// ================================================================================================
const P128 = 2n ** 128n;
const P64 = 2n ** 64n;
function createPrimeField(modulus, useWasmOrOptions) {
    if (!useWasmOrOptions) {
        return new PrimeField_1.PrimeField(modulus);
    }
    const Subfield = getPrimeSubfieldConstructor(modulus);
    if (!Subfield) {
        return new PrimeField_1.PrimeField(modulus);
    }
    const wasmOptions = normalizeWasmOptions(useWasmOrOptions);
    return new Subfield(modulus, wasmOptions);
}
exports.createPrimeField = createPrimeField;
// HELPER FUNCTIONS
// ================================================================================================
function getPrimeSubfieldConstructor(modulus) {
    if (modulus < P128 && modulus > (P128 - P64)) {
        return subfields_1.WasmPrimeField128;
    }
}
function normalizeWasmOptions(useWasmOrOptions) {
    if (typeof useWasmOrOptions === 'boolean') {
        return { memory: new WebAssembly.Memory({ initial: 10 }) };
    }
    const memory = useWasmOrOptions.memory || new WebAssembly.Memory({ initial: 10 });
    return { memory };
}
//# sourceMappingURL=index.js.map