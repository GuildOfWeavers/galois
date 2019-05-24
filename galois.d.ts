declare module '@gow/galois' {

    export type Polynom = bigint[];

    export interface FiniteField {

        readonly characteristic  : bigint;
        readonly extensionDegree : number;
        readonly elementSize     : number;

        add(x: bigint, y: bigint): bigint;
        sub(x: bigint, y: bigint): bigint;
        mul(x: bigint, y: bigint): bigint;
        div(x: bigint, y: bigint): bigint;
        exp(x: bigint, y: bigint): bigint;
        inv(value: bigint): bigint;

        invMany(values: bigint[]): bigint[];
        mulMany(values: bigint[][], m1: bigint[], m2?: bigint[]): bigint[][];

        combine(values: bigint[], coefficients: bigint[]): bigint;
        combineMany(values: bigint[][], coefficients: bigint[]): bigint[];

        getPowerSeries(seed: bigint, length: number): bigint[];
        
        rand(): bigint;

        getRootOfUnity(order: number): bigint;
        getPowerCycle(rootOfUnity: bigint): bigint[];

        addPolys(a: Polynom, b: Polynom): Polynom;
        subPolys(a: Polynom, b: Polynom): Polynom;
        mulPolys(a: Polynom, b: Polynom): Polynom;
        divPolys(a: Polynom, b: Polynom): Polynom;

        mulPolyByConstant(p: Polynom, c: bigint): Polynom;

        evalPolyAt(p: Polynom, x: bigint): bigint;
        evalPolyAtRoots(p: Polynom, rootsOfUnity: bigint[]): bigint[];

        interpolate(xs: bigint[], ys: bigint[]): Polynom;
        interpolateRoots(rootsOfUnity: bigint[], ys: bigint[]): Polynom;
        interpolateQuarticBatch(xSets: bigint[][], ySets: bigint[][]): Polynom[];
    }

    export class PrimeField {
        constructor(modulus: bigint);
    }
    export interface PrimeField extends FiniteField {
        mod(value: bigint): bigint;
    }

}