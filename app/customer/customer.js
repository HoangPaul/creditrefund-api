var BigNumber = require('bignumber.js');
var PayoutValue = require('app/customer/payout-value');

var TABLE_NAME = 'customers';

/**
 * @param {{payout: number, admin: number, google: number}} percentages
 * @param {boolean} isSendable
 * @constructor
 */
function Customer(email, percentages, isSendable) {
    this.email = email;
    this.percentages = percentages;
    this.isSendable = isSendable || true;
}

/**
 * @param {{dbDriver: object, config: object}} context
 * @param {string} email
 * @param {function(?object {Payout=}) callback
 */
Customer.load = function(context, email, callback) {
    var params = {
        TableName: TABLE_NAME,
        Key: {
            "email": email
        }
    };

    context.dbDriver.get(params, function(err, dbData) {
        if (err) {
            return callback(err);
        }

        var isSendable = context.config.IS_SENDABLE;
        var data = {
            payout: context.config.PAYOUT,
            admin: context.config.ADMIN,
            google: context.config.GOOGLE
        };

        if (typeof dbData.Item !== 'undefined') {
            isSendable = dbData.Item['is_sendable'];
            data['payout'] = dbData.Item['payout'];
            data['admin'] = dbData.Item['admin'];
            data['google'] = dbData.Item['google'];
        }

        var customer = new Customer(email, data, isSendable);

        return callback(null, customer);
    });
}

Customer.prototype.getEmail = function() {
    return this.email;
}

/**
 * @param {number} totalAmount
 * @param {number} inputFormat
 * @return {PayoutValue}
 */
Customer.prototype.calculateTotalValue = function(totalAmount, inputFormat) {
    var bTotalAmount = new BigNumber(totalAmount);
    return new PayoutValue(bTotalAmount, inputFormat);
};

/**
 * @param {number} totalAmount
 * @param {number} inputFormat
 * @return {PayoutValue}
 */
Customer.prototype.calculatePayoutValue = function(totalAmount, inputFormat) {
    var bTotalAmount = new BigNumber(totalAmount);
    var payoutValue = bTotalAmount.times(this.percentages.payout).dividedBy(100);
    return new PayoutValue(payoutValue, inputFormat);
};

/**
 * @param {number} totalAmount
 * @param {number} inputFormat
 * @return {PayoutValue}
 */
Customer.prototype.calculateGoogleValue = function(totalAmount, inputFormat) {
    var bTotalAmount = new BigNumber(totalAmount);
    var payoutValue = bTotalAmount.times(this.percentages.google).dividedBy(100);
    return new PayoutValue(payoutValue, inputFormat);
};

/**
 * @param {number} totalAmount
 * @param {number} inputFormat
 * @return {PayoutValue}
 */
Customer.prototype.calculateAdminValue = function(totalAmount, inputFormat) {
    var bTotalAmount = new BigNumber(totalAmount);
    var payoutValue = bTotalAmount.times(this.percentages.admin).dividedBy(100);
    return new PayoutValue(payoutValue, inputFormat);
};

/**
 * @returns {boolean}
 */
Customer.prototype.getIsSendable = function() {
    return this.isSendable;
};

/**
 * @return {string}
 */
Customer.prototype.toString = function() {
    return JSON.stringify(this.percentages);
};

module.exports = Customer;