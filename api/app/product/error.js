var VisibleError = require('app/error/visible');

/**
 * @param {Error} error
 * @param {number} errorCode
 * @extends {VisibleError}
 * @constructor
 */
function ProductError(error, errorCode) {
    VisibleError.call(this, error, errorCode);
    this.name = 'ProductError';
    this.errorCode = errorCode || 4004;
}

ProductError.prototype = Object.create(VisibleError.prototype);

module.exports = ProductError;