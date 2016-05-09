var us = require('underscore');

function ValidationResult() {
    this.errors = [];
}

/**
 * @param {Error} error
 */
ValidationResult.prototype.addError = function(error) {
    this.errors.push(error);
};

/**
 * @return {boolean}
 */
ValidationResult.prototype.hasErrors = function() {
    return this.errors.length > 0;
};

/**
 * @returns {Error[]|string}
 */
ValidationResult.prototype.getErrors = function(delimiter) {
    if (typeof delimiter === 'undefined') {
        return this.errors;
    }

    var errorMessages = us.map(this.errors, function(error) {
        return error.message;
    });

    return errorMessages.join(delimiter);
};

module.exports = ValidationResult;