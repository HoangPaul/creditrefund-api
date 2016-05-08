var us = require('underscore');

var TABLE_NAME = 'fees';

/**
 * @param {Object[]} fees
 * @param {Object[]} mandatoryFees
 * @constructor
 */
function FeeCollection(fees, mandatoryFees) {
    this.fees = fees;
    this.mandatoryFees = mandatoryFees;
}

/**
 * @param {{dbDriver: Object}} context
 * @param {function(?Object, FeeCollection=)} callback
 */
FeeCollection.load = function(context, callback) {
    var params = {
        TableName: TABLE_NAME
    };

    context.dbDriver.scan(params, function(err, feesData) {
        if (err) {
            return callback(err);
        }

        var fees = {};
        var mandatoryFees = {};
        us.each(feesData.Items, function(feeData) {
            fees[feeData['code']] = feeData;

            if (feeData['mandatory'] === true) {
                mandatoryFees[feeData['code']] = feeData;
            }
        });

        var feeCollection = new FeeCollection(fees, mandatoryFees);

        return callback(err, feeCollection);
    });
};

/**
 * @returns {Object[]}
 */
FeeCollection.prototype.getMandatoryFees = function() {
    return this.mandatoryFees;
};

/**
 * @param {string} code
 * @returns {Object[]|Error}
 */
FeeCollection.prototype.getFeeByCode = function(code) {
    if (typeof this.fees[code] === 'undefined') {
        return new Error('Could not find fee with code "' + code + '"')
    }
    return this.fees[code];
};

return module.exports = FeeCollection;