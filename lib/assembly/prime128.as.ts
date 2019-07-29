// <reference no-default-lib="true"/>
/// <reference path="../../node_modules/assemblyscript/std/assembly/index.d.ts" />

// MODULE VARIABLES
// ================================================================================================
const VALUE_SIZE = 16;
const HALF_OFFSET = VALUE_SIZE / 2;
const U64_MAX = 0xFFFFFFFFFFFFFFFF;
const MASK32 = 0xFFFFFFFF;

let _rLo: u64;
let _rHi: u64;
let _rEx: u64;

// MODULUS
// ================================================================================================
let mHi: u64;
let mLo: u64;

export function setModulus(mHi1: u32, mHi2: u32, mLo1: u32, mLo2: u32): void {
    mHi = ((<u64>mHi1) << 32) | (<u64>mHi2);
    mLo = ((<u64>mLo1) << 32) | (<u64>mLo2);
}

// INPUTS / OUTPUTS
// ================================================================================================
let _inputs = new ArrayBuffer(8 * VALUE_SIZE);
let _outputs = new ArrayBuffer(8 * VALUE_SIZE);

export function getInputsPtr(): usize {
    return changetype<usize>(_inputs);
}

export function getOutputsPtr(): usize {
    return changetype<usize>(_outputs);
}

// ARRAY OPERATIONS
// ================================================================================================
type ArithmeticOp = (aHi: u64, aLo: u64, bHi: u64, bLo: u64) => void;

export function newArray(elementCount: u32): ArrayBuffer {
    return new ArrayBuffer(elementCount * VALUE_SIZE);
}

export function addArrayElements(aRef: usize, bRef: usize, elementCount: u32): ArrayBuffer {
    let result = new ArrayBuffer(elementCount * VALUE_SIZE);
    arrayElementOp(aRef, bRef, changetype<usize>(result), elementCount, modAdd);
    return result;
}

export function addArrayElements2(aRef: usize, bIdx: u32, elementCount: u32): ArrayBuffer {
    let result = new ArrayBuffer(elementCount * VALUE_SIZE);
    let bRef = changetype<usize>(_inputs) + bIdx * VALUE_SIZE;
    arrayScalarOp(aRef, bRef, changetype<usize>(result), elementCount, modAdd);
    return result;
}

export function subArrayElements(aRef: usize, bRef: usize, elementCount: u32): ArrayBuffer {
    let result = new ArrayBuffer(elementCount * VALUE_SIZE);
    arrayElementOp(aRef, bRef, changetype<usize>(result), elementCount, modSub);
    return result;
}

export function subArrayElements2(aRef: usize, bIdx: u32, elementCount: u32): ArrayBuffer {
    let result = new ArrayBuffer(elementCount * VALUE_SIZE);
    let bRef = changetype<usize>(_inputs) + bIdx * VALUE_SIZE;
    arrayScalarOp(aRef, bRef, changetype<usize>(result), elementCount, modSub);
    return result;
}

export function mulArrayElements(aRef: usize, bRef: usize, elementCount: u32): ArrayBuffer {
    let result = new ArrayBuffer(elementCount * VALUE_SIZE);
    arrayElementOp(aRef, bRef, changetype<usize>(result), elementCount, modMul);
    return result;
}

export function mulArrayElements2(aRef: usize, bIdx: u32, elementCount: u32): ArrayBuffer {
    let result = new ArrayBuffer(elementCount * VALUE_SIZE);
    let bRef = changetype<usize>(_inputs) + bIdx * VALUE_SIZE;
    arrayScalarOp(aRef, bRef, changetype<usize>(result), elementCount, modMul);
    return result;
}

export function divArrayElements(aRef: usize, bRef: usize, elementCount: u32): ArrayBuffer {
    let result = invArrayElements(bRef, elementCount);
    let rRef = changetype<usize>(result);
    arrayElementOp(aRef, rRef, rRef, elementCount, modMul);
    return result;
}

export function divArrayElements2(aRef: usize, bIdx: u32, elementCount: u32): ArrayBuffer {
    let result = new ArrayBuffer(elementCount * VALUE_SIZE);
    let bRef = changetype<usize>(_inputs) + bIdx * VALUE_SIZE;

    let bLo = load<u64>(bRef);
    let bHi = load<u64>(bRef, HALF_OFFSET);

    modInv(bHi, bLo);
    store<u64>(bRef, _rLo);
    store<u64>(bRef, _rHi, HALF_OFFSET);

    arrayScalarOp(aRef, bRef, changetype<usize>(result), elementCount, modMul);

    return result;
}

export function expArrayElements(aRef: usize, bRef: usize, elementCount: u32): ArrayBuffer {
    let result = new ArrayBuffer(elementCount * VALUE_SIZE);
    arrayElementOp(aRef, bRef, changetype<usize>(result), elementCount, modExp);
    return result;
}

export function expArrayElements2(aRef: usize, bIdx: u32, elementCount: u32): ArrayBuffer {
    let result = new ArrayBuffer(elementCount * VALUE_SIZE);
    let bRef = changetype<usize>(_inputs) + bIdx * VALUE_SIZE;
    arrayScalarOp(aRef, bRef, changetype<usize>(result), elementCount, modExp);
    return result;
}

export function invArrayElements(sRef: usize, elementCount: u32): ArrayBuffer {
    let result = new ArrayBuffer(elementCount * VALUE_SIZE);
    let rRef = changetype<usize>(result);

    let sHi: u64, sLo: u64, rHi: u64, rLo: u64;

    let lastHi: u64 = 0;
    let lastLo: u64 = 1;
    for (let i = 0; i < result.byteLength; i += VALUE_SIZE) {
        // result[i] = last;
        store<u64>(rRef + i, lastLo);
        store<u64>(rRef + i, lastHi, HALF_OFFSET);

        // last = last * (source[i] || 1)
        sLo = load<u64>(sRef + i);
        sHi = load<u64>(sRef + i, HALF_OFFSET);

        if (sHi == 0 && sLo == 0) sLo++;

        modMul(sHi, sLo, lastHi, lastLo);
        lastLo = _rLo; lastHi = _rHi;
    }

    modInv(lastHi, lastLo);
    let invHi = _rHi, invLo = _rLo;

    for (let i = result.byteLength - VALUE_SIZE; i >= 0; i -= VALUE_SIZE) {
        sLo = load<u64>(sRef + i);
        sHi = load<u64>(sRef + i, HALF_OFFSET);

        // result[i] = source[i] ? mul(result[i], inv) : 0n;
        if (sHi == 0 && sLo == 0) {
            rHi = 0; rLo = 0;
            sHi = 1; sLo = 1;
        }
        else {
            rLo = load<u64>(rRef + i);
            rHi = load<u64>(rRef + i, HALF_OFFSET);
            modMul(rHi, rLo, invHi, invLo);
            rHi = _rHi; rLo = _rLo;
        }
        store<u64>(rRef + i, rLo);
        store<u64>(rRef + i, rHi, HALF_OFFSET);

        // inv = mul(inv, source[i] || 1n);
        modMul(invHi, invLo, sHi, sLo);
        invHi = _rHi; invLo = _rLo;
    }

    return result;
}

function arrayElementOp(aRef: usize, bRef: usize, rRef: usize, count: i32, op: ArithmeticOp): void {

    let endRef = aRef + count * this.VALUE_SIZE;
    let aiRef = aRef, biRef = bRef, riRef = rRef;

    while (aiRef < endRef) {
        let aLo = load<u64>(aiRef);
        let aHi = load<u64>(aiRef, HALF_OFFSET);

        let bLo = load<u64>(biRef);
        let bHi = load<u64>(biRef, HALF_OFFSET);

        op(aHi, aLo, bHi, bLo);

        store<u64>(riRef, _rLo);
        store<u64>(riRef, _rHi, HALF_OFFSET);

        aiRef += VALUE_SIZE;
        biRef += VALUE_SIZE;
        riRef += VALUE_SIZE;
    }
}

function arrayScalarOp(aRef: usize, bRef: usize, rRef: usize, count: i32, op: ArithmeticOp): void {

    let bLo = load<u64>(bRef);
    let bHi = load<u64>(bRef, HALF_OFFSET);

    let endRef = aRef + count * this.VALUE_SIZE;
    let aiRef = aRef, riRef = rRef;

    while (aiRef < endRef) {
        let aLo = load<u64>(aiRef);
        let aHi = load<u64>(aiRef, HALF_OFFSET);

        op(aHi, aLo, bHi, bLo);

        store<u64>(riRef, _rLo);
        store<u64>(riRef, _rHi, HALF_OFFSET);

        aiRef += VALUE_SIZE;
        riRef += VALUE_SIZE;
    }
}

// VECTOR FUNCTIONS
// ================================================================================================
export function combineVectors(aRef: usize, bRef: usize, elementCount: i32): u32 {

    let byteLength = elementCount * VALUE_SIZE;
    let rRef = changetype<usize>(_outputs);
    let rLo: u64, rHi: u64 = 0;

    for (let i = 0; i < byteLength; i += VALUE_SIZE) {
        let aLo = load<u64>(aRef + i);
        let aHi = load<u64>(aRef + i, HALF_OFFSET);

        let bLo = load<u64>(bRef + i);
        let bHi = load<u64>(bRef + i, HALF_OFFSET);

        // r = r + a * b
        modMul(aHi, aLo, bHi, bLo);
        modAdd(rHi, rLo, _rHi, _rLo);
        rHi = _rHi; rLo = _rLo;
    }
    
    // save the result into the 0 slot of the output buffer
    store<u64>(rRef, _rLo);
    store<u64>(rRef, _rHi, HALF_OFFSET);

    return 0;
}

// MATRIX FUNCTIONS
// ================================================================================================
export function mulMatrixes(aRef: usize, bRef: usize, n: u32, m: u32, p: u32): ArrayBuffer {
    let result = new ArrayBuffer(n * p * VALUE_SIZE);
    let rRef = changetype<usize>(result);

    let aLo: u64, aHi: u64, bLo: u64, bHi: u64, sHi: u64, sLo: u64;
    let aRowSize = m * VALUE_SIZE;
    let bRowSize = p * VALUE_SIZE;

    for (let i: u32 = 0; i < n; i++) {
        for (let j: u32 = 0; j < p; j++) {
            sLo = 0; sHi = 0;
            for (let k: u32 = 0; k < m; k++) {
                // a = a[i,k]
                let aValueRef = aRef + aRowSize * i + k * VALUE_SIZE;
                aLo = load<u64>(aValueRef);
                aHi = load<u64>(aValueRef, HALF_OFFSET);

                // b = b[k,j]
                let bValueRef = bRef + bRowSize * k + j * VALUE_SIZE;
                bLo = load<u64>(bValueRef);
                bHi = load<u64>(bValueRef, HALF_OFFSET);

                // s = s + a * b
                modMul(aHi, aLo, bHi, bLo);
                modAdd(sHi, sLo, _rHi, _rLo);
                sHi = _rHi; sLo = _rLo;
            }

            let rValueRef = rRef + bRowSize * i + j * VALUE_SIZE;
            store<u64>(rValueRef, sLo);
            store<u64>(rValueRef, sHi, HALF_OFFSET);
        }
    }

    return result;
}

// POWER FUNCTIONS
// ================================================================================================
export function getPowerSeries(length: u32, seedIdx: u32): ArrayBuffer {
    let arraySize = length * VALUE_SIZE;
    let result = new ArrayBuffer(arraySize);
    let rRef = changetype<usize>(result);
    let endRef = rRef + arraySize;

    let sRef = changetype<usize>(_inputs) + seedIdx * VALUE_SIZE;
    let sLo = load<u64>(sRef);
    let sHi = load<u64>(sRef, HALF_OFFSET);

    let pLo: u64 = 1, pHi: u64 = 0;
    store<u64>(rRef, pLo);
    store<u64>(rRef, pHi, HALF_OFFSET);

    for (let riRef: u32 = rRef + VALUE_SIZE; riRef < endRef; riRef += VALUE_SIZE) {
        modMul(pHi, pLo, sHi, sLo);
        pLo = _rLo; pHi = _rHi;

        store<u64>(riRef, pLo);
        store<u64>(riRef, pHi, HALF_OFFSET);
    }

    return result;
}

// POLYNOMIAL FUNCTIONS
// ================================================================================================
export function evalPolyAtRoots(pRef: usize, rRef: usize, polyDegree: u32, rootCount: u32): ArrayBuffer {

    let vRefEnd = pRef + polyDegree * VALUE_SIZE;
    let result = fastFT(pRef, rRef, rootCount, vRefEnd, 0, 0);
    return result;
}

export function interpolateRoots(rRef: usize, vRef: usize, elementCount: u32): ArrayBuffer {

    let resultLength = elementCount * VALUE_SIZE;
    let reversedRoots = new ArrayBuffer(resultLength);
    let rrRef = changetype<usize>(reversedRoots);

    // invert the roots array
    store<u64>(rrRef, 1);
    rrRef += VALUE_SIZE;

    let startRef = rRef;
    rRef += resultLength - VALUE_SIZE;
    while (rRef > startRef) {
        let vLo = load<u64>(rRef);
        let vHi = load<u64>(rRef, HALF_OFFSET);
        store<u64>(rrRef, vLo);
        store<u64>(rrRef, vHi, HALF_OFFSET);

        rRef -= VALUE_SIZE;
        rrRef += VALUE_SIZE;
    }

    let vRefEnd = vRef + resultLength;
    let result = fastFT(vRef, changetype<usize>(reversedRoots), elementCount, vRefEnd, 0, 0);
    let resRef = changetype<usize>(result);

    modSub(mHi, mLo, 0, 2);
    modExp(0, elementCount, _rHi, _rLo);
    let ivLo = _rLo, ivHi = _rHi;

    let endRef = resRef + resultLength;
    while (resRef < endRef) {
        let vLo = load<u64>(resRef);
        let vHi = load<u64>(resRef, HALF_OFFSET);

        modMul(ivHi, ivLo, vHi, vLo);

        store<u64>(resRef, _rLo);
        store<u64>(resRef, _rHi, HALF_OFFSET);

        resRef += VALUE_SIZE;
    }

    return result;
}

// FAST FOURIER TRANSFORM
// ================================================================================================
function fastFT(vRef: usize, rRef: usize, rootCount: u32, vRefEnd: u32, depth: u32, offset: u32): ArrayBuffer {
    let step: u32 = VALUE_SIZE << depth;
    let resultElementCount = rootCount >> depth;

    // if only 4 values left, use simple FT
    if (resultElementCount <= 4) {
        return baseFT(vRef, rRef, vRefEnd, step, offset);
    }
    
    let even = fastFT(vRef, rRef, rootCount, vRefEnd, depth + 1, offset);
    let eRef = changetype<usize>(even);
    let odd  = fastFT(vRef, rRef, rootCount, vRefEnd, depth + 1, offset + step);
    let oRef = changetype<usize>(odd);

    let resultLength = resultElementCount * VALUE_SIZE;
    let result = new ArrayBuffer(resultLength);
    let resRef = changetype<usize>(result);
    
    let halfLength = resultLength >> 1;
    let endRef = resRef + halfLength;
    while (resRef < endRef) {
        let yLo = load<u64>(oRef);
        let yHi = load<u64>(oRef, HALF_OFFSET);

        let rLo = load<u64>(rRef);
        let rHi = load<u64>(rRef, HALF_OFFSET);

        // yr = (y * r) % m
        modMul(yHi, yLo, rHi, rLo);
        let yrLo = _rLo, yrHi = _rHi;

        let xLo = load<u64>(eRef);
        let xHi = load<u64>(eRef, HALF_OFFSET);

        // result[i] = (x + yr) % m
        modAdd(xHi, xLo, yrHi, yrLo);
        store<u64>(resRef, _rLo);
        store<u64>(resRef, _rHi, HALF_OFFSET);

        // result[i + halfLength] = (x - yr) % m
        modSub(xHi, xLo, yrHi, yrLo);
        store<u64>(resRef + halfLength, _rLo);
        store<u64>(resRef + halfLength, _rHi, HALF_OFFSET);

        oRef += VALUE_SIZE;
        eRef += VALUE_SIZE;
        rRef += step;
        resRef += VALUE_SIZE;
    }

    return result;
}

function baseFT(vRef: usize, rRef: usize, vRefEnd: u32, step: u32, offset: u32): ArrayBuffer {

    let result = new ArrayBuffer(VALUE_SIZE << 2);
    let resRef = changetype<usize>(result);
    vRef += offset;

    // load value variables
    let v0Lo: u64 = 0, v0Hi: u64 = 0, v1Lo: u64 = 0, v1Hi: u64 = 0;
    let v2Lo: u64 = 0, v2Hi: u64 = 0, v3Lo: u64 = 0, v3Hi: u64 = 0;

    if (vRef < vRefEnd) {
        v0Lo = load<u64>(vRef); v0Hi = load<u64>(vRef, HALF_OFFSET);
        vRef += step;
        if (vRef < vRefEnd) {
            v1Lo = load<u64>(vRef); v1Hi = load<u64>(vRef, HALF_OFFSET);
            vRef += step;
            if (vRef < vRefEnd) {
                v2Lo = load<u64>(vRef); v2Hi = load<u64>(vRef, HALF_OFFSET);
                vRef += step;
                if (vRef < vRefEnd) {
                    v3Lo = load<u64>(vRef); v3Hi = load<u64>(vRef, HALF_OFFSET);
                }
            }
        }
    }

    // load root variables
    let r0Lo = load<u64>(rRef), r0Hi = load<u64>(rRef, HALF_OFFSET); rRef += step;
    let r1Lo = load<u64>(rRef), r1Hi = load<u64>(rRef, HALF_OFFSET); rRef += step;
    let r2Lo = load<u64>(rRef), r2Hi = load<u64>(rRef, HALF_OFFSET); rRef += step;
    let r3Lo = load<u64>(rRef), r3Hi = load<u64>(rRef, HALF_OFFSET);
    
    // calculate 1st result
    let lastLo: u64 = 0, lastHi: u64 = 0;
    modMul(v0Hi, v0Lo, r0Hi, r0Lo);
    let t0Lo = _rLo, t0Hi = _rHi;

    modMul(v2Hi, v2Lo, r0Hi, r0Lo);
    modAdd(t0Hi, t0Lo, _rHi, _rLo);
    let t1Lo = _rLo, t1Hi = _rHi;

    modMul(v1Hi, v1Lo, r0Hi, r0Lo);
    modAdd(t1Hi, t1Lo, _rHi, _rLo);
    lastLo = _rLo; lastHi = _rHi;

    modMul(v3Hi, v3Lo, r0Hi, r0Lo);
    modAdd(lastHi, lastLo, _rHi, _rLo);
    lastLo = _rLo; lastHi = _rHi;

    store<u64>(resRef, lastLo);
    store<u64>(resRef, lastHi, HALF_OFFSET);

    // calculate 2nd result
    modMul(v2Hi, v2Lo, r2Hi, r2Lo);
    modAdd(t0Hi, t0Lo, _rHi, _rLo);
    let t2Lo = _rLo, t2Hi = _rHi;

    modMul(v1Hi, v1Lo, r1Hi, r1Lo);
    modAdd(t2Hi, t2Lo, _rHi, _rLo);
    lastLo = _rLo; lastHi = _rHi;

    modMul(v3Hi, v3Lo, r3Hi, r3Lo);
    modAdd(lastHi, lastLo, _rHi, _rLo);
    lastLo = _rLo; lastHi = _rHi;

    resRef += VALUE_SIZE;
    store<u64>(resRef, lastLo);
    store<u64>(resRef, lastHi, HALF_OFFSET);

    // calculate 3rd result
    modMul(v1Hi, v1Lo, r2Hi, r2Lo);
    modAdd(t1Hi, t1Lo, _rHi, _rLo);
    lastLo = _rLo; lastHi = _rHi;

    modMul(v3Hi, v3Lo, r2Hi, r2Lo);
    modAdd(lastHi, lastLo, _rHi, _rLo);
    lastLo = _rLo; lastHi = _rHi;

    resRef += VALUE_SIZE;
    store<u64>(resRef, lastLo);
    store<u64>(resRef, lastHi, HALF_OFFSET);

    // calculate 4th result
    modMul(v1Hi, v1Lo, r3Hi, r3Lo);
    modAdd(t2Hi, t2Lo, _rHi, _rLo);
    lastLo = _rLo; lastHi = _rHi;

    modMul(v3Hi, v3Lo, r1Hi, r1Lo);
    modAdd(lastHi, lastLo, _rHi, _rLo);
    lastLo = _rLo; lastHi = _rHi;

    resRef += VALUE_SIZE;
    store<u64>(resRef, lastLo);
    store<u64>(resRef, lastHi, HALF_OFFSET);

    return result;
}

// MODULAR ARITHMETIC FUNCTIONS
// ================================================================================================
/**
 * Performs modular addition of a and b using the algorithm:
 *  if (b = 0)
 *      return a
 *  else if (a = 0)
 *      return b
 *  else
 *      b = m - b
 *      if (a < b)
 *          return m - b + a
 *      else
 *          return a - b
 */
function modAdd(aHi: u64, aLo: u64, bHi: u64, bLo: u64): void {
    if (bHi == 0 && bLo == 0) {
        _rLo = aLo; _rHi = aHi;
    }
    else if (aHi == 0 && aLo == 0) {
        _rLo = bLo; _rHi = bHi;
    }
    else {
        let rLo: u64, rHi: u64;

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
  
        // return the result
        _rLo = rLo; _rHi = rHi;
    }
}

/**
 * Performs modular subtraction of b from a using the algorithm:
 *  if (a < b)
 *      return m - a + b
 *  else
 *      return a - b
 */
function modSub(aHi: u64, aLo: u64, bHi: u64, bLo: u64): void {
    let rLo: u64, rHi: u64;

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

    // return the result
    _rLo = rLo; _rHi = rHi;
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
function modMul(aHi: u64, aLo: u64, bHi: u64, bLo: u64): void {
    if ((aHi == 0 && aLo == 0) || (bHi == 0 && bLo == 0)) {
        _rLo = 0; _rHi = 0;
    }
    else {
        // iteration 1
        mul128x64(aHi, aLo, bHi);                       // ab = a * b1
        let z0 = _rLo, z1 = _rHi, z2 = _rEx;            // z = ab
        let q0 = _rEx;                                  // q = z >> n

        mul128x64(mHi, mLo, q0);                        // qm = q * m
        let qm0 = _rLo, qm1 = _rHi, qm2 = _rEx;

        sub192x192(z2, z1, z0, qm2, qm1, qm0);          // z = z - qm
        z0 = _rLo; z1 = _rHi, z2 = _rEx;

        if (z2 > 0) {
            assert(z2 == 1, 'z2 is greater than 1');
            let t0 = z0;                                // z = z - m
            z0 = t0 - mLo; z1 = z1 - mHi;
            if (z0 > t0) z1--;
        }

        // iteration 2
        let z3: u32 = 0;                                // potential overflow bit
        z2 = z1, z1 = z0; z0 = 0;                       // z << w
        mul128x64(aHi, aLo, bLo);                       // ab = a * b0
        z0 = _rLo; z1 = z1 + _rHi, z2 = z2 + _rEx;      // z = z + ab
        if (z1 < _rHi) {
            if (z2 < _rEx) {
                z2++;
                z3 = 1;
            }
            else {
                z2++;
                if (z2 == 0) z3 = 1;
            }
        }
        else {
            if (z2 < _rEx) z3 = 1;
        }

        q0 = z2;                                        // q = z >> n

        if (z3 == 1) {
            let t1 = z1;                                // z = z - (m << w)
            z1 = t1 - mLo; z2 = z2 - mHi;
            if (z1 > t1) z2--;
        }

        mul128x64(mHi, mLo, q0);                        // qm = q * m
        qm0 = _rLo; qm1 = _rHi; qm2 = _rEx;

        sub192x192(z2, z1, z0, qm2, qm1, qm0);          // z = z - qm
        z0 = _rLo; z1 = _rHi, z2 = _rEx;

        if (z2 > 0 || lt(mHi, mLo, z1, z0)) {           // if m < z
            let t0 = z0;                                // z = z - m
            z0 = t0 - mLo; z1 = z1 - mHi;
            if (z0 > t0) z1--;
        }

        _rLo = z0; _rHi = z1;                           // return the result
    }
}

function modExp(baseHi: u64, baseLo: u64, expHi: u64, expLo: u64): void {
    let rHi: u64, rLo: u64;

    if (baseHi == 0 && baseLo == 0) {
        assert(expHi != 0 || expLo != 0, 'Base and exponent cannot be both 0');
        rHi = 0; rLo = 0;
    }
    else {
        rHi = 0; rLo = 1;
        while (expHi > 0 || expLo > 0) {
            if ((expLo & 1) == 1) {
                // r = (r * base) % m
                modMul(rHi, rLo, baseHi, baseLo);
                rHi = _rHi; rLo = _rLo;
            }
    
            // exp = exp / 2
            expLo = (expLo >> 1) | ((expHi & 1) << 63);
            expHi = (expHi >> 1);
    
            // base = (base^2) % m
            modMul(baseHi, baseLo, baseHi, baseLo);
            baseHi = _rHi; baseLo = _rLo;
        }
    }

    // return the result
    _rLo = rLo; _rHi = rHi;
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
function modInv(xHi: u64, xLo: u64): void {
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
            uLo = _rLo; uHi = _rHi; uEx = _rEx;
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
                uLo = _rLo; uHi = _rHi; uEx = _rEx;

                // d = d + a;
                add192x192(dEx, dHi, dLo, aEx, aHi, aLo);
                dLo = _rLo; dHi = _rHi; dEx = _rEx;

                while ((uLo & 1) == 0) {
                    if ((dLo & 1) == 1) {
                        // d = d + m;
                        add192x192(dEx, dHi, dLo, 0, mHi, mLo);
                        dLo = _rLo; dHi = _rHi; dEx = _rEx;
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
            aLo = _rLo; aHi = _rHi; aEx = _rEx;

            while ((vLo & 1) == 0) {
                if ((aLo & 1) == 1) {
                    // a = a + m;
                    add192x192(aEx, aHi, aLo, 0, mHi, mLo);
                    aLo = _rLo; aHi = _rHi; aEx = _rEx;
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
            aLo = _rLo; aHi = _rHi; aEx = _rEx;
        }
    }

    // return the result
    _rLo = aLo; _rHi = aHi;
}

// REGULAR ARITHMETIC FUNCTIONS
// ================================================================================================
// @ts-ignore
@inline
function add192x192(a2: u64, a1: u64, a0: u64, b2: u64, b1: u64, b0: u64): void {
    _rLo = a0 + b0;
    _rHi = a1 + b1;
    _rEx = a2 + b2;

    if (_rLo < a0) {
        if (_rHi < a1) {
            _rEx++;
            _rHi++;
        }
        else {
            _rHi++;
            if (_rHi == 0) _rEx++;
        }
    }
    else {
        if (_rHi < a1) _rEx++;
    }
}

// @ts-ignore
@inline
function sub192x192(a2: u64, a1: u64, a0: u64, b2: u64, b1: u64, b0: u64): void {
    _rLo = a0 - b0;
    _rHi = a1 - b1;
    _rEx = a2 - b2;

    if (_rLo > a0) {
        if (_rHi > a1) {
            _rEx--;
            _rHi--;
        }
        else {
            _rHi--;
            if (_rHi == U64_MAX) _rEx--;
        }
    }
    else {
        if (_rHi > a1) _rEx--;
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

    // return the result
    _rLo = r0; _rHi = r1; _rEx = r2;
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