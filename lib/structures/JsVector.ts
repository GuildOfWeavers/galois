// IMPORTS
// ================================================================================================
import { Vector } from '@guildofweavers/galois';

// VECTOR CLASS
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

    toValues(): bigint[] {
        return this.values;
    }

    // ARRAY-LIKE METHODS
    // --------------------------------------------------------------------------------------------
    slice(start?: number, end?: number): JsVector {
        return new JsVector(this.values.slice(start, end), this.elementSize);
    }
}