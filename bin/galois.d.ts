declare module '@guildofweavers/galois' {

    /** Polynomial represented in reverse-coefficient form */
    export type Polynom = bigint[];

    export interface FiniteField {

        /** Characteristic of the field: p in GF(p**n) */
        readonly characteristic: bigint;
        
        /** Extension of the field: n in GF(p**n) */
        readonly extensionDegree: number;

        /** Size of a field element in bytes */
        readonly elementSize: number;

        /** Additive identity of the field */
        readonly zero: bigint;

        /** Multiplicative identity of the field */
        readonly one: bigint;

        // BASIC ARITHMETICS
        // ----------------------------------------------------------------------------------------

        /**
         * Computes x + y
         * @param x Field element
         * @param y Field element
         */
        add(x: bigint, y: bigint): bigint;

        /**
         * Computes x - y
         * @param x Field element
         * @param y Field element
         */
        sub(x: bigint, y: bigint): bigint;

        /**
         * Computes x * y
         * @param x Field element
         * @param y Field element
         */
        mul(x: bigint, y: bigint): bigint;

        /**
         * Computes x * inv(y)
         * @param x Field element
         * @param y Field element
         */
        div(x: bigint, y: bigint): bigint;

        /**
         * Computes b**p
         * @param b Field element to exponentiate
         * @param p Exponent, a positive or a negative number
         */
        exp(b: bigint, p: bigint): bigint;

        /**
         * Computes modular inverse using Extended Euclidean algorithm
         * @param value Field element to invert
         */
        inv(value: bigint): bigint;

        // VECTOR OPERATIONS
        // ----------------------------------------------------------------------------------------
        /** Computes a new vector v such that v[i] = a[i] + b[i] for all i */
        addVectorElements(a: bigint[], b: bigint[]): bigint[];

        /** Computes a new vector v such that v[i] = a[i] + b for all i */
        addVectorElements(a: bigint[], b: bigint): bigint[];

        /** Computes a new vector v such that v[i] = a[i] - b[i] for all i */
        subVectorElements(a: bigint[], b: bigint[]): bigint[];

        /** Computes a new vector v such that v[i] = a[i] - b for all i */
        subVectorElements(a: bigint[], b: bigint): bigint[];

        /** Computes a new vector v such that v[i] = a[i] * b[i] for all i */
        mulVectorElements(a: bigint[], b: bigint[]): bigint[];

        /** Computes a new vector v such that v[i] = a[i] * b for all i */
        mulVectorElements(a: bigint[], b: bigint): bigint[];

        /** Computes a new vector v such that v[i] = a[i] * inv(b[i]) for all i */
        divVectorElements(a: bigint[], b: bigint[]): bigint[];

        /** Computes a new vector v such that v[i] = a[i] * inv(b) for all i */
        divVectorElements(a: bigint[], b: bigint): bigint[];

        /** Computes a new vector v such that v[i] = a[i]^b[i] for all i */
        expVectorElements(a: bigint[], b: bigint[]): bigint[];

        /** Computes a new vector v such that v[i] = a[i]^b for all i */
        expVectorElements(a: bigint[], b: bigint[]): bigint[];

        /** Computes a linear combination of two vectors */
        combineVectors(a: bigint[], b: bigint[]): bigint;

        // MATRIX OPERATIONS
        // ----------------------------------------------------------------------------------------
        /** Computes a new matrix m such that m[i,j] = a[i,j] + b[i,j] for all i and j */
        addMatrixElements(a: bigint[][], b: bigint[][]): bigint[][];

        /** Computes a new matrix m such that m[i,j] = a[i,j] + b for all i and j */
        addMatrixElements(a: bigint[][], b: bigint): bigint[][];

        /** Computes a new matrix m such that m[i,j] = a[i,j] - b[i,j] for all i and j */
        subMatrixElements(a: bigint[][], b: bigint[][]): bigint[][];

        /** Computes a new matrix m such that m[i,j] = a[i,j] - b for all i and j */
        subMatrixElements(a: bigint[][], b: bigint): bigint[][];

        /** Computes a new matrix m such that m[i,j] = a[i,j] * b[i,j] for all i and j */
        mulMatrixElements(a: bigint[][], b: bigint[][]): bigint[][];

        /** Computes a new matrix m such that m[i,j] = a[i,j] * b for all i and j */
        mulMatrixElements(a: bigint[][], b: bigint): bigint[][];

        /** Computes a new matrix m such that m[i,j] = a[i,j] * inv(b[i,j]) for all i and j */
        divMatrixElements(a: bigint[][], b: bigint[][]): bigint[][];

        /** Computes a new matrix m such that m[i,j] = a[i,j] * inv(b) for all i and j */
        divMatrixElements(a: bigint[][], b: bigint): bigint[][];

        /** Computes a new matrix m such that m[i,j] = a[i,j]^b[i,j] for all i and j */
        expMatrixElements(a: bigint[][], b: bigint[][]): bigint[][];

        /** Computes a new matrix m such that m[i,j] = a[i,j]^b for all i and j */
        expMatrixElements(a: bigint[][], b: bigint): bigint[][];

        /**
         * Computes a matrix with dimensions [m,n] which is a product of matrixes a and b
         * @param a Matrix with dimensions [m,p]
         * @param b Matrix with dimensions [p,n]
         */
        mulMatrixes(a: bigint[][], b: bigint[][]): bigint[][];

        /**
         * Computes a vector of length m which is a product of matrix a and vector b
         * @param a Matrix with dimensions [m,n]
         * @param b Vector of length n
         */
        mulMatrixByVector(a: bigint[][], b: bigint[]): bigint[];

        // BATCH OPERATIONS
        // ----------------------------------------------------------------------------------------
        /**
         * Computes modular inverse for all passed-in values using Montgomery batch inversion
         * @param values Field elements
         */
        invMany(values: bigint[]): bigint[];

        /**
         * Computes a matrix with values[column][row] * m1[row] * m2[row] for all columns
         * @param values Matrix of field elements with outer array representing columns, and inner array representing rows
         * @param m1 An array of values for each row in the matrix
         * @param m2 An array of values for each row in the matrix
         */
        mulMany(values: bigint[][], m1: bigint[], m2?: bigint[]): bigint[][];

        /**
         * Computes a linear combination of values
         * @param values Filed elements to combine
         * @param coefficients Coefficients to apply
         */
        combine(values: bigint[], coefficients: bigint[]): bigint;

        /**
         * Computes a linear combination for all rows
         * @param values A matrix of field elements with outer array representing columns, and inner array representing rows
         * @param coefficients Coefficients to apply
         */
        combineMany(values: bigint[][], coefficients: bigint[]): bigint[];

        /**
         * Computes a series of powers for the provided base element
         * @param base Field element to exponentiate
         * @param length Length of the series to return
         */
        getPowerSeries(base: bigint, length: number): bigint[];
        
        // RANDOMNESS
        // ----------------------------------------------------------------------------------------

        /**
         * Generate a cryptographically-secure random field element
         */
        rand(): bigint;

        /**
         * Generates a sequence of pseudorandom field elements from the provided seed
         * @param seed Seed for the PRNG
         * @param length Length of sequence to generate
         */
        prng(seed: bigint | Buffer, length: number): bigint[];

        /**
         * Generates a single pseudorandom field element from the provided seed
         * @param seed Seed for the PRNG
         */
        prng(seed: bigint | Buffer): bigint;

        // ROOTS OF UNITY
        // ----------------------------------------------------------------------------------------

        /**
         * Computes a primitive root of unity such that root**order=1
         * @param order Order of the root of unity
         */
        getRootOfUnity(order: number): bigint;

        /**
         * Computes an array containing a full cycle of roots of unity generated by the primitive root
         * @param rootOfUnity Primitive root of unity
         */
        getPowerCycle(rootOfUnity: bigint): bigint[];

        // BASIC POLYNOMIAL OPERATIONS
        // ----------------------------------------------------------------------------------------

        /**
         * Computes a[i] + b[i] for all i
         * @param a Polynomial
         * @param b Polynomial
         */
        addPolys(a: Polynom, b: Polynom): Polynom;

        /**
         * Computes a[i] - b[i] for all i
         * @param a Polynomial
         * @param b Polynomial
         */
        subPolys(a: Polynom, b: Polynom): Polynom;

        /**
         * Computes a[i] * b[i] at all i
         * @param a Polynomial
         * @param b Polynomial
         */
        mulPolys(a: Polynom, b: Polynom): Polynom;

        /**
         * Computes a[i] * inv(b[i]) for all i
         * @param a Polynomial
         * @param b Polynomial
         */
        divPolys(a: Polynom, b: Polynom): Polynom;

        /**
         * Computes p[i] * c for all i
         * @param p Polynomial to multiply
         * @param c Constant
         */
        mulPolyByConstant(p: Polynom, c: bigint): Polynom;

        // POLYNOMIAL EVALUATION
        // ----------------------------------------------------------------------------------------

        /**
         * Evaluates a polynomial at a provided x coordinates
         * @param p Polynomial to evaluate
         * @param x X coordinates at which to evaluate the polynomial
         */
        evalPolyAt(p: Polynom, x: bigint): bigint;

        /**
         * Uses Fast Fourier Transform to evaluate a polynomial at all provided roots of unity
         * @param p Polynomial to evaluate
         * @param rootsOfUnity Roots of unity representing x coordinates to evaluate
         */
        evalPolyAtRoots(p: Polynom, rootsOfUnity: bigint[]): bigint[];

        // POLYNOMIAL INTERPOLATION
        // ----------------------------------------------------------------------------------------

        /**
         * Uses Lagrange Interpolation to compute a polynomial from provided points
         * @param xs x coordinates of points
         * @param ys y coordinates of points
         */
        interpolate(xs: bigint[], ys: bigint[]): Polynom;

        /**
         * Uses Fast Fourier Transform to compute a polynomial from provided points
         * @param rootsOfUnity Roots of unity representing x coordinates of points to interpolate
         * @param ys y coordinates of points to interpolate
         */
        interpolateRoots(rootsOfUnity: bigint[], ys: bigint[]): Polynom;

        /**
         * Uses an optimized version of Lagrange Interpolation for degree 3 polynomials
         * @param xSets A matrix of X coordinates (4 values per row)
         * @param ySets A matrix of Y coordinates (4 values per row)
         */
        interpolateQuarticBatch(xSets: bigint[][], ySets: bigint[][]): Polynom[];
    }

    // FINITE FIELD IMPLEMENTATIONS
    // ----------------------------------------------------------------------------------------
    export class PrimeField {
        constructor(modulus: bigint);
    }
    export interface PrimeField extends FiniteField {
        mod(value: bigint): bigint;
    }

}