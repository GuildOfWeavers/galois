"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// VECTOR CLASS
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
    // ARRAY-LIKE METHODS
    // --------------------------------------------------------------------------------------------
    slice(start, end) {
        return new JsVector(this.values.slice(start, end), this.elementSize);
    }
}
exports.JsVector = JsVector;
//# sourceMappingURL=JsVector.js.map