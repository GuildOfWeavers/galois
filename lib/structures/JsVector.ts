// IMPORTS
// ================================================================================================
import { Vector } from '@guildofweavers/galois';

// CONSTANTS
// ================================================================================================
const MASK_64B = 0xFFFFFFFFFFFFFFFFn;

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
        const blocks = this.elementSize >> 3;
        let value = this.values[index];
        for (let i = 0; i < blocks; i++) {
            destination.writeBigUInt64LE(value & MASK_64B, offset);
            value = value >> 64n;
            offset += 8;
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
        const limbCount = this.elementSize >> 3;

        if (elementCount === 1) {
            let value = this.values[startIdx];
            for (let i = 0; i < limbCount; i++) {
                result.writeBigUInt64LE(value & MASK_64B, offset);
                value = value >> 64n;
                offset += 8;
            }
        }
        
        const endIdx = startIdx + elementCount;
        for (let index = startIdx; index < endIdx; index++) {
            let value = this.values[index];
            for (let limb = 0; limb < limbCount; limb++, offset += 8) {
                result.writeBigUInt64LE(value & MASK_64B, offset);
                value = value >> 64n;
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