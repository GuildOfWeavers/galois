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

    newArray(elementCount: number, sRef: number, sElementCount: number): number;
    transposeArray(vRef: number, rowCount: number, colCount: number): number;

    addArrayElements(aRef: number, bRef: number, elementCount: number): number;
    addArrayElements2(aRef: number, bIdx: number, elementCount: number): number;
    subArrayElements(aRef: number, bRef: number, elementCount: number): number;
    subArrayElements2(aRef: number, bIdx: number, elementCount: number): number;
    mulArrayElements(aRef: number, bRef: number, elementCount: number): number;
    mulArrayElements2(aRef: number, bIdx: number, elementCount: number): number;
    mulArrayElements3(aRef: number, bRef: number, rRef: number, elementCount: number): void;
    divArrayElements(aRef: number, bRef: number, elementCount: number): number;
    divArrayElements2(aRef: number, bIdx: number, elementCount: number): number;
    expArrayElements(aRef: number, bRef: number, elementCount: number): number;
    expArrayElements2(aRef: number, bIdx: number, elementCount: number): number;
    invArrayElements(sourceRef: number, elementCount: number): number;

    getPowerSeries(length: number, seedIdx: number): number;

    combineVectors(aRef: number, bRef: number, elementCount: number): number;

    mulMatrixes(aRef: number, bRef: number, n: number, m: number, p: number): number;

    mulPolys(aRef: number, bRef: number, aElementCount: number, bElementCount: number): number;
    divPolys(aRef: number, bRef: number, aElementCount: number, bElementCount: number): number

    evalPolyAt(pRef: number, xIdx: number, elementCount: number): number;
    evalPolyAtRoots(pRef: number, rRef: number, polyDegree: number, rootCount: number): number;
    evalQuarticBatch(pRef: number, xRef: number, polyCount: number): number;

    interpolate(xRef: number, yRef: number, elementCount: number): number;
    interpolateRoots(rRef: number, yRef: number, resRef: number, elementCount: number): number;
    interpolateQuarticBatch(xRef: number, yRef: number, rowCount: number): number;
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