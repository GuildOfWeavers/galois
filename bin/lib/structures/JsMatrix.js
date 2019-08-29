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
    toValues() {
        return this.values;
    }
    toBuffer() {
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
    rowsToBuffers(indexes) {
        const result = new Array();
        const limbCount = this.elementSize >> 3;
        const rowSize = this.colCount * this.elementSize;
        if (!indexes) {
            for (let i = 0; i < this.rowCount; i++) {
                let buffer = Buffer.allocUnsafe(rowSize), offset = 0;
                for (let j = 0; j < this.colCount; j++) {
                    let value = this.values[i][j];
                    for (let limb = 0; limb < limbCount; limb++, offset += 8) {
                        buffer.writeBigUInt64LE(value & MASK_64B, offset);
                        value = value >> 64n;
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
                    for (let limb = 0; limb < limbCount; limb++, offset += 8) {
                        buffer.writeBigUInt64LE(value & MASK_64B, offset);
                        value = value >> 64n;
                    }
                }
                result.push(buffer);
            }
        }
        return result;
    }
}
exports.JsMatrix = JsMatrix;
//# sourceMappingURL=JsMatrix.js.map