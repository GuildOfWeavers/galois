export class Vector {

    readonly values         : bigint[];
    readonly elementSize    : number;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(length: number, elementSize: number) {
        this.values = new Array<bigint>(length);
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
}