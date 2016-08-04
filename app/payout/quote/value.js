var assert = require('assert');
var BigNumber = require('bignumber.js');

/**
 * @param {BigNumber} value
 * @param {number} format
 * @throws {TypeError}
 * @constructor
 */
function QuoteValue(value, format) {
    if (!(value instanceof BigNumber)) {
        throw new TypeError('Value is not of type BigNumber');
    }

    switch (format) {
        case QuoteValue.DOLLARS:
            this.value = value.times(100);
            break;
        case QuoteValue.CENTS:
            this.value = value;
            break;
        default:
            throw new TypeError('Unknown format');
            break;
    }
}

/**
 * @const {number}
 */
QuoteValue.DOLLARS = 1;

/**
 * @const {number}
 */
QuoteValue.CENTS  = 2;

/**
 * @param {number} format
 * @returns {BigNumber|Error}
 */
QuoteValue.prototype.getValue = function(format) {
    switch (format) {
        case QuoteValue.DOLLARS:
            return this.value.dividedBy(100);
            break;
        case QuoteValue.CENTS:
            return this.value;
            break;
        default:
            return new Error('Unknown format');
            break;
    }
};

/**
 * @returns {string}
 */
QuoteValue.prototype.toString = function() {
    return JSON.stringify(this.toObject());
};

/**
 * @returns {{value: string, format: number}}
 */
QuoteValue.prototype.toObject = function () {
    return {
        'value': this.value.toString()
    };
};

module.exports = QuoteValue;

