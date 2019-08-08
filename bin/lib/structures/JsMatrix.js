"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// CONSTANTS
// ================================================================================================
const MASK_64B = 0xffffffffffffffffn;
// CLASS DEFINITION
// ================================================================================================
class JsMatrix {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(values, elementSize) {
        this.rowCount = values.length;
        this.colCount = values[0].length;
        this.values = values;
        this.elementSize = elementSize;
    }
    // PROPERTIES
    // --------------------------------------------------------------------------------------------
    get byteLength() {
        return this.rowCount * this.colCount * this.elementSize;
    }
    // VALUE ACCESSORS
    // --------------------------------------------------------------------------------------------
    getValue(row, column) {
        return this.values[row][column];
    }
    setValue(row, column, value) {
        this.values[row][column] = value;
    }
    toValues() {
        return this.values;
    }
    copyValue(row, column, destination, offset) {
        const blocks = this.elementSize >> 3;
        let value = this.values[row][column];
        for (let i = 0; i < blocks; i++) {
            destination.writeBigUInt64LE(value & MASK_64B, offset);
            value = value >> 64n;
            offset += 8;
        }
        return this.elementSize;
    }
}
exports.JsMatrix = JsMatrix;
//# sourceMappingURL=JsMatrix.js.map