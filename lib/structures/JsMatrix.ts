// IMPORTS
// ================================================================================================
import { Matrix } from '@guildofweavers/galois';

// CONSTANTS
// ================================================================================================
const MASK_32B = 0xFFFFFFFFn;

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
        const limbCount = this.elementSize >> 2;
        let value = this.values[row][column];
        for (let i = 0; i < limbCount; i++, offset += 4) {
            destination.writeUInt32LE(Number(value & MASK_32B), offset);
            value = value >> 32n;
        }
        return this.elementSize;
    }

    toValues(): bigint[][] {
        return this.values;
    }

    toBuffer(): Buffer {
        let offset = 0;
        const result = Buffer.alloc(this.byteLength);
        const limbCount = this.elementSize >> 2;

        for (let i = 0; i < this.rowCount; i++) {
            for (let j = 0; j < this.colCount; j++) {
                let value = this.values[i][j];
                for (let limb = 0; limb < limbCount; limb++, offset += 4) {
                    result.writeUInt32LE(Number(value & MASK_32B), offset);
                    value = value >> 32n;
                }
            }
        }
        
        return result;
    }

    rowsToBuffers(indexes?: number[]): Buffer[] {
        const result = new Array<Buffer>();
        const limbCount = this.elementSize >> 2;
        const rowSize = this.colCount * this.elementSize;
        
        if (!indexes) {
            for (let i = 0; i < this.rowCount; i++) {
                let buffer = Buffer.allocUnsafe(rowSize), offset = 0;
                for (let j = 0; j < this.colCount; j++) {
                    let value = this.values[i][j];
                    for (let limb = 0; limb < limbCount; limb++, offset += 4) {
                        buffer.writeUInt32LE(Number(value & MASK_32B), offset);
                        value = value >> 32n;
                    }
                }
                result.push(buffer);
            }
        }
        else {
            for (let i of indexes) {
                let buffer = Buffer.allocUnsafe(rowSize), offset = 0;
                for (let j = 0; j < this.colCount; j++) {
                    let value = this.values[i][j];
                    for (let limb = 0; limb < limbCount; limb++, offset += 4) {
                        buffer.writeUInt32LE(Number(value & MASK_32B), offset);
                        value = value >> 32n;
                    }
                }
                result.push(buffer);
            }
            
        }
        return result;
    }
}