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

export function newArray(elementCount: u32, sRef: usize, sElementCount: u32): ArrayBuffer {
    let result = new ArrayBuffer(elementCount * VALUE_SIZE);
    if (sRef) {
        if (sElementCount == 0) {
            sElementCount = elementCount;
        }
        
        // TODO: replace with bulk memory copy
        let rRef = changetype<usize>(result);
        let endRef = sRef + sElementCount * VALUE_SIZE;
        while (sRef < endRef) {
            let vLo = load<u64>(sRef);
            let vHi = load<u64>(sRef, HALF_OFFSET);
            store<u64>(rRef, vLo);
            store<u64>(rRef, vHi, HALF_OFFSET);
    
            sRef += VALUE_SIZE;
            rRef += VALUE_SIZE;
        }
    }
    return result;
}

export function transposeArray(vRef: usize, resRef: usize, rowCount: u32, colCount: u32): void {
    
    let resultLength = rowCount * colCount * VALUE_SIZE;
    let rEndRef = resRef + resultLength;
    let vEndRef = vRef + resultLength;
    let colLength = rowCount * VALUE_SIZE;

    while (resRef < rEndRef) {
        let viRef = vRef;
        while (viRef < vEndRef) {
            let vLo = load<u64>(viRef);
            let vHi = load<u64>(viRef, HALF_OFFSET);

            store<u64>(resRef, vLo);
            store<u64>(resRef, vHi, HALF_OFFSET);

            resRef += VALUE_SIZE;
            viRef += colLength;
        }
        vRef += VALUE_SIZE;
    }
}

export function addArrayElements1(aRef: usize, bRef: usize, resRef: usize, elementCount: u32): void {
    arrayElementOp(aRef, bRef, resRef, elementCount, modAdd);
}

export function addArrayElements2(aRef: usize, bIdx: u32, resRef: usize, elementCount: u32): void {
    let bRef = changetype<usize>(_inputs) + bIdx * VALUE_SIZE;
    arrayScalarOp(aRef, bRef, resRef, elementCount, modAdd);
}

export function subArrayElements1(aRef: usize, bRef: usize, resRef: usize, elementCount: u32): void {
    arrayElementOp(aRef, bRef, resRef, elementCount, modSub);
}

export function subArrayElements2(aRef: usize, bIdx: u32, resRef: usize, elementCount: u32): void {
    let bRef = changetype<usize>(_inputs) + bIdx * VALUE_SIZE;
    arrayScalarOp(aRef, bRef, resRef, elementCount, modSub);
}

export function mulArrayElements1(aRef: usize, bRef: usize, resRef: usize, elementCount: u32): void {
    arrayElementOp(aRef, bRef, resRef, elementCount, modMul);
}

export function mulArrayElements2(aRef: usize, bIdx: u32, resRef: usize, elementCount: u32): void {
    let bRef = changetype<usize>(_inputs) + bIdx * VALUE_SIZE;
    arrayScalarOp(aRef, bRef, resRef, elementCount, modMul);
}

export function divArrayElements1(aRef: usize, bRef: usize, resRef: usize, elementCount: u32): void {
    let rRef = resRef;
    if (aRef == resRef) {
        // @ts-ignore
        rRef = __retain(__alloc(elementCount * VALUE_SIZE,0));
    }

    invArrayElements(bRef, rRef, elementCount);
    arrayElementOp(aRef, rRef, resRef, elementCount, modMul);

    if (aRef == resRef) {
        // @ts-ignore
        __release(rRef);
    }
}

export function divArrayElements2(aRef: usize, bIdx: u32, resRef: usize, elementCount: u32): void {
    
    let bRef = changetype<usize>(_inputs) + bIdx * VALUE_SIZE;
    let bLo = load<u64>(bRef);
    let bHi = load<u64>(bRef, HALF_OFFSET);

    modInv(bHi, bLo);
    store<u64>(bRef, _rLo);
    store<u64>(bRef, _rHi, HALF_OFFSET);

    arrayScalarOp(aRef, bRef, resRef, elementCount, modMul);
}

export function expArrayElements1(aRef: usize, bRef: usize, resRef: usize, elementCount: u32): void {
    arrayElementOp(aRef, bRef, resRef, elementCount, modExp);
}

export function expArrayElements2(aRef: usize, bIdx: u32, resRef: usize, elementCount: u32): void {
    let bRef = changetype<usize>(_inputs) + bIdx * VALUE_SIZE;
    arrayScalarOp(aRef, bRef, resRef, elementCount, modExp);
}

export function invArrayElements(sRef: usize, resRef: usize, elementCount: u32): void {

    let resultLength: i32 = elementCount * VALUE_SIZE;
    let sHi: u64, sLo: u64, rHi: u64, rLo: u64;
    let rRef = resRef;

    // handle the case if source and result arrays are the same
    if (sRef == resRef) {
        // @ts-ignore
        rRef = __retain(__alloc(resultLength, 0));
    }

    let lastLo: u64 = 1, lastHi: u64 = 0;
    for (let i = 0; i < resultLength; i += VALUE_SIZE) {
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

    for (let i: i32 = resultLength - VALUE_SIZE; i >= 0; i -= VALUE_SIZE) {
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
            rLo = _rLo; rHi = _rHi;
        }
        store<u64>(resRef + i, rLo);
        store<u64>(resRef + i, rHi, HALF_OFFSET);

        // inv = mul(inv, source[i] || 1n);
        modMul(invHi, invLo, sHi, sLo);
        invLo = _rLo; invHi = _rHi;
    }

    if (sRef == resRef) {
        // @ts-ignore
        __release(rRef);
    }
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
export function mulMatrixes(aRef: usize, bRef: usize, resRef: usize, n: u32, m: u32, p: u32): void {

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

            let rValueRef = resRef + bRowSize * i + j * VALUE_SIZE;
            store<u64>(rValueRef, sLo);
            store<u64>(rValueRef, sHi, HALF_OFFSET);
        }
    }
}

// POWER FUNCTIONS
// ================================================================================================
export function getPowerSeries(seedIdx: u32, resRef: usize, length: u32): void {
    let resultLength = length * VALUE_SIZE;
    let endRef = resRef + resultLength;

    let sRef = changetype<usize>(_inputs) + seedIdx * VALUE_SIZE;
    let sLo = load<u64>(sRef);
    let sHi = load<u64>(sRef, HALF_OFFSET);

    let pLo: u64 = 1, pHi: u64 = 0;
    store<u64>(resRef, pLo);
    store<u64>(resRef, pHi, HALF_OFFSET);
    resRef += VALUE_SIZE;

    while (resRef < endRef) {
        modMul(pHi, pLo, sHi, sLo);
        pLo = _rLo; pHi = _rHi;

        store<u64>(resRef, pLo);
        store<u64>(resRef, pHi, HALF_OFFSET);

        resRef += VALUE_SIZE;
    }
}

// POLYNOMIAL FUNCTIONS
// ================================================================================================
export function mulPolys(aRef: usize, bRef: usize, resRef: usize, aDegreePlus1: u32, bDegreePlus1: u32): void {
    let aLength = aDegreePlus1 * VALUE_SIZE;
    let bLength = bDegreePlus1 * VALUE_SIZE;

    for (let i: u32 = 0; i < aLength; i += VALUE_SIZE) {
        for (let j: u32 = 0; j < bLength; j += VALUE_SIZE) {
            let aLo = load<u64>(aRef + i), aHi = load<u64>(aRef + i, HALF_OFFSET);
            let bLo = load<u64>(bRef + j), bHi = load<u64>(bRef + j, HALF_OFFSET);
            modMul(aHi, aLo, bHi, bLo);

            let rRef = resRef + i + j;
            let rLo = load<u64>(rRef), rHi = load<u64>(rRef, HALF_OFFSET);
            modAdd(rHi, rLo, _rHi, _rLo);

            store<u64>(rRef, _rLo);
            store<u64>(rRef, _rHi, HALF_OFFSET);
        }
    }
}

export function divPolys(aRef: usize, bRef: usize, resRef: usize, aDegreePlus1: u32, bDegreePlus1: u32): void {
    let aPos = <i32>(aDegreePlus1 * VALUE_SIZE - VALUE_SIZE);
    let bPos = <i32>(bDegreePlus1 * VALUE_SIZE - VALUE_SIZE);

    let diff = <i32>(aPos - bPos);
    let resultLength = diff + VALUE_SIZE;
    
    let aCopy = newArray(aDegreePlus1, aRef, aDegreePlus1);
    aRef = changetype<usize>(aCopy);
    
    for (let p = resultLength - VALUE_SIZE; diff >= 0; diff -= VALUE_SIZE, aPos -= VALUE_SIZE, p -= VALUE_SIZE) {

        let aLo = load<u64>(aRef + aPos), aHi = load<u64>(aRef + aPos, HALF_OFFSET);
        let bLo = load<u64>(bRef + bPos), bHi = load<u64>(bRef + bPos, HALF_OFFSET);
        
        modInv(bHi, bLo);
        modMul(aHi, aLo, _rHi, _rLo);
        let qLo = _rLo, qHi = _rHi;

        store<u64>(resRef + p, qLo);
        store<u64>(resRef + p, qHi, HALF_OFFSET);
        
        for (let i = bPos; i >= 0; i -= VALUE_SIZE) {
            let bLo = load<u64>(bRef + i), bHi = load<u64>(bRef + i, HALF_OFFSET);
            modMul(bHi, bLo, qHi, qLo);
                        
            let aiRef = aRef + diff + i;
            let aLo = load<u64>(aiRef), aHi = load<u64>(aiRef, HALF_OFFSET);
            modSub(aHi, aLo, _rHi, _rLo);

            store<u64>(aiRef, _rLo);
            store<u64>(aiRef, _rHi, HALF_OFFSET);
        }
    }
}

export function evalPolyAt(pRef: usize, xIdx: u32, degreePlus1: u32): u32 {

    // load x value
    let xRef = changetype<usize>(_inputs) + xIdx * VALUE_SIZE;
    let xLo = load<u64>(xRef);
    let xHi = load<u64>(xRef, HALF_OFFSET);

    // evaluate the polynomial
    evalPoly(pRef, xHi, xLo, degreePlus1);

    // save the result into the 0 slot of the output buffer
    let rRef = changetype<usize>(_outputs);
    store<u64>(rRef, _rLo);
    store<u64>(rRef, _rHi, HALF_OFFSET);

    return 0;
}

export function evalPolyAtRoots(pRef: usize, xRef: usize, degreePlus1: u32, rootCount: u32): ArrayBuffer {

    let vRefEnd = pRef + degreePlus1 * VALUE_SIZE;
    let result = fastFT(pRef, xRef, rootCount, vRefEnd, 0, 0);
    return result;
}

export function interpolate(xRef: usize, yRef: usize, elementCount: i32): ArrayBuffer {

    let resultLength = elementCount * VALUE_SIZE;

    // 1 --- build zero polynomial
    let zPolyLength = resultLength + VALUE_SIZE;
    let zPoly = new ArrayBuffer(zPolyLength);
    let zRef = changetype<usize>(zPoly);

    // set last value to 1
    store<u64>(zRef + resultLength, 1);

    let p = resultLength - VALUE_SIZE;
    for (let i = 0; i < resultLength; i += VALUE_SIZE, p -= VALUE_SIZE) {

        let xLo = load<u64>(xRef + i);
        let xHi = load<u64>(xRef + i, HALF_OFFSET);

        // load zPoly[p]
        let zLo = load<u64>(zRef + p);
        let zHi = load<u64>(zRef + p, HALF_OFFSET);

        for(let j = p; j < resultLength; j += VALUE_SIZE) {
        
            // load zPoly[j+1]
            let zLo1 = load<u64>(zRef + j, VALUE_SIZE);
            let zHi1 = load<u64>(zRef + j, VALUE_SIZE + HALF_OFFSET);
            
            // zPoly[i] = zPoly[j] - x[i] * zPoly[j+1]
            modMul(xHi, xLo, zHi1, zLo1);
            modSub(zHi, zLo, _rHi, _rLo);
            store<u64>(zRef + j, _rLo);
            store<u64>(zRef + j, _rHi, HALF_OFFSET);

            zLo = zLo1; zHi = zHi1;
        }
    }

    // 2 --- build numerators
    let divisor = new ArrayBuffer(VALUE_SIZE << 1);
    let divRef = changetype<usize>(divisor);
    store<u64>(divRef, 1, VALUE_SIZE);  // divisor[1] = 1

    let numerators = new ArrayBuffer(resultLength * elementCount);
    let numRef = changetype<usize>(numerators);
    for (let i = 0; i < resultLength; i += VALUE_SIZE, numRef += resultLength) {
        // divisor[0] = -x[i]
        let xLo = load<u64>(xRef + i);
        let xHi = load<u64>(xRef + i, HALF_OFFSET);
        modSub(0, 0, xHi, xLo);
        store<u64>(divRef, _rLo);
        store<u64>(divRef, _rHi, HALF_OFFSET);

        divPolys(zRef, divRef, numRef, elementCount + 1, 2);
    }

    // 3 --- build denominators
    numRef = changetype<usize>(numerators);
    let denominators = new ArrayBuffer(resultLength);
    let denRef = changetype<usize>(denominators);
    for (let i = 0; i < resultLength; i += VALUE_SIZE, numRef += resultLength) {
        let xLo = load<u64>(xRef + i);
        let xHi = load<u64>(xRef + i, HALF_OFFSET);

        evalPoly(numRef, xHi, xLo, elementCount);

        store<u64>(denRef + i, _rLo);
        store<u64>(denRef + i, _rHi, HALF_OFFSET);
    }

    // 4 --- compute the inverse
    let invDenominators = new ArrayBuffer(elementCount * VALUE_SIZE);
    let iRef = changetype<usize>(invDenominators);
    invArrayElements(denRef, iRef, elementCount);

    // 5 --- finish interpolation
    numRef = changetype<usize>(numerators);
    let result = new ArrayBuffer(resultLength);
    let resRef = changetype<usize>(result);
    for (let i = 0; i < resultLength; i += VALUE_SIZE) {
        let yLo = load<u64>(yRef + i);
        let yHi = load<u64>(yRef + i, HALF_OFFSET);

        let iLo = load<u64>(iRef + i);
        let iHi = load<u64>(iRef + i, HALF_OFFSET);

        modMul(yHi, yLo, iHi, iLo);
        let ysLo = _rLo, ysHi = _rHi;

        for (let j = 0; j < resultLength; j += VALUE_SIZE) {
            let nLo = load<u64>(numRef + i * elementCount + j);
            let nHi = load<u64>(numRef + i * elementCount + j, HALF_OFFSET);

            if ((nLo > 0 || nHi > 0) && (yLo > 0 || yHi > 0)) {
                modMul(nHi, nLo, ysHi, ysLo);

                let resLo = load<u64>(resRef + j);
                let resHi = load<u64>(resRef + j, HALF_OFFSET);
                modAdd(resHi, resLo, _rHi, _rLo);

                store<u64>(resRef + j, _rLo);
                store<u64>(resRef + j, _rHi, HALF_OFFSET);
            }
        }
    }

    return result;
}

export function interpolateRoots(rRef: usize, vRef: usize, resRef: usize, elementCount: u32): void {

    let resultLength = elementCount * VALUE_SIZE;
    
    // reverse the roots array and store them in the results array
    let rrRef = resRef;     
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

    // run FFT against reversed roots
    let vRefEnd = vRef + resultLength;
    let fftResult = fastFT(vRef, resRef, elementCount, vRefEnd, 0, 0);
    let fftRef = changetype<usize>(fftResult);

    modSub(mHi, mLo, 0, 2);
    modExp(0, elementCount, _rHi, _rLo);
    let ivLo = _rLo, ivHi = _rHi;

    let endRef = resRef + resultLength;
    while (resRef < endRef) {
        let vLo = load<u64>(fftRef);
        let vHi = load<u64>(fftRef, HALF_OFFSET);

        modMul(ivHi, ivLo, vHi, vLo);

        store<u64>(resRef, _rLo);
        store<u64>(resRef, _rHi, HALF_OFFSET);

        resRef += VALUE_SIZE;
        fftRef += VALUE_SIZE;
    }
}

export function evalQuarticBatch(pRef: usize, xRef: usize, resRef: usize, polyCount: u32): void {
    let resultLength = polyCount * VALUE_SIZE;
    let refEnd = resRef + resultLength;
    let rowSize = VALUE_SIZE << 2; // 4 * VALUE_SIZE

    let kLo: u64, kHi: u64, xLo: u64, xHi: u64, xpLo: u64, xpHi: u64, rLo: u64, rHi: u64;

    while (resRef < refEnd) {
        // term 0
        rLo = load<u64>(pRef);
        rHi = load<u64>(pRef, HALF_OFFSET);

        // term 1
        kLo = load<u64>(pRef, VALUE_SIZE);
        kHi = load<u64>(pRef, VALUE_SIZE + HALF_OFFSET);

        xLo = load<u64>(xRef);
        xHi = load<u64>(xRef, HALF_OFFSET);

        modMul(kHi, kLo, xHi, xLo);
        modAdd(rHi, rLo, _rHi, _rLo);
        rLo = _rLo; rHi = _rHi;

        // term 2
        kLo = load<u64>(pRef, VALUE_SIZE * 2);
        kHi = load<u64>(pRef, VALUE_SIZE * 2 + HALF_OFFSET);

        modMul(xHi, xLo, xHi, xLo);
        xpLo = _rLo; xpHi = _rHi;   // xp = x*x

        modMul(kHi, kLo, xpHi, xpLo);
        modAdd(rHi, rLo, _rHi, _rLo);
        rLo = _rLo; rHi = _rHi;

        // term 3
        kLo = load<u64>(pRef, VALUE_SIZE * 3);
        kHi = load<u64>(pRef, VALUE_SIZE * 3 + HALF_OFFSET);

        modMul(xpHi, xpLo, xHi, xLo);   // x*x*x
        modMul(kHi, kLo, _rHi, _rLo);
        modAdd(rHi, rLo, _rHi, _rLo);

        store<u64>(resRef, _rLo);
        store<u64>(resRef, _rHi, HALF_OFFSET);

        resRef += VALUE_SIZE;
        xRef += VALUE_SIZE;
        pRef += rowSize;
    }
}

export function interpolateQuarticBatch(xRef: usize, yRef: usize, resRef: usize, rowCount: u32): void {
    
    let equationSize = VALUE_SIZE << 2;                             // 4 values per equation
    let eqRowSize = equationSize << 2;                              // 4 equations per row
    let equations = new ArrayBuffer(eqRowSize * rowCount);
    let eqRef = changetype<usize>(equations);
    let eqRefEnd = eqRef + equations.byteLength;

    let xRefOrig = xRef;

    // build equations
    while (eqRef < eqRefEnd) {

        let x0Lo = load<u64>(xRef);
        let x0Hi = load<u64>(xRef, HALF_OFFSET);
        
        let x1Lo = load<u64>(xRef, VALUE_SIZE);
        let x1Hi = load<u64>(xRef, VALUE_SIZE + HALF_OFFSET);

        let x2Lo = load<u64>(xRef, VALUE_SIZE * 2);
        let x2Hi = load<u64>(xRef, VALUE_SIZE * 2 + HALF_OFFSET);

        let x3Lo = load<u64>(xRef, VALUE_SIZE * 3);
        let x3Hi = load<u64>(xRef, VALUE_SIZE * 3 + HALF_OFFSET);

        modMul(x0Hi, x0Lo, x1Hi, x1Lo);     // x0 * x1
        let x01Lo = _rLo, x01Hi = _rHi;
        modMul(x0Hi, x0Lo, x2Hi, x2Lo);     // x0 * x2
        let x02Lo = _rLo, x02Hi = _rHi;
        modMul(x0Hi, x0Lo, x3Hi, x3Lo);     // x0 * x3
        let x03Lo = _rLo, x03Hi = _rHi;
        modMul(x1Hi, x1Lo, x2Hi, x2Lo);     // x1 * x2
        let x12Lo = _rLo, x12Hi = _rHi;
        modMul(x1Hi, x1Lo, x3Hi, x3Lo);     // x1 * x3
        let x13Lo = _rLo, x13Hi = _rHi;
        modMul(x2Hi, x2Lo, x3Hi, x3Lo);     // x2 * x3
        let x23Lo = _rLo, x23Hi = _rHi;

        // eq0
        modSub(0, 0, x12Hi, x12Lo);         // -x12 * x3
        modMul(_rHi, _rLo, x3Hi, x3Lo);
        store<u64>(eqRef, _rLo);
        store<u64>(eqRef, _rHi, HALF_OFFSET);

        modAdd(x12Hi, x12Lo, x13Hi, x13Lo); // x12 + x13 + x23
        modAdd(_rHi, _rLo, x23Hi, x23Lo);
        store<u64>(eqRef, _rLo, VALUE_SIZE);
        store<u64>(eqRef, _rHi, VALUE_SIZE + HALF_OFFSET);

        modSub(0, 0, x1Hi, x1Lo);           // -x1 - x2 - x3
        modSub(_rHi, _rLo, x2Hi, x2Lo);
        modSub(_rHi, _rLo, x3Hi, x3Lo);
        store<u64>(eqRef, _rLo, VALUE_SIZE * 2);
        store<u64>(eqRef, _rHi, VALUE_SIZE * 2 + HALF_OFFSET);
        
        store<u64>(eqRef, 1, VALUE_SIZE * 3);

        // eq1
        modSub(0, 0, x02Hi, x02Lo);         // -x02 * x3
        modMul(_rHi, _rLo, x3Hi, x3Lo);
        store<u64>(eqRef, _rLo, VALUE_SIZE * 4);
        store<u64>(eqRef, _rHi, VALUE_SIZE * 4 + HALF_OFFSET);

        modAdd(x02Hi, x02Lo, x03Hi, x03Lo); // x02 + x03 + x23
        modAdd(_rHi, _rLo, x23Hi, x23Lo);
        store<u64>(eqRef, _rLo, VALUE_SIZE * 5);
        store<u64>(eqRef, _rHi, VALUE_SIZE * 5 + HALF_OFFSET);

        modSub(0, 0, x0Hi, x0Lo);           // -x0 - x2 - x3
        modSub(_rHi, _rLo, x2Hi, x2Lo);
        modSub(_rHi, _rLo, x3Hi, x3Lo);
        store<u64>(eqRef, _rLo, VALUE_SIZE * 6);
        store<u64>(eqRef, _rHi, VALUE_SIZE * 6 + HALF_OFFSET);

        store<u64>(eqRef, 1, VALUE_SIZE * 7);
        
        // eq2
        modSub(0, 0, x01Hi, x01Lo);         // -x01 * x3
        modMul(_rHi, _rLo, x3Hi, x3Lo);
        store<u64>(eqRef, _rLo, VALUE_SIZE * 8);
        store<u64>(eqRef, _rHi, VALUE_SIZE * 8 + HALF_OFFSET);

        modAdd(x01Hi, x01Lo, x03Hi, x03Lo); // x01 + x03 + x13
        modAdd(_rHi, _rLo, x13Hi, x13Lo);
        store<u64>(eqRef, _rLo, VALUE_SIZE * 9);
        store<u64>(eqRef, _rHi, VALUE_SIZE * 9 + HALF_OFFSET);

        modSub(0, 0, x0Hi, x0Lo);           // -x0 - x1 - x3
        modSub(_rHi, _rLo, x1Hi, x1Lo);
        modSub(_rHi, _rLo, x3Hi, x3Lo);
        store<u64>(eqRef, _rLo, VALUE_SIZE * 10);
        store<u64>(eqRef, _rHi, VALUE_SIZE * 10 + HALF_OFFSET);

        store<u64>(eqRef, 1, VALUE_SIZE * 11);

        // eq3
        modSub(0, 0, x01Hi, x01Lo);         // -x01 * x2
        modMul(_rHi, _rLo, x2Hi, x2Lo);
        store<u64>(eqRef, _rLo, VALUE_SIZE * 12);
        store<u64>(eqRef, _rHi, VALUE_SIZE * 12 + HALF_OFFSET);

        modAdd(x01Hi, x01Lo, x02Hi, x02Lo); // x01 + x02 + x12
        modAdd(_rHi, _rLo, x12Hi, x12Lo);
        store<u64>(eqRef, _rLo, VALUE_SIZE * 13);
        store<u64>(eqRef, _rHi, VALUE_SIZE * 13 + HALF_OFFSET);

        modSub(0, 0, x0Hi, x0Lo);           // -x0 - x1 - x2
        modSub(_rHi, _rLo, x1Hi, x1Lo);
        modSub(_rHi, _rLo, x2Hi, x2Lo);
        store<u64>(eqRef, _rLo, VALUE_SIZE * 14);
        store<u64>(eqRef, _rHi, VALUE_SIZE * 14 + HALF_OFFSET);

        store<u64>(eqRef, 1, VALUE_SIZE * 15);

        xRef += equationSize;
        eqRef += eqRowSize;
    }

    let elementCount = rowCount << 2;
    eqRef = changetype<usize>(equations);
    
    evalQuarticBatch(eqRef, xRefOrig, resRef, elementCount);

    let invEvaluations = new ArrayBuffer(elementCount * VALUE_SIZE);
    let iyRef = changetype<usize>(invEvaluations);
    invArrayElements(resRef, iyRef, elementCount);
    arrayElementOp(iyRef, yRef, iyRef, elementCount, modMul);

    let temp = new ArrayBuffer(equationSize);
    let tRef = changetype<usize>(temp);

    while (eqRef < eqRefEnd) {

        arrayScalarOp(eqRef, iyRef, resRef, 4, modMul);

        iyRef += VALUE_SIZE;
        eqRef += equationSize;

        arrayScalarOp(eqRef, iyRef, tRef, 4, modMul);
        arrayElementOp(resRef, tRef, resRef, 4, modAdd);

        iyRef += VALUE_SIZE;
        eqRef += equationSize;

        arrayScalarOp(eqRef, iyRef, tRef, 4, modMul);
        arrayElementOp(resRef, tRef, resRef, 4, modAdd);

        iyRef += VALUE_SIZE;
        eqRef += equationSize;

        arrayScalarOp(eqRef, iyRef, tRef, 4, modMul);
        arrayElementOp(resRef, tRef, resRef, 4, modAdd);

        resRef += equationSize;
        iyRef += VALUE_SIZE;
        eqRef += equationSize;
    }
}

function evalPoly(pRef: usize, xHi: u64, xLo: u64, degreePlus1: u32): void {

    // set y to degree 0 term
    let yLo = load<u64>(pRef);
    let yHi = load<u64>(pRef, HALF_OFFSET);
    
    if (degreePlus1 > 1) {
        let pRefEnd = pRef + degreePlus1 * VALUE_SIZE;
        pRef += VALUE_SIZE;
    
        // compute degree 1 term
        let kLo = load<u64>(pRef);
        let kHi = load<u64>(pRef, HALF_OFFSET);
        modMul(kHi, kLo, xHi, xLo);
        modAdd(yHi, yLo, _rHi, _rLo);
        yLo = _rLo; yHi = _rHi;

        // compute all other terms
        pRef += VALUE_SIZE;
        let pxLo = xLo, pxHi = xHi;
        while (pRef < pRefEnd) {
            let kLo = load<u64>(pRef);
            let kHi = load<u64>(pRef, HALF_OFFSET);
    
            modMul(pxHi, pxLo, xHi, xLo);
            pxLo = _rLo; pxHi = _rHi;

            modMul(kHi, kLo, pxHi, pxLo);
            modAdd(yHi, yLo, _rHi, _rLo);
            yLo = _rLo; yHi = _rHi;
    
            pRef += VALUE_SIZE;
        }
    }

    // return the result
    _rLo = yLo; _rHi = yHi;
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
        else {
            // only first value is non-zero
            let r0Lo = load<u64>(rRef), r0Hi = load<u64>(rRef, HALF_OFFSET);
            modMul(v0Hi, v0Lo, r0Hi, r0Lo);
            store<u64>(resRef, _rLo); store<u64>(resRef, _rHi, HALF_OFFSET); resRef += VALUE_SIZE;
            store<u64>(resRef, _rLo); store<u64>(resRef, _rHi, HALF_OFFSET); resRef += VALUE_SIZE;
            store<u64>(resRef, _rLo); store<u64>(resRef, _rHi, HALF_OFFSET); resRef += VALUE_SIZE;
            store<u64>(resRef, _rLo); store<u64>(resRef, _rHi, HALF_OFFSET);
            return result;
        }
    }
    else {
        // all values are zeros
        return result;
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

/**
 * Performs modular exponentiation of base to the exp power using the following algorithm:
 *  if (base = 0) return 0
 *  r = 0
 *  while (exp > 0)
 *      if (exp is odd)
 *          r = (r * base) % m
 *      exp = floor(exp / 2)
 *      base = (base^2) % m
 *  return r
 */
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