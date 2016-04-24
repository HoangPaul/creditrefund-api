var BigNumber = require('bignumber.js');

/**
 * @param {BigNumber} value
 * @param {number} format
 * @throws {TypeError}
 * @constructor
 */
function PayoutValue(value, format) {
    switch (format) {
        case PayoutValue.DOLLARS:
            this.value = value.times(100);
            break;
        case PayoutValue.CENTS:
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
PayoutValue.DOLLARS  = 1;

/**
 * @const {number}
 */
PayoutValue.CENTS  = 2;

/**
 * @param {number} format
 * @returns {(string|Error)}
 */
PayoutValue.prototype.getValue = function(format) {
    switch (format) {
        case PayoutValue.DOLLARS:
            return this.value.dividedBy(100).toFixed(2, BigNumber.ROUND_UP);
            break;
        case PayoutValue.CENTS:
            return this.value.toFixed(0, BigNumber.ROUND_UP);
            break;
        default:
            return new Error('Unknown format');
            break;
    }
};

/**
 * @returns {string}
 */
PayoutValue.prototype.toString = function() {
    return JSON.stringify({
        'value': this.value.toString(),
        'format': this.format === PayoutValue.DOLLARS ? 'dollars' : 'cents'
    });
};

module.exports = PayoutValue;

