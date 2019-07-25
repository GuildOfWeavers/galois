"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Vector {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(length, elementSize) {
        this.values = new Array(length);
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
}
exports.Vector = Vector;
//# sourceMappingURL=Vector.js.map