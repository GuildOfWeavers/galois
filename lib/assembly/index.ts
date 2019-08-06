// IMPORTS
// ================================================================================================
import * as fs from 'fs';
import * as loader from 'assemblyscript/lib/loader';
import { WasmOptions } from '@guildofweavers/galois';

// CONSTANTS
// ================================================================================================
const PRIME128_WASM = `${__dirname}/prime128.wasm`;

// INTERFACES
// ================================================================================================
export type WasmPrime128 = loader.ASUtil & {
    getInputsPtr(): number;
    getOutputsPtr(): number;
    setModulus(mHi1: number, mHi2: number, mLo1: number, mLo2: number): void;

    newArray(elementCount: number): number;
    newRefArray(refCount: number): number;

    copyArrayElements(vRef: number, resRef: number, vElementCount: number): void;
    transposeArray(vRef: number, resRef: number, rowCount: number, colCount: number): void;
    pluckArray(vRef: number, resRef: number, skip: number, vElementCount: number, rElementCount: number): void;

    addArrayElements1(aRef: number, bRef: number, resRef: number, elementCount: number): void;
    addArrayElements2(aRef: number, bIdx: number, resRef: number, elementCount: number): void;
    subArrayElements1(aRef: number, bRef: number, resRef: number, elementCount: number): void;
    subArrayElements2(aRef: number, bIdx: number, resRef: number, elementCount: number): void;
    mulArrayElements1(aRef: number, bRef: number, resRef: number, elementCount: number): void;
    mulArrayElements2(aRef: number, bIdx: number, resRef: number, elementCount: number): void;
    divArrayElements1(aRef: number, bRef: number, resRef: number, elementCount: number): void;
    divArrayElements2(aRef: number, bIdx: number, resRef: number, elementCount: number): void;
    expArrayElements1(aRef: number, bRef: number, resRef: number, elementCount: number): void;
    expArrayElements2(aRef: number, bIdx: number, resRef: number, elementCount: number): void;

    invArrayElements(sourceRef: number, resRef: number, elementCount: number): void;
    negArrayElements(sourceRef: number, resRef: number, elementCount: number): void;

    getPowerSeries(seedIdx: number, resRef: number, length: number): void;

    combineVectors(aRef: number, bRef: number, elementCount: number): number;
    combineManyVectors(vRef: number, kRef: number, resRef: number, vCount: number, kCount: number): void;

    mulMatrixes(aRef: number, bRef: number, resRef: number, n: number, m: number, p: number): void;

    addPolys(aRef: number, bRef: number, resRef: number, aDegreePlus1: number, bDegreePlus1: number): void
    mulPolys(aRef: number, bRef: number, resRef: number, aDegreePlus1: number, bDegreePlus1: number): void;
    divPolys(aRef: number, bRef: number, resRef: number, aDegreePlus1: number, bDegreePlus1: number): void;

    evalPolyAt(pRef: number, xIdx: number, degreePlus1: number): number;
    evalPolyAtRoots(pRef: number, xRef: number, resRef: number, degreePlus1: number, rootCount: number): void;
    evalQuarticBatch(pRef: number, xRef: number, resRef: number, polyCount: number): void;

    interpolate(xRef: number, yRef: number, resRef: number, elementCount: number): void;
    interpolateRoots(rRef: number, yRef: number, resRef: number, elementCount: number): void;
    interpolateQuarticBatch(xRef: number, yRef: number, resRef: number, rowCount: number): void;
}

// PUBLIC MODULE
// ================================================================================================
export function instantiatePrime128(options?: WasmOptions): WasmPrime128 {
    let initialMemPages = 10;
    if (options) {
        initialMemPages = Math.ceil(options.initialMemory / 1024 / 64);
    }

    const wasm = loader.instantiateBuffer<any>(fs.readFileSync(PRIME128_WASM), {
        env: {
            memory: new WebAssembly.Memory({ initial: initialMemPages })
        }
    });

    return wasm;
}