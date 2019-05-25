// IMPORTS
// ================================================================================================
import * as crypto from 'crypto';

// PUBLIC FUNCTIONS
// ================================================================================================
export function isPowerOf2(value: number | bigint): boolean {
    if (typeof value === 'bigint') {
        return (value !== 0n) && (value & (value - 1n)) === 0n;
    }
    else {
        return (value !== 0) && (value & (value - 1)) === 0;
    }
}

export function sha256(value: bigint | Buffer): bigint {
    const buffer = (typeof value === 'bigint')
        ? Buffer.from(value.toString(16), 'hex')
        : value;

    const hash = crypto.createHash('sha256').update(buffer);
    return BigInt('0x' + hash.digest().toString('hex'));
}