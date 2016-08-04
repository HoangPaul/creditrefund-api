var ValidationResult = require('app/validation/result');

var TABLE_NAME = 'payoutOptions';

function PayoutHelper(context) {
    this.context = context;
}

/**
 * @param {string} payoutOption
 * @param {function(?Error, boolean=)} callback
 */
PayoutHelper.prototype.isEnabled = function(payoutOption, callback) {
    var params = {
        TableName: TABLE_NAME,
        Key: {
            "payoutOption": payoutOption
        }
    };

    this.context.dbDriver.get(params, function(err, dbData) {
        if (err) {
            return callback(err);
        }

        if (typeof dbData.Item === 'undefined') {
            return callback(new Error('Failed to retrieve payout option "' + payoutOption + '"'));
        }

        return callback(null, dbData.Item.isEnabled);
    });
};

/**
 * @param {object} data
 * @param {string[]} requiredFields
 * @returns {ValidationResult}
 */
PayoutHelper.prototype.hasRequiredData = function(data, requiredFields) {
    var validationResult = new ValidationResult();

    for (var i = 0; i < requiredFields.length; i++) {
        var requiredField = requiredFields[i];
        if (typeof data[requiredField] === 'undefined' || !data[requiredField]) {
            validationResult.addError(new Error("Missing required field '" + requiredField + "'"));
        }
    }
    return validationResult;
};

module.exports = PayoutHelper;