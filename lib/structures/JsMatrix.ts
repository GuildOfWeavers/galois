// IMPORTS
// ================================================================================================
import { Matrix } from '@guildofweavers/galois';

// VECTOR CLASS
// ================================================================================================
export class JsMatrix implements Matrix {

    readonly values         : bigint[][];
    readonly rowCount       : number;
    readonly colCount       : number;
    readonly elementSize    : number;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(values: bigint[][], elementSize: number) {
        this.rowCount = values.length;
        this.colCount = values[0].length;
        this.values = values;
        this.elementSize = elementSize;
    }

    // PROPERTIES
    // --------------------------------------------------------------------------------------------
    get byteLength(): number {
        return this.values.length * this.elementSize;
    }

    // VALUE ACCESSORS
    // --------------------------------------------------------------------------------------------
    getValue(row: number, column: number): bigint {
        return this.values[row][column];
    }

    setValue(row: number, column: number, value: bigint): void {
        this.values[row][column] = value;
    }

    toValues(): bigint[][] {
        return this.values;
    }
}