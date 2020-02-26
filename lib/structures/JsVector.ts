// IMPORTS
// ================================================================================================
import { Vector } from '@guildofweavers/galois';

// CONSTANTS
// ================================================================================================
const MASK_32B = 0xFFFFFFFFn;

// CLASS DEFINITION
// ================================================================================================
export class JsVector implements Vector {

    readonly values         : bigint[];
    readonly elementSize    : number;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(values: bigint[], elementSize: number) {
        this.values = values;
        this.elementSize = elementSize;
    }

    // PROPERTIES
    // --------------------------------------------------------------------------------------------
    get length(): number {
        return this.values.length;
    }

    get byteLength(): number {
        return this.values.length * this.elementSize;
    }

    // VALUE ACCESSORS
    // --------------------------------------------------------------------------------------------
    getValue(index: number): bigint {
        return this.values[index];
    }

    setValue(index: number, value: bigint): void {
        this.values[index] = value;
    }

    copyValue(index: number, destination: Buffer, offset: number): number {
        const limbCount = this.elementSize >> 2;
        let value = this.values[index];
        for (let i = 0; i < limbCount; i++, offset += 4) {
            destination.writeUInt32LE(Number(value & MASK_32B), offset);
            value = value >> 32n;
        }
        return this.elementSize;
    }

    toValues(): bigint[] {
        return this.values;
    }

    toBuffer(startIdx = 0, elementCount?: number): Buffer {
        if (elementCount === undefined) {
            elementCount = this.values.length - startIdx;
        }

        let offset = 0;
        const result = Buffer.alloc(elementCount * this.elementSize);
        const limbCount = this.elementSize >> 2;

        if (elementCount === 1) {
            let value = this.values[startIdx];
            for (let i = 0; i < limbCount; i++, offset += 4) {
                result.writeUInt32LE(Number(value & MASK_32B), offset);
                value = value >> 32n;
            }
            return result;
        }
        
        const endIdx = startIdx + elementCount;
        for (let index = startIdx; index < endIdx; index++) {
            let value = this.values[index];
            for (let i = 0; i < limbCount; i++, offset += 4) {
                result.writeUInt32LE(Number(value & MASK_32B), offset);
                value = value >> 32n;
            }
        }

        return result;
    }

    // ARRAY-LIKE METHODS
    // --------------------------------------------------------------------------------------------
    slice(start?: number, end?: number): JsVector {
        return new JsVector(this.values.slice(start, end), this.elementSize);
    }
}