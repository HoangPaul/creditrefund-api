var VisibleError = require('app/error/visible');

/**
 * @param {Error} error
 * @param {number} errorCode
 * @extends {VisibleError}
 * @constructor
 */
function ValidationError(error, errorCode) {
    VisibleError.call(this, error, errorCode);
    this.name = 'ValidationError';
    this.errorCode = errorCode || 4002;
}

ValidationError.prototype = Object.create(VisibleError.prototype);

module.exports = ValidationError;