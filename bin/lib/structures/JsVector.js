"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// CONSTANTS
// ================================================================================================
const MASK_64B = 0xffffffffffffffffn;
// CLASS DEFINITION
// ================================================================================================
class JsVector {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(values, elementSize) {
        this.values = values;
        this.elementSize = elementSize;
    }
    // PROPERTIES
    // --------------------------------------------------------------------------------------------
    get length() {
        return this.values.length;
    }
    get byteLength() {
        return this.values.length * this.elementSize;
    }
    // VALUE ACCESSORS
    // --------------------------------------------------------------------------------------------
    getValue(index) {
        return this.values[index];
    }
    setValue(index, value) {
        this.values[index] = value;
    }
    toValues() {
        return this.values;
    }
    copyValue(index, destination, offset) {
        const blocks = this.elementSize >> 3;
        let value = this.values[index];
        for (let i = 0; i < blocks; i++) {
            destination.writeBigUInt64LE(value & MASK_64B, offset);
            value = value >> 64n;
            offset += 8;
        }
        return this.elementSize;
    }
    // ARRAY-LIKE METHODS
    // --------------------------------------------------------------------------------------------
    slice(start, end) {
        return new JsVector(this.values.slice(start, end), this.elementSize);
    }
}
exports.JsVector = JsVector;
//# sourceMappingURL=JsVector.js.map