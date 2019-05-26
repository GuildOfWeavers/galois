// IMPORTS
// ================================================================================================
import { FiniteField, Polynom } from '@guildofweavers/galois';
import * as crypto from 'crypto';
import { isPowerOf2, sha256 } from './utils';

// CLASS DEFINITION
// ================================================================================================
export class PrimeField implements FiniteField {

    readonly modulus    : bigint;
    readonly elementSize: number;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(modulus: bigint) {
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
    get characteristic(): bigint {
        return this.modulus;
    }

    get extensionDegree(): number {
        return 1;
    }

    // BASIC ARITHMETIC
    // --------------------------------------------------------------------------------------------
    mod(value: bigint): bigint {
        return value >= 0n
            ? value % this.modulus
            : ((value % this.modulus) + this.modulus) % this.modulus;
    }

    add(x: bigint, y: bigint): bigint {
        return this.mod(x + y);
    }

    sub(x: bigint, y: bigint): bigint {
        return this.mod(x - y);
    }

    mul(x: bigint, y: bigint): bigint {
        return this.mod(x * y);
    }

    div(x: bigint, y: bigint) {
        return this.mul(x, this.inv(y));
    }

    exp(base: bigint, exponent: bigint): bigint {
        base = this.mod(base);
        if (base === 0n && exponent === 0n) {
            throw new TypeError('Base and exponent cannot be both 0');
        }

        let result = 1n;
        while (exponent > 0n) {
            if (base === 0n) return 0n;
            if (exponent % 2n) {
                result = this.mul(result, base);
            }
            exponent = exponent / 2n;
            base = this.mul(base, base);
        }

        return result;
    }

    inv(a: bigint): bigint {
        if (a === 0n) return a;
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

    // RANDOMNESS
    // --------------------------------------------------------------------------------------------
    rand(): bigint {
        const buffer = crypto.randomBytes(this.elementSize);
        return this.mod(BigInt('0x' + buffer.toString('hex')));
    }

    prng(seed: bigint | Buffer): bigint
    prng(seed: bigint | Buffer, length?: number): bigint[];
    prng(seed: bigint | Buffer, length?: number): bigint[] | bigint {
        if (length === undefined) {
            // if length is not specified, return just a single element
            return this.mod(sha256(seed));
        }

        const result = new Array<bigint>(length);
        let numseed = sha256(seed);
        for (let i = 0; i < length; i++) {
            result[i] = this.mod(numseed);
            numseed = sha256(numseed);
        }
        return result;
    }

    // BATCH OPERATIONS
    // --------------------------------------------------------------------------------------------
    invMany(values: bigint[]): bigint[] {

        const result = new Array<bigint>(values.length);
        let last = 1n;
        for (let i = 0; i < values.length; i++) {
            result[i] = last;
            last = this.mod(last * (values[i] || 1n));
        }

        let inv = this.inv(last);
        for (let i = values.length - 1; i >= 0; i--) {
            result[i] = this.mod(values[i] ? result[i] * inv : 0n);
            inv = this.mul(inv, values[i] || 1n);
        }
        return result;
    }

    mulMany(values: bigint[][], m1: bigint[], m2?: bigint[]): bigint[][] {
        const colCount = values.length;
        const rowCount = values[0].length;

        const result = new Array<bigint[]>(colCount);
        for (let i = 0; i < colCount; i++) {
            result[i] = new Array<bigint>(rowCount);
        }

        for (let r = 0; r < rowCount; r++) {
            let mv1 = m1[r], mv2 = m2 ? m2[r] : 1n;
            for (let c = 0; c < colCount; c++) {
                result[c][r] = this.mod(values[c][r] * mv1 * mv2);
            }
        }

        return result;
    }

    combine(values: bigint[], coefficients: bigint[]): bigint {
        let result = 0n;
        for (let i = 0; i < values.length; i++) {
            result = this.mod(result + values[i] * coefficients[i]);
        }
        return result;
    }

    combineMany(values: bigint[][], coefficients: bigint[]): bigint[] {
        const colCount = values.length;
        const rowCount = values[0].length;
        const result = new Array<bigint>(rowCount);

        for (let r = 0; r < rowCount; r++) {
            let v = 0n;
            for (let c = 0; c < colCount; c++) {
                v = this.mod(v + values[c][r] * coefficients[c]);
            }
            result[r] = v;
        }

        return result;
    }

    getPowerSeries(seed: bigint, length: number): bigint[] {
        const powers = new Array<bigint>(length);
        powers[0] = 1n;
        for (let i = 1; i < length; i++) {
            powers[i] = this.mul(powers[i-1], seed);
        }
        return powers;
    }

    // ROOTS OF UNITY
    // --------------------------------------------------------------------------------------------
    getRootOfUnity(order: number): bigint {
        if (!isPowerOf2(order)) {
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

    getPowerCycle(rootOfUnity: bigint): bigint[] {
        const result = [1n];
        let value = rootOfUnity;
        while (value !== 1n) {
            result.push(value);
            value = this.mul(value, rootOfUnity);
        }
        return result;
    }

    // POLYNOMIALS
    // --------------------------------------------------------------------------------------------
    addPolys(a: Polynom, b: Polynom): Polynom {
        const result: Polynom = new Array(Math.max(a.length, b.length));
        for (let i = 0; i < result.length; i++) {
            let coefficientA = (i < a.length ? a[i] : 0n);
            let coefficientB = (i < b.length ? b[i] : 0n);
            result[i] = this.mod(coefficientA + coefficientB);
        }
        return result;
    }

    subPolys(a: Polynom, b: Polynom): Polynom {
        const result: Polynom = new Array(Math.max(a.length, b.length));
        for (let i = 0; i < result.length; i++) {
            let coefficientA = (i < a.length ? a[i] : 0n);
            let coefficientB = (i < b.length ? b[i] : 0n);
            result[i] = this.mod(coefficientA - coefficientB);
        }
        return result;
    }

    mulPolys(a: Polynom, b: Polynom): Polynom {
        const result: Polynom = new Array(a.length + b.length - 1);
        for (let i = 0; i < a.length; i++) {
            for (let j = 0; j < b.length; j++) {
                let k = i + j;
                result[k] = this.mod((result[k] ? result[k] : 0n) + a[i] * b[j]);
            }
        }
        return result;
    }

    divPolys(a: Polynom, b: Polynom): Polynom {
        if (a.length < b.length) {
            throw new Error('Cannot divide by polynomial of higher order');
        }
        
        let apos = a.length - 1;
        let bpos = b.length - 1;
        let diff = apos - bpos;

        a = a.slice();
        let result: Polynom = new Array(diff + 1);

        for (let p = result.length - 1; diff >= 0; diff--, apos--, p--) {
            let quot = this.div(a[apos], b[bpos]);
            result[p] = quot;
            for (let i = bpos; i >= 0; i--) {
                a[diff + i] = this.mod(a[diff + i] - b[i] * quot);
            }
        }

        return result;
    }

    mulPolyByConstant(a: Polynom, c: bigint): Polynom {
        const result: Polynom = new Array(a.length);
        for (let i = 0; i < result.length; i++) {
            result[i] = this.mod(a[i] * c);
        }
        return result;
    }

    evalPolyAt(p: Polynom, x: bigint): bigint {
        switch (p.length) {
            case 0: return 0n;
            case 1: return p[0];
            case 2: return this.mod(p[0] + p[1] * x);
            case 3: return this.mod(p[0] + p[1] * x + p[2] * x * x);
            case 4: {
                const x2 = x * x;
                const x3 = x2 * x;
                return this.mod(p[0] + p[1] * x + p[2] * x2 + p[3] * x3);
            }
            case 5: {
                const x2 = x * x;
                const x3 = x2 * x;
                return this.mod(p[0] + p[1] * x + p[2] * x2 + p[3] * x3 + p[4] * x3 * x);
            }
            default: {
                let y = 0n;
                let powerOfx = 1n;

                for (let i = 0; i < p.length; i++) {
                    y = this.mod(y + p[i] * powerOfx);
                    powerOfx = this.mul(powerOfx, x);
                }

                return y;
            }
        }
    }

    evalPolyAtRoots(p: Polynom, rootsOfUnity: bigint[]): bigint[] {
        if (p.length > rootsOfUnity.length) {
            throw new Error('Number of roots of unity cannot be smaller than number of values');
        }
        else if (!isPowerOf2(rootsOfUnity.length)) {
            throw new Error('Number of roots of unity must be 2^n');
        }

        let values = p;

        // make sure values and roots of unity are of the same length
        if (rootsOfUnity.length > p.length) {
            values = new Array(rootsOfUnity.length);
            for (let i = 0; i < p.length; i++) {
                values[i] = p[i];
            }
            for (let i = p.length; i < values.length; i++) {
                values[i] = 0n;
            }
        }

        const result = fastFF(values, rootsOfUnity, 0, 0, this);
        return result;
    }

    interpolate(xs: bigint[], ys: bigint[]): Polynom {
        if (xs.length !== ys.length) {
            throw new Error('Number of x coordinates must be the same as number of y coordinates');
        }

        const root = zpoly(xs, this);
        const numerators = new Array<bigint[]>(xs.length);
        for (let i = 0; i < xs.length; i++) {
            numerators[i] = this.divPolys(root, [-xs[i], 1n]);
        }

        const denominators = new Array<bigint>(xs.length);
        for (let i = 0; i < xs.length; i++) {
            denominators[i] = this.evalPolyAt(numerators[i], xs[i]);
        }
        const invertedDenominators = this.invMany(denominators);

        const result: Polynom = new Array(ys.length).fill(0n);
        for (let i = 0; i < xs.length; i++) {
            let ySlice = this.mod(ys[i] * invertedDenominators[i]);
            for (let j = 0; j < ys.length; j++) {
                if (numerators[i][j] && ys[i]) {
                    result[j] = this.mod(result[j] + numerators[i][j] * ySlice);
                }
            }
        }

        return result;
    }

    interpolateRoots(rootsOfUnity: bigint[], ys: bigint[]): Polynom {
        if (rootsOfUnity.length !== ys.length) {
            throw new Error('Number of roots of unity must be the same as number of y coordinates');
        }
        else if (!isPowerOf2(rootsOfUnity.length)) {
            throw new Error('Number of roots of unity must be 2^n');
        }

        const invlen = this.exp(BigInt(ys.length), this.modulus - 2n);
        let reversedRoots = new Array<bigint>(rootsOfUnity.length);
        reversedRoots[0] = 1n;
        for (let i = rootsOfUnity.length - 1, j = 1; i > 0; i--, j++) {
            reversedRoots[j] = rootsOfUnity[i];
        }

        const result = fastFF(ys, reversedRoots, 0, 0, this);
        for (let i = 0; i < result.length; i++) {
            result[i] = this.mod(result[i] * invlen);
        }
        return result;
    }

    interpolateQuarticBatch(xSets: bigint[][], ySets: bigint[][]): Polynom[] {
        const data = new Array<[bigint[], Polynom, Polynom, Polynom, Polynom]>(xSets.length);
        const inverseTargets = new Array<bigint>(xSets.length * 4);

        for (let i = 0; i < xSets.length; i++) {
            let xs = xSets[i];
            let ys = ySets[i];

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

            let e0 = this.evalPolyAt(eq0, xs[0]);
            let e1 = this.evalPolyAt(eq1, xs[1]);
            let e2 = this.evalPolyAt(eq2, xs[2]);
            let e3 = this.evalPolyAt(eq3, xs[3]);

            inverseTargets[i * 4 + 0] = e0;
            inverseTargets[i * 4 + 1] = e1;
            inverseTargets[i * 4 + 2] = e2;
            inverseTargets[i * 4 + 3] = e3;

            data[i] = [ys, eq0, eq1, eq2, eq3];
        }

        const inverseValues = this.invMany(inverseTargets);
        const result = new Array<bigint[]>(data.length);
        for (let i = 0; i < data.length; i++) {
            let [ys, eq0, eq1, eq2, eq3] = data[i];

            let invY0 = ys[0] * inverseValues[i * 4 + 0];
            let invY1 = ys[1] * inverseValues[i * 4 + 1];
            let invY2 = ys[2] * inverseValues[i * 4 + 2];
            let invY3 = ys[3] * inverseValues[i * 4 + 3];

            result[i] = [
                this.mod(eq0[0] * invY0 + eq1[0] * invY1 + eq2[0] * invY2 + eq3[0] * invY3),
                this.mod(eq0[1] * invY0 + eq1[1] * invY1 + eq2[1] * invY2 + eq3[1] * invY3),
                this.mod(eq0[2] * invY0 + eq1[2] * invY1 + eq2[2] * invY2 + eq3[2] * invY3),
                this.mod(eq0[3] * invY0 + eq1[3] * invY1 + eq2[3] * invY2 + eq3[3] * invY3)
            ];
        }

        return result;
    }
}

// HELPER FUNCTIONS
// ================================================================================================
function fastFF(values: bigint[], roots: bigint[], depth: number, offset: number, F: PrimeField) {

    const step = 1 << depth;
    const resultLength = roots.length / step;

    // if only 4 values left, use simple FT
    if (resultLength <= 4) {
        const result = new Array<bigint>(4);
        for (let i = 0; i < 4; i++) {
            let last = values[offset] * roots[0];
            last += values[offset + step] * roots[i * step];
            last += values[offset + 2 * step] * roots[(i * 2) % 4 * step];
            last += values[offset + 3 * step] * roots[(i * 3) % 4 * step];
            result[i] = F.mod(last);
        }
        return result;
    }
    
    const even = fastFF(values, roots, depth + 1, offset, F);
    const odd = fastFF(values, roots, depth + 1, offset + step, F);

    const halfLength = resultLength / 2;
    const result = new Array<bigint>(resultLength);
    for (let i = 0; i < halfLength; i++) {
        let x = even[i];
        let y = odd[i];
        let yTimesRoot = y * roots[i * step];
        result[i] = F.add(x, yTimesRoot);
        result[i + halfLength] = F.sub(x, yTimesRoot);
    }

    return result;
}

function zpoly(xs: bigint[], F: PrimeField): Polynom {
    const result: Polynom = new Array(xs.length + 1);
    result[result.length - 1] = 1n;

    let p = result.length - 2;
    for (let i = 0; i < xs.length; i++, p--) {
        result[p] = 0n;
        for (let j = p; j < result.length - 1; j++) {
            result[j] = F.mod(result[j] - result[j + 1] * xs[i]);
        }
    }
    return result;
}