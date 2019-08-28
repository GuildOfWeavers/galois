// IMPORTS
// ================================================================================================
import { Matrix } from '@guildofweavers/galois';

// CONSTANTS
// ================================================================================================
const MASK_64B = 0xFFFFFFFFFFFFFFFFn;

// CLASS DEFINITION
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
        return this.rowCount * this.colCount * this.elementSize;
    }

    // VALUE ACCESSORS
    // --------------------------------------------------------------------------------------------
    getValue(row: number, column: number): bigint {
        return this.values[row][column];
    }

    setValue(row: number, column: number, value: bigint): void {
        this.values[row][column] = value;
    }

    copyValue(row: number, column: number, destination: Buffer, offset: number): number {
        const blocks = this.elementSize >> 3;
        let value = this.values[row][column];
        for (let i = 0; i < blocks; i++) {
            destination.writeBigUInt64LE(value & MASK_64B, offset);
            value = value >> 64n;
            offset += 8;
        }
        return this.elementSize;
    }

    toValues(): bigint[][] {
        return this.values;
    }

    toBuffer(): Buffer {
        let offset = 0;
        const result = Buffer.alloc(this.byteLength);
        const limbCount = this.elementSize >> 3;

        for (let i = 0; i < this.rowCount; i++) {
            for (let j = 0; j < this.colCount; j++) {
                let value = this.values[i][j];
                for (let limb = 0; limb < limbCount; limb++, offset += 8) {
                    result.writeBigUInt64LE(value & MASK_64B, offset);
                    value = value >> 64n;
                }
            }
        }
        
        return result;
    }
}