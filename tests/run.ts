import { createPrimeField } from "../index";

const modulus = 2n**128n - 15n * 2n**27n + 1n; // 2n**128n - 159n
const F = createPrimeField(modulus, null);
const wasm128 = createPrimeField(modulus, { initialMemory: 128 * 1024 * 1024 }); // 128 MB

const elements = 2**3;
const root = F.getRootOfUnity(elements);

const vRoots = F.getPowerSeries(root, elements);
const v1 = F.prng(42n, elements);
const v2 = F.prng(43n, elements);
const vm = F.newMatrixFrom([v1.toValues() as any]);
const vR = F.interpolateRoots(vRoots, vm);
const vC = F.interpolateRoots(vRoots, v1);

const wRoots = wasm128.getPowerSeries(root, elements);
const wm = wasm128.newMatrixFrom(vm.toValues());
const wR = wasm128.interpolateRoots(wRoots, wm);

console.log('done!');

/*
const v1 = F.prng(42n, elements * 16);
const vK = F.prng(43n, 16);
const v2 = F.vectorToMatrix(v1, elements);
const v3 = F.matrixRowsToVectors(v2);

let start = Date.now();
const vR = F.combineManyVectors(v3, vK);
console.log(`Combined 16 vectors of length ${elements} in ${Date.now() - start} ms`);

const w1 = wasm128.newVectorFrom(v1.toValues());
const wK = wasm128.prng(43n, 16);
const w2 = wasm128.vectorToMatrix(w1, elements);
const w3 = wasm128.matrixRowsToVectors(w2);

start = Date.now();
const wR = wasm128.combineManyVectors(w3, wK);
console.log(`Combined 16 vectors of length ${elements} in ${Date.now() - start} ms`);

for (let i = 0; i < vR.length; i++) {
    if (vR.getValue(i) !== wR.getValue(i)) {
        console.log(`> Error at index ${i}!`);
        break;
    }
}

console.log('done!');

/*
const root = F.getRootOfUnity(elements);

const v1 = F.getPowerSeries(root, elements);
const v2 = F.prng(42n, elements * 4);
const v3 = F.vectorToMatrix(v2, elements);
const vR = F.evalPolysAtRoots(v3, v1);

const w1 = wasm128.getPowerSeries(root, elements);
const w2 = wasm128.prng(42n, elements * 4);
const w3 = wasm128.vectorToMatrix(w2, elements);
const wR = wasm128.evalPolysAtRoots(w3, w1);

for (let i = 0; i < vR.rowCount; i++) {
    for (let j = 0; j < vR.colCount; j++) {
        if (vR.getValue(i, j) !== wR.getValue(i, j)) {
            console.log(`> Error at index ${i}!`);
            break;
        }
    }
}

console.log('done!');

/*
const v1 = F.prng(42n, elements);
const v2 = F.prng(43n, elements);

let start = Date.now();
const vPoly = F.interpolate(v1, v2);
console.log(`Interpolated degree ${elements} polynomial in ${Date.now() - start} ms`);

const w1 = wasm128.newVectorFrom(v1.values);
const w2 = wasm128.newVectorFrom(v2.values);

start = Date.now();
const wPoly = wasm128.interpolate(w1, w2);
console.log(`Interpolated degree ${elements} polynomial in ${Date.now() - start} ms`);

console.log('done!');

/* INTERPOLATE ROOTS (MATRIX)
const elements = 2**16;
const polyCount = 8;
const v1 = F.prng(42n, elements * polyCount);
const vYs = F.vectorToMatrix(v1, elements);

const rou = F.getRootOfUnity(elements);
const vRoots = F.getPowerSeries(rou, elements);

let start = Date.now();
const vPolys = new Array<bigint[]>(polyCount);
for (let i = 0; i < polyCount; i++) {
    vPolys[i] = F.interpolateRoots(vRoots, vYs[i]);
}
console.log(`Interpolated ${polyCount} degree ${elements} polynomials in ${Date.now() - start} ms`);

const w1 = wasm128.newVector(v1.length);
for (let i = 0; i < v1.length; i++) {
    w1.setValue(i, v1[i]);
}
const wYs = wasm128.vectorToMatrix(w1, elements);

const wRoots = wasm128.newVector(vRoots.length);
for (let i = 0; i < vRoots.length; i++) {
    wRoots.setValue(i, vRoots[i]);
}

start = Date.now();
const wPolys = wasm128.interpolateRoots(wRoots, wYs);
console.log(`Interpolated ${polyCount} degree ${elements} polynomials in ${Date.now() - start} ms`);

for (let i = 0; i < polyCount; i++) {
    for (let j = 0; j < elements; j++) {
        if (vPolys[i][j] !== wPolys.getValue(i, j)) {
            console.log(`> Interpolation error in WASM at index ${i}!`);
            break;
        }
    }
}

console.log('done!');


/*
let vXs = F.vectorToMatrix(v1, 4);
let vYs = F.vectorToMatrix(v2, 4);

const w1 = wasm128.newVector(elements);
const w2 = wasm128.newVector(elements);
for (let i = 0; i < elements; i++) {
    w1.setValue(i, v1[i]);
    w2.setValue(i, v2[i]);
}
const wXs = wasm128.vectorToMatrix(w1, 4);
const wYs = wasm128.vectorToMatrix(w2, 4);

let start = Date.now();
let vPolys = F.interpolateQuarticBatch(vXs, vYs);
console.log(`Interpolated ${elements / 4} quartic polynomials in ${Date.now() - start} ms`);

start = Date.now();
let wPolys = wasm128.interpolateQuarticBatch(wXs, wYs);
console.log(`Interpolated ${elements / 4} quartic polynomials in ${Date.now() - start} ms`);

for (let i = 0; i < elements / 4; i++) {
    for (let j = 0; j < 4; j++) {
        if (vPolys[i][j] !== wPolys.getValue(i, j)) {
            console.log(`> Transposition error in WASM at index ${i}!`);
            break;
        }
    }
}

console.log('done!');

/*
const wasm128 = Wasm.instantiate(F.modulus, { initialMemory: 128 * 1024 * 1024 });

const elements = 2**20;
const rowLength = 4;
let columnLength = elements / rowLength;
const v1 = F.prng(42n, elements);
const v2 = F.prng(42n, columnLength);

const w1 = wasm128.newVector(elements);
for (let i = 0; i < elements; i++) {
    w1.setValue(i, v1[i]);
}

const w2 = wasm128.newVector(columnLength);
for (let i = 0; i < columnLength; i++) {
    w2.setValue(i, v2[i]);
}

let start = Date.now();
const vM = F.vectorToMatrix(v1, rowLength);
console.log(`Transposed ${elements} elements in ${Date.now() - start} ms`);

start = Date.now();
const wM = wasm128.vectorToMatrix(w1, rowLength);
console.log(`Transposed ${elements} elements in ${Date.now() - start} ms`);

for (let i = 0; i < columnLength; i++) {
    for (let j = 0; j < rowLength; j++) {
        if (vM[i][j] !== wM.getValue(i, j)) {
            console.log(`> Transposition error in WASM at index ${i}!`);
            break;
        }
    }
}

start = Date.now();
const vEv = F.evalQuarticBatch(vM, v2);
console.log(`Evaluated ${columnLength} quartic polynomials in ${Date.now() - start} ms`);

start = Date.now();
const wEv = wasm128.evalQuarticBatch(wM, w2);
console.log(`Evaluated ${columnLength} quartic polynomials in ${Date.now() - start} ms`);

for (let i = 0; i < columnLength; i++) {
    if (vEv[i] !== wEv.getValue(i)) {
        console.log(`> Quartic batch evaluation error in WASM at index ${i}!`);
        break;
    }
}

console.log('done!');

/*
const elements = 2**20;
const polyDegree = elements / 16;

const rou = F.getRootOfUnity(elements);
const xs = F.getPowerSeries(rou, elements);
const poly = F.prng(42n, polyDegree);

let start = Date.now();
const ys = F.evalPolyAtRoots(poly, xs);
//const ys = F.interpolateRoots(xs, poly);
console.log(`Evaluated ${elements} elements in ${Date.now() - start} ms`);

const wPoly = wasm128.newVector(polyDegree);
for (let i = 0; i < polyDegree; i++) {
    wPoly.setValue(i, poly[i]);
}
const wXs = wasm128.newVector(elements);
for (let i = 0; i < elements; i++) {
    wXs.setValue(i, xs[i]);
}

start = Date.now();
const wYs = wasm128.evalPolyAtRoots(wPoly, wXs);
//const w3 = wasm128.interpolateRoots(w2, w1);
console.log(`Evaluated ${elements} elements in ${Date.now() - start} ms`);

for (let i = 0; i < elements; i++) {
    if (ys[i] !== wYs.getValue(i)) {
        console.log(`> Evaluation error in WASM at index ${i}!`);
        break;
    }
}
console.log('done!');

/*
import { Worker } from 'worker_threads';

const worker = new Worker('./tests/worker.js', { workerData: 'testing' });
worker.on('message', (message) => {
    console.log(`Message: ${message}`);
});

worker.on('error', (error) => {
    console.log(`Worker error: ${error.message}`);
});

worker.on('exit', (code) => {
    if (code !== 0) {
        console.error(`Worker stopped with exit code ${code}`);
    }
    else {
        console.log('Worker exited');
    }
});

worker.postMessage('ping');
*/