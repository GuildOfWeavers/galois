// IMPORTS
// ================================================================================================
import { FiniteField, Polynom } from '@guildofweavers/galois';

// CLASS DEFINITION
// ================================================================================================
export class BinaryField implements FiniteField {

    readonly modulus        : bigint;
    readonly extensionDegree: number;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(modulus: bigint) {
        this.modulus = modulus;

        let degree = 0;
        while (modulus !== 1n) {
          degree++;
          modulus = modulus >> 1n;
        }
        this.extensionDegree = degree;
    }

    // PUBLIC ACCESSORS
    // --------------------------------------------------------------------------------------------
    get characteristic(): bigint {
        return 2n;
    }

    get elementSize(): number {
        return Math.ceil(this.extensionDegree / 8);
    }

    // BASIC ARITHMETIC
    // --------------------------------------------------------------------------------------------
    add(x: bigint, y: bigint): bigint {
        return x ^ y;
    }

    sub(x: bigint, y: bigint): bigint {
        return x ^ y;
    }

    mul(x: bigint, y: bigint): bigint {
        const m = this.modulus;
        const h = 1n << BigInt(this.extensionDegree - 1);
        let p = 0n;

        while (x && y) {
            if (y & 1n) {
                p = p ^ x;
            }
            y = y >> 1n;

            if (x & h) {
                x = (x << 1n) ^ m;
            }
            else {
                x = x << 1n;
            }
            
        }

        return p;
    }

    div(x: bigint, y: bigint) {
        return this.mul(x, this.inv(y));
    }

    exp(base: bigint, exponent: bigint): bigint {
        if (base === 0n && exponent === 0n) throw new TypeError('Invalid inputs');

        let result = 1n;
        while (exponent > 0n) {
            if (base === 0n) return 0n;
            if (exponent & 1n) {
                result = this.mul(result, base);
            }
            exponent = exponent << 1n;
            base = this.mul(base, base);
        }

        return result;
    }

    inv(a: bigint): bigint {
        throw new Error('Not implemented');
    }

    rand(): bigint {
        throw new Error('Not implemented');
    }

    // BATCH OPERATIONS
    // --------------------------------------------------------------------------------------------
    invMany(values: bigint[]): bigint[] {
        throw new Error('Not implemented');
    }

    mulMany(values: bigint[][], m1: bigint[], m2?: bigint[]): bigint[][] {
        throw new Error('Not implemented');
    }

    combine(values: bigint[], coefficients: bigint[]): bigint {
        throw new Error('Not implemented');
    }

    combineMany(values: bigint[][], coefficients: bigint[]): bigint[] {
        throw new Error('Not implemented');
    }

    getPowerSeries(seed: bigint, length: number): bigint[] {
        throw new Error('Not implemented');
    }

    // ROOTS OF UNITY
    // --------------------------------------------------------------------------------------------
    getRootOfUnity(order: number): bigint {
        throw new Error('Not implemented');
    }

    getPowerCycle(rootOfUnity: bigint): bigint[] {
        throw new Error('Not implemented');
    }

    // POLYNOMIALS
    // --------------------------------------------------------------------------------------------
    addPolys(a: Polynom, b: Polynom): Polynom {
        throw new Error('Not implemented');
    }

    subPolys(a: Polynom, b: Polynom): Polynom {
        throw new Error('Not implemented');
    }

    mulPolys(a: Polynom, b: Polynom): Polynom {
        throw new Error('Not implemented');
    }

    divPolys(a: Polynom, b: Polynom): Polynom {
        throw new Error('Not implemented');
    }

    mulPolyByConstant(a: Polynom, c: bigint): Polynom {
        throw new Error('Not implemented');
    }

    evalPolyAt(p: Polynom, x: bigint): bigint {
        throw new Error('Not implemented');
    }

    evalPolyAtRoots(p: Polynom, rootsOfUnity: bigint[]): bigint[] {
        throw new Error('Not implemented');
    }

    interpolate(xs: bigint[], ys: bigint[]): Polynom {
        throw new Error('Not implemented');
    }

    interpolateRoots(rootsOfUnity: bigint[], ys: bigint[]): Polynom {
        throw new Error('Not implemented');
    }

    interpolateQuarticBatch(xSets: bigint[][], ySets: bigint[][]): Polynom[] {
        throw new Error('Not implemented');
    }
}