/**
 * @param {String} message
 * @param {number} errorCode
 * @constructor
 */
function VisibleError(message, errorCode) {
    this.name = 'VisibleError';
    this.message = message || '';
    this.stack = (new Error()).stack;
    this.errorCode = errorCode || 4001;
}

VisibleError.prototype = Object.create(Error.prototype);

module.exports = VisibleError;