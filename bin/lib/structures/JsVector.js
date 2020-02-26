"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// CONSTANTS
// ================================================================================================
const MASK_32B = 0xffffffffn;
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
    copyValue(index, destination, offset) {
        const limbCount = this.elementSize >> 2;
        let value = this.values[index];
        for (let i = 0; i < limbCount; i++, offset += 4) {
            destination.writeUInt32LE(Number(value & MASK_32B), offset);
            value = value >> 32n;
        }
        return this.elementSize;
    }
    toValues() {
        return this.values;
    }
    toBuffer(startIdx = 0, elementCount) {
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
    slice(start, end) {
        return new JsVector(this.values.slice(start, end), this.elementSize);
    }
}
exports.JsVector = JsVector;
//# sourceMappingURL=JsVector.js.map