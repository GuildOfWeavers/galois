"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTS
// ================================================================================================
const fs = require("fs");
const loader = require("assemblyscript/lib/loader");
// CONSTANTS
// ================================================================================================
const PRIME128_WASM = `${__dirname}/prime128.wasm`;
// PUBLIC MODULE
// ================================================================================================
function instantiatePrime128(options) {
    let initialMemPages = 10;
    if (options) {
        initialMemPages = Math.ceil(options.initialMemory / 1024 / 64);
    }
    const wasm = loader.instantiateBuffer(fs.readFileSync(PRIME128_WASM), {
        env: {
            memory: new WebAssembly.Memory({ initial: initialMemPages })
        }
    });
    return wasm;
}
exports.instantiatePrime128 = instantiatePrime128;
//# sourceMappingURL=index.js.map