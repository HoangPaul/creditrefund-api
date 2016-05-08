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
 * @returns {Error[]}
 */
ValidationResult.prototype.getErrors = function() {
    return this.errors;
};

module.exports = ValidationResult;