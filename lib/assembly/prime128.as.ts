//// <reference no-default-lib="true"/>
/// <reference path="../../node_modules/assemblyscript/std/assembly/index.d.ts" />

// MODULE VARIABLES
// ================================================================================================
const VALUE_SIZE = 16;
const HALF_OFFSET = VALUE_SIZE / 2;
const U64_MAX = 0xFFFFFFFFFFFFFFFF;
const MASK32 = 0xFFFFFFFF;

let __resLo: u64;
let __resHi: u64;
let __resEx: u64;

// MODULUS
// ================================================================================================
let mHi: u64;
let mLo: u64;

export function setModulus(mHi1: u32, mHi2: u32, mLo1: u32, mLo2: u32): void {
    mHi = ((<u64>mHi1) << 32) | (<u64>mHi2);
    mLo = ((<u64>mLo1) << 32) | (<u64>mLo2);
}

// VECTOR FUNCTIONS
// ================================================================================================
export function newVector(length: u32): ArrayBuffer {
    return new ArrayBuffer(length * VALUE_SIZE);
}

export function addVectorElements(a: ArrayBuffer, b: ArrayBuffer): ArrayBuffer {
    let result = new ArrayBuffer(a.byteLength);

    let aRef = changetype<usize>(a);
    let bRef = changetype<usize>(b);
    let rRef = changetype<usize>(result);

    for (let i = 0; i < a.byteLength; i += VALUE_SIZE) {
        let aHi = load<u64>(aRef + i);
        let aLo = load<u64>(aRef + i + HALF_OFFSET);

        let bHi = load<u64>(bRef + i);
        let bLo = load<u64>(bRef + i + HALF_OFFSET);

        modAdd(aHi, aLo, bHi, bLo, rRef + i);
    }

    return result;
}

export function subVectorElements(a: ArrayBuffer, b: ArrayBuffer): ArrayBuffer {
    let result = new ArrayBuffer(a.byteLength);

    let aRef = changetype<usize>(a);
    let bRef = changetype<usize>(b);
    let rRef = changetype<usize>(result);

    for (let i = 0; i < a.byteLength; i += VALUE_SIZE) {
        let aHi = load<u64>(aRef + i);
        let aLo = load<u64>(aRef + i + HALF_OFFSET);

        let bHi = load<u64>(bRef + i);
        let bLo = load<u64>(bRef + i + HALF_OFFSET);

        modSub(aHi, aLo, bHi, bLo, rRef + i);
    }

    return result;
}

export function mulVectorElements(a: ArrayBuffer, b: ArrayBuffer): ArrayBuffer {
    let result = new ArrayBuffer(a.byteLength);

    let aRef = changetype<usize>(a);
    let bRef = changetype<usize>(b);
    let rRef = changetype<usize>(result);

    for (let i = 0; i < a.byteLength; i += VALUE_SIZE) {
        let aHi = load<u64>(aRef + i);
        let aLo = load<u64>(aRef + i + HALF_OFFSET);

        let bHi = load<u64>(bRef + i);
        let bLo = load<u64>(bRef + i + HALF_OFFSET);

        modMul(aHi, aLo, bHi, bLo, rRef + i);
    }

    return result;
}

export function divVectorElements(a: ArrayBuffer, b: ArrayBuffer): ArrayBuffer {
    let result = invVectorElements(b);

    let aRef = changetype<usize>(a);
    let rRef = changetype<usize>(result);

    for (let i = 0; i < a.byteLength; i += VALUE_SIZE) {
        let aHi = load<u64>(aRef + i);
        let aLo = load<u64>(aRef + i + HALF_OFFSET);

        let bHi = load<u64>(rRef + i);
        let bLo = load<u64>(rRef + i + HALF_OFFSET);

        modMul(aHi, aLo, bHi, bLo, rRef + i);
    }

    return result;
}

export function expVectorElements(a: ArrayBuffer, b: ArrayBuffer): ArrayBuffer {
    let result = new ArrayBuffer(a.byteLength);

    let aRef = changetype<usize>(a);
    let bRef = changetype<usize>(b);
    let rRef = changetype<usize>(result);

    for (let i = 0; i < a.byteLength; i += VALUE_SIZE) {
        let aHi = load<u64>(aRef + i);
        let aLo = load<u64>(aRef + i + HALF_OFFSET);

        let bHi = load<u64>(bRef + i);
        let bLo = load<u64>(bRef + i + HALF_OFFSET);

        modExp(aHi, aLo, bHi, bLo, rRef + i);
    }

    return result;
}

export function invVectorElements(source: ArrayBuffer): ArrayBuffer {
    let result = new ArrayBuffer(source.byteLength);

    let sRef = changetype<usize>(source);
    let rRef = changetype<usize>(result);

    let sHi: u64, sLo: u64, rHi: u64, rLo: u64;

    let lastHi: u64 = 0;
    let lastLo: u64 = 1;
    for (let i = 0; i < source.byteLength; i += VALUE_SIZE) {
        // result[i] = last;
        store<u64>(rRef + i, lastHi);
        store<u64>(rRef + i + HALF_OFFSET, lastLo);

        // last = last * (source[i] || 1)
        sHi = load<u64>(sRef + i);
        sLo = load<u64>(sRef + i + HALF_OFFSET);

        if (sHi == 0 && sLo == 0) sLo++;

        modMul(sHi, sLo, lastHi, lastLo, 0);
        lastLo = __resLo; lastHi = __resHi;
    }

    modInv(lastHi, lastLo, 0);
    let invHi = __resHi, invLo = __resLo;

    for (let i = source.byteLength - VALUE_SIZE; i >= 0; i -= VALUE_SIZE) {
        sHi = load<u64>(sRef + i);
        sLo = load<u64>(sRef + i + HALF_OFFSET);

        // result[i] = source[i] ? mul(result[i], inv) : 0n;
        if (sHi == 0 && sLo == 0) {
            rHi = 0; rLo = 0;
            sHi = 1; sLo = 1;
        }
        else {
            rHi = load<u64>(rRef + i);
            rLo = load<u64>(rRef + i + HALF_OFFSET);
            modMul(rHi, rLo, invHi, invLo, 0);
            rHi = __resHi; rLo = __resLo;
        }
        store<u64>(rRef + i, rHi);
        store<u64>(rRef + i + HALF_OFFSET, rLo);

        // inv = mul(inv, source[i] || 1n);
        modMul(invHi, invLo, sHi, sLo, 0);
        invHi = __resHi; invLo = __resLo;
    }

    return result;
}

// MODULAR ARITHMETIC FUNCTIONS
// ================================================================================================
/**
 * Performs modular addition of a and b using the algorithm:
 *  if (a = b)
 *      return a
 *  else
 *      b = m - b
 *      if (a < b)
 *          return m - b + a
 *      else
 *          return a - b
 */
function modAdd(aHi: u64, aLo: u64, bHi: u64, bLo: u64, rRef: usize): void {
    let rHi: u64;
    let rLo: u64;

    if (bHi == 0 && bLo == 0) {
        rLo = aLo;
        rHi = aHi;
    }
    else {
        bLo = mLo - bLo;
        bHi = mHi - bHi;
        if (bLo > mLo) bHi--;

        if (lt(aHi, aLo, bHi, bLo)) {
            rLo = mLo - bLo;
            rHi = mHi - bHi;
            if (rLo > mLo) rHi--;
    
            rLo = rLo + aLo;
            rHi = rHi + aHi;
            if (rLo < aLo) rHi++;
        }
        else {
            rLo = aLo - bLo;
            rHi = aHi - bHi;
            if (rLo > aLo) rHi--;
        }
    }
  
    store<u64>(rRef, rHi);
    store<u64>(rRef + HALF_OFFSET, rLo);
}

/**
 * Performs modular subtraction of b from a using the algorithm:
 *  if (a < b)
 *      return m - a + b
 *  else
 *      return a - b
 */
function modSub(aHi: u64, aLo: u64, bHi: u64, bLo: u64, rRef: usize): void {

    let rHi: u64;
    let rLo: u64;

    if (lt(aHi, aLo, bHi, bLo)) {
        rLo = mLo - bLo;
        rHi = mHi - bHi;
        if (rLo > mLo) rHi--;

        rLo = rLo + aLo;
        rHi = rHi + aHi;
        if (rLo < aLo) rHi++;
    }
    else {
        rLo = aLo - bLo;
        rHi = aHi - bHi;
        if (rLo > aLo) rHi--;
    }

    store<u64>(rRef, rHi);
    store<u64>(rRef + HALF_OFFSET, rLo);
}

/**
 * Performs modular multiplication of a and b using an unrolled version of the algorithm:
 *  n = 128, w = 64, nw = n / w
 *  z = 0
 *  for (i = nw - 1 to 0)
 *      z = (z << w) + a * bi
 *      q = z >> n
 *      z = z - q * m
 *  if z > m
 *      z = z - m
 */
function modMul(aHi: u64, aLo: u64, bHi: u64, bLo: u64, rRef: usize): void {

    // iteration 1
    mul128x64(aHi, aLo, bHi);                           // ab = a * b1
    let z0 = __resLo, z1 = __resHi, z2 = __resEx;       // z = ab
    let q0 = __resEx;                                   // q = z >> n

    mul128x64(mHi, mLo, q0);                            // qm = q * m
    let qm0 = __resLo, qm1 = __resHi, qm2 = __resEx;

    sub192x192(z2, z1, z0, qm2, qm1, qm0);              // z = z - qm
    z0 = __resLo; z1 = __resHi, z2 = __resEx;

    // iteration 2
    assert(z2 == 0, 'z2 must be 0');
    let z3: u32 = 0;                                    // potential overflow bit
    z2 = z1, z1 = z0; z0 = 0;                           // z << w
    mul128x64(aHi, aLo, bLo);                           // ab = a * b0
    z0 = __resLo; z1 = z1 + __resHi, z2 = z2 + __resEx; // z = z + ab
    if (z1 < __resHi) {
        if (z2 < __resEx) {
            z2++;
            z3 = 1;
        }
        else {
            z2++;
            if (z2 == 0) z3 = 1;
        }
    }
    else {
        if (z2 < __resEx) z3 = 1;
    }

    q0 = z2;                                            // q = z >> n

    if (z3 == 1) {
        let t1 = z1;                                    // z = z - (m << w)
        z1 = t1 - mLo; z2 = z2 - mHi;
        if (z1 > t1) z2--;
    }

    mul128x64(mHi, mLo, q0);                            // qm = q * m
    qm0 = __resLo; qm1 = __resHi; qm2 = __resEx;
    
    sub192x192(z2, z1, z0, qm2, qm1, qm0);              // z = z - qm
    z0 = __resLo; z1 = __resHi, z2 = __resEx;

    if (z2 > 0 || lt(mHi, mLo, z1, z0)) {               // if m < z
        let t0 = z0;                                    // z = z - m
        z0 = t0 - mLo; z1 = z1 - mHi;
        if (z0 > t0) z1--;
    }

    if (rRef == 0) {
        __resHi = z1;
        __resLo = z0;
    }
    else {
        store<u64>(rRef, z1);
        store<u64>(rRef + HALF_OFFSET, z0);
    }
}

function modExp(baseHi: u64, baseLo: u64, expHi: u64, expLo: u64, rRef: usize): void {

    let rHi: u64, rLo: u64;

    if (baseHi == 0 && baseLo == 0) {
        rHi = 0; rLo = 0;
    }
    else {
        rHi = 0; rLo = 1;
        while (expHi > 0 || expLo > 0) {
            if ((expLo & 1) == 1) {
                // r = (r * base) % m
                modMul(rHi, rLo, baseHi, baseLo, 0);
                rHi = __resHi; rLo = __resLo;
            }
    
            // exp = exp / 2
            expLo = (expLo >> 1) | ((expHi & 1) << 63);
            expHi = (expHi >> 1);
    
            // base = (base^2) % m
            modMul(baseHi, baseLo, baseHi, baseLo, 0);
            baseHi = __resHi; baseLo = __resLo;
        }
    }

    store<u64>(rRef, rHi);
    store<u64>(rRef + HALF_OFFSET, rLo);
}

/** 
 * Computes modular inverse of x using extended binary GCD algorith:
 *  if (x is odd) then u = x, else u = x + m
 *  v = y, a = 0, d = y - 1
 *  while (v != 1)
 *      while (v < u)
 *          u = u - v
 *          d = d + a
 *          while (u is even)
 *              if (d is odd) then d = d + y
 *              u = u / 2
 *              d = d / 2
 *      v = v - u
 *      a = a + d
 *      while (v is even)
 *          if (a is odd) then a = a + y
 *          v = v / 2
 *          a = a / 2
 *  return a mod y
 */
function modInv(xHi: u64, xLo: u64, rRef: usize): void {
    // a = 0
    let aEx: u64 = 0, aHi: u64 = 0, aLo: u64 = 0;

    if (xHi != 0 || xLo != 0) {
        let uEx: u64 = 0, uHi: u64, uLo: u64;
        if ((xLo & 1) == 1) {
            // u = x
            uHi = xHi; uLo = xLo;
        }
        else {
            // u = x + m
            add192x192(0, xHi, xLo, 0, mHi, mLo);
            uLo = __resLo; uHi = __resHi; uEx = __resEx;
        }

        // v = m
        let vHi = mHi, vLo = mLo;
        // d = m - 1
        let dEx: u64 = 0, dHi = mHi, dLo = mLo - 1;
        if (dLo > mLo) dHi--;

        while (!eq(vHi, vLo, 0, 1)) {   // v != 1
            while (uEx > 0 || lt(vHi, vLo, uHi, uLo)) { // v < u
                // u = u - v;
                sub192x192(uEx, uHi, uLo, 0, vHi, vLo);
                uLo = __resLo; uHi = __resHi; uEx = __resEx;

                // d = d + a;
                add192x192(dEx, dHi, dLo, aEx, aHi, aLo);
                dLo = __resLo; dHi = __resHi; dEx = __resEx;

                while ((uLo & 1) == 0) {
                    if ((dLo & 1) == 1) {
                        // d = d + m;
                        add192x192(dEx, dHi, dLo, 0, mHi, mLo);
                        dLo = __resLo; dHi = __resHi; dEx = __resEx;
                    }
                    // u = u >> 1;
                    uLo = (uLo >> 1) | ((uHi & 1) << 63);
                    uHi = (uHi >> 1) | (((<u64>uEx) & 1) << 63);
                    uEx = (uEx >> 1);

                    // d = d >> 1;
                    dLo = (dLo >> 1) | ((dHi & 1) << 63);
                    dHi = (dHi >> 1) | (((<u64>dEx) & 1) << 63);
                    dEx = (dEx >> 1);
                }
            }

            // v = v - u;
            let vLoTemp = vLo;
            vLo = vLo - uLo; vHi = vHi - uHi;
            if (vLo > vLoTemp) vHi--;

            //a = a + d;
            add192x192(aEx, aHi, aLo, dEx, dHi, dLo);
            aLo = __resLo; aHi = __resHi; aEx = __resEx;

            while ((vLo & 1) == 0) {
                if ((aLo & 1) == 1) {
                    // a = a + m;
                    add192x192(aEx, aHi, aLo, 0, mHi, mLo);
                    aLo = __resLo; aHi = __resHi; aEx = __resEx;
                }

                // v = v >> 1;
                vLo = (vLo >> 1) | ((vHi & 1) << 63);
                vHi = (vHi >> 1);

                // a = a >> 1;
                aLo = (aLo >> 1) | ((aHi & 1) << 63);
                aHi = (aHi >> 1) | (((<u64>aEx) & 1) << 63);
                aEx = (aEx >> 1);
            }
        }

        // r = a mod m;
        while (aEx > 0 || lt(mHi, mLo, aHi, aLo)) {
            // a = a - m
            sub192x192(aEx, aHi, aLo, 0, mHi, mLo);
            aLo = __resLo; aHi = __resHi; aEx = __resEx;
        }
    }

    // either return the result or store it at the specified location
    if (rRef == 0) {
        __resHi = aHi;
        __resLo = aLo;
    }
    else {
        store<u64>(rRef, aHi);
        store<u64>(rRef + HALF_OFFSET, aLo);
    }
}

// REGULAR ARITHMETIC FUNCTIONS
// ================================================================================================
// @ts-ignore
@inline
function add192x192(a2: u64, a1: u64, a0: u64, b2: u64, b1: u64, b0: u64): void {
    __resLo = a0 + b0;
    __resHi = a1 + b1;
    __resEx = a2 + b2;

    if (__resLo < a0) {
        if (__resHi < a1) {
            __resEx++;
            __resHi++;
        }
        else {
            __resHi++;
            if (__resHi == 0) __resEx++;
        }
    }
    else {
        if (__resHi < a1) __resEx++;
    }
}

// @ts-ignore
@inline
function sub192x192(a2: u64, a1: u64, a0: u64, b2: u64, b1: u64, b0: u64): void {
    __resLo = a0 - b0;
    __resHi = a1 - b1;
    __resEx = a2 - b2;

    if (__resLo > a0) {
        if (__resHi > a1) {
            __resEx--;
            __resHi--;
        }
        else {
            __resHi--;
            if (__resHi == U64_MAX) __resEx--;
        }
    }
    else {
        if (__resHi > a1) __resEx--;
    }
}

// @ts-ignore
@inline
function mul128x64(aHi: u64, aLo: u64, b: u64): void {

    // parse inputs
    let a0 = aLo & MASK32;
    let a1 = aLo >> 32;
    let a2 = aHi & MASK32;
    let a3 = aHi >> 32;

    let b0 = b & MASK32;
    let b1 = b >> 32;

    // build the first word
    let t = a0 * b0;
    let r0 = t & MASK32;
    let carry = t >> 32;

    t = a1 * b0 + carry;
    carry = t >> 32;
    t = a0 * b1 + (t & MASK32);

    r0 = r0 + (t << 32);
    carry = carry + (t >> 32);

    // build the second words
    t = a1 * b1 + carry;
    let r1 = t & MASK32;
    carry = t >> 32;

    t = r1 + a2 * b0;
    r1 = t & MASK32;
    carry = carry + (t >> 32);

    t = a3 * b0 + carry;
    carry = t >> 32;
    t = a2 * b1 + (t & MASK32);

    r1 = r1 + (t << 32);
    carry = carry + (t >> 32);

    // build the third word
    let r2 = a3 * b1 + carry;

    __resLo = r0;
    __resHi = r1;
    __resEx = r2;
}

// COMPARISON FUNCTIONS
// ================================================================================================
// @ts-ignore
@inline
function eq(aHi: u64, aLo: u64, bHi: u64, bLo: u64): boolean {
    return aHi == bHi && aLo == bLo;
}

// @ts-ignore
@inline
function lt(aHi: u64, aLo: u64, bHi: u64, bLo: u64): boolean {
    return aHi == bHi ? aLo < bLo : aHi < bHi;
}

// @ts-ignore
@inline
function lte(aHi: u64, aLo: u64, bHi: u64, bLo: u64): boolean {
    return !gt(aHi, aLo, bHi, bLo);
}

// @ts-ignore
@inline
function gt(aHi: u64, aLo: u64, bHi: u64, bLo: u64): boolean {
    return aHi == bHi ? aLo > bLo : aHi > bHi;
}

// @ts-ignore
@inline
function gte(aHi: u64, aLo: u64, bHi: u64, bLo: u64): boolean {
    return !lt(aHi, aLo, bHi, bLo);
}