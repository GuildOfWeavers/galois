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
    transposeArray(vRef: number, resRef: number, rowCount: number, colCount: number): void;

    addArrayElements1(aRef: number, bRef: number, resRef: number, elementCount: number): void;
    addArrayElements2(aRef: number, bIdx: number, resRef: number, elementCount: number): void;
    subArrayElements1(aRef: number, bRef: number, resRef: number, elementCount: number): void;
    subArrayElements2(aRef: number, bIdx: number, resRef: number, elementCount: number): void;
    mulArrayElements1(aRef: number, bRef: number, resRef: number, elementCount: number): void;
    mulArrayElements2(aRef: number, bIdx: number, resRef: number, elementCount: number): void;
    divArrayElements(aRef: number, bRef: number, elementCount: number): number;     // TODO
    divArrayElements2(aRef: number, bIdx: number, elementCount: number): number;    // TODO
    expArrayElements1(aRef: number, bRef: number, resRef: number, elementCount: number): void;
    expArrayElements2(aRef: number, bIdx: number, resRef: number, elementCount: number): void;
    invArrayElements(sourceRef: number, elementCount: number): number;  // TODO

    getPowerSeries(seedIdx: number, resRef: number, length: number): void;

    combineVectors(aRef: number, bRef: number, elementCount: number): number;

    mulMatrixes(aRef: number, bRef: number, resRef: number, n: number, m: number, p: number): void;

    mulPolys(aRef: number, bRef: number, resRef: number, aDegreePlus1: number, bDegreePlus1: number): void;
    divPolys(aRef: number, bRef: number, resRef: number, aDegreePlus1: number, bDegreePlus1: number): void;

    evalPolyAt(pRef: number, xIdx: number, elementCount: number): number;
    evalPolyAtRoots(pRef: number, rRef: number, polyDegree: number, rootCount: number): number; // TODO
    evalQuarticBatch(pRef: number, xRef: number, resRef: number, polyCount: number): void;

    interpolate(xRef: number, yRef: number, elementCount: number): number;  // TODO
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