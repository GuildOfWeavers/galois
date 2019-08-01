"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// VECTOR CLASS
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
        return this.values.length * this.elementSize;
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
}
exports.JsMatrix = JsMatrix;
//# sourceMappingURL=JsMatrix.js.map