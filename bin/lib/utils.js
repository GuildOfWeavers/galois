"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// IMPORTS
// ================================================================================================
const crypto = require("crypto");
// PUBLIC FUNCTIONS
// ================================================================================================
function isPowerOf2(value) {
    if (typeof value === 'bigint') {
        return (value !== 0n) && (value & (value - 1n)) === 0n;
    }
    else {
        return (value !== 0) && (value & (value - 1)) === 0;
    }
}
exports.isPowerOf2 = isPowerOf2;
function sha256(value) {
    const buffer = (typeof value === 'bigint')
        ? Buffer.from(value.toString(16), 'hex')
        : value;
    const hash = crypto.createHash('sha256').update(buffer);
    return BigInt('0x' + hash.digest().toString('hex'));
}
exports.sha256 = sha256;
//# sourceMappingURL=utils.js.map