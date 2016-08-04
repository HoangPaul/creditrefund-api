var VisibleError = require('app/error/visible');

/**
 * @param {Error} error
 * @param {number} errorCode
 * @extends {VisibleError}
 * @constructor
 */
function QuoteError(error, errorCode) {
    VisibleError.call(this, error, errorCode);
    this.name = 'QuoteError';
    this.errorCode = errorCode || 4003;
}

QuoteError.prototype = Object.create(VisibleError.prototype);

module.exports = QuoteError;