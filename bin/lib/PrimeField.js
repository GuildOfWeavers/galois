"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require("crypto");
const structures_1 = require("./structures");
const utils_1 = require("./utils");
// CLASS DEFINITION
// ================================================================================================
class PrimeField {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(modulus) {
        this.modulus = modulus;
        let bitWidth = 1;
        while (modulus != 1n) {
            modulus = modulus >> 1n;
            bitWidth++;
        }
        this.elementSize = Math.ceil(bitWidth / 8);
    }
    // PUBLIC ACCESSORS
    // --------------------------------------------------------------------------------------------
    get characteristic() {
        return this.modulus;
    }
    get extensionDegree() {
        return 1;
    }
    get zero() {
        return 0n;
    }
    get one() {
        return 1n;
    }
    // BASIC ARITHMETIC
    // --------------------------------------------------------------------------------------------
    mod(value) {
        return value >= 0n
            ? value % this.modulus
            : ((value % this.modulus) + this.modulus) % this.modulus;
    }
    add(x, y) {
        return this.mod(x + y);
    }
    sub(x, y) {
        return this.mod(x - y);
    }
    mul(x, y) {
        return this.mod(x * y);
    }
    div(x, y) {
        return this.mul(x, this.inv(y));
    }
    exp(base, exponent) {
        base = this.mod(base);
        if (base === 0n) {
            if (exponent === 0n) {
                throw new TypeError('Base and exponent cannot be both 0');
            }
            return 0n;
        }
        // handle raising to negative power
        if (exponent < 0n) {
            base = this.inv(base);
            exponent = -exponent;
        }
        let result = 1n;
        while (exponent > 0n) {
            if (exponent % 2n) {
                result = this.mul(result, base);
            }
            exponent = exponent / 2n;
            base = this.mul(base, base);
        }
        return result;
    }
    inv(a) {
        if (a === 0n)
            return a;
        let lm = 1n, hm = 0n;
        let low = this.mod(a);
        let high = this.modulus;
        while (low > 1n) {
            let r = high / low;
            let nm = hm - lm * r;
            let nw = high - low * r;
            high = low;
            hm = lm;
            lm = nm;
            low = nw;
        }
        return this.mod(lm);
    }
    neg(value) {
        return this.mod(0n - value);
    }
    // RANDOMNESS
    // --------------------------------------------------------------------------------------------
    rand() {
        const buffer = crypto.randomBytes(this.elementSize);
        return this.mod(BigInt('0x' + buffer.toString('hex')));
    }
    prng(seed, length) {
        if (length === undefined) {
            // if length is not specified, return just a single element
            return this.mod(utils_1.sha256(seed));
        }
        const result = new Array(length);
        let state = utils_1.sha256(seed);
        for (let i = 0; i < length; i++) {
            result[i] = this.mod(state);
            state = utils_1.sha256(state);
        }
        return this.newVectorFrom(result);
    }
    // VECTOR OPERATIONS
    // --------------------------------------------------------------------------------------------
    newVector(length) {
        return new structures_1.JsVector(new Array(length), this.elementSize);
    }
    newVectorFrom(values) {
        return new structures_1.JsVector(values, this.elementSize);
    }
    addVectorElements(a, b) {
        return (typeof b === 'bigint')
            ? this.vectorScalarOp(this.add, a, b)
            : this.vectorElementsOp(this.add, a, b);
    }
    subVectorElements(a, b) {
        return (typeof b === 'bigint')
            ? this.vectorScalarOp(this.sub, a, b)
            : this.vectorElementsOp(this.sub, a, b);
    }
    mulVectorElements(a, b) {
        return (typeof b === 'bigint')
            ? this.vectorScalarOp(this.mul, a, b)
            : this.vectorElementsOp(this.mul, a, b);
    }
    divVectorElements(a, b) {
        return (typeof b === 'bigint')
            ? this.vectorScalarOp(this.mul, a, this.inv(b))
            : this.vectorElementsOp(this.mul, a, this.invVectorElements(b));
    }
    expVectorElements(a, b) {
        return (typeof b === 'bigint')
            ? this.vectorScalarOp(this.exp, a, b)
            : this.vectorElementsOp(this.exp, a, b);
    }
    invVectorElements(source) {
        const rValues = new Array(source.length);
        const sValues = source.toValues();
        let last = 1n;
        for (let i = 0; i < source.length; i++) {
            rValues[i] = last;
            last = this.mod(last * (sValues[i] || 1n));
        }
        let inv = this.inv(last);
        for (let i = source.length - 1; i >= 0; i--) {
            rValues[i] = this.mod(sValues[i] ? rValues[i] * inv : 0n);
            inv = this.mul(inv, sValues[i] || 1n);
        }
        return this.newVectorFrom(rValues);
    }
    negVectorElements(source) {
        const rValues = new Array(source.length);
        const sValues = source.toValues();
        for (let i = 0; i < sValues.length; i++) {
            rValues[i] = this.mod(0n - sValues[i]);
        }
        return this.newVectorFrom(rValues);
    }
    combineVectors(a, b) {
        const aValues = a.toValues(), bValues = b.toValues();
        let result = 0n;
        for (let i = 0; i < a.length; i++) {
            result = this.mod(result + aValues[i] * bValues[i]);
        }
        return result;
    }
    combineManyVectors(v, k) {
        if (v.length !== k.length) {
            throw new Error('Number of vectors must be the same as number of coefficients');
        }
        const resultLength = v[0].length;
        const vValues = new Array(v.length);
        for (let i = 0; i < v.length; i++) {
            vValues[i] = v[i].toValues();
        }
        const kValues = k.toValues();
        const rValues = new Array(resultLength);
        for (let i = 0; i < resultLength; i++) {
            let sum = 0n;
            for (let j = 0; j < k.length; j++) {
                sum = this.mod(sum + kValues[j] * vValues[j][i]);
            }
            rValues[i] = sum;
        }
        return this.newVectorFrom(rValues);
    }
    pluckVector(v, skip, times) {
        const vValues = v.toValues();
        const rValues = new Array(times);
        for (let i = 0; i < times; i++) {
            rValues[i] = vValues[(i * skip) % vValues.length];
        }
        return this.newVectorFrom(rValues);
    }
    truncateVector(v, newLength) {
        return this.newVectorFrom(v.toValues().slice(0, newLength));
    }
    duplicateVector(v, times = 1) {
        let rValues = v.toValues();
        for (let i = 0; i < times; i++) {
            rValues = rValues.concat(rValues);
        }
        return this.newVectorFrom(rValues);
    }
    vectorToMatrix(v, columns) {
        const rowCount = v.length / columns;
        if (!Number.isInteger(rowCount)) {
            throw new Error('Number of columns does not evenly divide vector length');
        }
        const vValues = v.toValues();
        const rValues = new Array();
        for (let i = 0; i < rowCount; i++) {
            let row = new Array(columns);
            for (let j = 0; j < columns; j++) {
                row[j] = vValues[i + j * rowCount];
            }
            rValues[i] = row;
        }
        return this.newMatrixFrom(rValues);
    }
    vectorElementsOp(op, a, b) {
        const aValues = a.toValues(), bValues = b.toValues();
        const rValues = new Array(a.length);
        for (let i = 0; i < rValues.length; i++) {
            rValues[i] = op.call(this, aValues[i], bValues[i]);
        }
        return new structures_1.JsVector(rValues, this.elementSize);
    }
    vectorScalarOp(op, a, b) {
        const aValues = a.toValues();
        const rValues = new Array(a.length);
        for (let i = 0; i < rValues.length; i++) {
            rValues[i] = op.call(this, aValues[i], b);
        }
        return new structures_1.JsVector(rValues, this.elementSize);
    }
    // MATRIX OPERATIONS
    // --------------------------------------------------------------------------------------------
    newMatrix(rows, columns) {
        const values = new Array(rows);
        for (let i = 0; i < rows; i++) {
            values[i] = new Array(columns);
        }
        return new structures_1.JsMatrix(values, this.elementSize);
    }
    newMatrixFrom(values) {
        return new structures_1.JsMatrix(values, this.elementSize);
    }
    addMatrixElements(a, b) {
        return (typeof b === 'bigint')
            ? this.matrixScalarOp(this.add, a, b)
            : this.matrixElementsOp(this.add, a, b);
    }
    subMatrixElements(a, b) {
        return (typeof b === 'bigint')
            ? this.matrixScalarOp(this.sub, a, b)
            : this.matrixElementsOp(this.sub, a, b);
    }
    mulMatrixElements(a, b) {
        return (typeof b === 'bigint')
            ? this.matrixScalarOp(this.mul, a, b)
            : this.matrixElementsOp(this.mul, a, b);
    }
    divMatrixElements(a, b) {
        return (typeof b === 'bigint')
            ? this.matrixScalarOp(this.mul, a, this.inv(b))
            : this.matrixElementsOp(this.div, a, b);
    }
    expMatrixElements(a, b) {
        return (typeof b === 'bigint')
            ? this.matrixScalarOp(this.exp, a, b)
            : this.matrixElementsOp(this.exp, a, b);
    }
    invMatrixElements(source) {
        const sValues = source.toValues();
        const rValues = new Array(source.rowCount);
        let last = 1n;
        for (let i = 0; i < source.rowCount; i++) {
            let sRow = sValues[i];
            let rRow = new Array(sRow.length);
            for (let j = 0; j < sRow.length; j++) {
                rRow[j] = last;
                last = this.mod(last * (sRow[j] || 1n));
            }
            rValues[i] = rRow;
        }
        let inv = this.inv(last);
        for (let i = source.rowCount - 1; i >= 0; i--) {
            let sRow = sValues[i];
            let rRow = rValues[i];
            for (let j = sRow.length - 1; j >= 0; j--) {
                rRow[j] = this.mod(sRow[j] ? sRow[j] * inv : 0n);
                inv = this.mul(inv, sRow[j] || 1n);
            }
        }
        return this.newMatrixFrom(rValues);
    }
    negMatrixElements(source) {
        const sValues = source.toValues();
        const rValues = new Array(source.rowCount);
        for (let i = 0; i < source.rowCount; i++) {
            let sRow = sValues[i];
            let rRow = new Array(sRow.length);
            for (let j = 0; j < sRow.length; j++) {
                rRow[j] = this.mod(0n - sRow[j]);
            }
            rValues[i] = rRow;
        }
        return this.newMatrixFrom(rValues);
    }
    mulMatrixes(a, b) {
        const n = a.rowCount;
        const m = a.colCount;
        const p = b.colCount;
        const aValues = a.toValues(), bValues = b.toValues();
        const rValues = new Array(n);
        for (let i = 0; i < n; i++) {
            let row = rValues[i] = new Array(p);
            for (let j = 0; j < p; j++) {
                let s = 0n;
                for (let k = 0; k < m; k++) {
                    s = this.add(s, this.mul(aValues[i][k], bValues[k][j]));
                }
                row[j] = s;
            }
        }
        return this.newMatrixFrom(rValues);
    }
    mulMatrixByVector(m, v) {
        const mValues = m.toValues();
        const vValues = v.toValues();
        const rValues = new Array(m.rowCount);
        for (let i = 0; i < rValues.length; i++) {
            let s = 0n;
            let row = mValues[i];
            for (let j = 0; j < v.length; j++) {
                s = this.add(s, this.mul(row[j], vValues[j]));
            }
            rValues[i] = s;
        }
        return new structures_1.JsVector(rValues, this.elementSize);
    }
    mulMatrixRows(m, v) {
        if (m.colCount !== v.length) {
            throw new Error('Vector length must match the number of matrix columns');
        }
        let mValues = m.toValues();
        let vValues = v.toValues();
        let rValues = new Array(m.rowCount);
        for (let i = 0; i < m.rowCount; i++) {
            let row = new Array(v.length);
            for (let j = 0; j < v.length; j++) {
                row[j] = this.mod(mValues[i][j] * vValues[j]);
            }
            rValues[i] = row;
        }
        return this.newMatrixFrom(rValues);
    }
    matrixRowsToVectors(m) {
        const mValues = m.toValues();
        const result = new Array(m.rowCount);
        for (let i = 0; i < m.rowCount; i++) {
            result[i] = this.newVectorFrom(mValues[i]);
        }
        return result;
    }
    matrixElementsOp(op, a, b) {
        const aValues = a.toValues(), bValues = b.toValues();
        const rValues = new Array(a.rowCount);
        for (let i = 0; i < rValues.length; i++) {
            let r1 = aValues[i], r2 = bValues[i];
            let row = rValues[i] = new Array(r1.length);
            for (let j = 0; j < row.length; j++) {
                row[j] = op.call(this, r1[j], r2[j]);
            }
        }
        return this.newMatrixFrom(rValues);
    }
    matrixScalarOp(op, a, b) {
        const aValues = a.toValues();
        const rValues = new Array(a.rowCount);
        for (let i = 0; i < rValues.length; i++) {
            let row = rValues[i] = new Array(aValues[i].length);
            for (let j = 0; j < row.length; j++) {
                row[j] = op.call(this, aValues[i][j], b);
            }
        }
        return this.newMatrixFrom(rValues);
    }
    // OTHER OPERATIONS
    // --------------------------------------------------------------------------------------------
    getRootOfUnity(order) {
        if (!utils_1.isPowerOf2(order)) {
            throw new Error('Order of unity must be 2^n');
        }
        // TODO: improve algorithm (for non 2**n roots), add upper bound
        const bigOrder = BigInt(order);
        for (let i = 2n; i < this.modulus; i++) {
            let g = this.exp(i, (this.modulus - 1n) / bigOrder);
            if (this.exp(g, bigOrder) === 1n && this.exp(g, bigOrder / 2n) !== 1n) {
                return g;
            }
        }
        throw new Error(`Root of Unity for order ${order} was not found`);
    }
    getPowerSeries(seed, length) {
        const powers = new Array(length);
        powers[0] = 1n;
        for (let i = 1; i < length; i++) {
            powers[i] = this.mul(powers[i - 1], seed);
        }
        return this.newVectorFrom(powers);
    }
    // POLYNOMIALS
    // --------------------------------------------------------------------------------------------
    addPolys(a, b) {
        const aValues = a.toValues(), bValues = b.toValues();
        const rValues = new Array(Math.max(a.length, b.length));
        for (let i = 0; i < rValues.length; i++) {
            let coefficientA = (i < a.length ? aValues[i] : 0n);
            let coefficientB = (i < b.length ? bValues[i] : 0n);
            rValues[i] = this.mod(coefficientA + coefficientB);
        }
        return this.newVectorFrom(rValues);
    }
    subPolys(a, b) {
        const aValues = a.toValues(), bValues = b.toValues();
        const rValues = new Array(Math.max(a.length, b.length));
        for (let i = 0; i < rValues.length; i++) {
            let coefficientA = (i < a.length ? aValues[i] : 0n);
            let coefficientB = (i < b.length ? bValues[i] : 0n);
            rValues[i] = this.mod(coefficientA - coefficientB);
        }
        return this.newVectorFrom(rValues);
    }
    mulPolys(a, b) {
        const aValues = a.toValues(), bValues = b.toValues();
        const rValues = new Array(a.length + b.length - 1);
        for (let i = 0; i < a.length; i++) {
            for (let j = 0; j < b.length; j++) {
                let k = i + j;
                rValues[k] = this.mod((rValues[k] || 0n) + aValues[i] * bValues[j]);
            }
        }
        return this.newVectorFrom(rValues);
    }
    divPolys(a, b) {
        const aValues = a.toValues().slice(), bValues = b.toValues();
        let apos = lastNonZeroIndex(aValues);
        let bpos = lastNonZeroIndex(bValues);
        if (apos < bpos) {
            throw new Error('Cannot divide by polynomial of higher order');
        }
        let diff = apos - bpos;
        let rValues = new Array(diff + 1);
        for (let p = rValues.length - 1; diff >= 0; diff--, apos--, p--) {
            let quot = this.div(aValues[apos], bValues[bpos]);
            rValues[p] = quot;
            for (let i = bpos; i >= 0; i--) {
                aValues[diff + i] = this.mod(aValues[diff + i] - bValues[i] * quot);
            }
        }
        return this.newVectorFrom(rValues);
    }
    mulPolyByConstant(a, c) {
        const aValues = a.toValues();
        const rValues = new Array(a.length);
        for (let i = 0; i < rValues.length; i++) {
            rValues[i] = this.mod(aValues[i] * c);
        }
        return this.newVectorFrom(rValues);
    }
    // POLYNOMIAL EVALUATION
    // --------------------------------------------------------------------------------------------
    evalPolyAt(p, x) {
        const pValues = p.toValues();
        switch (p.length) {
            case 0: return 0n;
            case 1: return pValues[0];
            case 2: return this.mod(pValues[0] + pValues[1] * x);
            case 3: return this.mod(pValues[0] + pValues[1] * x + pValues[2] * x * x);
            case 4: {
                const x2 = x * x;
                const x3 = x2 * x;
                return this.mod(pValues[0] + pValues[1] * x + pValues[2] * x2 + pValues[3] * x3);
            }
            case 5: {
                const x2 = x * x;
                const x3 = x2 * x;
                return this.mod(pValues[0] + pValues[1] * x + pValues[2] * x2 + pValues[3] * x3 + pValues[4] * x3 * x);
            }
            default: {
                let y = 0n;
                let powerOfx = 1n;
                for (let i = 0; i < p.length; i++) {
                    y = this.mod(y + pValues[i] * powerOfx);
                    powerOfx = this.mul(powerOfx, x);
                }
                return y;
            }
        }
    }
    evalPolyAtRoots(p, rootsOfUnity) {
        if (!utils_1.isPowerOf2(rootsOfUnity.length)) {
            throw new Error('Number of roots of unity must be a power of 2');
        }
        if (p.length > rootsOfUnity.length) {
            throw new Error('Polynomial degree must be smaller than or equal to the number of roots of unity');
        }
        let pValues = p.toValues();
        // make sure values and roots of unity are of the same length
        if (rootsOfUnity.length > p.length) {
            let tValues = new Array(rootsOfUnity.length);
            for (let i = 0; i < p.length; i++) {
                tValues[i] = pValues[i];
            }
            tValues.fill(0n, p.length);
            pValues = tValues;
        }
        const rValues = fastFT(pValues, rootsOfUnity.toValues(), 0, 0, this);
        return this.newVectorFrom(rValues);
    }
    evalPolysAtRoots(p, rootsOfUnity) {
        if (!utils_1.isPowerOf2(rootsOfUnity.length)) {
            throw new Error('Number of roots of unity must be a power of 2');
        }
        const pValues = p.toValues();
        const polys = new Array(p.rowCount);
        for (let i = 0; i < p.rowCount; i++) {
            if (pValues[i].length === rootsOfUnity.length) {
                polys[i] = pValues[i];
            }
            else if (pValues[i].length > rootsOfUnity.length) {
                // make sure values and roots of unity are of the same length
                let tValues = new Array(rootsOfUnity.length);
                for (let j = 0; j < pValues[i].length; j++) {
                    tValues[j] = pValues[i][j];
                }
                tValues.fill(0n, pValues[i].length);
                polys[i] = tValues;
            }
            else {
                throw new Error('Polynomial degree must be smaller than or equal to the number of roots of unity');
            }
        }
        const xValues = rootsOfUnity.toValues();
        const rValues = new Array(p.rowCount);
        for (let i = 0; i < p.rowCount; i++) {
            rValues[i] = fastFT(polys[i], xValues, 0, 0, this);
        }
        return this.newMatrixFrom(rValues);
    }
    evalQuarticBatch(polys, xs) {
        if (polys.rowCount !== xs.length) {
            throw new Error('Number of quartic polynomials must be the same as the number of x coordinates');
        }
        const pValues = polys.toValues();
        const xValues = xs.toValues();
        const rValues = new Array(xs.length);
        for (let i = 0; i < xs.length; i++) {
            rValues[i] = this.evalPolyAt(this.newVectorFrom(pValues[i]), xValues[i]);
        }
        return this.newVectorFrom(rValues);
    }
    // POLYNOMIAL INTERPOLATION
    // --------------------------------------------------------------------------------------------
    interpolate(xs, ys) {
        if (xs.length !== ys.length) {
            throw new Error('Number of x coordinates must be the same as number of y coordinates');
        }
        const xsValues = xs.toValues();
        const root = this.newVectorFrom(zpoly(xsValues, this));
        let divisor = this.newVectorFrom([0n, 1n]);
        const numerators = new Array(xs.length);
        for (let i = 0; i < xs.length; i++) {
            divisor.values[0] = -xsValues[i];
            numerators[i] = this.divPolys(root, divisor);
        }
        const denominators = new Array(xs.length);
        for (let i = 0; i < xs.length; i++) {
            denominators[i] = this.evalPolyAt(numerators[i], xsValues[i]);
        }
        const invDenValues = this.invVectorElements(this.newVectorFrom(denominators)).values;
        const yValues = ys.toValues();
        const rValues = new Array(xs.length).fill(0n);
        for (let i = 0; i < xs.length; i++) {
            let ySlice = this.mod(yValues[i] * invDenValues[i]);
            for (let j = 0; j < xs.length; j++) {
                if (numerators[i].values[j] && yValues[i]) {
                    rValues[j] = this.mod(rValues[j] + numerators[i].values[j] * ySlice);
                }
            }
        }
        return this.newVectorFrom(rValues);
    }
    interpolateRoots(rootsOfUnity, ys) {
        if (!utils_1.isPowerOf2(rootsOfUnity.length)) {
            throw new Error('Number of roots of unity must be 2^n');
        }
        // reverse roots of unity
        const rouValues = rootsOfUnity.toValues();
        const invlen = this.exp(BigInt(rootsOfUnity.length), this.modulus - 2n);
        let reversedRoots = new Array(rootsOfUnity.length);
        reversedRoots[0] = 1n;
        for (let i = rootsOfUnity.length - 1, j = 1; i > 0; i--, j++) {
            reversedRoots[j] = rouValues[i];
        }
        // run FFT to compute the interpolation
        if (ys instanceof structures_1.JsVector) {
            if (rootsOfUnity.length !== ys.length) {
                throw new Error('Number of roots of unity must be the same as number of y coordinates');
            }
            const yValues = ys.toValues();
            const rValues = fastFT(yValues, reversedRoots, 0, 0, this);
            for (let i = 0; i < rValues.length; i++) {
                rValues[i] = this.mod(rValues[i] * invlen);
            }
            return this.newVectorFrom(rValues);
        }
        else if (ys instanceof structures_1.JsMatrix) {
            const yValues = ys.toValues();
            const rValues = new Array(ys.rowCount);
            for (let i = 0; i < ys.rowCount; i++) {
                if (rootsOfUnity.length !== yValues[i].length) {
                    throw new Error('Number of roots of unity must be the same as number of y coordinates');
                }
                let rowValues = fastFT(yValues[i], reversedRoots, 0, 0, this);
                for (let j = 0; j < rValues.length; j++) {
                    rowValues[j] = this.mod(rowValues[j] * invlen);
                }
                rValues[i] = rowValues;
            }
            return this.newMatrixFrom(rValues);
        }
        else {
            throw new Error(`y-coordinates object is invalid`);
        }
    }
    interpolateQuarticBatch(xSets, ySets) {
        const data = new Array(xSets.rowCount);
        const inverseTargets = new Array(xSets.rowCount * 4);
        const xsValues = xSets.toValues(), ysValues = ySets.toValues();
        for (let i = 0; i < xSets.rowCount; i++) {
            let xs = xsValues[i];
            let ys = ysValues[i];
            let x01 = xs[0] * xs[1];
            let x02 = xs[0] * xs[2];
            let x03 = xs[0] * xs[3];
            let x12 = xs[1] * xs[2];
            let x13 = xs[1] * xs[3];
            let x23 = xs[2] * xs[3];
            let eq0 = [-x12 * xs[3], x12 + x13 + x23, -xs[1] - xs[2] - xs[3], 1n];
            let eq1 = [-x02 * xs[3], x02 + x03 + x23, -xs[0] - xs[2] - xs[3], 1n];
            let eq2 = [-x01 * xs[3], x01 + x03 + x13, -xs[0] - xs[1] - xs[3], 1n];
            let eq3 = [-x01 * xs[2], x01 + x02 + x12, -xs[0] - xs[1] - xs[2], 1n];
            let e0 = this.evalPolyAt(this.newVectorFrom(eq0), xs[0]);
            let e1 = this.evalPolyAt(this.newVectorFrom(eq1), xs[1]);
            let e2 = this.evalPolyAt(this.newVectorFrom(eq2), xs[2]);
            let e3 = this.evalPolyAt(this.newVectorFrom(eq3), xs[3]);
            inverseTargets[i * 4 + 0] = e0;
            inverseTargets[i * 4 + 1] = e1;
            inverseTargets[i * 4 + 2] = e2;
            inverseTargets[i * 4 + 3] = e3;
            data[i] = [ys, eq0, eq1, eq2, eq3];
        }
        const inverseValues = this.invVectorElements(this.newVectorFrom(inverseTargets)).values;
        const rValues = new Array(data.length);
        for (let i = 0; i < data.length; i++) {
            let [ys, eq0, eq1, eq2, eq3] = data[i];
            let invY0 = ys[0] * inverseValues[i * 4 + 0];
            let invY1 = ys[1] * inverseValues[i * 4 + 1];
            let invY2 = ys[2] * inverseValues[i * 4 + 2];
            let invY3 = ys[3] * inverseValues[i * 4 + 3];
            rValues[i] = [
                this.mod(eq0[0] * invY0 + eq1[0] * invY1 + eq2[0] * invY2 + eq3[0] * invY3),
                this.mod(eq0[1] * invY0 + eq1[1] * invY1 + eq2[1] * invY2 + eq3[1] * invY3),
                this.mod(eq0[2] * invY0 + eq1[2] * invY1 + eq2[2] * invY2 + eq3[2] * invY3),
                this.mod(eq0[3] * invY0 + eq1[3] * invY1 + eq2[3] * invY2 + eq3[3] * invY3)
            ];
        }
        return this.newMatrixFrom(rValues);
    }
}
exports.PrimeField = PrimeField;
// HELPER FUNCTIONS
// ================================================================================================
function fastFT(values, roots, depth, offset, F) {
    const step = 1 << depth;
    const resultLength = roots.length / step;
    // if only 4 values left, use simple FT
    if (resultLength <= 4) {
        const result = new Array(4);
        for (let i = 0; i < 4; i++) {
            let last = values[offset] * roots[0];
            last += values[offset + step] * roots[i * step];
            last += values[offset + 2 * step] * roots[(i * 2) % 4 * step];
            last += values[offset + 3 * step] * roots[(i * 3) % 4 * step];
            result[i] = F.mod(last);
        }
        return result;
    }
    const even = fastFT(values, roots, depth + 1, offset, F);
    const odd = fastFT(values, roots, depth + 1, offset + step, F);
    const halfLength = resultLength / 2;
    const result = new Array(resultLength);
    for (let i = 0; i < halfLength; i++) {
        let x = even[i];
        let y = odd[i];
        let yTimesRoot = y * roots[i * step];
        result[i] = F.add(x, yTimesRoot);
        result[i + halfLength] = F.sub(x, yTimesRoot);
    }
    return result;
}
function zpoly(xs, field) {
    const result = new Array(xs.length + 1);
    result[result.length - 1] = 1n;
    let p = result.length - 2;
    for (let i = 0; i < xs.length; i++, p--) {
        result[p] = 0n;
        for (let j = p; j < result.length - 1; j++) {
            result[j] = field.mod(result[j] - result[j + 1] * xs[i]);
        }
    }
    return result;
}
function lastNonZeroIndex(values) {
    for (let i = values.length - 1; i >= 0; i--) {
        if (values[i] !== 0n)
            return i;
    }
}
//# sourceMappingURL=PrimeField.js.map