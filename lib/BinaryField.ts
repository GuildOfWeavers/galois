// IMPORTS
// ================================================================================================
import { FiniteField, Polynom, Vector, Matrix } from '@guildofweavers/galois';

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

    get zero(): bigint {
        throw new Error('Not implemented');
    }

    get one(): bigint {
        throw new Error('Not implemented');
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

    // RANDOMNESS
    // ----------------------------------------------------------------------------------------
    rand(): bigint {
        throw new Error('Not implemented');
    }

    prng(seed: bigint | Buffer): bigint
    prng(seed: bigint | Buffer, length?: number): Vector;
    prng(seed: bigint | Buffer, length?: number): Vector | bigint {
        throw new Error('Not implemented');
    }

    // VECTOR OPERATIONS
    // --------------------------------------------------------------------------------------------
    newVector(length: number): Vector {
        throw new Error('Not implemented');
    }

    addVectorElements(a: Vector, b: bigint | Vector): Vector {
        throw new Error('Not implemented');
    }

    subVectorElements(a: Vector, b: bigint | Vector): Vector {
        throw new Error('Not implemented');
    }

    mulVectorElements(a: Vector, b: bigint | Vector): Vector {
        throw new Error('Not implemented');
    }

    divVectorElements(a: Vector, b: bigint | Vector): Vector {
        throw new Error('Not implemented');
    }

    expVectorElements(a: Vector, b: bigint | Vector): Vector {
        throw new Error('Not implemented');
    }

    invVectorElements(values: Vector): Vector {
        throw new Error('Not implemented');
    }

    combineVectors(a: Vector, b: Vector): bigint {
        throw new Error('Not implemented');
    }

    // MATRIX OPERATIONS
    // --------------------------------------------------------------------------------------------
    newMatrix(rows: number, columns: number): Matrix {
        throw new Error('Not implemented');
    }

    addMatrixElements(a: Matrix, b: bigint | Matrix): Matrix {
        throw new Error('Not implemented');
    }
    
    subMatrixElements(a: Matrix, b: bigint | Matrix): Matrix {
        throw new Error('Not implemented');
    }

    mulMatrixElements(a: Matrix, b: bigint | Matrix): Matrix {
        throw new Error('Not implemented');
    }

    divMatrixElements(a: Matrix, b: bigint | Matrix): Matrix {
        throw new Error('Not implemented');
    }

    expMatrixElements(a: Matrix, b: bigint | Matrix): Matrix {
        throw new Error('Not implemented');
    }

    invMatrixElements(values: Matrix): Matrix {
        throw new Error('Not implemented');
    }

    mulMatrixes(a: Matrix, b: Matrix): Matrix {
        throw new Error('Not implemented');
    }

    mulMatrixByVector(m: Matrix, v: Vector): Vector {
        throw new Error('Not implemented');
    }

    // BATCH OPERATIONS
    // --------------------------------------------------------------------------------------------
    getPowerSeries(seed: bigint, length: number): Vector {
        throw new Error('Not implemented');
    }

    // ROOTS OF UNITY
    // --------------------------------------------------------------------------------------------
    getRootOfUnity(order: number): bigint {
        throw new Error('Not implemented');
    }

    getPowerCycle(rootOfUnity: bigint): Vector {
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

    evalPolyAtRoots(p: Polynom, rootsOfUnity: Vector): Vector {
        throw new Error('Not implemented');
    }

    interpolate(xs: Vector, ys: Vector): Polynom {
        throw new Error('Not implemented');
    }

    interpolateRoots(rootsOfUnity: Vector, ys: Vector): Polynom {
        throw new Error('Not implemented');
    }

    interpolateQuarticBatch(xSets: Matrix, ySets: Matrix): Polynom[] {
        throw new Error('Not implemented');
    }
}