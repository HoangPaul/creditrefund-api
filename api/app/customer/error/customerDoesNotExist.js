/**
 * @param {String} message
 * @param {number} errorCode
 * @constructor
 */
function CustomerDoesNotExistError(message, errorCode) {
    this.name = 'CustomerDoesNotExistError';
    this.message = message || '';
    this.stack = (new Error()).stack;
    this.errorCode = errorCode || 3000;
}

CustomerDoesNotExistError.prototype = Object.create(Error.prototype);

module.exports = CustomerDoesNotExistError;